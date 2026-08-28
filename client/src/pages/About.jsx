import { useEffect, useState } from 'react';
import { getAbout } from '../api/client.js';
import Card from '../components/ui/Card.jsx';

export default function About() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { getAbout().then(setD).catch((e) => setErr(e.message)); }, []);

  if (err) return <p className="text-avail-red">Couldn't load: {err}</p>;
  if (!d) return <p className="text-muted">Loading…</p>;

  return (
    <div className="space-y-4">
      <Card title={d.project} bodyClass="p-4">
        <p className="text-[13px] text-muted">{d.tagline}</p>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="✓ Real" bodyClass="p-4">
          <ul className="space-y-1.5 text-[13px]">
            {d.real.map((x) => <li key={x} className="flex gap-2"><span className="text-avail-green">✓</span>{x}</li>)}
          </ul>
        </Card>
        <Card title="Mocked" bodyClass="p-4">
          <ul className="space-y-1.5 text-[13px]">
            {d.mocked.map((x) => <li key={x} className="flex gap-2"><span className="text-demo">◦</span>{x}</li>)}
          </ul>
        </Card>
      </div>
      <div className="rounded-[3px] border border-line bg-white px-4 py-3 text-[12px] text-muted">
        {d.disclaimers.map((x) => <p key={x}>{x}</p>)}
      </div>
    </div>
  );
}
