import { Router } from 'express';
import { Intent } from '../models/Intent.js';
import { Mandate } from '../models/Mandate.js';
import { STATUS, MANDATE_STATE, TERMINAL_STATUSES } from '../../shared/constants.js';
import { wrap } from '../asyncWrap.js';

const router = Router();

/**
 * POST /cancel — user backs out before the ticket is committed. Releases the
 * mandate lien (BLOCKED → RELEASED) so no money ever moved, and marks the
 * intent CANCELLED. Genuine user control.
 *
 * Note: this cancels a not-yet-confirmed intent. Once CONFIRMED/RAC the money
 * is EXECUTED and a real refund flow would be needed — out of scope, so we
 * refuse to cancel terminal intents here.
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
  if (TERMINAL_STATUSES.includes(intent.status)) {
    return res.status(409).json({ error: `cannot cancel — intent already ${intent.status}` });
  }

  if (intent.mandateId) {
    await Mandate.findByIdAndUpdate(intent.mandateId, {
      state: MANDATE_STATE.RELEASED,
      releasedAt: new Date(),
    });
  }
  intent.status = STATUS.CANCELLED;
  await intent.save();

  return res.json({ intentId, status: STATUS.CANCELLED });
}));

export default router;
