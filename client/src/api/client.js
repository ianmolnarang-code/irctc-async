// Client-only data layer — everything runs in the browser via localStorage.
// No backend, no database. Same function names the pages already import, so the
// UI is unchanged. Booking allocation runs here (single-threaded JS, so no race
// within a browser); inventory is per-browser (a UX/journey demo, not shared
// state).
import { FARE } from '../constants.js';

const KEY = { inv: 'tatkal.inventory', intents: 'tatkal.intents' };

// ---- seed data (mirrors the old scripts/seed.js) ----
const TRAINS = [
  {
    trainId: '12951', trainName: 'Mumbai Rajdhani', from: 'MMCT', to: 'NDLS',
    classes: [
      { class: '3A', seatsTotal: 2, seatsLeft: 2, racLeft: 3, coaches: ['B1', 'B2', 'B3'] },
      { class: '2A', seatsTotal: 12, seatsLeft: 12, racLeft: 4, coaches: ['A1', 'A2'] },
      { class: '1A', seatsTotal: 6, seatsLeft: 6, racLeft: 0, coaches: ['H1'] },
    ],
  },
  {
    trainId: '12009', trainName: 'Shatabdi Express', from: 'MMCT', to: 'ADI',
    classes: [
      { class: 'SL', seatsTotal: 40, seatsLeft: 40, racLeft: 8, coaches: ['S1', 'S2', 'S3', 'S4'] },
      { class: '3A', seatsTotal: 20, seatsLeft: 20, racLeft: 5, coaches: ['B1', 'B2'] },
    ],
  },
  {
    trainId: '12627', trainName: 'Karnataka Express', from: 'NDLS', to: 'SBC',
    classes: [
      { class: 'SL', seatsTotal: 30, seatsLeft: 30, racLeft: 6, coaches: ['S1', 'S2', 'S3'] },
    ],
  },
];

function seedInventory() {
  const tatkalOpenAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const docs = [];
  for (const t of TRAINS) {
    for (const c of t.classes) {
      docs.push({
        trainId: t.trainId, trainName: t.trainName, from: t.from, to: t.to,
        class: c.class, seatsTotal: c.seatsTotal, seatsLeft: c.seatsLeft, racLeft: c.racLeft,
        coaches: c.coaches, berthsPerCoach: 72, tatkalOpenAt,
      });
    }
  }
  return docs;
}

// ---- localStorage helpers ----
const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

function getInventory() {
  let inv = read(KEY.inv, null);
  if (!inv) { inv = seedInventory(); write(KEY.inv, inv); }
  return inv;
}
const saveInventory = (inv) => write(KEY.inv, inv);
const getIntents = () => read(KEY.intents, []);
const saveIntents = (x) => write(KEY.intents, x);

// ---- deterministic berth allocation (ported from the old worker) ----
const TYPE_RANK = { LB: 0, SL: 1, MB: 2, UB: 3, SU: 4 };
const berthType = (n) => ({ 1: 'LB', 2: 'MB', 3: 'UB', 4: 'LB', 5: 'MB', 6: 'UB', 7: 'SL', 0: 'SU' }[n % 8]);
function coachesMiddleFirst(coaches) {
  const n = coaches.length, mid = Math.floor((n - 1) / 2), order = [];
  for (let d = 0; d < n; d++) {
    if (mid + d < n) order.push(coaches[mid + d]);
    if (d > 0 && mid - d >= 0) order.push(coaches[mid - d]);
  }
  return order;
}
const seqCache = {};
function berthSequence(inv) {
  const key = `${inv.trainId}:${inv.class}`;
  if (seqCache[key]) return seqCache[key];
  const coaches = inv.coaches?.length ? inv.coaches : ['C1'];
  const perCoach = inv.berthsPerCoach || 72;
  const berths = [];
  coachesMiddleFirst(coaches).forEach((coach, coachRank) => {
    for (let b = 1; b <= perCoach; b++) berths.push({ coach, coachRank, berthNo: b, berthType: berthType(b) });
  });
  berths.sort((a, b) => a.coachRank - b.coachRank || TYPE_RANK[a.berthType] - TYPE_RANK[b.berthType] || a.berthNo - b.berthNo);
  seqCache[key] = berths;
  return berths;
}
function allocateBerth(inv, newSeatsLeft) {
  const ordinal = inv.seatsTotal - newSeatsLeft;
  const seq = berthSequence(inv);
  const p = seq[(ordinal - 1) % seq.length];
  return { coach: p.coach, berthNo: p.berthNo, berthType: p.berthType };
}

