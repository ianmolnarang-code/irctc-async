import mongoose from 'mongoose';

/**
 * A confirmed/RAC ticket record. Written by the worker after a successful
 * atomic seat decrement. One PNR per intent (unique index) so a redelivered
 * job can never mint a second ticket.
 */
const PnrSchema = new mongoose.Schema(
  {
    pnr: { type: String, required: true, unique: true },
    intentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Intent', required: true, unique: true },
    trainId: { type: String, required: true },
    class: { type: String, required: true },
    coach: { type: String, default: null },
    berthNo: { type: Number, default: null },
    berthType: { type: String, default: null },
    status: { type: String, required: true, enum: ['CONFIRMED', 'RAC'] },
  },
  { timestamps: true }
);

export const Pnr = mongoose.model('Pnr', PnrSchema);
