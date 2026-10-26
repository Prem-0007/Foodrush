const notFound = (req, res) => res.status(404).json({ error: 'Not found' });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Body is not valid JSON' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Body too large' });
  if (err.status && err.status < 500) return res.status(err.status).json({ error: err.message });
  console.error(JSON.stringify({ level: 'error', reqId: req.id, msg: err.message, stack: err.stack }));
  res.status(500).json({ error: 'Something went wrong', requestId: req.id });
};

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

module.exports = { notFound, errorHandler, HttpError };
