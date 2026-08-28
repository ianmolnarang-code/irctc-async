import axios from 'axios';

// All endpoints are under /api. Same-origin in dev thanks to the Vite proxy;
// override the origin with VITE_API_BASE in prod.
export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE || '') + '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Thin wrappers around the API. Producer side only — the worker drives the rest.
export const createIntent = (body) => api.post('/intent', body).then((r) => r.data);
export const book = (intentId) => api.post('/book', { intentId }).then((r) => r.data);
export const cancel = (intentId) => api.post('/cancel', { intentId }).then((r) => r.data);
export const getAvailability = (trainId) =>
  api.get('/availability', { params: trainId ? { trainId } : {} }).then((r) => r.data);
export const getAbout = () => api.get('/about').then((r) => r.data);
export const getPnr = (pnr) => api.get(`/pnr/${encodeURIComponent(pnr)}`).then((r) => r.data);
export const getBookings = (mobile) =>
  api.get('/intents', { params: mobile ? { mobile } : {} }).then((r) => r.data);
