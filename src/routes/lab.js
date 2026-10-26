// Real endpoints behind the Systems Lab. Mounted only when LAB_ENABLED=true, and only for admins.
const router = require('express').Router();
const mongoose = require('mongoose');
const crypto = require('crypto');
const { LabCharge, LabStock, LabRestaurant, LabOrder } = require('../models/Lab');
const MenuItem = require('../models/MenuItem');
const config = require('../config');
const checkout = require('./checkout');

const clamp = (v, a, b) => Math.min(b, Math.max(a, Number.isFinite(v) ? v : a));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sessionOf = (req) => {
  const s = req.get('x-lab-session');
  return s && /^[A-Za-z0-9]{8,40}$/.test(s) ? s : null;
};
const timed = async (fn) => { const t = process.hrtime.bigint(); const out = await fn(); return [out, Number(process.hrtime.bigint() - t) / 1e6]; };
const r1 = (n) => Math.round(n * 10) / 10;

/* ---------- status and parameters ---------- */
router.get('/status', async (req, res) => {
  let pingMs = null, dbError = null;
  try { [, pingMs] = await timed(() => mongoose.connection.db.admin().ping()); } catch (e) { dbError = e.message; }
  res.json({
    node: process.version, uptimeSeconds: Math.round(process.uptime()), rssMb: Math.round(process.memoryUsage().rss / 1048576),
    db: { state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState], pingMs: pingMs && r1(pingMs), error: dbError, poolMax: 10 },
    stripe: { mode: config.stripeSecretKey.startsWith('sk_live') ? 'live' : 'test', currency: config.currency, webhookConfigured: config.stripeWebhookSecret.startsWith('whsec_') },
    limits: { api: '120 requests / minute / IP', auth: '10 attempts / 15 minutes / IP', checkout: '10 / minute / user', jwtExpiry: '1 hour', checkoutExpiry: '30 minutes', bodyLimit: '50 KB' },
  });
});

/* ---------- rate limiting: a real token bucket ---------- */
const buckets = new Map();
router.get('/ping', (req, res) => {
  const cap = clamp(Number(req.query.cap) || 8, 1, 20), rate = clamp(Number(req.query.rate) || 2, 1, 10);
  const now = Date.now(), key = req.user.id;
  let b = buckets.get(key);
  if (!b || b.cap !== cap || b.rate !== rate) b = { cap, rate, tokens: cap, t: now };
  b.tokens = Math.min(cap, b.tokens + ((now - b.t) / 1000) * rate); b.t = now;
  if (b.tokens >= 1) { b.tokens -= 1; buckets.set(key, b); return res.json({ allowed: true, tokens: r1(b.tokens) }); }
  buckets.set(key, b);
  const retry = Math.ceil(((1 - b.tokens) / rate) * 10) / 10;
  res.set('Retry-After', String(Math.ceil(retry)));
  res.status(429).json({ allowed: false, retryAfterSeconds: retry, tokens: r1(b.tokens) });
});

/* ---------- idempotency ---------- */
router.post('/charge', async (req, res, next) => {
  try {
    const session = sessionOf(req);
    if (!session) return res.status(400).json({ error: 'X-Lab-Session header required' });
    const key = req.get('idempotency-key');
    const chargeId = 'ch_' + crypto.randomBytes(5).toString('hex');
    if (!key) { await LabCharge.create({ session, chargeId }); return res.status(201).json({ created: true, chargeId, note: 'no key, so this was treated as a new payment' }); }
    try {
      await LabCharge.create({ session, key, chargeId });
      return res.status(201).json({ created: true, chargeId });
    } catch (e) {
      if (e.code !== 11000) throw e;
      const first = await LabCharge.findOne({ session, key }).lean();
      return res.json({ created: false, replayed: true, chargeId: first.chargeId });
    }
  } catch (e) { next(e); }
});
router.get('/charges', async (req, res, next) => {
  try { const session = sessionOf(req); res.json({ count: session ? await LabCharge.countDocuments({ session }) : 0 }); } catch (e) { next(e); }
});
router.delete('/charges', async (req, res, next) => {
  try { const session = sessionOf(req); if (session) await LabCharge.deleteMany({ session }); res.json({ ok: true }); } catch (e) { next(e); }
});

