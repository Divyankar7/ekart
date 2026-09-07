const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { trackActivity } = require('../controllers/activityController');

/**
 * POST /api/users/track-activity
 * Requires authentication — guests cannot have a history.
 */
router.post('/track-activity', protect, trackActivity);

module.exports = router;
