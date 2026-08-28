import mongoose from 'mongoose';
import { CLASSES } from '../../shared/constants.js';

/**
 * One document per train-class. `seatsLeft` and `racLeft` are the contended
 * counters — they are mutated ONLY by the worker, via atomic findOneAndUpdate
 * with a `$gt: 0` guard, so they can never go negative and there is exactly one
 * writer per train-class. The API tier never writes these.
 */
const InventorySchema = new mongoose.Schema(
  {
    trainId: { type: String, required: true },
    class: { type: String, required: true, enum: Object.values(CLASSES) },
    trainName: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    seatsTotal: { type: Number, required: true, min: 0 },
    seatsLeft: { type: Number, required: true, min: 0 },
    racLeft: { type: Number, required: true, min: 0, default: 0 },
    coaches: { type: [String], default: [] }, // e.g. ['B1','B2','B3'] for allocation
    berthsPerCoach: { type: Number, default: 72 },
    tatkalOpenAt: { type: Date, required: true },
  },
  { timestamps: true }
);

InventorySchema.index({ trainId: 1, class: 1 }, { unique: true });

export const Inventory = mongoose.model('Inventory', InventorySchema);
