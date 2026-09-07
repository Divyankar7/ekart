const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name:     { type: String, required: true },
    image:    { type: String, default: '' },
    category: { type: String, default: '' },
    brand:    { type: String, default: '' },
    price:    { type: Number, required: true }, // USD price at time of purchase
    qty:      { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    street:   { type: String, required: true, trim: true },
    city:     { type: String, required: true, trim: true },
    pincode:  { type: String, required: true, trim: true },
    phone:    { type: String, required: true, trim: true },
  },
  { _id: false }
);

// ---------------------------------------------------------------------------
// Timeline event — one entry per status change
// ---------------------------------------------------------------------------
const timelineEventSchema = new mongoose.Schema(
  {
    status:    { type: String, required: true },
    message:   { type: String, default: '' },
    timestamp: { type: Date,   default: Date.now },
  },
  { _id: false }
);

// ---------------------------------------------------------------------------
// Order schema
// ---------------------------------------------------------------------------
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    items:           { type: [orderItemSchema],     required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },

    paymentMethod: {
      type: String,
      enum: ['cod', 'online'],
      required: true,
    },

    // Payment detail — populated for online payments
    paymentResult: {
      id:     { type: String },
      status: { type: String },
      paidAt: { type: Date },
    },

    // Pricing — all in USD (display layer converts via useCurrency)
    subtotalUsd:  { type: Number, required: true },
    taxUsd:       { type: Number, required: true },
    shippingUsd:  { type: Number, default: 0 },
    totalUsd:     { type: Number, required: true },

    // Order lifecycle
    status: {
      type: String,
      enum: ['placed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'placed',
      index: true,
    },

    timeline: { type: [timelineEventSchema], default: [] },

    // Estimated delivery date (set at creation, e.g. +7 days for standard)
    estimatedDelivery: { type: Date },

    isPaid:      { type: Boolean, default: false },
    paidAt:      { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
  },
  { timestamps: true } // createdAt = order placed timestamp
);

// ---------------------------------------------------------------------------
// Virtual: human-readable order ID (e.g. "ORD-20260906-A3F2")
// ---------------------------------------------------------------------------
orderSchema.virtual('displayId').get(function () {
  const date = this.createdAt
    ? this.createdAt.toISOString().slice(0, 10).replace(/-/g, '')
    : 'XXXXXXXX';
  const suffix = this._id.toString().slice(-4).toUpperCase();
  return `ORD-${date}-${suffix}`;
});

orderSchema.set('toJSON',   { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
