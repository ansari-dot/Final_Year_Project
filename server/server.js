'use strict';

// Server entry point - email notification handlers enabled

const http = require('http');
const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { connectDB, syncDB } = require('./config/database');
const { initSocketIO } = require('./sockets');
const { initCronJobs } = require('./utils/cronJobs');

const PORT = env.port;

const start = async () => {
  try {
    await connectDB();

    // Schema sync.
    // - Use `npm run db:sync:alter` (or set DB_SYNC=alter) to apply model changes.
    // - Use `npm run db:sync:force` (or set DB_SYNC=force) to drop and recreate (DESTROYS DATA).
    // - On normal startup we just verify the connection; the schema is already migrated.
    const mode = (process.env.DB_SYNC || '').toLowerCase();
    if (mode === 'force') {
      logger.warn('DB_SYNC=force – dropping and recreating all tables.');
      await syncDB({ force: true });
    } else if (mode === 'alter') {
      logger.warn('DB_SYNC=alter – applying schema changes.');
      await syncDB({ alter: true });
    }

    const server = http.createServer(app);

    const io = initSocketIO(server);
    app.set('io', io);

    // Initialize cron jobs
    initCronJobs();

    server.listen(PORT, () => {
      logger.info(`ReWearX Backend running on http://localhost:${PORT}`);
      logger.info(`API base: http://localhost:${PORT}/api/${env.apiVersion}`);
      logger.info(`Environment: ${env.nodeEnv}`);
    });

    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
      setTimeout(() => {
        logger.error('Forcing shutdown.');
        process.exit(1);
      }, 10_000).unref();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled rejection:', reason);
      logger.error('Unhandled rejection:', reason);
    });
    process.on('uncaughtException', (err) => {
      console.error('Uncaught exception:', err);
      logger.error('Uncaught exception:', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('Server failed to start:', err);
    logger.error('Server failed to start:', err);
    process.exit(1);
  }
};

start();
