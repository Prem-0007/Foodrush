// Scratch collections used only by the admin-only /api/lab endpoints. They never touch real orders or menu data.
const { Schema, model } = require('mongoose');

// Idempotency demo. Unique per (session, key) only when a key was sent. Auto-deleted after 1 hour.
const labChargeSchema = new Schema({
  session: { type: String, required: true, index: true },
  key: String,
  chargeId: String,
  createdAt: { type: Date, default: Date.now, expires: 3600 },
}, { versionKey: false });
labChargeSchema.index({ session: 1, key: 1 }, { unique: true, partialFilterExpression: { key: { $type: 'string' } } });

// Locking demo: one portion of stock with a version number and a lock flag.
const labStockSchema = new Schema({ _id: String, stock: Number, version: Number, locked: Boolean }, { versionKey: false });

// N+1 and index demos.
const labRestaurantSchema = new Schema({ _id: Number, name: String }, { versionKey: false });
const labOrderSchema = new Schema({ rid: Number, status: String, total: Number, createdAt: Date }, { versionKey: false });

module.exports = {
  LabCharge: model('LabCharge', labChargeSchema),
  LabStock: model('LabStock', labStockSchema),
  LabRestaurant: model('LabRestaurant', labRestaurantSchema),
  LabOrder: model('LabOrder', labOrderSchema),
};
