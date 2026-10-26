// Runs without MongoDB or network: checks validation, auth, webhook signatures, probes and headers.
process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/none';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_testsecret';

const test = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');
const app = require('../src/app');

let server, base;
test.before(() => new Promise((r) => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }); }));
test.after(() => server.close());

const call = (path, opts = {}) => fetch(base + path, opts).then(async (r) => ({ status: r.status, headers: r.headers, body: await r.text() }));
const json = (r) => JSON.parse(r.body);
const bearer = (payload, opts) => 'Bearer ' + jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256', subject: '64b000000000000000000001', ...opts });

test('liveness is ok and readiness is 503 without a database', async () => {
  assert.strictEqual((await call('/healthz')).status, 200);
  assert.strictEqual((await call('/readyz')).status, 503);
});

test('security headers and request id are set', async () => {
  const r = await call('/healthz');
  assert.match(r.headers.get('content-security-policy'), /default-src 'self'/);
  assert.ok(r.headers.get('x-request-id'));
  assert.strictEqual(r.headers.get('x-powered-by'), null);
});

test('frontend is served and has no inline script (CSP safe)', async () => {
  const r = await call('/');
  assert.strictEqual(r.status, 200);
  assert.ok(!/<script>[^<]/.test(r.body));
});

test('webhook rejects missing and forged signatures', async () => {
  const body = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed' });
  assert.strictEqual((await call('/api/webhooks/stripe', { method: 'POST', headers: { 'content-type': 'application/json' }, body })).status, 400);
  const bad = Stripe.webhooks.generateTestHeaderString({ payload: body, secret: 'whsec_wrong' });
  assert.strictEqual((await call('/api/webhooks/stripe', { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': bad }, body })).status, 400);
});

test('webhook rejects a body changed after signing', async () => {
  const signed = JSON.stringify({ id: 'evt_2', type: 'x' });
  const sig = Stripe.webhooks.generateTestHeaderString({ payload: signed, secret: process.env.STRIPE_WEBHOOK_SECRET });
  const tampered = JSON.stringify({ id: 'evt_2', type: 'checkout.session.completed' });
  assert.strictEqual((await call('/api/webhooks/stripe', { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': sig }, body: tampered })).status, 400);
});

test('checkout and orders need a token', async () => {
  assert.strictEqual((await call('/api/checkout', { method: 'POST' })).status, 401);
  assert.strictEqual((await call('/api/orders')).status, 401);
});

test('JWT with alg none, wrong secret or expired is rejected', async () => {
  const none = 'Bearer ' + Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url') + '.' + Buffer.from('{"sub":"1","role":"admin"}').toString('base64url') + '.';
  const wrong = 'Bearer ' + jwt.sign({ role: 'admin' }, 'other', { subject: '1' });
  const expired = bearer({ role: 'customer' }, { expiresIn: -10 });
  for (const h of [none, wrong, expired]) assert.strictEqual((await call('/api/orders', { headers: { authorization: h } })).status, 401);
});

test('checkout rejects missing idempotency key and bad bodies before touching the database', async () => {
  const auth = bearer({ role: 'customer' });
  const post = (body, extra = {}) => call('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json', authorization: auth, ...extra }, body: JSON.stringify(body) });
  const ok = { items: [{ sku: 'BIRYANI-01', qty: 1 }], address: '12-4-7 Beach Road, Visakhapatnam' };
  assert.strictEqual((await post({ ...ok, items: [{ sku: 'BIRYANI-01', qty: -3 }] })).status, 422);
  assert.strictEqual((await post({ ...ok, total: 1 })).status, 422); // client-supplied price is rejected
  assert.strictEqual((await post({ ...ok, items: [{ sku: 'BIRYANI-01', qty: 1, price: 1 }] })).status, 422);
  assert.strictEqual((await post({ ...ok, address: 'x'.repeat(300) })).status, 422);
  assert.strictEqual((await post(ok)).status, 400); // valid body, no Idempotency-Key header
  assert.strictEqual((await post(ok, { 'idempotency-key': 'short' })).status, 400);
});

test('registration rejects role escalation and weak input', async () => {
  const reg = (b) => call('/api/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) });
  assert.strictEqual((await reg({ name: 'A', email: 'a@b.in', password: 'longenough1', role: 'admin' })).status, 422);
  assert.strictEqual((await reg({ name: 'A', email: 'not-an-email', password: 'longenough1' })).status, 422);
  assert.strictEqual((await reg({ name: 'A', email: 'a@b.in', password: 'short' })).status, 422);
});

test('malformed JSON and unknown API routes give clean errors', async () => {
  assert.strictEqual((await call('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{oops' })).status, 400);
  assert.strictEqual((await call('/api/nope')).status, 404);
});

test('order id must be a valid ObjectId', async () => {
  const r = await call('/api/orders/not-an-id', { headers: { authorization: bearer({ role: 'customer' }) } });
  assert.strictEqual(r.status, 400);
});
