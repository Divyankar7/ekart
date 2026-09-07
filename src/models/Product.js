const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true },
  },
  { timestamps: true, _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    images: [{ type: String }],

    // Aggregated rating
    ratingsAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (val) => Math.round(val * 10) / 10, // store as e.g. 4.3
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
    reviews: [reviewSchema],

    // Total units sold — used for trendingNow
    totalSales: {
      type: Number,
      default: 0,
      index: true,
    },

    // Tags allow finer-grained text search beyond category
    tags: [{ type: String, lowercase: true, trim: true }],

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true } // createdAt used for freshDrops
);

// ---------------------------------------------------------------------------
// Compound text index: enables $text search across name, description, tags
// ---------------------------------------------------------------------------
productSchema.index(
  { name: 'text', description: 'text', tags: 'text' },
  { weights: { name: 10, tags: 5, description: 1 }, name: 'ProductTextIndex' }
);

// Useful for freshDrops query (newest first, active only)
productSchema.index({ createdAt: -1, isActive: 1 });

// Useful for trendingNow query
productSchema.index({ totalSales: -1, ratingsAverage: -1 });

// ---------------------------------------------------------------------------
// Static: recompute ratingsAverage + ratingsCount after a review is added
// ---------------------------------------------------------------------------
productSchema.statics.recalcRatings = async function (productId) {
  const product = await this.findById(productId);
  if (!product || product.reviews.length === 0) return;
  const total = product.reviews.reduce((sum, r) => sum + r.rating, 0);
  product.ratingsCount = product.reviews.length;
  product.ratingsAverage = total / product.ratingsCount;
  await product.save();
};

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
