import { Router } from 'express';
import { Intent } from '../models/Intent.js';
import { addBookingJob } from '../queue/producer.js';
import { STATUS, TERMINAL_STATUSES } from '../../shared/constants.js';
import { wrap } from '../asyncWrap.js';

const router = Router();

/**
 * POST /book  — the 10 AM click. O(1) and lock-free: this is the "workload
 * removed" proof. All heavy validation already happened in Phase 1, so the
 * request tier does nothing but stamp, enqueue, and return 202.
 *
 * Body: { intentId }
 */
router.post('/', wrap(async (req, res) => {
  const { intentId } = req.body ?? {};
  if (!intentId) {
    return res.status(400).json({ error: 'intentId is required' });
  }

  const intent = await Intent.findById(intentId);
  if (!intent) {
    return res.status(404).json({ error: 'intent not found' });
  }

  // Already handled — safe to call twice (button double-tap, retry).
  if (TERMINAL_STATUSES.includes(intent.status)) {
    return res.status(409).json({ error: `intent already ${intent.status}`, status: intent.status });
  }
  if (intent.status === STATUS.QUEUED || intent.status === STATUS.PROCESSING) {
    return res.status(202).json({ intentId, status: intent.status, queuedAt: intent.queuedAt });
  }

  // Server-authoritative FCFS priority signal — never trust client time.
  const queuedAt = Date.now();
  intent.queuedAt = queuedAt;
  intent.status = STATUS.QUEUED;
  await intent.save();

  await addBookingJob({
    intentId: intent.id,
    trainId: intent.trainId,
    class: intent.class,
    queuedAt,
  });

  return res.status(202).json({ intentId, status: STATUS.QUEUED, queuedAt });
}));

export default router;
