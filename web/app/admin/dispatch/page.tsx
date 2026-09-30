'use client';
import { useCallback, useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useAdminNavItems } from '@/lib/admin-nav';
import api from '@/lib/api';
import { useTranslation } from 'react-i18next';

type Mission = {
  id: string;
  missionNumber: string;
  growerId: string;
  orderId?: string;
  pickupAddress: string;
  status: string;
  batchId?: string | null;
  lotBatchId?: string | null;
  lotProductName?: string | null;
  lotEstateId?: string | null;
  qualityStatus?: string | null;
  qualityOk?: boolean;
  linkable?: boolean;
  batches?: { batchId: string; productName: string; estateId?: string };
};
type Order = {
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  unit: string;
  catalogProductId?: string | null;
  fulfillingEstateId?: string | null;
  estates?: { ownerId: string; name: string };
  fulfilling_estate?: { id?: string; ownerId: string; name: string };
};

function DispatchContent() {
  const { t } = useTranslation();
  const nav = useAdminNavItems();
  const [data, setData] = useState<{ missions: Mission[]; orders: Order[]; pendingDocuments?: Array<{ id: string; missionId: string; orderId: string; deliveryNumber: string }> }>({ missions: [], orders: [] });
  const [missionId, setMissionId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [targetOrderId, setTargetOrderId] = useState('');
  useEffect(() => { setTargetOrderId(new URLSearchParams(window.location.search).get('orderId') || ''); }, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try { setData((await api.get('/deliveries/admin/link-options')).data); }
    catch { setError(t('dispatchFlow.error')); }
    finally { setBusy(false); }
  }, [t]);
  useEffect(() => { void load(); }, [load]);
  const targetOrder = data.orders.find(order => order.id === targetOrderId);

  const missionMatchesOrder = (mission: Mission, order: Order) => {
    const farmId = order.fulfillingEstateId ?? order.fulfilling_estate?.id;
    const growerOk = mission.growerId === (order.fulfilling_estate || order.estates)?.ownerId;
    if (!growerOk) return false;
    if (order.catalogProductId && farmId && mission.lotEstateId && mission.lotEstateId !== farmId) return false;
    return mission.linkable !== false && mission.qualityOk !== false && !!mission.batchId;
  };

  const availableMissions = !targetOrderId
    ? data.missions.filter((m) => m.linkable !== false)
    : data.missions.filter((mission) => targetOrder && missionMatchesOrder(mission, targetOrder) && (!mission.orderId || mission.orderId === targetOrderId));

  const mission = availableMissions.find((m) => m.id === missionId);
  const orders = data.orders.filter((o) => (!targetOrderId || o.id === targetOrderId) && mission && (o.fulfilling_estate || o.estates)?.ownerId === mission.growerId && (!mission.orderId || mission.orderId === o.id));
  const order = orders.find((o) => o.id === orderId);

  const link = async () => {
    if (busy || !mission || !order) return;
    setBusy(true); setError(''); setSaved('');
    try {
      const { data: result } = await api.post('/deliveries/admin/link-mission', { missionId, orderId });
      setSaved(result.deliveryNumber); setTargetOrderId(''); setMissionId(''); setOrderId(''); await load();
    } catch (e) {
      const message = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(typeof message === 'string' ? message : t('dispatchFlow.error'));
    } finally { setBusy(false); }
  };
  const retryDocuments = async (mid: string, oid: string) => {
    setBusy(true); setError('');
    try {
      const { data: result } = await api.post('/deliveries/admin/link-mission', { missionId: mid, orderId: oid });
      await load();
      if (!result.documentsReady) setError(t('dispatchFlow.documentsPending'));
    } catch { setError(t('dispatchFlow.error')); }
    finally { setBusy(false); }
  };

  const noMissionHint = targetOrder?.catalogProductId && availableMissions.length === 0 && !busy
    ? t('dispatchFlow.noQualityMission', {
        defaultValue: 'No mission with a quality-checked lot from {{farm}} — ask the grower to create the lot and request transport.',
        farm: targetOrder.fulfilling_estate?.name ?? targetOrder.estates?.name ?? 'the fulfilling farm',
      })
    : null;

  return <SidebarLayout title={t('dispatchFlow.title')} navItems={nav}><main className="mx-auto max-w-3xl space-y-5 p-6">
    <h1 className="text-2xl font-semibold">{t('dispatchFlow.title')}</h1><p>{t('dispatchFlow.hint')}</p>
    {targetOrderId && <section className="rounded border bg-green-50 p-4 space-y-2">
      <p>{targetOrder ? t('orderOperations.dispatchContext', { number: targetOrder.orderNumber, product: targetOrder.productName, quantity: targetOrder.quantity, unit: targetOrder.unit }) : busy ? t('adminPages.orderManagement.loading') : t('orderOperations.dispatchUnavailable')}</p>
      {noMissionHint && <p className="text-sm text-amber-900">{noMissionHint}</p>}
      {targetOrder && !availableMissions.length && !busy && !noMissionHint && <p>{t('orderOperations.noMission')}</p>}
      <a href="/admin/orders" className="mr-4 underline">{t('orderOperations.backOrders')}</a>
      <button type="button" disabled={busy} className="underline" onClick={() => { setTargetOrderId(''); setMissionId(''); setOrderId(''); }}>{t('orderOperations.allDispatch')}</button>
    </section>}
    <button className="rounded border px-4 py-2" disabled={busy} onClick={() => void load()}>{t('deliveryReview.refresh')}</button>
    <label className="block">{t('dispatchFlow.mission')}<select className="block w-full rounded border p-3" disabled={busy} value={missionId} onChange={(e) => { setMissionId(e.target.value); setOrderId(targetOrderId); setSaved(''); }}>
      <option value="">{t('dispatchFlow.choose')}</option>{availableMissions.map((m) => (
        <option key={m.id} value={m.id} disabled={!m.linkable}>
          {m.missionNumber} · {m.lotProductName || m.batches?.productName || '—'} · lot {m.lotBatchId || m.batchId || '—'} · {m.qualityOk ? '✓ quality' : `✗ ${m.qualityStatus || 'no quality'}`} · {m.status}
        </option>
      ))}
    </select></label>
    <label className="block">{t('dispatchFlow.order')}<select className="block w-full rounded border p-3" disabled={busy || !mission} value={orderId} onChange={(e) => setOrderId(e.target.value)}>
      <option value="">{t('dispatchFlow.choose')}</option>{orders.map((o) => <option key={o.id} value={o.id}>{o.orderNumber} · {o.productName} · {o.quantity} {o.unit}</option>)}
    </select></label>
    {mission && order ? <p>{mission.missionNumber} → {order.orderNumber} · {order.productName} · {order.quantity} {order.unit}</p> : null}
    <button className="rounded bg-green-700 px-4 py-3 text-white disabled:opacity-50" disabled={busy || !mission || !order || !mission.linkable} onClick={() => void link()}>{t('dispatchFlow.link')}</button>
    {error ? <p role="alert" className="text-red-700">{error}</p> : null}
    {saved ? <p role="status">{t('dispatchFlow.saved')} {saved}</p> : null}
    {data.pendingDocuments?.length ? <section className="space-y-3"><h2 className="font-semibold">{t('dispatchFlow.documentsPending')}</h2>
      {data.pendingDocuments.map((d) => <div key={d.id} className="rounded border p-3"><p>{d.deliveryNumber}</p><button className="rounded border px-3 py-2" disabled={busy} onClick={() => void retryDocuments(d.missionId, d.orderId)}>{t('dispatchFlow.retryDocuments')}</button></div>)}
    </section> : null}
  </main></SidebarLayout>;
}
export default function DispatchPage() { return <AuthGuard requiredRoles={['ADMIN', 'SUPER_ADMIN']}><DispatchContent /></AuthGuard>; }
