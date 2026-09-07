const express = require('express');
const router = express.Router();

const { optionalAuth } = require('../middleware/auth');
const { getDiscoveryFeed } = require('../controllers/discoveryController');

/**
 * GET /api/discovery/feed
 *
 * optionalAuth is intentional here:
 *   - Logged-in users → personalized feed
 *   - Guests          → cold-start feed
 * Both share the same route, the controller branches on req.user.
 */
router.get('/feed', optionalAuth, getDiscoveryFeed);

module.exports = router;
