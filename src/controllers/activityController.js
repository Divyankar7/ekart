const User = require('../models/User');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_RECENT_SEARCHES = 5;
const MAX_VIEWED_PRODUCTS = 10;

// Affinity delta applied per interaction type
const AFFINITY_DELTA = {
  view: 1,
  search: 2, // searches signal stronger intent
};

/**
 * POST /api/users/track-activity
 *
 * Payload:
 *   { type: 'view' | 'search', productId?: string, query?: string, category?: string }
 *
 * - 'view'   → push productId into viewedProducts (cap at 10), increment category affinity
 * - 'search' → push { query, category } into recentSearches (cap at 5), increment category affinity
 */
const trackActivity = async (req, res, next) => {
  try {
    const { type, productId, query, category } = req.body;

    // ── Input validation ────────────────────────────────────────────────────
    if (!type || !['view', 'search'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Field 'type' must be 'view' or 'search'.",
      });
    }

    if (type === 'view' && !productId) {
      return res.status(400).json({
        success: false,
        message: "'productId' is required for a 'view' interaction.",
      });
    }

    if (type === 'search' && !query && !category) {
      return res.status(400).json({
        success: false,
        message:
          "At least one of 'query' or 'category' is required for a 'search' interaction.",
      });
    }

    // ── Load the user document with mutable sub-arrays ──────────────────────
    // req.user was attached by the protect middleware but was lean-selected;
    // we need the full document here to call instance methods and save.
    const user = await User.findById(req.user._id);

    // ── Handle 'view' ────────────────────────────────────────────────────────
    if (type === 'view') {
      // Remove any prior entry for the same product so it bubbles to the top
      user.viewedProducts = user.viewedProducts.filter(
        (v) => v.product.toString() !== productId
      );

      // Prepend the new view
      user.viewedProducts.unshift({ product: productId, viewedAt: new Date() });

      // Enforce cap (keep most recent MAX_VIEWED_PRODUCTS entries)
      if (user.viewedProducts.length > MAX_VIEWED_PRODUCTS) {
        user.viewedProducts = user.viewedProducts.slice(0, MAX_VIEWED_PRODUCTS);
      }
    }

    // ── Handle 'search' ──────────────────────────────────────────────────────
    if (type === 'search') {
      // Remove duplicate search if the exact query already exists
      if (query) {
        user.recentSearches = user.recentSearches.filter(
          (s) => s.query.toLowerCase() !== query.toLowerCase()
        );
      }

      // Prepend the new search entry
      user.recentSearches.unshift({
        query: query || '',
        category: category || null,
        searchedAt: new Date(),
      });

      // Enforce cap
      if (user.recentSearches.length > MAX_RECENT_SEARCHES) {
        user.recentSearches = user.recentSearches.slice(0, MAX_RECENT_SEARCHES);
      }
    }

    // ── Update category affinity ─────────────────────────────────────────────
    const affinityCategory = category || null;
    if (affinityCategory) {
      user.incrementCategoryAffinity(
        affinityCategory,
        AFFINITY_DELTA[type] ?? 1
      );
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Activity tracked successfully.',
      data: {
        recentSearches: user.recentSearches,
        viewedProductsCount: user.viewedProducts.length,
        categoryAffinity: user.categoryAffinity,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { trackActivity };
