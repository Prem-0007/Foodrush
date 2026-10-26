// Lab endpoints that need no database: token bucket and the real validation schema.
// Run in its own process (node --test does this) so LAB_ENABLED is read when the app loads.
process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/none';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_testsecret';
process.env.LAB_ENABLED = 'true';

const test = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

let server, base;
test.before(() => new Promise((r) => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }); }));
test.after(() => server.close());
const tok = (role, sub) => 'Bearer ' + jwt.sign({ role }, process.env.JWT_SECRET, { algorithm: 'HS256', subject: sub });
const get = (p, role = 'admin', sub = '64b000000000000000000001') => fetch(base + p, { headers: { authorization: tok(role, sub) } });

test('lab needs a token and an admin', async () => {
  assert.strictEqual((await fetch(base + '/api/lab/ping')).status, 401);
  assert.strictEqual((await get('/api/lab/ping', 'customer')).status, 403);
});

test('token bucket allows a burst then returns 429 with Retry-After', async () => {
  const sub = '64b0000000000000000000a1';
  const codes = [];
  for (let i = 0; i < 5; i++) codes.push((await get('/api/lab/ping?cap=3&rate=1', 'admin', sub)).status);
  assert.deepStrictEqual(codes.slice(0, 3), [200, 200, 200]);
  assert.strictEqual(codes[3], 429);
  const r = await get('/api/lab/ping?cap=3&rate=1', 'admin', sub);
  assert.ok(Number(r.headers.get('retry-after')) >= 1);
});

test('token buckets are per user', async () => {
  for (let i = 0; i < 3; i++) await get('/api/lab/ping?cap=2&rate=1', 'admin', '64b0000000000000000000b1');
  assert.strictEqual((await get('/api/lab/ping?cap=2&rate=1', 'admin', '64b0000000000000000000b2')).status, 200);
});

test('validate endpoint uses the real checkout schema', async () => {
  const post = (b) => fetch(base + '/api/lab/validate', { method: 'POST', headers: { 'content-type': 'application/json', authorization: tok('admin', '64b000000000000000000001') }, body: JSON.stringify(b) });
  const good = { items: [{ sku: 'BIRYANI-01', qty: 2 }], address: '12-4-7 Beach Road, Visakhapatnam' };
  assert.strictEqual((await post(good)).status, 200);
  const bad = await post({ ...good, total: 1 });
  assert.strictEqual(bad.status, 422);
  assert.ok((await bad.json()).issues.length >= 1);
  assert.strictEqual((await post({ ...good, items: [{ sku: 'BIRYANI-01', qty: 0 }] })).status, 422);
});

test('status reports database state and Stripe mode without leaking secrets', async () => {
  const r = await get('/api/lab/status');
  const txt = await r.text();
  assert.strictEqual(r.status, 200);
  assert.ok(!txt.includes('sk_test_dummy') && !txt.includes('whsec_'));
  const d = JSON.parse(txt);
  assert.strictEqual(d.stripe.mode, 'test');
  assert.strictEqual(d.db.state, 'disconnected');
});

test('lab page is served and has no inline script or style attributes', async () => {
  const html = await (await fetch(base + '/lab/')).text();
  assert.ok(html.includes('/lab/lab.js'));
  assert.ok(!/<script>[^<]/.test(html));
  assert.ok(!/ style=/.test(html));
});
