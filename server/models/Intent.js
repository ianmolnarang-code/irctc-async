import mongoose from 'mongoose';
import { STATUS, CLASSES, MAX_PASSENGERS } from '../../shared/constants.js';

const PassengerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true, min: 0, max: 120 },
    gender: { type: String, required: true, enum: ['M', 'F', 'O'] },
    berthPref: {
      type: String,
      enum: ['LB', 'MB', 'UB', 'SL', 'SU', 'ANY'],
      default: 'ANY',
    },
    // Filled by the worker on CONFIRMED.
    allottedCoach: { type: String, default: null },
    allottedBerthNo: { type: Number, default: null },
    allottedBerthType: { type: String, default: null },
  },
  { _id: false }
);

/**
 * The user's booking intent. Created (PREBOOKED) during the calm Phase-1
 * wizard with all heavy validation already done. `POST /book` stamps
 * `queuedAt` server-side and flips it to QUEUED; the worker drives the rest of
 * the lifecycle. `idempotencyKey` is unique — duplicate pre-books collapse here.
 */
const IntentSchema = new mongoose.Schema(
  {
    idempotencyKey: { type: String, required: true, unique: true },
    userMobile: { type: String, required: true },
    userEmail: { type: String, required: true },
    trainId: { type: String, required: true },
    class: { type: String, required: true, enum: Object.values(CLASSES) },
    journeyDate: { type: String, required: true }, // ISO date string, part of the idempotency key
    passengers: {
      type: [PassengerSchema],
      required: true,
      validate: [
        (v) => v.length >= 1 && v.length <= MAX_PASSENGERS,
        `passengers must be between 1 and ${MAX_PASSENGERS}`,
      ],
    },
    mandateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mandate', default: null },
    status: {
      type: String,
      required: true,
      enum: Object.values(STATUS),
      default: STATUS.PREBOOKED,
    },
    // Server-authoritative FCFS priority signal. Set only by POST /book.
    queuedAt: { type: Number, default: null },
    pnr: { type: String, default: null },
  },
  { timestamps: true }
);

export const Intent = mongoose.model('Intent', IntentSchema);
