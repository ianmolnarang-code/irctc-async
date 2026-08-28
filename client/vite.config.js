import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Client-only app (data lives in localStorage) — no dev proxy needed.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
