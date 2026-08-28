import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useBooking } from '../../store/BookingContext.jsx';
import StepBar from '../../components/StepBar.jsx';
import Card from '../../components/ui/Card.jsx';
import Field from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';
import MockTag from '../../components/MockTag.jsx';

const gen = () => String(Math.floor(100000 + Math.random() * 900000)); // 6-digit

// The Aadhaar-linked mobile/email are looked up automatically (simulated here,
// derived deterministically from the Aadhaar so re-booking dedups the same).
const linkedMobileFrom = (aadhaar) => '9' + aadhaar.slice(-9); // 10-digit
const emailFrom = (aadhaar) => `user${aadhaar.slice(-4)}@example.com`;

export default function AadhaarOtp() {
  const nav = useNavigate();
  const { draft, patch } = useBooking();
  const [aadhaar, setAadhaar] = useState('');
  const [sentCode, setSentCode] = useState(null);
  const [otp, setOtp] = useState('');

  if (!draft.passengers.length) return <Navigate to="/" replace />;

  const validAadhaar = /^\d{12}$/.test(aadhaar);
  const verified = sentCode && otp === sentCode;

  const linkedMobile = validAadhaar ? linkedMobileFrom(aadhaar) : '';
  const maskedMobile = linkedMobile ? `+91 ●●●●●● ${linkedMobile.slice(-4)}` : '';
  const fmtAadhaar = aadhaar.replace(/(\d{4})(?=\d)/g, '$1 ').trim();

  function sendOtp() {
    setSentCode(gen());
    setOtp('');
  }

  function proceed() {
    // Contact is the Aadhaar-linked mobile + email (auto-resolved, not typed).
    patch({ contact: { userMobile: linkedMobile, userEmail: emailFrom(aadhaar) } });
    nav('/prebook/upi');
  }

  return (
    <div>
      <StepBar current={2} />
      <Card title="Aadhaar Verification" bodyClass="p-4">
        <div className="mb-3 flex items-center gap-2">
          <MockTag>No real Aadhaar / UIDAI / SMS</MockTag>
          <span className="text-[12px] text-muted">Done now — kept out of the 10 AM rush.</span>
        </div>

        <div className="max-w-md space-y-4">
          <Field
            label="Aadhaar Number"
            inputMode="numeric"
            maxLength={14}
            placeholder="XXXX XXXX XXXX"
            value={fmtAadhaar}
            onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
            hint="Enter your 12-digit Aadhaar. The OTP is sent automatically to the mobile linked with it — no number needed."
          />

          {!sentCode ? (
            <Button variant="secondary" disabled={!validAadhaar} onClick={sendOtp}>
              Send OTP
            </Button>
          ) : (
            <div className="space-y-3 animate-fade-up">
              <div className="rounded-[3px] border-l-4 border-brand bg-brand-light px-3 py-2 text-[12.5px] text-brand-dark">
                OTP sent automatically to the mobile linked with Aadhaar {fmtAadhaar} — <strong>{maskedMobile}</strong>.
              </div>
              <div className="rounded-[3px] border border-dashed border-demo bg-demo/10 px-3 py-2 text-[12px] text-demo-dark">
                <MockTag>Demo</MockTag> No SMS is really sent. Your code is <strong className="tabular tracking-widest">{sentCode}</strong>.
              </div>
              <Field label="Enter OTP" inputMode="numeric" maxLength={6} placeholder="6-digit code"
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
              {otp.length === 6 && !verified && <p className="text-[12px] text-avail-red">Incorrect OTP.</p>}
              <button onClick={sendOtp} className="text-[12px] text-brand hover:underline">Resend OTP</button>
            </div>
          )}
        </div>
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <Button variant="secondary" onClick={() => nav('/prebook/passengers')}>Back</Button>
        <Button disabled={!(validAadhaar && verified)} onClick={proceed}>Continue</Button>
      </div>
    </div>
  );
}
