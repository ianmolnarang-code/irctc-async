import { Router } from 'express';
import { Inventory } from '../models/Inventory.js';
import { wrap } from '../asyncWrap.js';

/**
 * GET /availability — live seat counts, read from MongoDB (the source of
 * truth). Booking mutates Inventory atomically in the same DB, so these counts
 * are always current. No Redis needed — keeps the serverless deploy simple.
 *
 * Query (optional): ?trainId=12951
 */
export default function availabilityRouter() {
  const router = Router();

  router.get('/', wrap(async (req, res) => {
    const filter = req.query.trainId ? { trainId: req.query.trainId } : {};
    const invs = await Inventory.find(filter).lean();
    res.json({
      availability: invs.map((inv) => ({
        trainId: inv.trainId,
        trainName: inv.trainName,
        from: inv.from,
        to: inv.to,
        class: inv.class,
        seatsTotal: inv.seatsTotal,
        seatsLeft: inv.seatsLeft,
        racLeft: inv.racLeft,
        tatkalOpenAt: inv.tatkalOpenAt,
      })),
    });
  }));

  return router;
}
