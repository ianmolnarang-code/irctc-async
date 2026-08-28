// Floating-label field matching the IRCTC booking widget (PrimeNG float label).
export default function Field({ label, hint, as = 'input', children, className = '', ...props }) {
  return (
    <div className={className}>
      <div className="irctc-field">
        {label && <label>{label}</label>}
        {as === 'select' ? <select {...props}>{children}</select> : <input {...props} />}
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}
