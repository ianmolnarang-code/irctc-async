import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useBooking } from '../../store/BookingContext.jsx';
import StepBar from '../../components/StepBar.jsx';
import Card from '../../components/ui/Card.jsx';
import Field from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';
import Segmented from '../../components/ui/Segmented.jsx';
import { CLASS_LABEL } from '../../constants.js';

const MAX = 4;
const blank = () => ({ name: '', age: '', gender: 'M', berthPref: 'ANY' });

export default function Passengers() {
  const nav = useNavigate();
  const { draft, patch } = useBooking();
  const [list, setList] = useState(draft.passengers.length ? draft.passengers : [blank()]);

  if (!draft.train) return <Navigate to="/" replace />;

  const update = (i, k, v) => setList((l) => l.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)));
  const add = () => list.length < MAX && setList((l) => [...l, blank()]);
  const remove = (i) => setList((l) => l.filter((_, idx) => idx !== i));
  const valid = list.every((p) => p.name.trim() && Number(p.age) > 0 && Number(p.age) <= 120);

  function proceed() {
    patch({ passengers: list.map((p) => ({ ...p, age: Number(p.age) })) });
    nav('/prebook/aadhaar');
  }

  return (
    <div>
      <StepBar current={1} />
      <Card title={`Passenger Details — ${draft.train.trainName} · ${CLASS_LABEL[draft.train.class]}`} bodyClass="p-4 space-y-3">
        <p className="text-[12px] text-muted">Add up to {MAX} passengers (Tatkal limit).</p>
        {list.map((p, i) => (
          <div key={i} className="rounded-[3px] border border-line p-3 animate-fade-up">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-bold text-brand-dark">Passenger {i + 1}</span>
              {list.length > 1 && (
                <button onClick={() => remove(i)} className="text-[12px] text-avail-red hover:underline">Remove</button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
              <Field label="Name" placeholder="Full name" value={p.name} onChange={(e) => update(i, 'name', e.target.value)} />
              <Field label="Age" type="number" min="1" max="120" placeholder="30" value={p.age} onChange={(e) => update(i, 'age', e.target.value)} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div>
                <div className="mb-1 text-[11px] font-medium text-muted">Gender</div>
                <Segmented options={[{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }, { value: 'O', label: 'Other' }]}
                  value={p.gender} onChange={(v) => update(i, 'gender', v)} />
              </div>
              <div>
                <div className="mb-1 text-[11px] font-medium text-muted">Berth Preference</div>
                <Segmented options={[{ value: 'ANY', label: 'Any' }, { value: 'LB', label: 'Lower' }, { value: 'MB', label: 'Middle' }, { value: 'UB', label: 'Upper' }]}
                  value={p.berthPref} onChange={(v) => update(i, 'berthPref', v)} />
              </div>
            </div>
          </div>
        ))}
        {list.length < MAX && <Button variant="secondary" onClick={add}>+ Add Passenger</Button>}
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <Button variant="secondary" onClick={() => nav('/')}>Back</Button>
        <Button disabled={!valid} onClick={proceed}>Continue</Button>
      </div>
    </div>
  );
}
