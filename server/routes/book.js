import { Router } from 'express';
import { Intent } from '../models/Intent.js';
import { commitBooking } from '../booking.js';
import { wrap } from '../asyncWrap.js';

const router = Router();

/**
 * POST /book — the Tatkal-time click. Self-service, synchronous: the seat is
 * allocated in this request and the outcome (CONFIRMED / RAC / WAITLIST + PNR
 * and berth) is returned directly. No queue, no worker — deployable on
 * serverless (Vercel). Still race-free via the atomic decrement in
 * commitBooking().
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

  const outcome = await commitBooking(intent);
  return res.json(outcome);
}));

export default router;
