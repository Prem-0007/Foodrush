const stripe = require('../stripe');
const config = require('../config');
const Order = require('../models/Order');
const WebhookEvent = require('../models/WebhookEvent');
const { releaseOrderStock } = require('../services/orders');

// Must receive the raw body: the signature is computed over the exact bytes Stripe sent.
module.exports = async function webhook(req, res) {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.get('stripe-signature'), config.stripeWebhookSecret);
  } catch (e) {
    return res.status(400).send('Invalid signature');
  }

  try {
    // Stripe may send the same event more than once. Skip events we already finished.
    if (await WebhookEvent.exists({ _id: event.id })) return res.json({ received: true, duplicate: true });

    const obj = event.data.object;
    const orderId = obj.metadata && obj.metadata.orderId;

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        if (obj.payment_status !== 'paid' || !orderId) break;
        const order = await Order.findById(orderId);
        if (!order) break;
        if (obj.amount_total !== order.total) {
          // The amount Stripe collected is not the amount we expected. Do not mark it paid.
          console.error(JSON.stringify({ level: 'error', msg: 'amount mismatch', orderId, expected: order.total, got: obj.amount_total }));
          break;
        }
        // Only move pending_payment to paid. A repeat of this event changes nothing.
        const paid = await Order.findOneAndUpdate({ _id: orderId, status: 'pending_payment' }, { $set: { status: 'paid', paymentIntentId: obj.payment_intent } });
        if (!paid && order.status === 'expired') {
          console.error(JSON.stringify({ level: 'error', msg: 'payment arrived for an expired order, needs a refund or manual review', orderId }));
        }
        break;
      }
      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed': {
        if (!orderId) break;
        const o = await Order.findOne({ _id: orderId, status: 'pending_payment' });
        if (o) await releaseOrderStock(orderId, 'expired');
        break;
      }
      default:
        break; // other events are acknowledged and ignored
    }

    await WebhookEvent.create({ _id: event.id, type: event.type }).catch((e) => { if (e.code !== 11000) throw e; });
    res.json({ received: true });
  } catch (e) {
    console.error(JSON.stringify({ level: 'error', msg: 'webhook handler failed', eventId: event.id, err: e.message }));
    res.status(500).send('Handler failed'); // Stripe will retry with backoff
  }
};
