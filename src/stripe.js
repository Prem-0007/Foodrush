const Stripe = require('stripe');
const config = require('./config');
module.exports = new Stripe(config.stripeSecretKey, { maxNetworkRetries: 2, timeout: 10000 });
