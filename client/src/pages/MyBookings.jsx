import { useEffect, useState } from 'react';
import { getBookings } from '../api/client.js';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import QueueBadge from '../components/QueueBadge.jsx';
import { CLASS_LABEL } from '../constants.js';

export default function MyBookings() {
  const [rows, setRows] = useState([]);
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  function load(m) {
    setLoading(true); setErr(null);
    getBookings(m).then((d) => setRows(d.bookings || [])).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

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
          <table className="w-full min-w-[420px] text-[13px]">
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
                  <td className="px-3 py-2 text-right"><QueueBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
