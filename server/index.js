import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import cors from 'cors';

import { connectMongo } from './db.js';
import { createRedisClient } from './redis.js';
import { initSocket } from './ws/socket.js';

import intentRouter from './routes/intent.js';
import bookRouter from './routes/book.js';
import cancelRouter from './routes/cancel.js';
import availabilityRouter from './routes/availability.js';
import aboutRouter from './routes/about.js';
import pnrRouter from './routes/pnr.js';
import intentsRouter from './routes/intents.js';

const PORT = process.env.PORT || 4000;
const corsOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

async function main() {
  await connectMongo();
  const redis = createRedisClient();

  const app = express();
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json());

  // All API routes live under /api so they never collide with client-side
  // page routes (e.g. the /pnr and /about pages in the SPA).
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/intent', intentRouter);
  app.use('/api/intents', intentsRouter);
  app.use('/api/book', bookRouter);
  app.use('/api/cancel', cancelRouter);
  app.use('/api/availability', availabilityRouter(redis));
  app.use('/api/pnr', pnrRouter);
  app.use('/api/about', aboutRouter);

  // Central error handler — keeps a failed request from crashing the process
  // (works together with the wrap() helper on async routes).
  app.use((err, _req, res, _next) => {
    console.error('[api] error:', err.message);
    res.status(500).json({ error: 'internal server error' });
  });

  const server = http.createServer(app);
  initSocket(server, corsOrigins);

  server.listen(PORT, () => {
    console.log(`[server] API + Socket.io listening on :${PORT}`);
    console.log(`[server] CORS origins: ${corsOrigins.join(', ')}`);
  });
}

main().catch((err) => {
  console.error('[server] fatal:', err);
  process.exit(1);
});
