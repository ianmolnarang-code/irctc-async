import { Navigate, useNavigate } from 'react-router-dom';
import { useBooking } from '../store/BookingContext.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import QueueBadge from '../components/QueueBadge.jsx';
import SeatCounter from '../components/SeatCounter.jsx';
import { CLASS_LABEL, BERTH_LABEL } from '../constants.js';

// Result page. Booking is synchronous now, so the outcome came back in the
// /book response and is stored on the draft — no WebSocket needed.
const FLOW = ['Requested', 'Allocated', 'Confirmed'];

export default function LiveStatus() {
  const nav = useNavigate();
  const { draft, reset } = useBooking();
  const outcome = draft.outcome;

  if (!draft.intentId || !outcome) return <Navigate to="/" replace />;

  const { status, pnr, coach, berthNo, berthType, seatsLeft, racLeft } = outcome;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card title="Booking Result" bodyClass="p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[13px] text-muted">Intent <code className="text-[11px]">{draft.intentId.slice(-8)}</code></span>
          <QueueBadge status={status} />
        </div>
        <ol className="space-y-3">
          {FLOW.map((s, i) => (
            <li key={s} className="flex items-center gap-3">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">✓</span>
              <span className="text-[13.5px] font-medium text-ink">{s}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <SeatCounter label={`${CLASS_LABEL[draft.train.class]} seats`} value={seatsLeft} />
        <SeatCounter label="RAC left" value={racLeft} />
      </div>

      <Card bodyClass="p-0" className="overflow-hidden animate-fade-up">
        <div className={`px-4 py-4 text-center ${tone(status)}`}>
          <div className="text-[13px] font-bold uppercase tracking-wide">{title(status)}</div>
          {pnr && <div className="tabular mt-1 text-2xl font-bold text-ink">{pnr}</div>}
          {coach && <div className="mt-0.5 text-[12.5px] text-muted">Coach {coach} · Berth {berthNo} · {BERTH_LABEL[berthType] || berthType}</div>}
          <p className="mt-2 text-[12px] text-muted">{sub(status)}</p>
        </div>
      </Card>

      <Button variant="secondary" className="w-full" onClick={() => { reset(); nav('/'); }}>Book Another</Button>
      <p className="text-center text-[11px] text-muted">Seat allocated synchronously at booking time — no queue, no waiting.</p>
    </div>
  );
}

const title = (s) => ({ CONFIRMED: 'Confirmed', RAC: 'RAC', WAITLIST: 'Waitlisted', FAILED: 'Failed', CANCELLED: 'Cancelled' }[s] || s);
const tone = (s) => (s === 'CONFIRMED' ? 'bg-green-50' : s === 'RAC' ? 'bg-amber-50' : s === 'WAITLIST' ? 'bg-red-50' : 'bg-page');
const sub = (s) => ({
  CONFIRMED: 'Fare debited. Ticket messaged to you (demo).',
  RAC: 'Likely to confirm before departure. Fare debited.',
  WAITLIST: 'No seat this time — your payment hold was released, nothing charged.',
  FAILED: 'Something went wrong. Your hold was released, nothing charged.',
  CANCELLED: 'You cancelled. Nothing charged.',
}[s] || '');
