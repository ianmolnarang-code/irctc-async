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
    tagline: 'Do the paperwork before 10 AM. At 10 AM, one tap books the seat.',
    problem: [
      'At 10:00 everyone fills passenger details + pays at the same moment — it takes time and seats vanish mid-form.',
      'Payment and ticketing are coupled: money can be debited even when no seat is allotted.',
      'That failed booking is refunded only after ~2 days.',
    ],
    helps: [
      'All slow steps (passengers, identity, payment authorization) are done before 10 AM.',
      'Payment uses a pre-authorized autopay mandate — like an IPO/ASBA block: money is held, not debited.',
      'At 10 AM the user just presses Book — no forms, no payment step, no time lost.',
      'Money is debited only if the seat confirms; on waitlist the hold is released — no debit, no 2-day refund.',
      'Same first-come seat allocation as the real system — only the friction and the payment coupling are removed.',
    ],
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
