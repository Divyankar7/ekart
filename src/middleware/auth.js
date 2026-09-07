const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect
 * Hard-authentication middleware. Rejects the request with 401 if no valid
 * JWT is provided. Attaches the full user document to req.user.
 */
const protect = async (req, res, next) => {
  try {
    // Support Bearer token in Authorization header OR signed cookie
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach live user document (excluding password)
    const user = await User.findById(decoded.id).select(
      'name email recentSearches viewedProducts categoryAffinity purchasedProducts'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (err.name === 'TokenExpiredError') {
      return res
        .status(401)
        .json({ success: false, message: 'Token expired. Please log in again.' });
    }
    next(err);
  }
};

/**
 * optionalAuth
 * Soft-authentication middleware. Attaches req.user if a valid JWT is present,
 * but lets the request through either way. Used by the discovery feed so the
 * same endpoint handles both logged-in and guest users.
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(
      'name email recentSearches viewedProducts categoryAffinity purchasedProducts'
    );

    req.user = user || null;
    next();
  } catch {
    // Any token error → treat as guest, don't block the request
    req.user = null;
    next();
  }
};

module.exports = { protect, optionalAuth };
