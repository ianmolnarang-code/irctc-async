import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useBooking } from '../../store/BookingContext.jsx';
import { createIntent } from '../../api/client.js';
import StepBar from '../../components/StepBar.jsx';
import Card from '../../components/ui/Card.jsx';
import Field from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';
import MockTag from '../../components/MockTag.jsx';
import { FARE, CLASS_LABEL, inr } from '../../constants.js';

export default function UpiMandate() {
  const nav = useNavigate();
  const { draft, patch } = useBooking();
  const [vpa, setVpa] = useState(draft.upiVpa || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  if (!draft.train || !draft.contact.userMobile) return <Navigate to="/" replace />;

  const amount = (FARE[draft.train.class] ?? 0) * draft.passengers.length;
  const validVpa = /^[\w.-]+@[\w.-]+$/.test(vpa);

  async function authorize() {
    setBusy(true); setErr(null);
    try {
      const res = await createIntent({
        userMobile: draft.contact.userMobile,
        userEmail: draft.contact.userEmail,
        trainId: draft.train.trainId,
        class: draft.train.class,
        journeyDate: draft.journeyDate,
        passengers: draft.passengers,
        upiVpa: vpa,
      });
      patch({ upiVpa: vpa, intentId: res.intentId, mandate: { amount } });
      nav('/confirmed');
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <StepBar current={3} />
      <Card title="Payment — UPI Mandate" bodyClass="p-4">
        <div className="mb-3 flex items-center gap-2">
          <MockTag>No real UPI / NPCI</MockTag>
        </div>
        <div className="max-w-md space-y-4">
          <div className="rounded-[3px] border border-line bg-page px-4 py-3">
            <div className="text-[11px] uppercase tracking-wide text-muted">Amount to block</div>
            <div className="tabular text-3xl font-bold text-brand-dark">{inr(amount)}</div>
            <div className="text-[12px] text-muted">{CLASS_LABEL[draft.train.class]} · {draft.passengers.length} passenger{draft.passengers.length > 1 ? 's' : ''}</div>
          </div>
          <Field label="UPI ID" placeholder="yourname@bank" value={vpa}
            onChange={(e) => setVpa(e.target.value)} hint="Demo VPA — nothing is charged now." />
          <div className="rounded-[3px] border-l-4 border-avail-green bg-green-50 px-3 py-2 text-[12.5px] text-avail-green">
            This amount is <strong>blocked, not deducted</strong>. Debited only if your ticket confirms; released on waitlist.
          </div>
          {err && <p className="text-[12.5px] text-avail-red">{err}</p>}
          <Button variant="cta" disabled={!validVpa || busy} onClick={authorize} className="w-full py-2.5">
            {busy ? 'Authorizing…' : `Block ${inr(amount)} & Finish`}
          </Button>
        </div>
      </Card>

      <div className="mt-4">
        <Button variant="secondary" onClick={() => nav('/prebook/aadhaar')}>Back</Button>
      </div>
    </div>
  );
}
