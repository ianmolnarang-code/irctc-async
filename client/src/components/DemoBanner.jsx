import { Link } from 'react-router-dom';

// Thin, persistent disclosure — we're mimicking the IRCTC look, so this must
// stay unmistakable.
export default function DemoBanner() {
  return (
    <div className="bg-demo text-white text-[11.5px]">
      <div className="mx-auto flex max-w-[1000px] items-center justify-center gap-2 px-3 py-1 text-center">
        <strong>DEMO</strong>
        <span className="opacity-90">· IRCTC-style replica · not affiliated · no real Aadhaar / UPI / OTP</span>
        <Link to="/about" className="underline underline-offset-2">what's real</Link>
      </div>
    </div>
  );
}
