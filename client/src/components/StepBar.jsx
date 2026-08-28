// Compact wizard progress strip in IRCTC teal.
const STEPS = ['Train', 'Passengers', 'Identity', 'Payment'];

export default function StepBar({ current = 0 }) {
  return (
    <div className="mb-4 flex items-center gap-1 overflow-hidden rounded-[3px] border border-line bg-white text-[12px]">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div
            key={label}
            className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-2
              ${active ? 'bg-brand text-white' : done ? 'bg-brand-light text-brand-dark' : 'text-muted'}`}
          >
            <span className={`grid h-4 w-4 place-items-center rounded-full text-[10px] font-bold
              ${active ? 'bg-white text-brand' : done ? 'bg-brand text-white' : 'bg-line text-muted'}`}>
              {done ? '✓' : i + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
