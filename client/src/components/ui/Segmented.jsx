// Boxy radio-group selector, teal active state.
export default function Segmented({ options, value, onChange, className = '' }) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <div className={`inline-flex overflow-hidden rounded-[3px] border border-line ${className}`}>
      {opts.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`focus-ring px-3 py-1.5 text-[13px] transition-colors ${i > 0 ? 'border-l border-line' : ''}
              ${active ? 'bg-brand text-white font-medium' : 'bg-white text-ink hover:bg-brand-light'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
