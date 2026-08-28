import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useBooking } from '../store/BookingContext.jsx';
import { useSocket } from '../hooks/useSocket.js';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import QueueBadge from '../components/QueueBadge.jsx';
import SeatCounter from '../components/SeatCounter.jsx';
import { CLASS_LABEL, BERTH_LABEL } from '../constants.js';

const FLOW = ['QUEUED', 'PROCESSING', 'CONFIRMED'];
const TERMINAL = ['CONFIRMED', 'RAC', 'WAITLIST', 'FAILED', 'CANCELLED'];

export default function LiveStatus() {
  const nav = useNavigate();
  const { draft, reset } = useBooking();
  const [status, setStatus] = useState('QUEUED');
  const [seats, setSeats] = useState(draft.train?.seatsLeft ?? null);
  const [rac, setRac] = useState(draft.train?.racLeft ?? null);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);

  const sub = useMemo(
    () => (draft.intentId ? { intentId: draft.intentId, trainId: draft.train.trainId, class: draft.train.class } : {}),
    [draft.intentId, draft.train?.trainId, draft.train?.class]
  );

  useSocket(sub, {
    onIntentUpdate: (p) => { setStatus(p.status); if (p.berth || p.pnr) setResult({ pnr: p.pnr, ...(p.berth || {}) }); },
    onSeatsUpdate: (p) => { setSeats(p.seatsLeft); setRac(p.racLeft); },
    onNotify: (p) => setToast(p.message),
  });

  if (!draft.intentId) return <Navigate to="/" replace />;

  const done = TERMINAL.includes(status);
  const flowIndex = FLOW.indexOf(status === 'RAC' || status === 'WAITLIST' ? 'CONFIRMED' : status);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card title="Booking Status (Live)" bodyClass="p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[13px] text-muted">Intent <code className="text-[11px]">{draft.intentId.slice(-8)}</code></span>
          <QueueBadge status={status} />
        </div>
        <ol className="space-y-3">
          {FLOW.map((s, i) => {
            const reached = flowIndex >= i;
            const isCurrent = FLOW[flowIndex] === s && !done;
            return (
              <li key={s} className="flex items-center gap-3">
                <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold
                  ${reached ? 'bg-brand text-white' : 'bg-line text-muted'}`}>{reached ? '✓' : i + 1}</span>
                <span className={`text-[13.5px] ${reached ? 'font-medium text-ink' : 'text-muted'}`}>{label(s)}</span>
                {isCurrent && <span className="ml-auto h-2 w-2 animate-ping rounded-full bg-brand" />}
              </li>
            );
          })}
        </ol>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <SeatCounter label={`${CLASS_LABEL[draft.train.class]} seats`} value={seats} />
        <SeatCounter label="RAC left" value={rac} />
      </div>

      {done && (
        <Card bodyClass="p-0" className="overflow-hidden animate-fade-up">
          <div className={`px-4 py-4 text-center ${outcomeTone(status)}`}>
            <div className="text-[13px] font-bold uppercase tracking-wide">{outcomeTitle(status)}</div>
            {result?.pnr && <div className="tabular mt-1 text-2xl font-bold text-ink">{result.pnr}</div>}
            {result?.coach && <div className="mt-0.5 text-[12.5px] text-muted">Coach {result.coach} · Berth {result.berthNo} · {BERTH_LABEL[result.berthType] || result.berthType}</div>}
            <p className="mt-2 text-[12px] text-muted">{outcomeSub(status)}</p>
          </div>
        </Card>
      )}

      {toast && <div className="rounded-[3px] bg-brand-dark px-4 py-2.5 text-[13px] text-white animate-fade-in">{toast}</div>}

      {done && <Button variant="secondary" className="w-full" onClick={() => { reset(); nav('/'); }}>Book Another</Button>}
      <p className="text-center text-[11px] text-muted">Updates stream over WebSocket, pushed by the worker.</p>
    </div>
  );
}

const label = (s) => ({ QUEUED: 'Queued — in line', PROCESSING: 'Processing — allocating seat', CONFIRMED: 'Committed' }[s]);
const outcomeTitle = (s) => ({ CONFIRMED: 'Confirmed', RAC: 'RAC', WAITLIST: 'Waitlisted', FAILED: 'Failed', CANCELLED: 'Cancelled' }[s] || s);
const outcomeTone = (s) => (s === 'CONFIRMED' ? 'bg-green-50' : s === 'RAC' ? 'bg-amber-50' : s === 'WAITLIST' ? 'bg-red-50' : 'bg-page');
const outcomeSub = (s) => ({
  CONFIRMED: 'Fare debited. Ticket messaged to you.',
  RAC: 'Likely to confirm before departure. Fare debited.',
  WAITLIST: 'No seat this time — your payment hold was released, nothing charged.',
  FAILED: 'Something went wrong. Your hold was released, nothing charged.',
  CANCELLED: 'You cancelled. Nothing charged.',
}[s] || '');
