import { useState } from 'react';
import { getPnr } from '../api/client.js';
import Card from '../components/ui/Card.jsx';
import Field from '../components/ui/Field.jsx';
import Button from '../components/ui/Button.jsx';
import QueueBadge from '../components/QueueBadge.jsx';
import { CLASS_LABEL, BERTH_LABEL } from '../constants.js';

export default function PnrEnquiry() {
  const [pnr, setPnr] = useState('');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function check() {
    setBusy(true); setErr(null); setResult(null);
    try {
      setResult(await getPnr(pnr.trim()));
    } catch (e) {
      setErr(e.response?.status === 404 ? 'PNR not found. Book a ticket first, then look it up here.' : (e.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card title="PNR Enquiry" bodyClass="p-4">
        <div className="flex items-end gap-3">
          <Field className="flex-1" label="PNR Number" placeholder="e.g. PNR1120328042"
            value={pnr} onChange={(e) => setPnr(e.target.value.toUpperCase())} />
          <Button disabled={!pnr.trim() || busy} onClick={check}>{busy ? 'Checking…' : 'Get Status'}</Button>
        </div>
        {err && <p className="mt-3 text-[12.5px] text-avail-red">{err}</p>}
      </Card>

      {result && (
        <Card bodyClass="p-0" className="overflow-hidden animate-fade-up">
          <div className="flex items-center justify-between bg-brand px-4 py-2.5 text-white">
            <span className="tabular text-[15px] font-bold">{result.pnr}</span>
            <QueueBadge status={result.status} />
          </div>
          <div className="px-4 py-3">
            <div className="text-[14px] font-bold text-brand-dark">{result.trainName} <span className="font-normal text-muted">(#{result.trainId})</span></div>
            <div className="text-[12px] text-muted">{result.from} → {result.to} · {CLASS_LABEL[result.class] || result.class} · {result.journeyDate}</div>
          </div>
          {result.coach && (
            <div className="grid grid-cols-3 divide-x divide-line border-y border-line text-center">
              <Cell k="Coach" v={result.coach} />
              <Cell k="Berth" v={result.berthNo} />
              <Cell k="Type" v={BERTH_LABEL[result.berthType] || result.berthType} />
            </div>
          )}
          <table className="w-full text-[13px]">
            <thead><tr className="bg-page text-[11px] uppercase text-muted"><th className="px-4 py-1.5 text-left font-medium">Passenger</th><th className="px-4 py-1.5 text-right font-medium">Age / Gender</th></tr></thead>
            <tbody className="divide-y divide-line">
              {(result.passengers ?? []).map((p, i) => (
                <tr key={i}><td className="px-4 py-2 font-medium">{p.name}</td><td className="px-4 py-2 text-right text-muted">{p.age} · {p.gender}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function Cell({ k, v }) {
  return (
    <div className="px-3 py-2.5">
      <div className="text-[10.5px] uppercase tracking-wide text-muted">{k}</div>
      <div className="tabular text-[15px] font-bold text-ink">{v}</div>
    </div>
  );
}