/* ---------- validation: the same schema the real checkout uses ---------- */
router.post('/validate', (req, res) => {
  const r = checkout.schema.safeParse(req.body);
  res.status(r.success ? 200 : 422).json(r.success ? { ok: true } : { ok: false, issues: r.error.issues.map((i) => ({ path: i.path.join('.') || '(body)', message: i.message })) });
});

/* ---------- locking: two buyers, one portion, on the real database ---------- */
const STOCK_ID = 'biryani';
async function worker(name, mode, log) {
  const t0 = Date.now(), say = (m) => log.push(`+${String(Date.now() - t0).padStart(3)} ms  ${name}: ${m}`);
  if (mode === 'none') {
    const d = await LabStock.findById(STOCK_ID).lean(); say(`read stock = ${d.stock}`);
    await sleep(80);
    if (d.stock < 1) { say('sold out'); return false; }
    await LabStock.updateOne({ _id: STOCK_ID }, { $set: { stock: d.stock - 1 } }); say(`wrote stock = ${d.stock - 1}, order confirmed`); return true;
  }
  if (mode === 'opt') {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const d = await LabStock.findById(STOCK_ID).lean(); say(`read stock = ${d.stock}, version ${d.version}`);
      await sleep(80);
      if (d.stock < 1) { say('sold out'); return false; }
      const r = await LabStock.updateOne({ _id: STOCK_ID, version: d.version }, { $set: { stock: d.stock - 1 }, $inc: { version: 1 } });
      if (r.modifiedCount === 1) { say(`update matched version ${d.version}, order confirmed`); return true; }
      say(`update matched 0 rows (version changed), re-reading`);
    }
    return false;
  }
  if (mode === 'pess') {
    let waited = false;
    for (let i = 0; i < 100; i++) {
      if (await LabStock.findOneAndUpdate({ _id: STOCK_ID, locked: false }, { $set: { locked: true } })) break;
      if (!waited) { say('lock is held by the other buyer, waiting'); waited = true; }
      await sleep(15);
    }
    say('got the lock');
    const d = await LabStock.findById(STOCK_ID).lean(); say(`read stock = ${d.stock}`);
    await sleep(80);
    let ok = false;
    if (d.stock >= 1) { await LabStock.updateOne({ _id: STOCK_ID }, { $set: { stock: d.stock - 1 } }); say(`wrote stock = ${d.stock - 1}, order confirmed`); ok = true; } else say('sold out');
    await LabStock.updateOne({ _id: STOCK_ID }, { $set: { locked: false } }); say('released the lock');
    return ok;
  }
  const r = await LabStock.findOneAndUpdate({ _id: STOCK_ID, stock: { $gte: 1 } }, { $inc: { stock: -1 } });
  say(r ? 'conditional decrement matched, order confirmed' : 'condition stock >= 1 failed, sold out');
  return !!r;
}
router.post('/race', async (req, res, next) => {
  try {
    const mode = ['none', 'opt', 'pess', 'atomic'].includes(req.body && req.body.mode) ? req.body.mode : 'none';
    await LabStock.findOneAndUpdate({ _id: STOCK_ID }, { $set: { stock: 1, version: 0, locked: false } }, { upsert: true });
    const log = [];
    const results = await Promise.all([worker('Asha', mode, log), worker('Ravi', mode, log)]);
    const final = await LabStock.findById(STOCK_ID).lean();
    res.json({ mode, log, confirmed: results.filter(Boolean).length, finalStock: final.stock });
  } catch (e) { next(e); }
});

