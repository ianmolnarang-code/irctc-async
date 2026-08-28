import { Mandate } from '../server/models/Mandate.js';
import { MANDATE_STATE } from '../shared/constants.js';

/**
 * MOCK mandate execution. Execute-after-confirm: money is only "debited" once
 * the ticket is actually CONFIRMED/RAC. The transitions are guarded on the
 * current state so a redelivered job cannot double-execute or double-release.
 */

export async function executeMandate(mandateId) {
  if (!mandateId) return null;
  // Only BLOCKED → EXECUTED. If already EXECUTED (redelivery), this no-ops.
  return Mandate.findOneAndUpdate(
    { _id: mandateId, state: MANDATE_STATE.BLOCKED },
    { state: MANDATE_STATE.EXECUTED, executedAt: new Date() },
    { new: true }
  );
}

export async function releaseMandate(mandateId) {
  if (!mandateId) return null;
  // Only BLOCKED → RELEASED. Never release an already-executed (paid) mandate.
  return Mandate.findOneAndUpdate(
    { _id: mandateId, state: MANDATE_STATE.BLOCKED },
    { state: MANDATE_STATE.RELEASED, releasedAt: new Date() },
    { new: true }
  );
}
