import { createContext, useContext, useEffect, useState } from 'react';

// Holds the in-progress booking draft across wizard pages. Persisted to
// sessionStorage so a refresh mid-flow doesn't lose the user's work.
const BookingContext = createContext(null);
const KEY = 'tatkal.booking';

const EMPTY = {
  train: null, // { trainId, trainName, from, to, class, seatsLeft, racLeft }
  journeyDate: '',
  passengers: [],
  contact: { userMobile: '', userEmail: '' },
  upiVpa: '',
  intentId: null,
  mandate: null, // { amount }
};

function load() {
  try {
    return { ...EMPTY, ...JSON.parse(sessionStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...EMPTY };
  }
}

export function BookingProvider({ children }) {
  const [draft, setDraft] = useState(load);

  useEffect(() => {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  }, [draft]);

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  const reset = () => {
    sessionStorage.removeItem(KEY);
    setDraft({ ...EMPTY });
  };

  return (
    <BookingContext.Provider value={{ draft, patch, reset }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
}
