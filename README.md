# Async Tatkal — scaffold + core engine

A decoupled, queue-based railway booking demo. The citizen does all the heavy
work (passengers, identity, payment authorization) **before** the 10 AM Tatkal
rush; a single lightweight click then enqueues a booking *intent* that a
**separate worker process** consumes in strict FCFS order to allocate a seat
race-free.

> **Demo only.** Not affiliated with IRCTC / Indian Railways. No real Aadhaar,
> UPI, OTP, or payment data is used anywhere.

## Architecture

```
Browser ──POST /intent──▶ Express API ──creates──▶ MongoDB (Intent PREBOOKED, Mandate BLOCKED)
   │                          │
   └──POST /book──────────────┤ stamp queuedAt, status QUEUED, 202 Accepted
                              ▼
                        BullMQ queue  (one per train:class)   ← "Kafka-style" ordered queue
                              ▼
                     Worker process (concurrency 1 / train-class)
                        atomic seat decrement · allocate berth
                        execute-after-confirm mandate · idempotent
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
             Redis (seat cache)   Redis pub/sub ──▶ API re-broadcasts ──▶ Socket.io ──▶ browser
```

Two processes share this codebase — `npm run server` (API) and
`npm run worker` (consumer). The physical split is the point: it proves the
decoupling.

## What's real vs mocked

| Real | Mocked |
| --- | --- |
| Ordered queue, strict FCFS (`queuedAt` priority) | Aadhaar / OTP verification |
| Single-writer-per-train-class → no overbooking | UPI mandate / NPCI |
| Atomic seat decrement (`findOneAndUpdate` + `$gt:0`) | Email / WhatsApp notifications |
| Deterministic berth allocation | Queue transport: **BullMQ substituted for Kafka** (same ordered, single-consumer semantics) |
| Execute-after-confirm mandate (no money-debited-no-ticket) | |
| Idempotent, redelivery-safe processing | |
| Live seat counter + status over WebSocket | |

The `/about` endpoint returns this list as JSON; the client `/about` page renders it.

## Setup

Requires Node 18+ and managed cloud services (no local Redis/Mongo needed):

1. **MongoDB Atlas** — free cluster, copy the SRV connection string.
2. **Upstash Redis** — free database, copy the `rediss://` (TLS) URL.

```bash
cp .env.example .env   # then fill in MONGODB_URI and REDIS_URL
npm install
npm install --prefix client
npm run seed           # loads mock trains + inventory, warms the seat cache
```

## Run (two terminals)

```bash
npm run server         # API + Socket.io on :4000
```

```bash
npm run worker         # BullMQ consumers; prints "waiting for jobs…"
```

Client (full pre-book → book → live-status flow, Apple-style UI):

```bash
npm run client         # Vite dev server on :5173, proxies to :4000
```

The client is complete: Search → Passengers → Aadhaar (mock) → UPI mandate
(mock) → Intent Confirmed → Review → **Live Status** (WebSocket queue position,
live seat counter, PNR/RAC/WL outcome). Tailwind is loaded via CDN for now;
swap to a PostCSS build before production.

## Smoke test (no UI)

```bash
# 1. pre-book (returns intentId)
curl -s -X POST localhost:4000/api/intent -H 'content-type: application/json' -d '{
  "userMobile":"9999999999","userEmail":"demo@example.com",
  "trainId":"12951","class":"3A","journeyDate":"2026-09-01",
  "passengers":[{"name":"A","age":30,"gender":"M","berthPref":"LB"}]
}'

# 2. fire the booking (expect 202 instantly)
curl -s -X POST localhost:4000/api/book -H 'content-type: application/json' -d '{"intentId":"<id>"}'

# 3. watch the worker terminal: PROCESSING → CONFIRMED (PNR...), seat decremented.
# 4. look it up:  curl localhost:4000/api/pnr/<PNR>   ·   list:  curl localhost:4000/api/intents
```

Train `12951` class `3A` is seeded with only **2 seats + 3 RAC**, so a burst of
concurrent pre-book+book calls demonstrates CONFIRMED → RAC → WAITLIST with no
overbooking and no double-charge (waitlisted mandates are RELEASED, not debited).

## Layout

```
shared/    constants + idempotency key
server/    Express API, Mongoose models, BullMQ producer, Socket.io bridge
worker/    BullMQ consumers — allocate, mandate, notify (the core engine)
scripts/   seed.js
client/    Vite React app — full wizard + live status (Apple-style UI kit)
```
