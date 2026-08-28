// Boxy white panel, PrimeNG/IRCTC style. Optional teal title header.
export default function Card({ title, className = '', children, bodyClass = 'p-4', ...props }) {
  return (
    <div className={`rounded-[4px] border border-line bg-white shadow-sm ${className}`} {...props}>
      {title && (
        <div className="rounded-t-[4px] bg-brand px-4 py-2 text-[13px] font-medium text-white">{title}</div>
      )}
      <div className={bodyClass}>{children}</div>
    </div>
  );
}
