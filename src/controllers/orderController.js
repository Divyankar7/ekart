const mongoose = require('mongoose');
const Order   = require('../models/Order');
const Product = require('../models/Product');
const User    = require('../models/User');

const GST_RATE      = 0.18;
const STANDARD_SHIP = 0;      // free standard shipping
const EXPRESS_SHIP  = 4.99;   // USD

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Adds a timeline entry to an order.
 * Call before saving the order document.
 */
const pushTimeline = (order, status, message = '') => {
  order.timeline.push({ status, message, timestamp: new Date() });
  order.status = status;
};

// ---------------------------------------------------------------------------
// POST /api/orders
//
// Body:
//   {
//     items: [{ productId, name, image, category, brand, price, qty }],
//     shippingAddress: { fullName, street, city, pincode, phone },
//     paymentMethod: 'cod' | 'online',
//     deliveryOption: 'standard' | 'express',
//     // for online mock:
//     mockPaymentId?: string
//   }
// ---------------------------------------------------------------------------
const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      deliveryOption = 'standard',
      mockPaymentId,
    } = req.body;

    // ── Input validation ────────────────────────────────────────────────────
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
    }

    const requiredAddr = ['fullName', 'street', 'city', 'pincode', 'phone'];
    for (const field of requiredAddr) {
      if (!shippingAddress?.[field]?.toString().trim()) {
        return res.status(400).json({ success: false, message: `Shipping address field '${field}' is required.` });
      }
    }

    if (!['cod', 'online'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "paymentMethod must be 'cod' or 'online'." });
    }

    // ── Transaction: stock check + deduct ──────────────────────────────────
    session.startTransaction();

    const productIds = items.map((i) => i.productId);
    const products   = await Product.find({ _id: { $in: productIds } }).session(session);

    // Build a lookup map
    const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

    // Validate every item and accumulate order items
    const orderItems = [];
    for (const item of items) {
      const product = productMap[item.productId];
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ success: false, message: `Product ${item.productId} not found.` });
      }
      if (!product.isActive) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: `"${product.name}" is no longer available.` });
      }
      if (product.stock < item.qty) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} unit(s) of "${product.name}" left in stock.`,
        });
      }

      // Deduct stock and increment sales atomically
      product.stock      -= item.qty;
      product.totalSales += item.qty;
      await product.save({ session });

      orderItems.push({
        product:  product._id,
        name:     product.name,
        image:    product.images?.[0] ?? '',
        category: product.category,
        brand:    product.brand ?? '',
        price:    product.price,  // snapshot at purchase time
        qty:      item.qty,
      });
    }

    // ── Pricing ─────────────────────────────────────────────────────────────
    const subtotalUsd = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
    const taxUsd      = subtotalUsd * GST_RATE;
    const shippingUsd = deliveryOption === 'express' ? EXPRESS_SHIP : STANDARD_SHIP;
    const totalUsd    = subtotalUsd + taxUsd + shippingUsd;

    // Delivery estimate
    const deliveryDays     = deliveryOption === 'express' ? 2 : 7;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);

    // ── Build order document ─────────────────────────────────────────────────
    const order = new Order({
      user:            req.user._id,
      items:           orderItems,
      shippingAddress,
      paymentMethod,
      subtotalUsd,
      taxUsd,
      shippingUsd,
      totalUsd,
      estimatedDelivery,
      timeline:        [],
    });

    // Initial timeline entry
    pushTimeline(order, 'placed', 'Order placed successfully.');

    // Handle online / mock payment
    if (paymentMethod === 'online') {
      order.isPaid  = true;
      order.paidAt  = new Date();
      order.paymentResult = {
        id:     mockPaymentId ?? `mock_${Date.now()}`,
        status: 'completed',
        paidAt: new Date(),
      };
      pushTimeline(order, 'processing', 'Payment received. Preparing your order.');
    }

    await order.save({ session });

    // ── Update user's purchasedProducts ──────────────────────────────────────
    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { purchasedProducts: { $each: orderItems.map((i) => i.product) } } },
      { session }
    );

    await session.commitTransaction();

    // Populate product refs before responding
    await order.populate('items.product', 'name images price');

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data:    order,
    });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    next(err);
  } finally {
    session.endSession();
  }
};

// ---------------------------------------------------------------------------
// GET /api/orders/my  — current user's order history
// ---------------------------------------------------------------------------
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-__v');

    return res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/orders/:id  — single order detail
// ---------------------------------------------------------------------------
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id:  req.params.id,
      user: req.user._id,   // users can only see their own orders
    }).populate('items.product', 'name images price category');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid order ID.' });
    }
    next(err);
  }
};

module.exports = { createOrder, getMyOrders, getOrderById };
