// IRCTC-style emblem (recreated as an SVG) + wordmark. Used in the header to
// mirror the real portal. This is a demo replica — see the footer / About for
// the "not affiliated with IRCTC" disclosure.
export default function LogoIRCTC({ className = '' }) {
  const navy = '#16216e';
  const grey = '#b9bcd0';
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 120 120" className="h-8 w-8" aria-hidden>
        <g fill="none" strokeWidth="9" strokeLinecap="round">
          <ellipse cx="60" cy="60" rx="47" ry="20" stroke={grey} transform="rotate(120 60 60)" />
          <ellipse cx="60" cy="60" rx="47" ry="20" stroke={navy} transform="rotate(0 60 60)" />
          <ellipse cx="60" cy="60" rx="47" ry="20" stroke={navy} transform="rotate(60 60 60)" />
        </g>
        <rect x="42" y="42" width="36" height="36" rx="4" fill={navy} />
        <text x="60" y="71" textAnchor="middle" fontSize="26" fontWeight="800" fill="#fff"
          fontFamily="Arial, sans-serif">R</text>
      </svg>
      <span className="text-[22px] font-extrabold tracking-tight" style={{ color: navy }}>IRCTC</span>
    </span>
  );
}