// ---- ids ----
const genId = () => 'i' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const genPnr = () => 'PNR' + Math.floor(1e9 + Math.random() * 9e9);
const apiError = (msg, status) => Object.assign(new Error(msg), { response: { status, data: { error: msg } } });
const delay = (v) => new Promise((r) => setTimeout(() => r(v), 120)); // tiny delay so spinners show

const TERMINAL = ['CONFIRMED', 'RAC', 'WAITLIST', 'CANCELLED', 'FAILED'];

// ===== public API (same shapes the old HTTP client returned) =====

export async function getAvailability(trainId) {
  const rows = getInventory().filter((r) => !trainId || r.trainId === trainId);
  return delay({
    availability: rows.map((r) => ({
      trainId: r.trainId, trainName: r.trainName, from: r.from, to: r.to, class: r.class,
      seatsTotal: r.seatsTotal, seatsLeft: r.seatsLeft, racLeft: r.racLeft, tatkalOpenAt: r.tatkalOpenAt,
    })),
  });
}

export async function createIntent(body) {
  const { userMobile, userEmail, trainId, class: cls, journeyDate, passengers, upiVpa = 'demo@upi' } = body;
  if (!userMobile || !userEmail || !trainId || !cls || !journeyDate) throw apiError('missing required fields', 400);
  if (!Array.isArray(passengers) || passengers.length < 1 || passengers.length > 4) throw apiError('passengers must be 1..4', 400);
  const slot = getInventory().find((r) => r.trainId === trainId && r.class === cls);
  if (!slot) throw apiError('no such train-class', 404);

  const idempotencyKey = [userMobile, trainId, journeyDate, cls].join('|');
  const intents = getIntents();
  const existing = intents.find((i) => i.idempotencyKey === idempotencyKey);
  if (existing) return delay({ intentId: existing.intentId, status: existing.status, deduped: true });

  const amount = (FARE[cls] || 0) * passengers.length;
  const intent = {
    intentId: genId(), idempotencyKey, userMobile, userEmail, trainId, class: cls, journeyDate,
    passengers, upiVpa, mandate: { amount, state: 'BLOCKED' }, status: 'PREBOOKED',
    pnr: null, coach: null, berthNo: null, berthType: null, createdAt: Date.now(),
  };
  intents.unshift(intent);
  saveIntents(intents);
  return delay({ intentId: intent.intentId, status: intent.status, mandate: { amount, state: 'BLOCKED' } });
}

export async function book(intentId) {
  const intents = getIntents();
  const intent = intents.find((i) => i.intentId === intentId);
  if (!intent) throw apiError('intent not found', 404);
  const inv = getInventory();
  const slot = inv.find((r) => r.trainId === intent.trainId && r.class === intent.class);

  if (!TERMINAL.includes(intent.status)) {
    if (slot.seatsLeft > 0) {
      slot.seatsLeft -= 1;
      const berth = allocateBerth(slot, slot.seatsLeft);
      intent.status = 'CONFIRMED';
      intent.pnr = genPnr();
      intent.coach = berth.coach; intent.berthNo = berth.berthNo; intent.berthType = berth.berthType;
      if (intent.passengers[0]) Object.assign(intent.passengers[0], { allottedCoach: berth.coach, allottedBerthNo: berth.berthNo, allottedBerthType: berth.berthType });
      intent.mandate.state = 'EXECUTED';
    } else if (slot.racLeft > 0) {
      slot.racLeft -= 1;
      intent.status = 'RAC';
      intent.pnr = genPnr();
      intent.mandate.state = 'EXECUTED';
    } else {
      intent.status = 'WAITLIST';
      intent.mandate.state = 'RELEASED';
    }
    saveInventory(inv);
    saveIntents(intents);
  }
  return delay(outcome(intent, slot));
}

