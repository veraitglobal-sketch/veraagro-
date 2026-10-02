import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ordersAPI, type Order } from '../../../lib/api';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { useAppLocaleTag } from '../../../lib/date-locale';
import { apiErrorMessage } from '../../../lib/api-error';
import {
  canRecordPacking,
  expectedPackedKg,
  packedWeightRange,
  validatePacking,
} from '../../../../shared/validation/order-packing';

type CompatibleBatch = {
  id: string;
  batchId: string;
  productName: string;
  quantity: number;
  unit: string;
  selected?: boolean;
};

/** Packing state + "Record packing" form for one order (same rules and wording as web /grower/orders). */
export function OrderPackingPanel({ order, onSaved }: { order: Order; onSaved: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const locale = useAppLocaleTag();
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 });
  const [open, setOpen] = useState(false);
  const [packs, setPacks] = useState(String(order.packedPackCount ?? order.packCount ?? 1));
  const [batchId, setBatchId] = useState(order.packedBatchId ?? '');
  const [lots, setLots] = useState<CompatibleBatch[]>([]);
  const [lotsLoading, setLotsLoading] = useState(false);
  const [kg, setKg] = useState(order.packedKg != null ? String(order.packedKg) : '');
  const [kgTouched, setKgTouched] = useState(order.packedKg != null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      setLotsLoading(true);
      try {
        const data = await ordersAPI.getCompatibleBatches(order.id);
        if (cancelled) return;
        const rows = Array.isArray(data) ? (data as CompatibleBatch[]) : [];
        setLots(rows);
        const pre = order.packedBatchId ?? rows.find((b) => b.selected)?.id ?? rows[0]?.id ?? '';
        setBatchId(pre);
      } catch {
        if (!cancelled) setLots([]);
      } finally {
        if (!cancelled) setLotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, order.id, order.packedBatchId]);

  const packed = order.packedAt != null && (order.packedPackCount ?? 0) > 0;
  const packsNum = Number(packs);
  const expected = expectedPackedKg(order, packsNum);
  const shownKg = kgTouched ? kg : expected != null ? String(expected) : kg;
  const kgNum = shownKg.trim() === '' ? null : Number(shownKg.replace(',', '.'));
  const range = packedWeightRange(order, packsNum);
  const problem = validatePacking(order, packsNum, kgNum);
  const lotMissing = !batchId.trim();
  const problemText =
    problem === 'notPaid'
      ? t('producer.ordersPrepare.errNotPaid')
      : problem === 'packsMin'
        ? t('producer.ordersPrepare.errPacksMin')
        : problem === 'packsMax'
          ? t('producer.ordersPrepare.errPacksMax', { max: order.packCount ?? 0 })
          : problem === 'weightRange' && range
            ? t('producer.ordersPrepare.errWeight', { min: nf.format(range.min), max: nf.format(range.max) })
            : null;

  const pickupBatchId = order.packedBatchId ?? order.packed_batch?.id ?? '';

  const save = async () => {
    if (problem || lotMissing) return;
    setSaving(true);
    setErr(null);
    try {
      await ordersAPI.recordPacking(order.id, {
        packedPackCount: packsNum,
        batchId: batchId.trim(),
        ...(kgNum != null ? { packedKg: kgNum } : {}),
      });
      setOpen(false);
      onSaved();
    } catch (e) {
      setErr(apiErrorMessage(e, t('producer.ordersPrepare.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const mission = order.missions?.[0];

  return (
    <View style={styles.wrap}>
      {order.packLine ? <Text style={styles.packLine}>{order.packLine}</Text> : null}
      <Text style={[styles.state, packed ? styles.stateDone : styles.statePending]}>
        {packed
          ? t('producer.ordersPrepare.packedState', {
              packed: order.packedPackCount ?? 0,
              total: order.packCount ?? order.packedPackCount ?? 0,
              kg: order.packedKg != null ? nf.format(order.packedKg) : '—',
              date: new Date(order.packedAt as string).toLocaleString(locale, {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              }),
            })
          : t('producer.ordersPrepare.notPacked')}
      </Text>
      {mission ? (
        <Text style={styles.meta}>{t('producer.ordersPrepare.mission', { mission: mission.missionNumber })}</Text>
      ) : null}

      {open ? (
        <View style={styles.form}>
          <Text style={styles.label}>{t('producer.ordersPrepare.selectLot')}</Text>
          {lotsLoading ? (
            <ActivityIndicator color={enterpriseColors.primary} style={{ marginVertical: 8 }} />
          ) : lots.length === 0 ? (
            <Text style={styles.hint}>{t('producer.ordersPrepare.noLots')}</Text>
          ) : (
            lots.map((b) => (
              <TouchableOpacity
                key={b.id}
                onPress={() => setBatchId(b.id)}
                style={[styles.lotRow, batchId === b.id && styles.lotRowSelected]}
                accessibilityRole="button"
              >
                <Text style={styles.lotRowText}>
                  {b.batchId} — {b.productName} ({nf.format(b.quantity)} {b.unit})
                </Text>
              </TouchableOpacity>
            ))
          )}
          {lotMissing && !lotsLoading && lots.length > 0 ? (
            <Text style={styles.error}>{t('producer.ordersPrepare.selectLotRequired')}</Text>
          ) : null}
          <Text style={styles.label}>{t('producer.ordersPrepare.packs')}</Text>
          <TextInput
            value={packs}
            onChangeText={setPacks}
            keyboardType="number-pad"
            style={styles.input}
            accessibilityLabel={t('producer.ordersPrepare.packs')}
          />
          {order.packCount != null ? (
            <Text style={styles.hint}>{t('producer.ordersPrepare.orderedPacks', { count: order.packCount })}</Text>
          ) : null}
          <Text style={styles.label}>{t('producer.ordersPrepare.packSize')}</Text>
          <Text style={[styles.input, styles.readonly]}>
            {order.packLabel || (order.packSizeKg != null ? `${nf.format(order.packSizeKg)} kg` : '—')}
          </Text>
          <Text style={styles.label}>{t('producer.ordersPrepare.netKg')}</Text>
          <TextInput
            value={shownKg}
            onChangeText={(v) => {
              setKgTouched(true);
              setKg(v);
            }}
            keyboardType="decimal-pad"
            style={styles.input}
            accessibilityLabel={t('producer.ordersPrepare.netKg')}
          />
          {range ? (
            <Text style={styles.hint}>
              {t('producer.ordersPrepare.weightHint', { min: nf.format(range.min), max: nf.format(range.max) })}
            </Text>
          ) : null}
          {problemText || err ? <Text style={styles.error}>{err || problemText}</Text> : null}
          <TouchableOpacity
            onPress={() => void save()}
            disabled={saving || !!problem || lotMissing || lots.length === 0}
            style={[enterpriseUi.authSubmit, styles.cta, (saving || problem || lotMissing) && styles.disabled]}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator color={enterpriseColors.white} />
            ) : (
              <Text style={[enterpriseUi.authSubmitText, styles.ctaText]}>{t('producer.ordersPrepare.save')}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setOpen(false)} style={styles.secondary} accessibilityRole="button">
            <Text style={styles.secondaryText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actions}>
          {order.nextAction === 'SELECT_LOT' ? (
            <View style={styles.selectLotBlock}>
              <Text style={styles.selectLotMessage}>{t('producer.ordersPrepare.selectLotMessage')}</Text>
              <TouchableOpacity
                onPress={() => router.push('/(producer)/quality-entry')}
                style={styles.secondary}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryText}>{t('producer.ordersPrepare.selectLotLink')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {canRecordPacking(order) && order.nextAction !== 'AWAITING_PICKUP' ? (
            <TouchableOpacity
              onPress={() => setOpen(true)}
              style={order.nextAction === 'PREPARE_AND_PACK' || order.nextAction === 'SELECT_LOT' ? [enterpriseUi.authSubmit, styles.cta] : styles.secondary}
              accessibilityRole="button"
            >
              <Text
                style={
                  order.nextAction === 'PREPARE_AND_PACK' || order.nextAction === 'SELECT_LOT'
                    ? [enterpriseUi.authSubmitText, styles.ctaText]
                    : styles.secondaryText
                }
              >
                {packed || order.nextAction === 'SELECT_LOT'
                  ? t('producer.ordersPrepare.edit')
                  : t('producer.ordersPrepare.record')}
              </Text>
            </TouchableOpacity>
          ) : null}
          {order.nextAction === 'REQUEST_PICKUP' ? (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(producer)/missions-create',
                  params: { orderId: order.id, ...(pickupBatchId ? { batchId: pickupBatchId } : {}) },
                })
              }
              style={[enterpriseUi.authSubmit, styles.cta]}
              accessibilityRole="button"
            >
              <Text style={[enterpriseUi.authSubmitText, styles.ctaText]}>{t('producer.ordersPrepare.requestPickup')}</Text>
            </TouchableOpacity>
          ) : null}
          {order.nextAction === 'AWAITING_PICKUP' ? (
            <Text style={styles.meta}>{t('producer.ordersPrepare.awaitingPickup')}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 10, gap: 4 },
  packLine: { fontSize: 14, fontWeight: '600', color: enterpriseColors.primary },
  state: { fontSize: 13, lineHeight: 18 },
  stateDone: { color: enterpriseColors.primary },
  statePending: { color: enterpriseColors.gray700, fontWeight: '500' },
  meta: { fontSize: 12, color: enterpriseColors.gray600 },
  form: { marginTop: 8, gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: enterpriseColors.gray900, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: enterpriseColors.gray900,
    backgroundColor: enterpriseColors.white,
  },
  readonly: { backgroundColor: enterpriseColors.gray100, color: enterpriseColors.gray700 },
  hint: { fontSize: 12, color: enterpriseColors.gray600 },
  error: { fontSize: 13, color: enterpriseColors.destructive, marginTop: 4 },
  actions: { marginTop: 8, gap: 8 },
  cta: { minHeight: 46, justifyContent: 'center', marginTop: 6 },
  ctaText: { textAlign: 'center', width: '100%' },
  disabled: { opacity: 0.55 },
  secondary: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
  },
  secondaryText: { fontSize: 14, fontWeight: '600', color: enterpriseColors.gray700 },
  lotRow: {
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
  },
  lotRowSelected: { borderColor: enterpriseColors.primary, backgroundColor: '#f7faf6' },
  lotRowText: { fontSize: 14, color: enterpriseColors.gray900 },
  selectLotBlock: { gap: 8 },
  selectLotMessage: { fontSize: 13, color: enterpriseColors.gray700, lineHeight: 18 },
});
