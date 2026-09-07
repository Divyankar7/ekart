const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { createOrder, getMyOrders, getOrderById } = require('../controllers/orderController');

// All order routes require authentication
router.use(protect);

router.post('/',      createOrder);   // POST  /api/orders
router.get('/my',     getMyOrders);   // GET   /api/orders/my
router.get('/:id',    getOrderById);  // GET   /api/orders/:id

module.exports = router;
