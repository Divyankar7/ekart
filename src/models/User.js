const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Tracks a single search term with a timestamp
const recentSearchSchema = new mongoose.Schema(
  {
    query: { type: String, required: true },
    category: { type: String, default: null },
    searchedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Tracks a single product view with a timestamp
const viewedProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    viewedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Category affinity: maps category slug → numeric score
// e.g. { electronics: 7, clothing: 2 }
const categoryAffinitySchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    score: { type: Number, default: 0 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // never returned in queries by default
    },

    // Interaction history — capped in application logic
    recentSearches: {
      type: [recentSearchSchema],
      default: [],
    },
    viewedProducts: {
      type: [viewedProductSchema],
      default: [],
    },

    // Affinity scores per category
    categoryAffinity: {
      type: [categoryAffinitySchema],
      default: [],
    },

    // Products the user has purchased — excluded from forYou feed
    purchasedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Pre-save: hash password if modified
// ---------------------------------------------------------------------------
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ---------------------------------------------------------------------------
// Instance method: verify password
// ---------------------------------------------------------------------------
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ---------------------------------------------------------------------------
// Instance method: get top N categories by affinity score
// ---------------------------------------------------------------------------
userSchema.methods.getTopCategories = function (n = 3) {
  return [...this.categoryAffinity]
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((c) => c.category);
};

// ---------------------------------------------------------------------------
// Instance method: upsert category affinity score
// ---------------------------------------------------------------------------
userSchema.methods.incrementCategoryAffinity = function (category, delta = 1) {
  if (!category) return;
  const existing = this.categoryAffinity.find((c) => c.category === category);
  if (existing) {
    existing.score += delta;
  } else {
    this.categoryAffinity.push({ category, score: delta });
  }
};

const User = mongoose.model('User', userSchema);
module.exports = User;
