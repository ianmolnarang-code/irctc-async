import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useBooking } from '../store/BookingContext.jsx';
import { book, cancel } from '../api/client.js';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { CLASS_LABEL, inr, BERTH_LABEL } from '../constants.js';

export default function BookingReview() {
  const nav = useNavigate();
  const { draft, patch, reset } = useBooking();
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);

  if (!draft.intentId) return <Navigate to="/" replace />;

  async function confirm() {
    setBusy('book'); setErr(null);
    try {
      const outcome = await book(draft.intentId); // synchronous: seat allocated now
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
        <Button variant="cta" disabled={!!busy} onClick={confirm} className="flex-1">
          {busy === 'book' ? 'Booking…' : 'Book Now'}
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
