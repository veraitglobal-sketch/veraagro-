'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fieldEntriesAPI, harvestAnnouncementsAPI } from '@/lib/api';
import { parseWeatherObservation } from '@biovera/shared/passport/weather-observation';

type Planting = { id: string; parcelId: string; cropType: string; announcementType: string; status: string };
export default function WeatherObservationForm({ farmId, parcelId, onSaved }: { farmId: string; parcelId: string; onSaved: () => Promise<void> }) {
  const { t } = useTranslation();
  const label = (key: string) => t(`glossary.productionHistory.${key}`);
  const [plans, setPlans] = useState<Planting[]>([]);
  const [plantingId, setPlantingId] = useState('');
  const [form, setForm] = useState({ from: '', until: '', minimumC: '', maximumC: '', frost: 'unknown', notes: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const clientRef = useRef<string | null>(null);
  useEffect(() => {
    let active = true;
    harvestAnnouncementsAPI.getMine().then((rows: Planting[]) => {
      if (active) setPlans(rows.filter(p => p.parcelId === parcelId && p.announcementType === 'PLANTING' && !['CANCELLED', 'REJECTED'].includes(p.status)));
    }).catch(() => { if (active) setMessage(label('saveError')); });
    return () => { active = false; };
  }, [parcelId, t]);
  const save = async () => {
    if (busy || !plantingId) return;
    setBusy(true); setMessage('');
    try {
      if (!form.minimumC.trim() || !form.maximumC.trim()) throw Error('Missing temperature');
      const weather = parseWeatherObservation({ ...form, until: form.until || form.from,
        minimumC: Number(form.minimumC.replace(',', '.')), maximumC: Number(form.maximumC.replace(',', '.')),
        frostObserved: form.frost === 'unknown' ? null : form.frost === 'yes' });
      clientRef.current ??= crypto.randomUUID();
      await fieldEntriesAPI.create({ type: 'WEATHER', farmId, clientReference: clientRef.current,
        data: { parcelId, plantingId, date: weather.from, weather, notes: form.notes } });
      clientRef.current = null; setMessage(label('saved')); await onSaved();
    } catch { setMessage(label('saveError')); }
    finally { setBusy(false); }
  };
  return <details className="rounded-xl border p-4 bg-white">
    <summary className="font-medium cursor-pointer">{label('addWeather')}</summary>
    <p className="text-sm text-gray-500 my-3">{label('weatherHelp')}</p>
    <div className="grid sm:grid-cols-2 gap-3">
      <label>{label('planting')}<select className="block w-full border rounded p-2" value={plantingId} onChange={e => setPlantingId(e.target.value)}><option value="">{label('choosePlanting')}</option>{plans.map(p => <option key={p.id} value={p.id}>{p.cropType} · {p.id.slice(0, 8)}</option>)}</select></label>
      {(['from', 'until', 'minimumC', 'maximumC', 'notes'] as const).map(key => <label key={key}>{label(key)}<input className="block w-full border rounded p-2" type={key === 'from' || key === 'until' ? 'datetime-local' : 'text'} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></label>)}
      <label>{label('frost')}<select className="block w-full border rounded p-2" value={form.frost} onChange={e => setForm({ ...form, frost: e.target.value })}>{['unknown', 'yes', 'no'].map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label>
    </div>
    <button disabled={busy || !plantingId} onClick={() => void save()} className="mt-4 rounded bg-[#2D5A27] text-white px-4 py-2 disabled:opacity-50">{t('common.save')}</button>
    {message ? <p role="status" className="mt-2 text-sm">{message}</p> : null}
  </details>;
}
