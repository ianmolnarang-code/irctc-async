import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../redis.js';
import { bookingQueueName } from '../../shared/constants.js';

// Lazily-created BullMQ Queue per train-class. Each train-class gets its own
// queue so the worker can run a single-concurrency consumer per partition —
// one writer per train-class means no distributed lock and no overbooking.
const queues = new Map();

function getBookingQueue(trainId, cls) {
  const name = bookingQueueName(trainId, cls);
  let q = queues.get(name);
  if (!q) {
    q = new Queue(name, {
      connection: redisConnectionOptions(),
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    });
    queues.set(name, q);
  }
  return q;
}

/**
 * Enqueue a booking job. Called by POST /book after it has stamped queuedAt and
 * flipped the intent to QUEUED. The jobId is the intentId so BullMQ dedupes
 * re-enqueues of the same intent — a second identical /book is a no-op at the
 * queue level, before the worker even runs its own idempotency check.
 *
 * @param {{intentId:string, trainId:string, class:string, queuedAt:number}} data
 */
export async function addBookingJob({ intentId, trainId, class: cls, queuedAt }) {
  const q = getBookingQueue(trainId, cls);
  return q.add(
    'book',
    { intentId, trainId, class: cls, queuedAt },
    { jobId: String(intentId) }
  );
}

export async function closeQueues() {
  await Promise.all([...queues.values()].map((q) => q.close()));
  queues.clear();
}
