import { useEffect, useState } from 'react';
import { getBookings, book } from '../api/client.js';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import QueueBadge from '../components/QueueBadge.jsx';
import { CLASS_LABEL } from '../constants.js';

export default function MyBookings() {
  const [rows, setRows] = useState([]);
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [bookingId, setBookingId] = useState(null); // row currently booking
  const [flash, setFlash] = useState(null); // { intentId, text }

  function load(m) {
    setLoading(true); setErr(null);
    getBookings(m).then((d) => setRows(d.bookings || [])).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  // The 10 AM moment: one tap books a prepared (PREBOOKED) intent.
  async function bookNow(intentId) {
    setBookingId(intentId); setErr(null); setFlash(null);
    try {
      const outcome = await book(intentId);
      setFlash({ intentId, text: outcome.pnr ? `${outcome.status} · ${outcome.pnr}` : outcome.status });
      load(mobile || undefined);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBookingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card title="My Bookings" bodyClass="p-4">
        <div className="flex items-end gap-3">
          <div className="irctc-field flex-1">
            <label>Filter by mobile (optional)</label>
            <input inputMode="numeric" maxLength={10} placeholder="10-digit number — leave blank for all"
              value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} />
          </div>
          <Button onClick={() => load(mobile || undefined)}>Refresh</Button>
        </div>
        <p className="mt-2 text-[12px] text-muted">
          Prepared bookings show a <strong className="text-accent-dark">Book Now</strong> — at 10 AM it's a single tap, no forms.
        </p>
      </Card>

      {loading && <p className="text-muted">Loading…</p>}
      {err && <p className="text-avail-red">{err}</p>}

      {!loading && rows.length === 0 && (
        <p className="rounded-[3px] border border-dashed border-line bg-white px-4 py-6 text-center text-muted">
          No bookings yet. Book a ticket and it will appear here.
        </p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-[4px] border border-line bg-white shadow-sm">
          <table className="w-full min-w-[480px] text-[13px]">
            <thead>
              <tr className="bg-page text-[11px] uppercase text-muted">
                <th className="px-3 py-2 text-left font-medium">Train</th>
                <th className="px-3 py-2 text-left font-medium">Class / Date</th>
                <th className="px-3 py-2 text-left font-medium">PNR</th>
                <th className="px-3 py-2 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((b) => (
                <tr key={b.intentId} className="hover:bg-brand-light/40">
                  <td className="px-3 py-2">
                    <div className="font-medium">{b.trainName || b.trainId}</div>
                    <div className="text-[11px] text-muted">{b.from} → {b.to} · {b.passengers} pax</div>
                  </td>
                  <td className="px-3 py-2 text-muted">{CLASS_LABEL[b.class] || b.class}<br />{b.journeyDate}</td>
                  <td className="px-3 py-2 tabular text-[12px]">{b.pnr || '—'}</td>
                  <td className="px-3 py-2 text-right">
                    {b.status === 'PREBOOKED' ? (
                      <Button variant="cta" className="px-3 py-1 text-[12px]" disabled={bookingId === b.intentId}
                        onClick={() => bookNow(b.intentId)}>
                        {bookingId === b.intentId ? 'Booking…' : 'Book Now'}
                      </Button>
                    ) : (
                      <div className="inline-flex flex-col items-end gap-0.5">
                        <QueueBadge status={b.status} />
                        {flash?.intentId === b.intentId && (
                          <span className="text-[10.5px] text-avail-green">just now: {flash.text}</span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
