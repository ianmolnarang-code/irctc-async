import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useBooking } from '../store/BookingContext.jsx';
import { book, cancel } from '../api/client.js';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import MockTag from '../components/MockTag.jsx';
import { CLASS_LABEL, inr, BERTH_LABEL } from '../constants.js';

function fmt(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

export default function BookingReview() {
  const nav = useNavigate();
  const { draft, reset } = useBooking();
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [override, setOverride] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!draft.intentId) return <Navigate to="/" replace />;

  const openAt = draft.train.tatkalOpenAt ? new Date(draft.train.tatkalOpenAt).getTime() : 0;
  const remaining = openAt - now;
  const isOpen = remaining <= 0;
  const gated = !isOpen && !override;

  async function confirm() {
    setBusy('book'); setErr(null);
    try { await book(draft.intentId); nav('/live'); }
    catch (e) { setErr(e.response?.data?.error || e.message); setBusy(null); }
  }
  async function abort() {
    setBusy('cancel'); setErr(null);
    try { await cancel(draft.intentId); reset(); nav('/'); }
    catch (e) { setErr(e.response?.data?.error || e.message); setBusy(null); }
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Tatkal window banner */}
      <div className={`mb-3 rounded-[3px] px-4 py-2.5 text-[13px] ${isOpen ? 'bg-green-50 text-avail-green' : 'bg-amber-50 text-avail-amber'}`}>
        {isOpen ? (
          <span>🟢 <strong>Tatkal booking is open.</strong> Your seat is allocated in FCFS order.</span>
        ) : (
          <span>⏳ Tatkal (TATKAL quota) opens in <strong className="tabular">{fmt(remaining)}</strong>. In production your booking fires automatically then.</span>
        )}
      </div>

      <Card title="Review & Book" bodyClass="p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <div>
            <div className="text-[14px] font-bold text-brand-dark">{draft.train.trainName} <span className="font-normal text-muted">(#{draft.train.trainId})</span></div>
            <div className="text-[12px] text-muted">{draft.train.from} → {draft.train.to} · {CLASS_LABEL[draft.train.class]} · {draft.journeyDate}</div>
          </div>
          <MockTag>10 AM auto-trigger</MockTag>
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
        <Button variant="cta" disabled={!!busy || gated} onClick={confirm} className="flex-1">
          {busy === 'book' ? 'Queuing…' : (isOpen || override) ? 'Book Now' : 'Waiting for 10 AM…'}
        </Button>
      </div>

      {gated && (
        <button onClick={() => setOverride(true)} className="mt-3 block w-full text-center text-[12px] text-brand hover:underline">
          Simulate the 10 AM trigger now (demo)
        </button>
      )}
      <p className="mt-2 text-center text-[11px] text-muted">Instant to submit — a worker allocates the seat in FCFS order. Watch it live next.</p>
    </div>
  );
}
