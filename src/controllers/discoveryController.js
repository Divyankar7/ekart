const Product = require('../models/Product');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const FRESH_DROPS_DAYS = 14;
const LIMITS = {
  continueBrowsing: 4,
  basedOnRecentSearch: 4,
  forYou: 8,
  freshDrops: 4,
  trendingNow: 4,
  // cold-start
  popularCategories: 6,
  coldTrending: 6,
  coldFreshDrops: 4,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Base product projection — keeps payloads lean for carousel rendering */
const PRODUCT_PROJECTION = {
  name: 1,
  category: 1,
  brand: 1,
  price: 1,
  images: { $slice: 1 }, // only the first image per product
  ratingsAverage: 1,
  ratingsCount: 1,
  totalSales: 1,
  createdAt: 1,
};

/**
 * Run all shelf queries concurrently and return the settled results keyed by
 * shelf name.  Any individual query that rejects will resolve as [] so a
 * single slow/failing DB call never breaks the whole feed.
 */
async function runParallel(queryMap) {
  const keys = Object.keys(queryMap);
  const results = await Promise.allSettled(keys.map((k) => queryMap[k]));
  return Object.fromEntries(
    keys.map((k, i) => [
      k,
      results[i].status === 'fulfilled' ? results[i].value : [],
    ])
  );
}

/**
 * Build a Mongoose text-search query from a raw search string.
 * Falls back to a case-insensitive regex on `name` when the string is too
 * short to be useful as a $text query (< 3 chars).
 */
function buildSearchQuery(searchTerm, extraFilter = {}) {
  if (!searchTerm || searchTerm.trim().length === 0) return null;

  const trimmed = searchTerm.trim();

  if (trimmed.length >= 3) {
    return { $text: { $search: trimmed }, isActive: true, ...extraFilter };
  }

  // Short term — regex fallback
  return {
    name: { $regex: trimmed, $options: 'i' },
    isActive: true,
    ...extraFilter,
  };
}

// ---------------------------------------------------------------------------
// Personalized shelf builders
// ---------------------------------------------------------------------------

/**
 * continueBrowsing — last N viewed products, ordered most-recent first.
 * We read the IDs directly off the user document (already in memory) and
 * do a single __IN__ query to hydrate them.
 */
async function getContinueBrowsing(user) {
  const viewedIds = user.viewedProducts
    .slice(0, LIMITS.continueBrowsing)
    .map((v) => v.product);

  if (viewedIds.length === 0) return [];

  const products = await Product.find({
    _id: { $in: viewedIds },
    isActive: true,
  }).select(PRODUCT_PROJECTION);

  // Preserve the original view order (most recently viewed first)
  const idOrder = viewedIds.map(String);
  return [...products].sort(
    (a, b) => idOrder.indexOf(String(a._id)) - idOrder.indexOf(String(b._id))
  );
}

/**
 * basedOnRecentSearch — products matching the user's latest search query.
 * Uses $text index when query is long enough, regex otherwise.
 */
async function getBasedOnRecentSearch(user) {
  if (user.recentSearches.length === 0) return [];

  const latestSearch = user.recentSearches[0]; // already sorted newest-first
  const searchTerm = latestSearch.query;
  const categoryHint = latestSearch.category;

  const extraFilter = categoryHint ? { category: categoryHint } : {};
  const query = buildSearchQuery(searchTerm, extraFilter);

  if (!query) return [];

  return Product.find(query)
    .select(PRODUCT_PROJECTION)
    .sort(query.$text ? { score: { $meta: 'textScore' } } : { totalSales: -1 })
    .limit(LIMITS.basedOnRecentSearch);
}

/**
 * forYou — products from the user's top-scoring categories, excluding items
 * already viewed or purchased to surface genuinely new items.
 */
async function getForYou(user) {
  const topCategories = user.getTopCategories(3);
  if (topCategories.length === 0) return [];

  // Build exclusion set from viewed + purchased
  const excludeIds = [
    ...user.viewedProducts.map((v) => v.product),
    ...user.purchasedProducts,
  ];

  return Product.find({
    category: { $in: topCategories },
    isActive: true,
    ...(excludeIds.length > 0 && { _id: { $nin: excludeIds } }),
  })
    .select(PRODUCT_PROJECTION)
    .sort({ ratingsAverage: -1, totalSales: -1 })
    .limit(LIMITS.forYou);
}

/**
 * freshDrops — newest active products added within the last FRESH_DROPS_DAYS days.
 */
async function getFreshDrops(limit = LIMITS.freshDrops) {
  const since = new Date();
  since.setDate(since.getDate() - FRESH_DROPS_DAYS);

  return Product.find({ isActive: true, createdAt: { $gte: since } })
    .select(PRODUCT_PROJECTION)
    .sort({ createdAt: -1 })
    .limit(limit);
}

/**
 * trendingNow — highest combined sales × rating signal.
 * Sorting by totalSales desc, then ratingsAverage desc as a tiebreaker covers
 * both high-volume and high-quality products.
 */
async function getTrendingNow(limit = LIMITS.trendingNow) {
  return Product.find({ isActive: true })
    .select(PRODUCT_PROJECTION)
    .sort({ totalSales: -1, ratingsAverage: -1 })
    .limit(limit);
}

// ---------------------------------------------------------------------------
// Cold-start shelf builders (guest / no history)
// ---------------------------------------------------------------------------

/**
 * Returns one representative product per popular category so the frontend
 * can render a "Shop by Category" carousel.
 */
async function getPopularCategories() {
  // Aggregate: group by category, pick the top-selling product per group
  const results = await Product.aggregate([
    { $match: { isActive: true } },
    { $sort: { totalSales: -1 } },
    {
      $group: {
        _id: '$category',
        productId: { $first: '$_id' },
        name: { $first: '$name' },
        image: { $first: { $arrayElemAt: ['$images', 0] } },
        category: { $first: '$category' },
        price: { $first: '$price' },
        ratingsAverage: { $first: '$ratingsAverage' },
        totalSales: { $first: '$totalSales' },
      },
    },
    { $sort: { totalSales: -1 } },
    { $limit: LIMITS.popularCategories },
    {
      $project: {
        _id: '$productId',
        category: 1,
        name: 1,
        image: 1,
        price: 1,
        ratingsAverage: 1,
        totalSales: 1,
      },
    },
  ]);

  return results;
}

// ---------------------------------------------------------------------------
// Main controller
// ---------------------------------------------------------------------------

/**
 * GET /api/discovery/feed
 *
 * Returns a structured JSON object with named carousel shelves.
 * req.user is populated by optionalAuth — null for guests.
 */
const getDiscoveryFeed = async (req, res, next) => {
  try {
    const user = req.user;
    const hasHistory =
      user &&
      (user.viewedProducts.length > 0 ||
        user.recentSearches.length > 0 ||
        user.categoryAffinity.length > 0);

    // ── Personalized path ────────────────────────────────────────────────────
    if (hasHistory) {
      const shelves = await runParallel({
        continueBrowsing: getContinueBrowsing(user),
        basedOnRecentSearch: getBasedOnRecentSearch(user),
        forYou: getForYou(user),
        freshDrops: getFreshDrops(),
        trendingNow: getTrendingNow(),
      });

      // Build context metadata so the frontend knows why shelves were chosen
      const latestSearch = user.recentSearches[0] ?? null;
      const topCategories = user.getTopCategories(3);

      return res.status(200).json({
        success: true,
        feedType: 'personalized',
        meta: {
          userId: user._id,
          basedOnSearch: latestSearch
            ? { query: latestSearch.query, category: latestSearch.category }
            : null,
          topCategories,
        },
        feed: {
          continueBrowsing: shelves.continueBrowsing,
          basedOnRecentSearch: shelves.basedOnRecentSearch,
          forYou: shelves.forYou,
          freshDrops: shelves.freshDrops,
          trendingNow: shelves.trendingNow,
        },
      });
    }

    // ── Cold-start / guest path ──────────────────────────────────────────────
    const [popularCategories, trendingNow, freshDrops] = await Promise.all([
      getPopularCategories(),
      getTrendingNow(LIMITS.coldTrending),
      getFreshDrops(LIMITS.coldFreshDrops),
    ]);

    return res.status(200).json({
      success: true,
      feedType: 'cold-start',
      meta: {
        userId: null,
        message:
          'Log in and start browsing to get a personalized feed tailored to you.',
      },
      feed: {
        popularCategories,
        trendingNow,
        freshDrops,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDiscoveryFeed };
