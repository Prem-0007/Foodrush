const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config');
const MenuItem = require('./models/MenuItem');
const User = require('./models/User');

const MENU = [
  { sku: 'BIRYANI-01', name: 'Chicken Dum Biryani', description: 'Slow cooked with saffron and fried onions', restaurant: 'Paradise Kitchen', price: 34900, stock: 40 },
  { sku: 'RAITA-01', name: 'Boondi Raita', description: 'Cool yoghurt with crisp boondi', restaurant: 'Paradise Kitchen', price: 6000, stock: 60 },
  { sku: 'PANEER-01', name: 'Paneer Butter Masala', description: 'Creamy tomato gravy', restaurant: 'Spice Route', price: 28900, stock: 30 },
  { sku: 'NAAN-01', name: 'Butter Naan', description: 'Tandoor baked', restaurant: 'Spice Route', price: 5500, stock: 80 },
  { sku: 'DOSA-01', name: 'Ghee Podi Dosa', description: 'Crisp dosa with spiced lentil powder', restaurant: 'Udupi Corner', price: 12000, stock: 50 },
  { sku: 'FILTER-01', name: 'Filter Coffee', description: 'Strong South Indian decoction', restaurant: 'Udupi Corner', price: 4000, stock: 100 },
];

(async () => {
  await mongoose.connect(config.mongoUri);
  for (const m of MENU) await MenuItem.updateOne({ sku: m.sku }, { $setOnInsert: m }, { upsert: true });
  console.log(`Menu ready (${MENU.length} items). Existing stock is left untouched.`);
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase(), pw = process.env.ADMIN_PASSWORD;
  if (email && pw) {
    await User.updateOne({ email }, { $setOnInsert: { name: 'Admin', email, passwordHash: await bcrypt.hash(pw, 12), role: 'admin' } }, { upsert: true });
    console.log(`Admin account ready: ${email}`);
  } else console.log('Set ADMIN_EMAIL and ADMIN_PASSWORD to create an admin account.');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
