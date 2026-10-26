const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const stripe = require('../stripe');
const config = require('../config');
const { HttpError } = require('../middleware/errors');

// Take stock for every line. Each decrement is a single atomic update that only succeeds
// if enough stock remains, so two customers can never both get the last portion.
// Without multi-document transactions (a standalone MongoDB), we undo earlier lines on failure.
async function reserveStock(lines) {
  const taken = [];
  for (const l of lines) {
    const ok = await MenuItem.findOneAndUpdate(
      { sku: l.sku, active: true, stock: { $gte: l.qty } },
      { $inc: { stock: -l.qty } }
    );
    if (!ok) {
      await releaseLines(taken);
      throw new HttpError(409, `Not enough stock for ${l.name}`);
    }
    taken.push(l);
  }
}

const releaseLines = (lines) =>
  Promise.all(lines.map((l) => MenuItem.updateOne({ sku: l.sku }, { $inc: { stock: l.qty } })));

// Release the stock of an order exactly once, even if called twice (webhook retry plus expiry).
async function releaseOrderStock(orderId, status) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, stockReleased: false },
    { $set: { stockReleased: true, status } },
    { new: true }
  );
  if (order) await releaseLines(order.items);
  return order;
}

async function sessionFor(order) {
  const s = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
  return { orderId: order._id, url: s.url, status: order.status };
}

async function createCheckout({ userId, email, items, address, idempotencyKey }) {
  // 1. Same key from the same user returns the same order (double tap, network retry).
  let order = await Order.findOne({ user: userId, idempotencyKey });
  if (order) {
    if (order.stripeSessionId && order.status === 'pending_payment') return sessionFor(order);
    if (order.stripeSessionId) return { orderId: order._id, url: null, status: order.status };
    // Otherwise a previous attempt stopped before a Stripe session existed. Continue below.
  }

  // 2. Price everything from our database. The client never sends a price.
  let lines;
  if (!order) {
    const skus = [...new Set(items.map((i) => i.sku))];
    const menu = await MenuItem.find({ sku: { $in: skus }, active: true }).lean();
    const bySku = new Map(menu.map((m) => [m.sku, m]));
    const qtyBySku = new Map();
    items.forEach((i) => qtyBySku.set(i.sku, (qtyBySku.get(i.sku) || 0) + i.qty));
    lines = [...qtyBySku].map(([sku, qty]) => {
      const m = bySku.get(sku);
      if (!m) throw new HttpError(422, `Unknown item ${sku}`);
      return { sku, name: m.name, unitPrice: m.price, qty };
    });

    // 3. Reserve stock, then create the order. Undo the reservation if creation fails.
    await reserveStock(lines);
    try {
      order = await Order.create({
        user: userId,
        items: lines,
        total: lines.reduce((n, l) => n + l.unitPrice * l.qty, 0),
        address,
        idempotencyKey,
      });
    } catch (e) {
      await releaseLines(lines);
      if (e.code === 11000) {
        // Two identical requests raced. The other one won, return its order.
        const existing = await Order.findOne({ user: userId, idempotencyKey });
        if (existing && existing.stripeSessionId) return sessionFor(existing);
        throw new HttpError(409, 'This order is already being created, try again in a moment');
      }
      throw e;
    }
  }

  // 4. Create the hosted Stripe Checkout page. The Stripe idempotency key makes a retry of this
  //    exact call return the same session instead of creating a second one.
  let session;
  try {
    session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        customer_email: email,
        client_reference_id: String(order._id),
        metadata: { orderId: String(order._id) },
        payment_intent_data: { metadata: { orderId: String(order._id) } },
        line_items: order.items.map((l) => ({
          quantity: l.qty,
          price_data: { currency: config.currency, unit_amount: l.unitPrice, product_data: { name: l.name } },
        })),
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        success_url: `${config.publicUrl}/?paid=${order._id}`,
        cancel_url: `${config.publicUrl}/?cancelled=${order._id}`,
      },
      { idempotencyKey: `checkout-${order._id}` }
    );
  } catch (e) {
    // Compensating action: the card was never charged, so give the food back.
    await releaseOrderStock(order._id, 'cancelled');
    throw new HttpError(502, 'Payment provider is unavailable, you were not charged');
  }
  // If this save fails, a retry with the same key reaches Stripe with the same idempotency key
  // and gets this same session back, so nothing is duplicated.
  order.stripeSessionId = session.id;
  await order.save();
  return { orderId: order._id, url: session.url, status: order.status };
}

module.exports = { createCheckout, releaseOrderStock };
