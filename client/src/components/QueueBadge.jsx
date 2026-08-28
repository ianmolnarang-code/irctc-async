// Status chip using IRCTC availability colors.
const STYLE = {
  PREBOOKED: 'bg-line text-ink',
  QUEUED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-brand-light text-brand-dark',
  CONFIRMED: 'bg-green-100 text-avail-green',
  RAC: 'bg-amber-100 text-avail-amber',
  WAITLIST: 'bg-red-100 text-avail-red',
  CANCELLED: 'bg-line text-muted',
  FAILED: 'bg-red-100 text-avail-red',
};

export default function QueueBadge({ status = 'PREBOOKED', position }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide ${STYLE[status] || STYLE.PREBOOKED}`}>
      {status === 'PROCESSING' && <span className="h-1.5 w-1.5 animate-ping rounded-full bg-brand" />}
      {status}
      {position != null && <span className="font-normal normal-case opacity-70">#{position}</span>}
    </span>
  );
}
