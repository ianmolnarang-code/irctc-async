import { createHash } from 'node:crypto';

/**
 * Deterministic idempotency key for an intent.
 *
 * sha256(userMobile + trainId + journeyDate + class) — one intent per
 * (person, train, date, class). The Intent model enforces a unique index on
 * this key, so duplicate pre-books collapse to a single document at the source
 * instead of being caught later in the queue.
 *
 * @param {{userMobile:string, trainId:string, journeyDate:string, class:string}} p
 * @returns {string} 64-char hex digest
 */
export function idempotencyKey({ userMobile, trainId, journeyDate, class: cls }) {
  const raw = [userMobile, trainId, journeyDate, cls].join('|');
  return createHash('sha256').update(raw).digest('hex');
}
