const crypto = require('crypto');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();
app.set('trust proxy', 1); // behind Render's proxy, so req.ip is the real client for rate limiting
app.disable('x-powered-by');

// Request id and one structured JSON log line per request, so a log line can be tied to an error.
app.use((req, res, next) => {
  req.id = req.get('x-request-id') || crypto.randomUUID();
  res.set('X-Request-Id', req.id);
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    if (req.path === '/healthz' || req.path === '/readyz') return;
    console.log(JSON.stringify({ level: 'info', reqId: req.id, method: req.method, path: req.path, status: res.statusCode, ms: Number(process.hrtime.bigint() - start) / 1e6 | 0 }));
  });
  next();
});

app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", 'https://fonts.googleapis.com'], fontSrc: ["'self'", 'https://fonts.gstatic.com'], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"], formAction: ["'self'", 'https://checkout.stripe.com'], frameAncestors: ["'none'"] } },
}));

app.use(require('./routes/health'));

// The webhook needs the raw body, so it is registered before express.json().
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json', limit: '1mb' }), require('./routes/webhook'));

app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many requests' } }));
app.use(express.json({ limit: '50kb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/checkout', require('./routes/checkout'));
app.use('/api/orders', require('./routes/orders'));
// The Systems Lab's real-server endpoints: off unless LAB_ENABLED=true, and admin only.
if (process.env.LAB_ENABLED === 'true') {
  const { requireAuth, requireRole } = require('./middleware/auth');
  app.use('/api/lab', requireAuth, requireRole('admin'), require('./routes/lab'));
} else {
  app.use('/api/lab', (req, res) => res.status(404).json({ error: 'Lab is disabled. Set LAB_ENABLED=true to turn it on.' }));
}
app.use('/api', notFound);

app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: '1h' }));
app.use(errorHandler);

module.exports = app;
