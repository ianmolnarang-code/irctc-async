// Inline "mocked" label.
export default function MockTag({ children = 'Mocked' }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-[2px] bg-demo/15 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-demo-dark">
      {children}
    </span>
  );
}
