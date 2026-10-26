const { Schema, model } = require('mongoose');

const itemSchema = new Schema(
  {
    sku: String,
    name: String,
    unitPrice: Number, // paise, copied at order time so later price changes never alter old orders
    qty: Number,
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [itemSchema], validate: (v) => v.length > 0 },
    total: { type: Number, required: true }, // paise
    address: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending_payment', 'paid', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'expired'],
      default: 'pending_payment',
      index: true,
    },
    stripeSessionId: { type: String, index: true, sparse: true },
    paymentIntentId: String,
    // The client sends this header on POST /api/checkout. The same key always returns the same order.
    idempotencyKey: { type: String, required: true },
    stockReleased: { type: Boolean, default: false },
  },
  { timestamps: true, optimisticConcurrency: true }
);

// One order per (user, key): a double tap cannot create two orders.
orderSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true });
// Common query: a user's recent orders.
orderSchema.index({ user: 1, createdAt: -1 });

module.exports = model('Order', orderSchema);
