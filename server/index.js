import 'dotenv/config';
import { createApp } from './app.js';
import { connectMongo } from './db.js';

const PORT = process.env.PORT || 4000;

async function main() {
  await connectMongo();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`[server] API listening on :${PORT}`);
  });
}

main().catch((err) => {
  console.error('[server] fatal:', err);
  process.exit(1);
});
