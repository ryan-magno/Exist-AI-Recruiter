import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Shared modules
import { pool, verifyDatabaseConnection } from './lib/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';

// Route modules
import healthRoutes from './routes/health.js';
import jobOrderRoutes from './routes/jobOrders.js';
import candidateRoutes from './routes/candidates.js';
import applicationRoutes from './routes/applications.js';
import pooledCandidateRoutes from './routes/pooledCandidates.js';
import departmentAndUploaderRoutes from './routes/departmentsAndUploaders.js';
import interviewAndOfferRoutes from './routes/interviewsAndOffers.js';
import timelineAndActivityLogRoutes from './routes/timelineAndActivityLog.js';
import webhookRoutes from './routes/webhooks.js';
import analyticsRoutes from './routes/analytics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.API_PORT || 3001;

// ---------- Validate required env vars ----------
const REQUIRED_ENV = ['PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE', 'N8N_CV_WEBHOOK_URL', 'N8N_JO_WEBHOOK_URL', 'N8N_EMAIL_WEBHOOK_URL', 'WEBHOOK_CALLBACK_URL'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    console.error('   Make sure .env exists in the project root with all required vars (see .env.example)');
    process.exit(1);
  }
}

// ---------- Middleware ----------
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(generalLimiter);

// Request logger (concise)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (req.path !== '/health') {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
    }
  });
  next();
});

// ---------- Routes ----------
app.use(healthRoutes);
app.use(jobOrderRoutes);
app.use(candidateRoutes);
app.use(applicationRoutes);
app.use(pooledCandidateRoutes);
app.use(departmentAndUploaderRoutes);
app.use(interviewAndOfferRoutes);
app.use(timelineAndActivityLogRoutes);
app.use(webhookRoutes);
app.use(analyticsRoutes);

// ---------- Catch-all & Error handler ----------
app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
});
app.use(errorHandler);

// ---------- Start server with DB verification ----------
async function start() {
  await verifyDatabaseConnection();

  const server = app.listen(PORT, () => {
    console.log(`🚀 API server running at http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
  });

  // Graceful shutdown
  let isShuttingDown = false;
  const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      console.log('HTTP server closed. Draining database pool...');
      try {
        await pool.end();
        console.log('Database pool closed. Exiting.');
        process.exit(0);
      } catch (err) {
        console.error('Error closing pool:', err.message);
        process.exit(1);
      }
    });

    setTimeout(() => {
      console.error('Graceful shutdown timed out after 15s. Forcing exit.');
      process.exit(1);
    }, 15000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
