import { Router } from 'express';
import { Inventory } from '../models/Inventory.js';
import { seatsKey } from '../../shared/constants.js';
import { wrap } from '../asyncWrap.js';

/**
 * GET /availability — live seat counts. Reads from Redis (fast, spike-proof)
 * and never hits Mongo under load. The worker is the only writer of seatsLeft
 * and keeps the Redis cache warm; here we just read it. Mongo is used only to
 * enumerate which train-classes exist and for static metadata.
 *
 * Query (optional): ?trainId=12951  to filter to one train.
 */
export default function availabilityRouter(redis) {
  const router = Router();

  router.get('/', wrap(async (req, res) => {
    const filter = req.query.trainId ? { trainId: req.query.trainId } : {};
    const invs = await Inventory.find(filter).lean();

    const rows = await Promise.all(
      invs.map(async (inv) => {
        const cached = await redis.get(seatsKey(inv.trainId, inv.class));
        // Fall back to the Mongo value if the cache is cold.
        const seatsLeft = cached !== null ? Number(cached) : inv.seatsLeft;
        return {
          trainId: inv.trainId,
          trainName: inv.trainName,
          from: inv.from,
          to: inv.to,
          class: inv.class,
          seatsTotal: inv.seatsTotal,
          seatsLeft,
          racLeft: inv.racLeft,
          tatkalOpenAt: inv.tatkalOpenAt,
        };
      })
    );

    res.json({ availability: rows });
  }));

  return router;
}
