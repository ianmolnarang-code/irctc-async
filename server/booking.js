import { customAlphabet } from 'nanoid';
import { Inventory } from './models/Inventory.js';
import { Pnr } from './models/Pnr.js';
import { STATUS, TERMINAL_STATUSES } from '../shared/constants.js';
import { allocateBerth } from '../worker/allocate.js';
import { executeMandate, releaseMandate } from '../worker/mandate.js';

const pnrId = customAlphabet('0123456789', 10);

/**
 * Commit a booking synchronously (self-service model: the user presses "Book
 * Now" at Tatkal time and the seat is allocated in this request). This is the
 * old worker loop, run inline — atomic seat decrement, deterministic berth
 * allocation, and execute-after-confirm mandate. Still race-free: the atomic
 * `findOneAndUpdate` with `$gt:0` can never oversell, even under concurrent
 * requests.
 *
 * @param {import('mongoose').Document} intent  a loaded Intent document
 * @returns {Promise<object>} outcome for the client
 */
export async function commitBooking(intent) {
  const { trainId, class: cls } = intent;

  // Idempotency: already settled, or a PNR already exists → return as-is.
  if (TERMINAL_STATUSES.includes(intent.status)) {
    return await snapshot(intent, { deduped: true });
  }
  const prior = await Pnr.findOne({ intentId: intent.id });
  if (prior) {
    return await snapshot(intent, { pnr: prior.pnr, deduped: true });
  }

  // Atomic confirmed-seat decrement.
  const confirmedInv = await Inventory.findOneAndUpdate(
    { trainId, class: cls, seatsLeft: { $gt: 0 } },
    { $inc: { seatsLeft: -1 } },
    { new: true }
  );

  let seatsLeft;
  let racLeft;

  if (confirmedInv) {
    const berth = allocateBerth(confirmedInv, confirmedInv.seatsLeft);
    const pnr = `PNR${pnrId()}`;
    await Pnr.create({
      pnr, intentId: intent.id, trainId, class: cls,
      coach: berth.coach, berthNo: berth.berthNo, berthType: berth.berthType,
      status: 'CONFIRMED',
    });
    if (intent.passengers[0]) {
      intent.passengers[0].allottedCoach = berth.coach;
      intent.passengers[0].allottedBerthNo = berth.berthNo;
      intent.passengers[0].allottedBerthType = berth.berthType;
    }
    intent.status = STATUS.CONFIRMED;
    intent.pnr = pnr;
    await executeMandate(intent.mandateId);
    seatsLeft = confirmedInv.seatsLeft;
    racLeft = confirmedInv.racLeft;
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
      await executeMandate(intent.mandateId);
      seatsLeft = racInv.seatsLeft;
      racLeft = racInv.racLeft;
    } else {
      intent.status = STATUS.WAITLIST;
      await releaseMandate(intent.mandateId);
      const inv = await Inventory.findOne({ trainId, class: cls }).lean();
      seatsLeft = inv?.seatsLeft ?? 0;
      racLeft = inv?.racLeft ?? 0;
    }
  }

  intent.queuedAt = Date.now();
  await intent.save();
  return {
    intentId: String(intent.id),
    status: intent.status,
    pnr: intent.pnr,
    coach: intent.passengers[0]?.allottedCoach ?? null,
    berthNo: intent.passengers[0]?.allottedBerthNo ?? null,
    berthType: intent.passengers[0]?.allottedBerthType ?? null,
    seatsLeft,
    racLeft,
  };
}

async function snapshot(intent, extra = {}) {
  const inv = await Inventory.findOne({ trainId: intent.trainId, class: intent.class }).lean();
  const pnrDoc = await Pnr.findOne({ intentId: intent.id }).lean();
  return {
    intentId: String(intent.id),
    status: intent.status,
    pnr: intent.pnr ?? pnrDoc?.pnr ?? null,
    coach: pnrDoc?.coach ?? null,
    berthNo: pnrDoc?.berthNo ?? null,
    berthType: pnrDoc?.berthType ?? null,
    seatsLeft: inv?.seatsLeft ?? 0,
    racLeft: inv?.racLeft ?? 0,
    ...extra,
  };
}
