const Product = require('../models/Product');

// ---------------------------------------------------------------------------
// GET /api/products/:id
// Returns a single product by its MongoDB ObjectId.
// ---------------------------------------------------------------------------
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.status(200).json({ success: true, data: product });
  } catch (err) {
    // CastError means malformed ObjectId
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' });
    }
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/products
// Query params:
//   category    — comma-separated category slugs  e.g. "electronics,footwear"
//   exclude     — comma-separated product IDs to exclude
//   sort        — "newest" | "trending" | "rating" | "price-asc" | "price-desc"
//   search      — full-text keyword search (uses $text index, falls back to regex)
//   minPrice    — minimum price in USD  (inclusive)
//   maxPrice    — maximum price in USD  (inclusive)
//   minRating   — minimum ratingsAverage (e.g. 3, 4)
//   page        — page number, 1-indexed (default 1)
//   limit       — results per page (default 12, max 48)
// ---------------------------------------------------------------------------
const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      exclude,
      sort      = 'trending',
      search,
      minPrice,
      maxPrice,
      minRating,
    } = req.query;

    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 12), 48);
    const skip  = (page - 1) * limit;

    // ── Build filter ────────────────────────────────────────────────────────
    const filter = { isActive: true };

    // Category: accept single value OR comma-separated list
    if (category) {
      const cats = category
        .split(',')
        .map((c) => c.toLowerCase().trim())
        .filter(Boolean);
      if (cats.length === 1) {
        filter.category = cats[0];
      } else if (cats.length > 1) {
        filter.category = { $in: cats };
      }
    }

    // Exclude specific IDs (e.g. current product on detail page)
    if (exclude) {
      const excludeIds = exclude.split(',').map((id) => id.trim()).filter(Boolean);
      if (excludeIds.length) filter._id = { $nin: excludeIds };
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = parseFloat(maxPrice);
    }

    // Minimum rating
    if (minRating !== undefined) {
      filter.ratingsAverage = { $gte: parseFloat(minRating) };
    }

    // ── Build sort ──────────────────────────────────────────────────────────
    const sortMap = {
      newest:     { createdAt: -1 },
      trending:   { totalSales: -1, ratingsAverage: -1 },
      rating:     { ratingsAverage: -1, ratingsCount: -1 },
      'price-asc':  { price: 1 },
      'price-desc': { price: -1 },
    };
    const sortQuery = sortMap[sort] ?? sortMap.trending;

    // ── Text search ─────────────────────────────────────────────────────────
    // $text search must come before .sort() and uses a special score sort.
    // For short terms (< 3 chars) fall back to a regex on name.
    let useTextSearch = false;
    if (search && search.trim().length > 0) {
      const term = search.trim();
      if (term.length >= 3) {
        filter.$text = { $search: term };
        useTextSearch = true;
      } else {
        filter.name = { $regex: term, $options: 'i' };
      }
    }

    // ── Execute queries in parallel ─────────────────────────────────────────
    const baseQuery = Product.find(filter).select(
      'name category brand price stock images ratingsAverage ratingsCount totalSales tags createdAt'
    );

    const dataQuery = useTextSearch
      ? baseQuery.clone().sort({ score: { $meta: 'textScore' }, ...sortQuery })
      : baseQuery.clone().sort(sortQuery);

    const [products, total] = await Promise.all([
      dataQuery.skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    // ── Price bounds (for slider range in UI) ───────────────────────────────
    // Return overall min/max so the frontend can set slider bounds correctly.
    const [bounds] = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, minPrice: { $min: '$price' }, maxPrice: { $max: '$price' } } },
    ]);

    return res.status(200).json({
      success: true,
      count:   products.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      bounds: bounds
        ? { minPrice: bounds.minPrice, maxPrice: bounds.maxPrice }
        : { minPrice: 0, maxPrice: 2000 },
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProductById, getProducts };
