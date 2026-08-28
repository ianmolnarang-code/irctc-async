import { Router } from 'express';
import { Intent } from '../models/Intent.js';
import { Inventory } from '../models/Inventory.js';
import { wrap } from '../asyncWrap.js';

const router = Router();

/**
 * GET /intents — recent bookings for the "My Bookings" page. Optional
 * ?mobile= filter (no auth in this demo, so it lists recent by default).
 */
router.get('/', wrap(async (req, res) => {
  const filter = req.query.mobile ? { userMobile: String(req.query.mobile) } : {};
  const intents = await Intent.find(filter).sort({ createdAt: -1 }).limit(50).lean();

  // Build a trainId+class → trainName map so we can label each row.
  const invs = await Inventory.find({}, { trainId: 1, class: 1, trainName: 1, from: 1, to: 1 }).lean();
  const names = new Map(invs.map((i) => [`${i.trainId}:${i.class}`, i]));

  res.json({
    bookings: intents.map((i) => {
      const inv = names.get(`${i.trainId}:${i.class}`) || {};
      return {
        intentId: i._id,
        trainId: i.trainId,
        trainName: inv.trainName ?? null,
        from: inv.from ?? null,
        to: inv.to ?? null,
        class: i.class,
        journeyDate: i.journeyDate,
        status: i.status,
        pnr: i.pnr,
        passengers: i.passengers?.length ?? 0,
        createdAt: i.createdAt,
      };
    }),
  });
}));

export default router;
