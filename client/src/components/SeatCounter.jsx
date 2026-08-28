import { useEffect, useRef, useState } from 'react';

// Live seat count. Pulses when the value changes (worker pushed an update).
export default function SeatCounter({ label = 'Seats', value, compact = false }) {
  const [pulse, setPulse] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current != null && value != null && value !== prev.current) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 400);
      prev.current = value;
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value]);

  if (compact) {
    return <span className={`tabular font-bold ${pulse ? 'text-accent' : 'text-brand-dark'}`}>{value ?? '—'}</span>;
  }
  return (
    <div className="rounded-[3px] border border-line bg-white px-4 py-3 text-center">
      <div className="text-[10.5px] font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className={`tabular text-3xl font-bold transition-colors ${pulse ? 'text-accent' : 'text-brand-dark'}`}>
        {value ?? '—'}
      </div>
    </div>
  );
}
