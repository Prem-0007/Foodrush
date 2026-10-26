const router = require('express').Router();
const MenuItem = require('../models/MenuItem');

router.get('/', async (req, res, next) => {
  try {
    const filter = { active: true };
    if (typeof req.query.restaurant === 'string') filter.restaurant = req.query.restaurant;
    // lean() skips Mongoose document overhead; the projection returns only what the page needs.
    const items = await MenuItem.find(filter, 'sku name description restaurant price stock').sort({ restaurant: 1, name: 1 }).lean();
    res.set('Cache-Control', 'public, max-age=15');
    res.json(items);
  } catch (e) { next(e); }
});

module.exports = router;
