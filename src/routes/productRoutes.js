const express = require('express');
const router = express.Router();
const { getProductById, getProducts } = require('../controllers/productController');

// GET /api/products?category=electronics&exclude=<id>&limit=8&sort=trending
router.get('/', getProducts);

// GET /api/products/:id
router.get('/:id', getProductById);

module.exports = router;
