// Shared domain constants used by both server and worker.

// Intent lifecycle. PREBOOKED/QUEUED/PROCESSING are transient; the rest are terminal.
export const STATUS = {
  PREBOOKED: 'PREBOOKED',
  QUEUED: 'QUEUED',
  PROCESSING: 'PROCESSING',
  CONFIRMED: 'CONFIRMED',
  RAC: 'RAC',
  WAITLIST: 'WAITLIST',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
};

// An intent in a terminal state must never be reprocessed (idempotency guard).
export const TERMINAL_STATUSES = [
  STATUS.CONFIRMED,
  STATUS.RAC,
  STATUS.WAITLIST,
  STATUS.CANCELLED,
  STATUS.FAILED,
];

// Travel classes (Tatkal quota). Codes double as Inventory keys.
export const CLASSES = {
  SL: 'SL', // Sleeper
  '3A': '3A', // AC 3-Tier
  '2A': '2A', // AC 2-Tier
  '1A': '1A', // AC First
};

// Mock Tatkal fare per class, in INR. Amount blocked by the UPI mandate.
export const FARE = {
  SL: 550,
  '3A': 1250,
  '2A': 2100,
  '1A': 3600,
};

// Mandate (mock UPI lien) lifecycle.
export const MANDATE_STATE = {
  BLOCKED: 'BLOCKED', // lien placed at pre-book time, no money moved
  EXECUTED: 'EXECUTED', // debited — only after CONFIRMED/RAC
  RELEASED: 'RELEASED', // lien lifted — WAITLIST/cancel/failure, no debit
};

export const MAX_PASSENGERS = 4;

// BullMQ queue names.
export const NOTIFY_QUEUE = 'notifications';

// One booking queue per train-class → single writer per partition, no lock.
// BullMQ 5 disallows ':' in queue names, so use '__' as the separator.
export function bookingQueueName(trainId, cls) {
  return `book__${trainId}__${cls}`;
}

// Socket.io event names.
export const WS_EVENTS = {
  INTENT_UPDATE: 'intent:update', // per-intent status transitions
  SEATS_UPDATE: 'seats:update', // live seat counter per train-class
  NOTIFY: 'notify', // mock email/WhatsApp toast
};

// Redis key for the cached live seat count of a train-class.
export function seatsKey(trainId, cls) {
  return `seats:${trainId}:${cls}`;
}

// Redis pub/sub channel the worker publishes UI events to. The API server is
// the only Socket.io holder, so it subscribes here and re-broadcasts to
// browsers — the worker never talks to sockets directly (clean process split).
export const WS_CHANNEL = 'ws:broadcast';

// Socket.io room helpers so emits are targeted, not global.
export function intentRoom(intentId) {
  return `intent:${intentId}`;
}
export function trainRoom(trainId, cls) {
  return `train:${trainId}:${cls}`;
}
