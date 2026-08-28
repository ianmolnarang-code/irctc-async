import { Navigate, useNavigate } from 'react-router-dom';
import { useBooking } from '../store/BookingContext.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { CLASS_LABEL } from '../constants.js';

export default function IntentConfirmed() {
  const nav = useNavigate();
  const { draft } = useBooking();
  if (!draft.intentId) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto max-w-lg">
      <Card title="Booking Scheduled" bodyClass="p-5">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green-100 text-avail-green text-lg">✓</span>
          <div>
            <div className="text-[15px] font-bold text-brand-dark">You're all set — nothing to do at 10 AM.</div>
            <p className="text-[12.5px] text-muted">A worker will book your seat the instant Tatkal opens and message you.</p>
          </div>
        </div>
        <table className="w-full text-[13px]">
          <tbody className="divide-y divide-line">
            <Row k="Train" v={`${draft.train.trainName} (#${draft.train.trainId})`} />
            <Row k="Route" v={`${draft.train.from} → ${draft.train.to}`} />
            <Row k="Class" v={CLASS_LABEL[draft.train.class]} />
            <Row k="Date" v={draft.journeyDate} />
            <Row k="Passengers" v={String(draft.passengers.length)} />
            <Row k="Intent ID" v={<code className="text-[11px]">{draft.intentId}</code>} />
          </tbody>
        </table>
        <Button variant="cta" className="mt-5 w-full py-2.5" onClick={() => nav('/review')}>
          Simulate the 10 AM Booking →
        </Button>
        <p className="mt-2 text-center text-[11px] text-muted">In production this fires automatically at 10:00. For the demo, you trigger it.</p>
      </Card>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <tr>
      <td className="py-2 pr-4 text-muted">{k}</td>
      <td className="py-2 text-right font-medium text-ink">{v}</td>
    </tr>
  );
}
