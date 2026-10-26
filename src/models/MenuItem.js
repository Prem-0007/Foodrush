const { Schema, model } = require('mongoose');

// price is stored in paise (1/100 rupee) as an integer, the unit Stripe uses.
const menuItemSchema = new Schema(
  {
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    restaurant: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 100, validate: Number.isInteger },
    stock: { type: Number, required: true, min: 0, validate: Number.isInteger },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('MenuItem', menuItemSchema);
