import 'dotenv/config';
import { Worker, Queue } from 'bullmq';
import { customAlphabet } from 'nanoid';

import { connectMongo } from '../server/db.js';
import { createRedisClient, redisConnectionOptions } from '../server/redis.js';
import { Inventory } from '../server/models/Inventory.js';
import { Intent } from '../server/models/Intent.js';
import { Pnr } from '../server/models/Pnr.js';

import { allocateBerth } from './allocate.js';
import { executeMandate, releaseMandate } from './mandate.js';
import { notifyBooking } from './notify.js';
import { publishWs } from './wsPublish.js';

import {
  STATUS,
  TERMINAL_STATUSES,
  WS_EVENTS,
  NOTIFY_QUEUE,
  bookingQueueName,
  seatsKey,
} from '../shared/constants.js';

const pnrId = customAlphabet('0123456789', 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Small per-job delay: mirrors NPCI's moderated-TPS execution rule and makes
// the live seat counter visibly tick down during a demo.
const DRAIN_DELAY_MS = Number(process.env.DRAIN_DELAY_MS ?? 150);

// Shared connections for this process.
const redisPub = createRedisClient(); // WS bridge + notify enqueue backing
const redisCache = createRedisClient(); // live seat-count cache

// Second, decoupled queue: booking commits enqueue a notification job here
// instead of doing I/O inline. The notify Worker below drains it.
const notifyQueue = new Queue(NOTIFY_QUEUE, { connection: redisConnectionOptions() });

function emitIntentUpdate(intent, extra = {}) {
  return publishWs(redisPub, {
    event: WS_EVENTS.INTENT_UPDATE,
    room: { type: 'intent', intentId: String(intent.id) },
    payload: { intentId: String(intent.id), status: intent.status, pnr: intent.pnr, ...extra },
  });
}

async function publishSeats(trainId, cls, seatsLeft, racLeft) {
  await redisCache.set(seatsKey(trainId, cls), String(seatsLeft));
  await publishWs(redisPub, {
    event: WS_EVENTS.SEATS_UPDATE,
    room: { type: 'train', trainId, class: cls },
    payload: { trainId, class: cls, seatsLeft, racLeft },
  });
}

/**
 * The consumer. One job = one booking intent. Runs at concurrency 1 per
 * train-class queue, so within a train-class there is exactly one writer and
 * the atomic $gt:0 decrement can never overbook.
 */
async function processBooking(job) {
  const { intentId, trainId, class: cls } = job.data;

  const intent = await Intent.findById(intentId);
  if (!intent) {
    console.warn(`[worker] intent ${intentId} not found — skipping`);
    return { status: 'MISSING' };
  }

  // --- idempotency: terminal intent, or a PNR already minted → no-op ---
  if (TERMINAL_STATUSES.includes(intent.status)) {
    console.log(`[worker] intent ${intentId} already ${intent.status} — no-op (redelivery)`);
    return { status: intent.status, deduped: true };
  }
  const priorPnr = await Pnr.findOne({ intentId: intent.id });
  if (priorPnr) {
    console.log(`[worker] intent ${intentId} already has PNR ${priorPnr.pnr} — reconciling`);
    return { status: priorPnr.status, pnr: priorPnr.pnr, deduped: true };
  }

  intent.status = STATUS.PROCESSING;
  await intent.save();
  await emitIntentUpdate(intent);
  await sleep(DRAIN_DELAY_MS);

  // --- atomic seat decrement (the race-free core) ---
  const confirmedInv = await Inventory.findOneAndUpdate(
    { trainId, class: cls, seatsLeft: { $gt: 0 } },
    { $inc: { seatsLeft: -1 } },
    { new: true }
  );

  let outcome;
  if (confirmedInv) {
    const berth = allocateBerth(confirmedInv, confirmedInv.seatsLeft);
    const pnr = `PNR${pnrId()}`;
    await Pnr.create({
      pnr,
      intentId: intent.id,
      trainId,
      class: cls,
      coach: berth.coach,
      berthNo: berth.berthNo,
      berthType: berth.berthType,
      status: 'CONFIRMED',
    });
    // Stamp the lead passenger with the allotted berth.
    if (intent.passengers[0]) {
      intent.passengers[0].allottedCoach = berth.coach;
      intent.passengers[0].allottedBerthNo = berth.berthNo;
      intent.passengers[0].allottedBerthType = berth.berthType;
    }
    intent.status = STATUS.CONFIRMED;
    intent.pnr = pnr;
    await executeMandate(intent.mandateId); // debit only now
    await publishSeats(trainId, cls, confirmedInv.seatsLeft, confirmedInv.racLeft);
    outcome = { status: STATUS.CONFIRMED, pnr, ...berth };
  } else {
    // No confirmed seat — try RAC.
    const racInv = await Inventory.findOneAndUpdate(
      { trainId, class: cls, racLeft: { $gt: 0 } },
      { $inc: { racLeft: -1 } },
      { new: true }
    );
    if (racInv) {
      const pnr = `PNR${pnrId()}`;
      await Pnr.create({ pnr, intentId: intent.id, trainId, class: cls, status: 'RAC' });
      intent.status = STATUS.RAC;
      intent.pnr = pnr;
      await executeMandate(intent.mandateId); // RAC is chargeable
      await publishSeats(trainId, cls, racInv.seatsLeft, racInv.racLeft);
      outcome = { status: STATUS.RAC, pnr };
    } else {
      intent.status = STATUS.WAITLIST;
      await releaseMandate(intent.mandateId); // no ticket → no debit
      outcome = { status: STATUS.WAITLIST };
    }
  }

  await intent.save();
  await emitIntentUpdate(intent, { berth: outcome.coach ? outcome : undefined });

  // Hand off to the decoupled notification queue.
  await notifyQueue.add('notify', { intentId: String(intent.id), outcome });

  console.log(`[worker] intent ${intentId} → ${outcome.status}${outcome.pnr ? ` (${outcome.pnr})` : ''}`);
  return outcome;
}

async function main() {
  await connectMongo();

  // One booking Worker per train-class queue → single writer per partition.
  const invs = await Inventory.find({}, { trainId: 1, class: 1 }).lean();
  const bookingWorkers = invs.map((inv) => {
    const name = bookingQueueName(inv.trainId, inv.class);
    const w = new Worker(name, processBooking, {
      connection: redisConnectionOptions(),
      concurrency: 1,
    });
    w.on('failed', (job, err) => console.error(`[worker] ${name} job ${job?.id} failed:`, err.message));
    return w;
  });
  console.log(`[worker] booking consumers up for ${bookingWorkers.length} train-classes`);

  // Notification Worker — drains the decoupled notify queue.
  const notifyWorker = new Worker(
    NOTIFY_QUEUE,
    async (job) => {
      const intent = await Intent.findById(job.data.intentId);
      if (intent) await notifyBooking(redisPub, intent, job.data.outcome);
    },
    { connection: redisConnectionOptions(), concurrency: 5 }
  );
  console.log('[worker] notification consumer up');
  console.log('[worker] waiting for jobs…');

  const shutdown = async () => {
    console.log('\n[worker] shutting down…');
    await Promise.all([...bookingWorkers.map((w) => w.close()), notifyWorker.close(), notifyQueue.close()]);
    await Promise.all([redisPub.quit(), redisCache.quit()]);
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[worker] fatal:', err);
  process.exit(1);
});
