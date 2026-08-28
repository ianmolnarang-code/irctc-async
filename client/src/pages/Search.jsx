import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailability } from '../api/client.js';
import { useBooking } from '../store/BookingContext.jsx';
import { CLASS_LABEL, inr, FARE } from '../constants.js';
import Button from '../components/ui/Button.jsx';
import SeatCounter from '../components/SeatCounter.jsx';

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// Availability label + color, IRCTC-style.
function avail(c) {
  if (c.seatsLeft > 0) return { text: `AVAILABLE-${String(c.seatsLeft).padStart(4, '0')}`, tone: 'text-avail-green', node: c.seatsLeft };
  if (c.racLeft > 0) return { text: `RAC ${c.racLeft}`, tone: 'text-avail-amber', node: null };
  return { text: 'WL / REGRET', tone: 'text-avail-red', node: null };
}

export default function Search() {
  const nav = useNavigate();
  const { patch } = useBooking();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [journeyDate, setJourneyDate] = useState(tomorrow());
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [quota, setQuota] = useState('TATKAL');
  const [clsFilter, setClsFilter] = useState('ALL');
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState(null); // `${trainId}:${class}`

  useEffect(() => {
    getAvailability()
      .then((d) => {
        const a = d.availability || [];
        setRows(a);
        if (a[0]) { setFrom(a[0].from); setTo(a[0].to); }
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Auto-refresh live availability every 5s once results are shown, so seat
  // counts tick down in real time without re-searching.
  useEffect(() => {
    if (!searched) return;
    const t = setInterval(() => {
      getAvailability().then((d) => setRows(d.availability || [])).catch(() => {});
    }, 5000);
    return () => clearInterval(t);
  }, [searched]);

  const stations = useMemo(() => [...new Set(rows.flatMap((r) => [r.from, r.to]))], [rows]);

  const trains = useMemo(() => {
    const m = new Map();
    for (const r of rows) {
      if (!m.has(r.trainId)) m.set(r.trainId, { ...r, classes: [] });
      m.get(r.trainId).classes.push(r);
    }
    return [...m.values()];
  }, [rows]);

  const results = useMemo(
    () => trains.filter((t) => (!from || t.from === from) && (!to || t.to === to)),
    [trains, from, to]
  );

  const pick = rows.find((r) => `${r.trainId}:${r.class}` === selected);

  function findTrains() {
    setSearched(true);
    setSelected(null);
  }

  function proceed() {
    if (!pick) return;
    patch({
      train: {
        trainId: pick.trainId, trainName: pick.trainName, from: pick.from, to: pick.to,
        class: pick.class, seatsLeft: pick.seatsLeft, racLeft: pick.racLeft,
        tatkalOpenAt: pick.tatkalOpenAt,
      },
      journeyDate,
    });
    nav('/prebook/passengers');
  }

  return (
    <div className="space-y-4">
      {/* Hero: Vande Bharat background with the booking widget floating on the left */}
      <section className="relative overflow-hidden rounded-[6px] shadow-sm">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/train-hero.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />
        <div className="relative grid items-center gap-6 p-3 sm:p-6 lg:min-h-[420px] lg:grid-cols-[minmax(0,500px)_1fr]">
          {/* Booking widget */}
          <div className="rounded-[4px] border border-line bg-white shadow-lg">
            <div className="rounded-t-[4px] bg-brand px-4 py-2 text-[13px] font-bold uppercase tracking-wide text-white">
              Book Your Ticket
            </div>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-x-3 gap-y-5 sm:grid-cols-12 sm:items-center">
            <div className="irctc-field sm:col-span-4">
              <label>From</label>
              <select value={from} onChange={(e) => setFrom(e.target.value)}>
                {stations.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="hidden justify-center sm:col-span-1 sm:flex">
              <button
                onClick={() => { setFrom(to); setTo(from); }}
                title="Swap"
                className="focus-ring grid h-8 w-8 place-items-center rounded-full border border-line text-brand hover:bg-brand-light"
              >⇄</button>
            </div>
            <div className="irctc-field sm:col-span-4">
              <label>To</label>
              <select value={to} onChange={(e) => setTo(e.target.value)}>
                {stations.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="irctc-field sm:col-span-3">
              <label>Journey Date</label>
              <input type="date" value={journeyDate} min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setJourneyDate(e.target.value)} />
            </div>

            <div className="irctc-field sm:col-span-4">
              <label>Class</label>
              <select value={clsFilter} onChange={(e) => setClsFilter(e.target.value)}>
                <option value="ALL">All Classes</option>
                {Object.keys(CLASS_LABEL).map((c) => <option key={c} value={c}>{CLASS_LABEL[c]}</option>)}
              </select>
            </div>
            <div className="irctc-field sm:col-span-4">
              <label>Quota</label>
              <select value={quota} onChange={(e) => setQuota(e.target.value)}>
                <option>GENERAL</option>
                <option>TATKAL</option>
                <option>PREMIUM TATKAL</option>
                <option>LADIES</option>
              </select>
            </div>
            <div className="sm:col-span-4">
              <Button variant="cta" onClick={findTrains} className="w-full py-2.5">Find Trains</Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-[12px] text-muted">
            {['Person With Disability', 'Flexible With Date', 'Train with Availability'].map((c) => (
              <label key={c} className="flex items-center gap-1.5">
                <input type="checkbox" className="accent-brand" /> {c}
              </label>
            ))}
          </div>
        </div>
          </div>
          {/* Right-side hero headline (like the real IRCTC hero) */}
          <div className="hidden text-center text-white lg:block lg:pr-6">
            <div className="text-5xl font-extrabold tracking-tight drop-shadow-lg xl:text-6xl">INDIAN RAILWAYS</div>
            <div className="mt-2 text-[17px] font-medium tracking-wide text-white/90 drop-shadow xl:text-xl">
              Safety <span className="opacity-50">|</span> Security <span className="opacity-50">|</span> Punctuality
            </div>
          </div>
        </div>
      </section>

      {loading && <p className="text-muted">Loading live availability…</p>}
      {err && <p className="rounded-[3px] bg-red-50 px-3 py-2 text-avail-red">Couldn't reach the API: {err}</p>}

      {/* Results */}
      {searched && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 text-[12px] text-muted">
            <span><strong className="text-ink">{from}</strong> → <strong className="text-ink">{to}</strong> · {journeyDate} · {quota} quota</span>
            <span>{results.length} train{results.length !== 1 ? 's' : ''} found</span>
          </div>

          {results.map((t) => {
            const classes = clsFilter === 'ALL' ? t.classes : t.classes.filter((c) => c.class === clsFilter);
            return (
              <div key={t.trainId} className="rounded-[4px] border border-line bg-white shadow-sm animate-fade-up">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
                  <div className="text-[14px] font-bold text-brand-dark">
                    {t.trainName} <span className="font-normal text-muted">(#{t.trainId})</span>
                  </div>
                  <div className="text-[11px] text-muted">Runs: M T W T F S S</div>
                </div>
                <div className="flex flex-wrap items-center gap-6 px-4 py-3 text-[13px]">
                  <div className="text-center"><div className="text-[16px] font-bold">10:00</div><div className="text-[11px] text-muted">{t.from}</div></div>
                  <div className="text-center text-muted"><div className="text-[11px]">15h 35m</div><div className="text-[10px]">———→</div></div>
                  <div className="text-center"><div className="text-[16px] font-bold">01:35</div><div className="text-[11px] text-muted">{t.to}</div></div>
                </div>

                <div className="flex flex-wrap gap-2 px-4 pb-4">
                  {classes.map((c) => {
                    const id = `${c.trainId}:${c.class}`;
                    const a = avail(c);
                    const active = id === selected;
                    return (
                      <button
                        key={id}
                        onClick={() => setSelected(id)}
                        className={`focus-ring w-[132px] rounded-[3px] border text-left transition-colors
                          ${active ? 'border-brand ring-1 ring-brand' : 'border-line hover:border-brand'}`}
                      >
                        <div className={`rounded-t-[2px] px-2 py-1 text-[12px] font-bold ${active ? 'bg-brand text-white' : 'bg-page text-ink'}`}>
                          {c.class}
                        </div>
                        <div className="px-2 py-2">
                          <div className={`text-[12px] font-bold ${a.tone}`}>{a.text}</div>
                          <div className="mt-0.5 text-[11px] text-muted">{inr(FARE[c.class] ?? 0)}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {pick && pick.trainId === t.trainId && (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-brand-light px-4 py-2.5 animate-fade-in">
                    <span className="text-[12.5px] text-brand-dark">
                      {CLASS_LABEL[pick.class]} · {inr(FARE[pick.class] ?? 0)} · seats <SeatCounter value={pick.seatsLeft} compact /> · RAC {pick.racLeft}
                    </span>
                    <Button variant="cta" onClick={proceed}>Book Now</Button>
                  </div>
                )}
              </div>
            );
          })}
          {results.length === 0 && <p className="rounded-[3px] bg-white px-4 py-6 text-center text-muted">No trains on this route.</p>}
        </div>
      )}

      {!searched && !loading && (
        <p className="rounded-[3px] border border-dashed border-line bg-white px-4 py-6 text-center text-[13px] text-muted">
          Enter your journey and tap <strong className="text-accent-dark">Find Trains</strong>. Tatkal quota is pre-selected.
        </p>
      )}
    </div>
  );
}
