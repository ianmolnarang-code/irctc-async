import { WS_EVENTS } from '../shared/constants.js';
import { publishWs } from './wsPublish.js';

/**
 * MOCK notifications — no real email or WhatsApp is sent. We log to the console
 * (visible to judges in the worker terminal) and push a toast to the user's
 * Live Status page over the WebSocket bridge.
 */
export async function notifyBooking(redisPub, intent, outcome) {
  const { status, pnr, coach, berthNo, berthType } = outcome;

  const lines = {
    CONFIRMED: `✅ Confirmed! PNR ${pnr} · ${coach}/${berthNo} (${berthType}). Fare debited.`,
    RAC: `🟡 RAC ${pnr}. You'll likely be confirmed — fare debited.`,
    WAITLIST: `⏳ Waitlisted. No money taken; your hold was released.`,
    FAILED: `⚠️ Booking failed. No money taken; your hold was released.`,
  };
  const message = lines[status] || `Status: ${status}`;

  console.log(`[notify][MOCK] → ${intent.userEmail} / ${intent.userMobile}: ${message}`);

  await publishWs(redisPub, {
    event: WS_EVENTS.NOTIFY,
    room: { type: 'intent', intentId: String(intent.id) },
    payload: { intentId: String(intent.id), status, pnr, message, channels: ['email', 'whatsapp'], mock: true },
  });
}
