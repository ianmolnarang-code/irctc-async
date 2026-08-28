import express from 'express';
import cors from 'cors';

import { connectMongo } from './db.js';
import intentRouter from './routes/intent.js';
import intentsRouter from './routes/intents.js';
import bookRouter from './routes/book.js';
import cancelRouter from './routes/cancel.js';
import availabilityRouter from './routes/availability.js';
import pnrRouter from './routes/pnr.js';
import aboutRouter from './routes/about.js';

/**
 * Build the Express API. Shared by local dev (server/index.js, which adds
 * app.listen) and the Vercel serverless function (api/[...path].js, which just
 * exports the app). Stateless and connection-cached, so it runs fine on
 * serverless — no Socket.io, no Redis, no long-running worker.
 */
export function createApp() {
  const app = express();
  const corsOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim());
  app.use(cors({ origin: corsOrigins.length === 1 && corsOrigins[0] === '*' ? true : corsOrigins }));
  app.use(express.json());

  // Ensure a DB connection before handling any request (idempotent).
  app.use(async (_req, _res, next) => {
    try {
      await connectMongo();
      next();
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/intent', intentRouter);
  app.use('/api/intents', intentsRouter);
  app.use('/api/book', bookRouter);
  app.use('/api/cancel', cancelRouter);
  app.use('/api/availability', availabilityRouter());
  app.use('/api/pnr', pnrRouter);
  app.use('/api/about', aboutRouter);

  app.use((err, _req, res, _next) => {
    console.error('[api] error:', err.message);
    res.status(500).json({ error: 'internal server error' });
  });

  return app;
}
