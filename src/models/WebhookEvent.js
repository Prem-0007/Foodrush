const { Schema, model } = require('mongoose');

// Stripe delivers each event at least once. The unique _id lets us ignore repeats.
const webhookEventSchema = new Schema(
  {
    _id: { type: String }, // Stripe event id, e.g. evt_123
    type: String,
    processedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// Remove records after 30 days; Stripe stops retrying long before that.
webhookEventSchema.index({ processedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = model('WebhookEvent', webhookEventSchema);
