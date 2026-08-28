import mongoose from 'mongoose';
import { MANDATE_STATE } from '../../shared/constants.js';

/**
 * MOCK UPI mandate — models the lien lifecycle only. No real money, no NPCI.
 *
 *   BLOCKED  → created at pre-book time; funds "held", nothing debited.
 *   EXECUTED → debited, but ONLY after the ticket is CONFIRMED/RAC.
 *   RELEASED → lien lifted on WAITLIST / cancel / failure; no debit ever.
 *
 * Execute-after-confirm is the whole point: it eliminates the observable
 * "money debited but no ticket" failure of the synchronous flow.
 */
const MandateSchema = new mongoose.Schema(
  {
    upiVpa: { type: String, required: true }, // e.g. demo@upi (fake)
    amount: { type: Number, required: true, min: 0 },
    state: {
      type: String,
      required: true,
      enum: Object.values(MANDATE_STATE),
      default: MANDATE_STATE.BLOCKED,
    },
    executedAt: { type: Date, default: null },
    releasedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Mandate = mongoose.model('Mandate', MandateSchema);
