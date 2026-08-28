// Rectangular IRCTC-style buttons. Variants: primary (indigo), cta (blue),
// secondary (outline), danger.
const VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  cta: 'bg-accent text-white hover:bg-accent-dark font-bold uppercase tracking-wide',
  secondary: 'bg-white text-brand-dark border border-brand hover:bg-brand-light',
  danger: 'bg-white text-avail-red border border-avail-red hover:bg-red-50',
};

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-[3px] px-5 py-2 text-[13.5px] font-medium
        transition-colors duration-150 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none
        ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