/* ---------- scratch data for the N+1 and index demos ---------- */
let dataReady = null;
function ensureLabData() {
  if (!dataReady) dataReady = (async () => {
    if ((await LabRestaurant.countDocuments()) < 200) {
      await LabRestaurant.deleteMany({});
      await LabRestaurant.insertMany(Array.from({ length: 200 }, (_, i) => ({ _id: i + 1, name: 'Restaurant ' + (i + 1) })));
    }
    if ((await LabOrder.countDocuments()) < 20000) {
      await LabOrder.deleteMany({});
      const now = Date.now();
      for (let b = 0; b < 4; b++) {
        await LabOrder.insertMany(Array.from({ length: 5000 }, (_, i) => ({
          rid: 1 + Math.floor(Math.random() * 200), status: Math.random() < 0.7 ? 'DELIVERED' : 'PENDING',
          total: 10000 + Math.floor(Math.random() * 90000), createdAt: new Date(now - (b * 5000 + i) * 60000),
        })), { ordered: false });
      }
    }
    await Promise.all([LabOrder.collection.createIndex({ rid: 1 }), LabOrder.collection.createIndex({ rid: 1, status: 1, createdAt: -1 })]);
  })().catch((e) => { dataReady = null; throw e; });
  return dataReady;
}

router.post('/n1', async (req, res, next) => {
  try {
    await ensureLabData();
    const n = clamp(Number(req.body && req.body.n) || 20, 5, 100);
    const mode = ['naive', 'join', 'batch'].includes(req.body && req.body.mode) ? req.body.mode : 'naive';
    let queries = 0;
    const [, ms] = await timed(async () => {
      if (mode === 'join') {
        queries = 1;
        await LabOrder.aggregate([{ $limit: n }, { $lookup: { from: LabRestaurant.collection.name, localField: 'rid', foreignField: '_id', as: 'restaurant' } }]);
        return;
      }
      const orders = await LabOrder.find().limit(n).lean(); queries = 1;
      if (mode === 'naive') { for (const o of orders) { await LabRestaurant.findById(o.rid).lean(); queries++; } }
      else { await LabRestaurant.find({ _id: { $in: [...new Set(orders.map((o) => o.rid))] } }).lean(); queries++; }
    });
    res.json({ mode, n, queries, ms: r1(ms) });
  } catch (e) { next(e); }
});

function planStages(p, out = []) {
  if (!p) return out;
  if (p.stage) out.push(p.stage + (p.indexName ? ` (${p.indexName})` : ''));
  planStages(p.inputStage, out); (p.inputStages || []).forEach((s) => planStages(s, out));
  return out;
}
router.post('/explain', async (req, res, next) => {
  try {
    await ensureLabData();
    const index = ['none', 'rest', 'comp'].includes(req.body && req.body.index) ? req.body.index : 'none';
    const hint = { none: { $natural: 1 }, rest: { rid: 1 }, comp: { rid: 1, status: 1, createdAt: -1 } }[index];
    let q = LabOrder.find({ rid: 42, status: 'DELIVERED' }).sort({ createdAt: -1 }).hint(hint);
    if (req.body && req.body.limit) q = q.limit(20);
    const ex = await q.explain('executionStats');
    const s = ex.executionStats;
    res.json({ index, plan: planStages(ex.queryPlanner.winningPlan).reverse().join(' → '), docsExamined: s.totalDocsExamined, keysExamined: s.totalKeysExamined, returned: s.nReturned, serverMs: s.executionTimeMillis });
  } catch (e) { next(e); }
});

/* ---------- caching: cache-aside on the real menu query ---------- */
let menuCache = null;
router.get('/cache', async (req, res, next) => {
  try {
    const ttl = clamp(Number(req.query.ttl) || 8, 1, 60), now = Date.now();
    if (menuCache && menuCache.exp > now) {
      const [, ms] = await timed(async () => menuCache.data);
      return res.json({ source: 'HIT', ms: r1(ms), ttlLeft: r1((menuCache.exp - now) / 1000), items: menuCache.data.length });
    }
    const [data, ms] = await timed(() => MenuItem.find({ active: true }).lean());
    menuCache = { data, exp: now + ttl * 1000 };
    res.json({ source: 'MISS', ms: r1(ms), ttlLeft: ttl, items: data.length });
  } catch (e) { next(e); }
});
router.delete('/cache', (req, res) => { menuCache = null; res.json({ ok: true }); });

module.exports = router;
