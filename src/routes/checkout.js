const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const User = require('../models/User');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { createCheckout } = require('../services/orders');

// 10 checkouts a minute per user is far above normal use and stops scripted abuse.
const limiter = rateLimit({
  windowMs: 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip, message: { error: 'Too many checkout attempts, slow down' },
});

const schema = z.object({
  items: z.array(z.object({ sku: z.string().regex(/^[A-Za-z0-9-]{3,24}$/), qty: z.number().int().min(1).max(20) }).strict()).min(1).max(30),
  address: z.string().trim().min(5).max(200),
}).strict();

router.post('/', requireAuth, limiter, validate(schema), async (req, res, next) => {
  try {
    const key = req.get('idempotency-key');
    if (!key || !/^[A-Za-z0-9_-]{8,64}$/.test(key)) {
      return res.status(400).json({ error: 'Send an Idempotency-Key header (8 to 64 letters, digits, - or _)' });
    }
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(401).json({ error: 'Unknown user' });
    const out = await createCheckout({ userId: user._id, email: user.email, items: req.body.items, address: req.body.address, idempotencyKey: key });
    res.status(out.url ? 201 : 200).json(out);
  } catch (e) { next(e); }
});

module.exports = router;
module.exports.schema = schema; // reused by the admin-only lab validation endpoint
