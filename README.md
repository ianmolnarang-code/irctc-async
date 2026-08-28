# Async Tatkal — prepare-ahead Tatkal booking (demo)

An IRCTC-style booking demo that fixes the 10 AM Tatkal scramble. You do all the
slow stuff **before** the window opens — passenger details, identity, and a
pre-authorized **autopay mandate** (IPO/ASBA-style: money is *blocked, not
debited*). At 10 AM you just press **Book** once. Same first-come seat
allocation — only the friction and the payment coupling are removed.

> **Demo only.** Not affiliated with or endorsed by IRCTC / Indian Railways.
> No real Aadhaar, UPI, OTP, or payment data is used.

## The problem it solves

- At 10:00 everyone fills details + pays at the same moment → it's slow and
  seats vanish mid-form.
- Payment and ticketing are coupled → money can be debited with **no** seat.
- That failed booking is refunded only after **~2 days**.

**Fix:** prepare everything ahead → one tap at 10 AM → debit **only** if the
seat confirms; on waitlist the hold is released (no debit, no 2-day refund).

## Architecture

Pure client-side single-page app — **no backend, no database.** All data
(inventory, bookings, PNRs) lives in the browser's `localStorage`, and seat
allocation runs in the client. This makes it a trivial static deploy.

> Because state is in `localStorage`, inventory is **per-browser** — this is a
> UX/journey demo, not a shared-inventory system.

```
client/                     Vite + React (IRCTC-style UI)
  src/
    api/client.js           the "data layer" — localStorage store + allocation
    pages/                  Search, PreBook wizard, Review, Result, My Bookings, PNR, About
    components/, store/     UI kit + booking context
vercel.json                 static build config for Vercel
```

## Run locally

```bash
npm install --prefix client
npm run dev
```

Open http://localhost:5173. Inventory seeds itself on first load.

## Flow

Search → Passengers → Aadhaar (mock OTP to the Aadhaar-linked mobile) → UPI
mandate (mock, blocks the fare) → **Review → Book Now** (instant allocation) →
Result. Prepared-but-unbooked intents show a one-tap **Book Now** in **My
Bookings** — the "10 AM moment."

## Deploy (Vercel)

Import the repo — `vercel.json` builds `client/` to `client/dist` and serves it
as a static SPA. **No environment variables, no database.**

## What's real vs mocked

| Real | Mocked |
| --- | --- |
| Prepare-ahead flow (info + payment auth before the window) | Aadhaar / OTP |
| One-tap booking at Tatkal time | UPI mandate / NPCI |
| Deterministic berth allocation | Email / WhatsApp notifications |
| Execute-after-confirm mandate (debit only on confirm) | Runs in-browser (localStorage), inventory is per-browser |
| Idempotent booking (re-tap safe) | |

The `/about` page in the app lists this too.
