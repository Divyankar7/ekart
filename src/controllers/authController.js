const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ---------------------------------------------------------------------------
// Helper: sign a JWT and return it
// ---------------------------------------------------------------------------
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ---------------------------------------------------------------------------
// Helper: build the safe user payload sent to the client
// ---------------------------------------------------------------------------
const userPayload = (user) => ({
  _id:             user._id,
  name:            user.name,
  email:           user.email,
  categoryAffinity: user.categoryAffinity,
  recentSearches:  user.recentSearches,
  viewedProducts:  user.viewedProducts,
  purchasedProducts: user.purchasedProducts,
  createdAt:       user.createdAt,
});

// ---------------------------------------------------------------------------
// POST /api/auth/register
// Body: { name, email, password }
// ---------------------------------------------------------------------------
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // ── Validation ─────────────────────────────────────────────────────────
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    // ── Duplicate email check ───────────────────────────────────────────────
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // ── Create user (pre-save hook hashes password) ─────────────────────────
    const user = await User.create({ name: name.trim(), email, password });

    const token = signToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: userPayload(user),
    });
  } catch (err) {
    // Mongoose duplicate key error (race condition)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/login
// Body: { email, password }
// ---------------------------------------------------------------------------
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // Explicitly select password (it has select:false on the schema)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+password name email categoryAffinity recentSearches viewedProducts purchasedProducts createdAt'
    );

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password.',
      });
    }

    const token = signToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userPayload(user),
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/auth/me   (requires protect middleware)
// Returns the currently authenticated user's profile.
// ---------------------------------------------------------------------------
const getMe = async (req, res) => {
  // req.user is attached by the protect middleware
  return res.status(200).json({
    success: true,
    user: userPayload(req.user),
  });
};

module.exports = { register, login, getMe };
