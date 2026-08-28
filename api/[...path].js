// Vercel serverless entry. Catches every /api/* request and hands it to the
// shared Express app. The app mounts its routes under /api/*, and Vercel
// preserves the original request path, so routing lines up.
import { createApp } from '../server/app.js';

const app = createApp();

export default function handler(req, res) {
  return app(req, res);
}
