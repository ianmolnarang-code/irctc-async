import { Router } from 'express';
import { Intent } from '../models/Intent.js';
import { Mandate } from '../models/Mandate.js';
import { Inventory } from '../models/Inventory.js';
import { idempotencyKey } from '../../shared/idempotencyKey.js';
import { STATUS, MANDATE_STATE, FARE, MAX_PASSENGERS } from '../../shared/constants.js';
import { wrap } from '../asyncWrap.js';

const router = Router();

/**
 * POST /intent — Phase 1 (the calm phase). Runs all the heavy, one-time
 * validation here so the 10 AM /book click has nothing left to do. Creates a
 * BLOCKED mock mandate (lien, no debit) and a PREBOOKED intent.
 *
 * Idempotent by (mobile, train, date, class): a repeat pre-book returns the
 * existing intent instead of creating a duplicate.
 *
 * Body: { userMobile, userEmail, trainId, class, journeyDate, passengers, upiVpa }
 */
router.post('/', wrap(async (req, res) => {
  const {
    userMobile,
    userEmail,
    trainId,
    class: cls,
    journeyDate,
    passengers,
    upiVpa = 'demo@upi',
  } = req.body ?? {};

  // ---- validation (done once, up front) ----
  if (!userMobile || !userEmail || !trainId || !cls || !journeyDate) {
    return res.status(400).json({ error: 'userMobile, userEmail, trainId, class, journeyDate are required' });
  }
  if (!Array.isArray(passengers) || passengers.length < 1 || passengers.length > MAX_PASSENGERS) {
    return res.status(400).json({ error: `passengers must be 1..${MAX_PASSENGERS}` });
  }
  const inv = await Inventory.findOne({ trainId, class: cls });
  if (!inv) {
    return res.status(404).json({ error: 'no such train-class in inventory' });
  }

  const key = idempotencyKey({ userMobile, trainId, journeyDate, class: cls });
  const existing = await Intent.findOne({ idempotencyKey: key });
  if (existing) {
    return res.status(200).json({ intentId: existing.id, status: existing.status, deduped: true });
  }

  // ---- mock UPI mandate: BLOCK the fare, debit nothing ----
  const amount = (FARE[cls] ?? 0) * passengers.length;
  const mandate = await Mandate.create({ upiVpa, amount, state: MANDATE_STATE.BLOCKED });

  const intent = await Intent.create({
    idempotencyKey: key,
    userMobile,
    userEmail,
    trainId,
    class: cls,
    journeyDate,
    passengers,
    mandateId: mandate.id,
    status: STATUS.PREBOOKED,
  });

  return res.status(201).json({
    intentId: intent.id,
    status: intent.status,
    mandate: { id: mandate.id, amount, state: mandate.state },
  });
}));

export default router;
