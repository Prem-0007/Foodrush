const jwt = require('jsonwebtoken');
const config = require('../config');

function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing Authorization header' });
  try {
    // Pin the algorithm so a token with alg "none" is rejected.
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (e) {
    res.status(401).json({ error: e.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' });
  }
}

const requireRole = (role) => (req, res, next) =>
  req.user && req.user.role === role ? next() : res.status(403).json({ error: 'Forbidden' });

const signToken = (user) =>
  jwt.sign({ role: user.role }, config.jwtSecret, { algorithm: 'HS256', subject: String(user._id), expiresIn: '1h' });

module.exports = { requireAuth, requireRole, signToken };
