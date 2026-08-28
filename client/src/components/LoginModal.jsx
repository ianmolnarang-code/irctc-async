import { useState } from 'react';
import Button from './ui/Button.jsx';
import MockTag from './MockTag.jsx';

// IRCTC-style login window — demo only, fields are prefilled. No real auth:
// "LOGIN" just closes the window and marks a demo user as signed in.
export default function LoginModal({ open, onClose, onLogin }) {
  const [captcha, setCaptcha] = useState('A7K9P2');
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm overflow-hidden rounded-[6px] bg-white shadow-2xl animate-fade-up">
        {/* header */}
        <div className="flex items-center justify-between bg-brand px-4 py-2.5 text-white">
          <span className="text-[14px] font-bold uppercase tracking-wide">User Login</span>
          <button onClick={onClose} aria-label="Close" className="text-white/90 hover:text-white text-lg leading-none">×</button>
        </div>

        <div className="space-y-3.5 p-5">
          <div className="flex items-center gap-2">
            <MockTag>Demo login</MockTag>
            <span className="text-[12px] text-muted">Prefilled — no real account.</span>
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-brand-dark">User Name</label>
            <input defaultValue="demo_user" autoComplete="off"
              className="focus-ring w-full rounded-[3px] border border-line px-3 py-2 text-[14px] text-ink" />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-brand-dark">Password</label>
            <input type="password" defaultValue="demopass123" autoComplete="off"
              className="focus-ring w-full rounded-[3px] border border-line px-3 py-2 text-[14px] text-ink" />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-brand-dark">Enter Captcha</label>
            <div className="flex items-center gap-2">
              <input value={captcha} onChange={(e) => setCaptcha(e.target.value)} autoComplete="off"
                className="focus-ring w-full rounded-[3px] border border-line px-3 py-2 text-[14px] text-ink" />
              <div className="select-none rounded-[3px] border border-line bg-page px-3 py-2 text-[15px] font-bold italic tracking-[0.25em] text-slate-500 line-through decoration-slate-300">
                A7K9P2
              </div>
            </div>
          </div>

          <Button variant="cta" className="w-full py-2.5" onClick={() => onLogin('demo_user')}>Login</Button>

          <div className="flex items-center justify-between pt-0.5 text-[12px]">
            <button className="text-accent-dark hover:underline" onClick={(e) => e.preventDefault()}>Forgot Account Details?</button>
            <button className="text-accent-dark hover:underline" onClick={(e) => e.preventDefault()}>Register</button>
          </div>
        </div>
      </div>
    </div>
  );
}