function outcome(intent, slot) {
  return {
    intentId: intent.intentId, status: intent.status, pnr: intent.pnr,
    coach: intent.coach, berthNo: intent.berthNo, berthType: intent.berthType,
    seatsLeft: slot?.seatsLeft ?? 0, racLeft: slot?.racLeft ?? 0,
  };
}

export async function cancel(intentId) {
  const intents = getIntents();
  const intent = intents.find((i) => i.intentId === intentId);
  if (!intent) throw apiError('intent not found', 404);
  if (TERMINAL.includes(intent.status)) throw apiError(`cannot cancel — already ${intent.status}`, 409);
  intent.mandate.state = 'RELEASED';
  intent.status = 'CANCELLED';
  saveIntents(intents);
  return delay({ intentId, status: 'CANCELLED' });
}

export async function getPnr(pnr) {
  const intent = getIntents().find((i) => i.pnr === (pnr || '').trim());
  if (!intent) throw apiError('PNR not found', 404);
  const inv = getInventory().find((r) => r.trainId === intent.trainId && r.class === intent.class);
  return delay({
    pnr: intent.pnr, status: intent.status === 'RAC' ? 'RAC' : 'CONFIRMED',
    trainId: intent.trainId, trainName: inv?.trainName ?? null, from: inv?.from ?? null, to: inv?.to ?? null,
    class: intent.class, coach: intent.coach, berthNo: intent.berthNo, berthType: intent.berthType,
    journeyDate: intent.journeyDate, passengers: intent.passengers ?? [], intentStatus: intent.status,
  });
}

export async function getBookings(mobile) {
  let list = getIntents();
  if (mobile) list = list.filter((i) => i.userMobile === mobile);
  const inv = getInventory();
  const info = (t, c) => inv.find((r) => r.trainId === t && r.class === c) || {};
  return delay({
    bookings: list.map((i) => {
      const n = info(i.trainId, i.class);
      return {
        intentId: i.intentId, trainId: i.trainId, trainName: n.trainName ?? null, from: n.from ?? null, to: n.to ?? null,
        class: i.class, journeyDate: i.journeyDate, status: i.status, pnr: i.pnr,
        passengers: i.passengers?.length ?? 0, createdAt: i.createdAt,
      };
    }),
  });
}

export async function getAbout() {
  return delay({
    project: 'Async Tatkal (demo)',
    tagline: 'Do the paperwork before 10 AM. At 10 AM, one tap books the seat.',
    problem: [
      'At 10:00 everyone fills passenger details + pays at the same moment — it takes time and seats vanish mid-form.',
      'Payment and ticketing are coupled: money can be debited even when no seat is allotted.',
      'That failed booking is refunded only after ~2 days.',
    ],
    helps: [
      'All slow steps (passengers, identity, payment authorization) are done before 10 AM.',
      'Payment uses a pre-authorized autopay mandate — like an IPO/ASBA block: money is held, not debited.',
      'At 10 AM the user just presses Book — no forms, no payment step, no time lost.',
      'Money is debited only if the seat confirms; on waitlist the hold is released — no debit, no 2-day refund.',
      'Same first-come seat allocation as the real system — only the friction and the payment coupling are removed.',
    ],
    real: [
      'Prepare-ahead flow: passengers + identity + payment authorization done before the window',
      'One-tap booking at Tatkal time (no forms, no payment step)',
      'Deterministic berth allocation (middle-coach-first, lower-berth-first)',
      'Execute-after-confirm mandate — debit only on confirm, release on waitlist',
      'Idempotent booking (re-tap is safe, no duplicate ticket or double charge)',
    ],
    mocked: [
      'Aadhaar / OTP verification — no real Aadhaar data is used',
      'UPI mandate — no real NPCI / bank; the lien lifecycle is simulated',
      'Email / WhatsApp notifications',
      'Runs entirely in your browser (localStorage) — inventory is per-browser, not a shared server',
    ],
    disclaimers: [
      'No affiliation with or endorsement by IRCTC / Indian Railways.',
      'No real personal, payment, or government identity data anywhere.',
    ],
  });
}
