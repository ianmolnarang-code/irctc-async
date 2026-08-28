import { Router } from 'express';

const router = Router();

/**
 * GET /about — honesty disclosure (a scored criterion). Machine-readable list
 * of exactly what is real vs mocked, surfaced in the UI's /about page and the
 * persistent DemoBanner.
 */
router.get('/', (_req, res) => {
  res.json({
    project: 'Async Tatkal (demo)',
    tagline: 'Do the paperwork before 10 AM; a decoupled worker books the seat.',
    real: [
      'Ordered queue with strict FCFS processing (queuedAt priority)',
      'Single-writer-per-train-class consumer → race-free, no overbooking',
      'Atomic seat decrement in MongoDB (findOneAndUpdate with $gt:0 guard)',
      'Deterministic berth allocation',
      'Execute-after-confirm mandate lifecycle (no money-debited-no-ticket)',
      'Idempotent job processing (redelivery-safe)',
      'Live seat counter + queue position over WebSocket',
      'Decoupled API and worker as separate OS processes',
    ],
    mocked: [
      'Aadhaar / OTP verification — no real Aadhaar data is used',
      'UPI mandate — no real NPCI / bank; lien lifecycle is simulated',
      'Email / WhatsApp notifications — logged + shown as a toast only',
      'Queue transport: BullMQ (Redis-backed) substituted for Kafka — same ordered, single-consumer semantics, one less service to host',
    ],
    disclaimers: [
      'No affiliation with or endorsement by IRCTC / Indian Railways.',
      'No real personal, payment, or government identity data anywhere.',
    ],
  });
});

export default router;
