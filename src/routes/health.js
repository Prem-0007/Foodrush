const router = require('express').Router();
const mongoose = require('mongoose');

// Liveness: the process is running. Never check dependencies here, or a database blip restarts every pod.
router.get('/healthz', (req, res) => res.json({ status: 'ok', uptime: Math.round(process.uptime()) }));

// Readiness: can we serve traffic right now? Used by Render and Kubernetes to route requests.
router.get('/readyz', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) throw new Error('db not connected');
    await mongoose.connection.db.admin().ping();
    res.json({ status: 'ready' });
  } catch (e) {
    res.status(503).json({ status: 'not ready', reason: e.message });
  }
});

module.exports = router;
