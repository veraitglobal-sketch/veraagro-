import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { buyerDeliveriesAPI, type BuyerDelivery } from '../../../lib/api/deliveries';
import { buyerDeliveryActions } from '../../../lib/buyer-delivery-state';
import { prepareHandoverPhotos } from '../../../lib/handover-evidence';
import { pickFromCamera } from '../../../lib/camera-picker';
import { apiErrorMessage } from '../../../lib/api-error';
import { EnterpriseButton } from '../../../design-system/EnterpriseButton';
import { useAppLocaleTag } from '../../../lib/date-locale';

const BEFORE_HANDOVER = new Set(['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']);

/** Receiving code the buyer shows to the driver on arrival (QR + typed fallback). */
function ReceivingCode({ deliveryId }: { deliveryId: string }) {
  const { t } = useTranslation();
  const [code, setCode] = useState<{ code: string; qrDataUrl: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const open = async () => {
    setBusy(true);
    try { setCode(await buyerDeliveriesAPI.receivingCode(deliveryId)); }
    catch (e) { Alert.alert(t('error'), apiErrorMessage(e, t('deliveryFlow.loadFailed'))); }
    finally { setBusy(false); }
  };
  return <View style={{ gap: 8, padding: 14, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(17,24,39,0.1)' }}>
    <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>{t('buyerReceiving.title')}</Text>
    <Text style={{ fontSize: 13, lineHeight: 18, color: '#4B5563' }}>{t('buyerReceiving.hint')}</Text>
    {code ? <View style={{ alignItems: 'center', gap: 6, paddingTop: 4 }}>
      <Image source={{ uri: code.qrDataUrl }} style={{ width: 200, height: 200 }} accessibilityLabel={code.code} />
      <Text style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8 }}>{t('buyerReceiving.manualCode')}</Text>
      <Text selectable style={{ fontSize: 20, fontWeight: '700', letterSpacing: 2, color: '#111827', fontVariant: ['tabular-nums'] }}>{code.code}</Text>
    </View> : <EnterpriseButton label={busy ? t('buyerReceiving.loading') : t('buyerReceiving.show')} onPress={() => void open()} disabled={busy} variant="secondary" />}
  </View>;
}

export function BuyerDeliveryPanel({ orderId, deliveryId, onChanged }: { orderId?: string; deliveryId?: string; onChanged?: () => void }) {
  const { t } = useTranslation();
  const locale = useAppLocaleTag();
  const router = useRouter();
  const [delivery, setDelivery] = useState<BuyerDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState(false);
  const [now, setNow] = useState(Date.now);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const lock = useRef(false);
  const generation = useRef(0);
  const renderedGeneration = generation.current;
  const load = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true); setError(null); setFresh(false);
    try {
      const result = await buyerDeliveriesAPI.get(orderId ? { orderId } : { deliveryId: deliveryId! });
      if (current === generation.current) { setDelivery(result); setFresh(true); setNow(Date.now()); }
    } catch (e) {
      if (current === generation.current) setError(apiErrorMessage(e, t('deliveryFlow.loadFailed')));
    } finally { if (current === generation.current) setLoading(false); }
  }, [orderId, deliveryId, t]);
  useFocusEffect(useCallback(() => { void load(); return () => { generation.current++; }; }, [load]));
  useEffect(() => {
    if (!delivery?.buyerPickupConfirmedAt && !delivery?.confirmedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [delivery?.buyerPickupConfirmedAt, delivery?.confirmedAt]);

  const confirm = async () => {
    if (!delivery || lock.current || !fresh || renderedGeneration !== generation.current || !buyerDeliveryActions(delivery).canConfirm) return;
    lock.current = true; setBusy(true);
    try { await buyerDeliveriesAPI.confirm(delivery.id); await load(); onChanged?.(); }
    catch (e) { setFresh(false); setError(apiErrorMessage(e, t('deliveryFlow.saveFailed'))); }
    finally { lock.current = false; setBusy(false); }
  };
  const report = async () => {
    if (!delivery || lock.current || !fresh || renderedGeneration !== generation.current) return;
    if (!buyerDeliveryActions(delivery).canReport) {
      setNow(Date.now()); Alert.alert(t('error'), t('deliveryFlow.expired')); return;
    }
    if (description.trim().length < 20 || photos.length === 0) {
      Alert.alert(t('error'), t('deliveryFlow.reportRequired')); return;
    }
    lock.current = true; setBusy(true);
    try {
      const data = await prepareHandoverPhotos(photos);
      await buyerDeliveriesAPI.report(delivery.id, description.trim(), data);
      setPhotos([]); setDescription(''); await load();
      Alert.alert(t('alerts.success'), t('deliveryFlow.reportSaved'));
    } catch (e) { setFresh(false); setError(apiErrorMessage(e, t('deliveryFlow.saveFailed'))); }
    finally { lock.current = false; setBusy(false); }
  };
  const camera = async () => {
    if (lock.current || photos.length >= 6) return;
    lock.current = true; setBusy(true);
    try {
      const image = await pickFromCamera({ t, allowsEditing: false, quality: 0.65 });
      if (image?.uri) setPhotos((prev) => [...prev, image.uri].slice(0, 6));
    } catch (e) { setError(apiErrorMessage(e, t('deliveryFlow.saveFailed'))); }
    finally { lock.current = false; setBusy(false); }
  };
  if (loading) return <ActivityIndicator />;
  const actions = delivery ? buyerDeliveryActions(delivery, now) : null;
  return <View style={{ gap: 12, marginVertical: 20 }}>
    <Text style={{ fontSize: 18 }}>{t('deliveryFlow.title')}</Text>
    {error ? <Text accessibilityRole="alert">{error}</Text> : null}
    {!fresh && delivery ? <Text>{t('buyerOrderActions.stale')}</Text> : null}
    <EnterpriseButton label={t('deliveryFlow.refresh')} onPress={() => void load()} disabled={busy} variant="secondary" />
    {!delivery ? <Text>{error ? '' : t('deliveryFlow.notAssigned')}</Text> : <>
      <Text>{delivery.deliveryNumber} · {t(`buyerDeliveryStatus.${delivery.status}`, { defaultValue: t('buyer.orders.statuses.UNKNOWN') })}</Text>
      {delivery.returnCase ? <View style={{ gap: 8 }}>
        <Text>{t('returnFlow.title')}: {t(`returnFlow.states.${delivery.returnCase.status}`)}</Text>
        {delivery.returnCase.status === 'RECEIVED' && delivery.returnCase.stockStatus ? <Text>{t('returnDisposition.title')}: {t(`returnDisposition.states.${delivery.returnCase.stockStatus}`)}</Text> : null}
        {delivery.returnCase.refund ? <Text>{t(`returnFlow.refundStates.${delivery.returnCase.refund.status}`)} · {(delivery.returnCase.refund.amountCents / 100).toFixed(2)} {delivery.returnCase.refund.currency}</Text> : null}
      </View> : null}
      {!delivery.digital_handovers && BEFORE_HANDOVER.has(String(delivery.status)) ? <ReceivingCode deliveryId={delivery.id} /> : null}
      {delivery.digital_handovers ? <EnterpriseButton
        disabled={busy}
        label={actions?.canCompleteHandover ? t('deliveryFlow.completeHandover') : t('deliveryFlow.viewEvidence')}
        onPress={() => router.push({ pathname: '/manager/handover-complete', params: { handoverId: delivery.digital_handovers!.id } })} /> : null}
      {actions?.canConfirm ? <>
        <Text>{t('deliveryFlow.confirmHint')}</Text>
        <EnterpriseButton label={t('deliveryFlow.confirm')} disabled={busy || !fresh} onPress={() => Alert.alert(t('deliveryFlow.confirm'), t('deliveryFlow.confirmHint'), [
          { text: t('common.cancel'), style: 'cancel' }, { text: t('deliveryFlow.confirm'), onPress: () => void confirm() },
        ])} />
      </> : null}
      {actions?.confirmed ? <Text>{t('deliveryFlow.receivedAt', { at: new Date(delivery.buyerPickupConfirmedAt || delivery.confirmedAt!).toLocaleString(locale) })}</Text> : null}
      {actions?.canReport ? <>
        <Text>{t('deliveryFlow.reportDeadline', { at: new Date(actions.deadline!).toLocaleString(locale) })}</Text>
        <TextInput accessibilityLabel={t('deliveryFlow.description')} placeholder={t('deliveryFlow.description')}
          value={description} onChangeText={setDescription} multiline maxLength={8000} editable={!busy}
          style={{ borderWidth: 1, borderColor: '#ccc', minHeight: 90, padding: 12 }} />
        {photos.map((uri, index) => <View key={uri + index}>
          <Image source={{ uri }} style={{ height: 140, width: '100%' }} resizeMode="contain" />
          <EnterpriseButton label={t('deliveryFlow.removePhoto')} disabled={busy} variant="secondary"
            onPress={() => setPhotos((prev) => prev.filter((_, i) => i !== index))} />
        </View>)}
        <EnterpriseButton label={t('deliveryFlow.addPhoto')} onPress={() => void camera()} disabled={busy || photos.length >= 6} />
        <EnterpriseButton label={t('deliveryFlow.report')} onPress={() => void report()} disabled={busy || !fresh} loading={busy} />
      </> : actions?.confirmed ? <Text>{t('deliveryFlow.expired')}</Text> : null}
      {delivery.buyer_delivery_issues?.map((issue) => <View key={issue.id} style={{ gap: 8 }}>
        <Text>{t('deliveryFlow.reportSaved')} · {new Date(issue.createdAt).toLocaleString(locale)}</Text>
        <Text selectable>{issue.id}</Text><Text>{issue.description}</Text>
        <Text>{t(`deliveryReview.states.${issue.status || 'PENDING'}`)}</Text>
        {issue.outcome ? <Text>{t(`deliveryReview.outcomes.${issue.outcome}`)}</Text> : null}
        {issue.resolution ? <Text>{issue.resolution}</Text> : null}
        {issue.resolvedAt ? <Text>{new Date(issue.resolvedAt).toLocaleString(locale)}</Text> : null}
        {issue.photoUrls.map((uri, index) => <Image key={index} source={{ uri }} style={{ height: 160, width: '100%' }} resizeMode="contain" />)}
      </View>)}
      {delivery.digital_handovers?.disputes?.map((dispute) => <View key={dispute.id} style={{ gap: 8 }}>
        <Text>{dispute.reason}</Text><Text>{t(`deliveryReview.states.${dispute.status}`)}</Text>
        {dispute.outcome ? <Text>{t(`deliveryReview.outcomes.${dispute.outcome}`)}</Text> : null}
        {dispute.resolution ? <Text>{dispute.resolution}</Text> : null}
        {dispute.resolvedAt ? <Text>{new Date(dispute.resolvedAt).toLocaleString(locale)}</Text> : null}
      </View>)}
    </>}
  </View>;
}
