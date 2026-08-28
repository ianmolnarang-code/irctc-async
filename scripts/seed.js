import 'dotenv/config';
import { connectMongo, disconnectMongo } from '../server/db.js';
import { Inventory } from '../server/models/Inventory.js';
import { Intent } from '../server/models/Intent.js';
import { Mandate } from '../server/models/Mandate.js';
import { Pnr } from '../server/models/Pnr.js';
import { createRedisClient } from '../server/redis.js';
import { seatsKey, CLASSES } from '../shared/constants.js';

// Tatkal window for the demo: opens 5 min from now so you can show the countdown,
// but the "Book Right Now" button bypasses it anyway.
const tatkalOpenAt = new Date(Date.now() + 5 * 60 * 1000);

// Mock trains. Note 12951:3A is seeded intentionally near-zero (2 seats, 3 RAC)
// so a burst of concurrent /book calls demonstrates CONFIRMED → RAC → WAITLIST.
const TRAINS = [
  {
    trainId: '12951',
    trainName: 'Mumbai Rajdhani',
    from: 'MMCT',
    to: 'NDLS',
    classes: [
      { class: CLASSES['3A'], seatsTotal: 2, seatsLeft: 2, racLeft: 3, coaches: ['B1', 'B2', 'B3'] },
      { class: CLASSES['2A'], seatsTotal: 12, seatsLeft: 12, racLeft: 4, coaches: ['A1', 'A2'] },
      { class: CLASSES['1A'], seatsTotal: 6, seatsLeft: 6, racLeft: 0, coaches: ['H1'] },
    ],
  },
  {
    trainId: '12009',
    trainName: 'Shatabdi Express',
    from: 'MMCT',
    to: 'ADI',
    classes: [
      { class: CLASSES.SL, seatsTotal: 40, seatsLeft: 40, racLeft: 8, coaches: ['S1', 'S2', 'S3', 'S4'] },
      { class: CLASSES['3A'], seatsTotal: 20, seatsLeft: 20, racLeft: 5, coaches: ['B1', 'B2'] },
    ],
  },
  {
    trainId: '12627',
    trainName: 'Karnataka Express',
    from: 'NDLS',
    to: 'SBC',
    classes: [
      { class: CLASSES.SL, seatsTotal: 30, seatsLeft: 30, racLeft: 6, coaches: ['S1', 'S2', 'S3'] },
    ],
  },
];

async function seed() {
  await connectMongo();

  // Fresh slate for a repeatable demo.
  await Promise.all([
    Inventory.deleteMany({}),
    Intent.deleteMany({}),
    Mandate.deleteMany({}),
    Pnr.deleteMany({}),
  ]);
  console.log('[seed] cleared existing collections');

  const docs = [];
  for (const t of TRAINS) {
    for (const c of t.classes) {
      docs.push({
        trainId: t.trainId,
        trainName: t.trainName,
        from: t.from,
        to: t.to,
        class: c.class,
        seatsTotal: c.seatsTotal,
        seatsLeft: c.seatsLeft,
        racLeft: c.racLeft,
        coaches: c.coaches,
        berthsPerCoach: 72,
        tatkalOpenAt,
      });
    }
  }
  const inserted = await Inventory.insertMany(docs);
  console.log(`[seed] inserted ${inserted.length} inventory docs`);

  // Warm the Redis availability cache so GET /availability is fast from t=0.
  const redis = createRedisClient();
  await Promise.all(
    inserted.map((d) => redis.set(seatsKey(d.trainId, d.class), String(d.seatsLeft)))
  );
  console.log('[seed] warmed Redis seat cache');
  await redis.quit();

  await disconnectMongo();
  console.log('[seed] done');
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
