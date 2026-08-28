import { Router } from 'express';
import { Pnr } from '../models/Pnr.js';
import { Intent } from '../models/Intent.js';
import { Inventory } from '../models/Inventory.js';
import { wrap } from '../asyncWrap.js';

const router = Router();

/**
 * GET /pnr/:pnr — PNR enquiry. Returns the ticket plus its journey and current
 * intent status. Used by the PNR Enquiry page.
 */
router.get('/:pnr', wrap(async (req, res) => {
  const pnr = await Pnr.findOne({ pnr: req.params.pnr.trim() }).lean();
  if (!pnr) return res.status(404).json({ error: 'PNR not found' });

  const intent = await Intent.findById(pnr.intentId).lean();
  const inv = await Inventory.findOne({ trainId: pnr.trainId, class: pnr.class }).lean();

  res.json({
    pnr: pnr.pnr,
    status: pnr.status, // CONFIRMED | RAC
    trainId: pnr.trainId,
    trainName: inv?.trainName ?? null,
    from: inv?.from ?? null,
    to: inv?.to ?? null,
    class: pnr.class,
    coach: pnr.coach,
    berthNo: pnr.berthNo,
    berthType: pnr.berthType,
    journeyDate: intent?.journeyDate ?? null,
    passengers: intent?.passengers ?? [],
    intentStatus: intent?.status ?? null,
  });
}));

export default router;
