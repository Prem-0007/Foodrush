const mongoose = require('mongoose');
const config = require('./src/config');
const app = require('./src/app');
const Order = require('./src/models/Order');
const MenuItem = require('./src/models/MenuItem');

async function main() {
  // maxPoolSize is the connection pool: connections are reused instead of opened per request.
  await mongoose.connect(config.mongoUri, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 });
  await Promise.all([Order.init(), MenuItem.init()]); // make sure indexes exist
  const server = app.listen(config.port, () => console.log(JSON.stringify({ level: 'info', msg: `FoodRush listening on ${config.port}` })));

  // Graceful shutdown: stop taking new requests, finish current ones, close the database.
  const stop = (sig) => {
    console.log(JSON.stringify({ level: 'info', msg: `${sig} received, shutting down` }));
    server.close(async () => { await mongoose.disconnect(); process.exit(0); });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => stop('SIGTERM'));
  process.on('SIGINT', () => stop('SIGINT'));
}
main().catch((e) => { console.error(e.message); process.exit(1); });
