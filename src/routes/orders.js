const router = require('express').Router();
const mongoose = require('mongoose');
const { z } = require('zod');
const Order = require('../models/Order');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { releaseOrderStock } = require('../services/orders');

const NEXT = { paid: ['preparing', 'cancelled'], preparing: ['out_for_delivery'], out_for_delivery: ['delivered'] };
const validId = (req, res, next) => (mongoose.isValidObjectId(req.params.id) ? next() : res.status(400).json({ error: 'Invalid order id' }));

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 20, 50);
    res.json(await Order.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(limit).lean());
  } catch (e) { next(e); }
});

router.get('/:id', validId, async (req, res, next) => {
  try {
    // The user id is part of the query, so one customer can never read another's order.
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id }).lean();
    order ? res.json(order) : res.status(404).json({ error: 'Not found' });
  } catch (e) { next(e); }
});

// Kitchen and riders move an order along. Admin only, and only to the allowed next status.
router.patch('/:id/status', requireRole('admin'), validId, validate(z.object({ status: z.enum(['preparing', 'out_for_delivery', 'delivered', 'cancelled']) }).strict()), async (req, res, next) => {
  try {
    const current = await Order.findById(req.params.id);
    if (!current) return res.status(404).json({ error: 'Not found' });
    if (!(NEXT[current.status] || []).includes(req.body.status)) {
      return res.status(409).json({ error: `Cannot go from ${current.status} to ${req.body.status}` });
    }
    current.status = req.body.status;
    // save() checks the document version (optimistic locking), so two staff members
    // changing the same order at once cannot silently overwrite each other.
    await current.save();
    if (req.body.status === 'cancelled') await releaseOrderStock(current._id, 'cancelled');
    res.json(current);
  } catch (e) {
    if (e.name === 'VersionError') return res.status(409).json({ error: 'Order changed while you were editing it, reload and retry' });
    next(e);
  }
});

module.exports = router;
