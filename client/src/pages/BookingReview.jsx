import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useBooking } from '../store/BookingContext.jsx';
import { book, cancel } from '../api/client.js';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { CLASS_LABEL, inr, BERTH_LABEL } from '../constants.js';

// HH:MM:SS (drops the hours segment when zero).
function fmt(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${String(h).padStart(2, '0')}:${m}:${sec}` : `${m}:${sec}`;
}

export default function BookingReview() {
  const nav = useNavigate();
  const { draft, patch, reset } = useBooking();
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [skipped, setSkipped] = useState(false);

  // Tatkal opens at 10:00 AM. Target the next 10:00 (today if we're before it,
  // otherwise tomorrow) so there's always a real countdown to show.
  const [openAt] = useState(() => {
    const t = new Date();
    t.setHours(10, 0, 0, 0);
    if (Date.now() >= t.getTime()) t.setDate(t.getDate() + 1);
    return t.getTime();
  });
  const opensToday = new Date(openAt).toDateString() === new Date().toDateString();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!draft.intentId) return <Navigate to="/" replace />;

  const remaining = Math.max(0, openAt - now);
  const windowOpen = remaining <= 0;
  const unlocked = windowOpen || skipped;

  async function confirm() {
    setBusy('book'); setErr(null);
    try {
      const outcome = await book(draft.intentId);
      patch({ outcome });
      nav('/live');
    } catch (e) { setErr(e.response?.data?.error || e.message); setBusy(null); }
  }
  async function abort() {
    setBusy('cancel'); setErr(null);
    try { await cancel(draft.intentId); reset(); nav('/'); }
    catch (e) { setErr(e.response?.data?.error || e.message); setBusy(null); }
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Tatkal window gate */}
      {!unlocked ? (
        <div className="mb-4 overflow-hidden rounded-[6px] bg-brand-dark text-white shadow-sm">
          <div className="px-5 py-5 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Tatkal window opens in</div>
            <div className="tabular mt-1.5 text-5xl font-bold leading-none">{fmt(remaining)}</div>
            <div className="mt-2 text-[12.5px] text-white/75">Opens {opensToday ? 'today' : 'tomorrow'} at 10:00 AM</div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[12px] text-white/85">
              <span>🔒</span> Booking unlocks automatically when the timer hits zero
            </div>
          </div>
          <div className="border-t border-white/15 px-5 py-2 text-center">
            <button onClick={() => setSkipped(true)} className="text-[12.5px] font-medium text-white/90 underline underline-offset-2 hover:text-white">
              Skip the timer (demo) →
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-2 rounded-[4px] border border-green-200 bg-green-50 px-4 py-2.5 text-[13px] text-avail-green">
          <span className="h-2.5 w-2.5 rounded-full bg-avail-green" />
          <span>
            <strong>Tatkal window is open.</strong>{skipped && !windowOpen ? ' (timer skipped for demo)' : ''} Tap Book Now — your seat is allocated in first-come order.
          </span>
        </div>
      )}

      <Card title="Review & Book" bodyClass="p-0">
        <div className="border-b border-line px-4 py-2.5">
          <div className="text-[14px] font-bold text-brand-dark">{draft.train.trainName} <span className="font-normal text-muted">(#{draft.train.trainId})</span></div>
          <div className="text-[12px] text-muted">{draft.train.from} → {draft.train.to} · {CLASS_LABEL[draft.train.class]} · {draft.journeyDate}</div>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-page text-[11px] uppercase text-muted">
              <th className="px-4 py-1.5 text-left font-medium">Passenger</th>
              <th className="px-4 py-1.5 text-right font-medium">Age / Gender / Berth</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {draft.passengers.map((p, i) => (
              <tr key={i}>
                <td className="px-4 py-2 font-medium">{p.name}</td>
                <td className="px-4 py-2 text-right text-muted">{p.age} · {p.gender} · {BERTH_LABEL[p.berthPref]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-line bg-page px-4 py-2.5 text-[13px]">
          <span className="text-muted">Blocked (debited only on confirm)</span>
          <span className="tabular font-bold text-brand-dark">{inr(draft.mandate?.amount ?? 0)}</span>
        </div>
      </Card>

      {err && <p className="mt-3 text-[12.5px] text-avail-red">{err}</p>}

      <div className="mt-4 flex items-center gap-3">
        <Button variant="danger" disabled={!!busy} onClick={abort} className="flex-1">
          {busy === 'cancel' ? 'Cancelling…' : 'Cancel'}
        </Button>
        <Button variant="cta" disabled={!!busy || !unlocked} onClick={confirm} className="flex-1">
          {busy === 'book' ? 'Booking…' : unlocked ? 'Book Now' : `🔒 Opens in ${fmt(remaining)}`}
        </Button>
      </div>

      <p className="mt-2 text-center text-[11px] text-muted">
        Your seat is allocated instantly, in first-come order. Fare is debited only if it confirms.
      </p>
      <p className="mt-1 text-center text-[11px] text-muted">
        Not 10 AM yet? Your details &amp; payment hold are saved —{' '}
        <button onClick={() => nav('/bookings')} className="text-accent-dark hover:underline">book later with one tap</button> from My Bookings.
      </p>
    </div>
  );
}
