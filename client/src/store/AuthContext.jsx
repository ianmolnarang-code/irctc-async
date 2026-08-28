import { createContext, useContext, useRef, useState } from 'react';
import LoginModal from '../components/LoginModal.jsx';

// Lightweight demo auth. Holds the (mock) signed-in user and owns the login
// modal, so any page can require login before an action (e.g. Book Now).
const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const pending = useRef(null); // action to run after a successful login

  const login = (u) => {
    setUser(u);
    setOpen(false);
    const cb = pending.current;
    pending.current = null;
    if (cb) cb();
  };
  const logout = () => setUser(null);
  const openLogin = () => { pending.current = null; setOpen(true); };
  const close = () => { pending.current = null; setOpen(false); };
  // Run `cb` if logged in; otherwise open login and run it after signing in.
  const requireLogin = (cb) => {
    if (user) cb?.();
    else { pending.current = cb || null; setOpen(true); }
  };

  return (
    <AuthCtx.Provider value={{ user, login, logout, openLogin, requireLogin }}>
      {children}
      <LoginModal open={open} onClose={close} onLogin={login} />
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
