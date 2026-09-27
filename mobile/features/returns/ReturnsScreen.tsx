import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { isAxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { Camera, MapPin, PackageOpen, X } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { returnsAPI, type ReturnCase } from '../../lib/api/returns';
import { returnAction } from '../../lib/return-action';
import { prepareHandoverPhotos } from '../../lib/handover-evidence';
import { pickFromCamera } from '../../lib/camera-picker';
import { apiErrorMessage } from '../../lib/api-error';
import { useAppLocaleTag } from '../../lib/date-locale';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';
import { EnterpriseButton } from '../../design-system/EnterpriseButton';
import { BioVeraSubpageHeader } from '../../components/BioVeraSubpageHeader';
import EmptyState from '../../components/EmptyState';

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  PLANNED: { bg: '#F6EDDA', fg: '#8A5D0F' },
  COLLECTED: { bg: '#E1EFEC', fg: '#1D665D' },
  RECEIVED: { bg: '#E8F1E4', fg: '#2D5A27' },
};

function money(cents: number, currency: string, locale: string) {
  try {
    return (cents / 100).toLocaleString(locale, { style: 'currency', currency });
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

function ReturnCard({ row, reload }: { row: ReturnCase; reload: () => Promise<void> }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const locale = useAppLocaleTag();
  const step = returnAction(row, user?.id);
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [proof, setProof] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);

  const run = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      setError(apiErrorMessage(e, t('returnFlow.error')));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const camera = () =>
    run(async () => {
      const image = await pickFromCamera({ t, quality: 0.6, allowsEditing: false });
      if (image?.uri) setPhotos((p) => [...p, image.uri].slice(0, 6));
    });
  const submit = () => {
    if (!step || photos.length < 2 || notes.trim().length < 10) return;
    Alert.alert(t(`returnFlow.${step}`), t('returnFlow.fullShipment'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.ok'),
        onPress: () =>
          void run(async () => {
            await returnsAPI.record(row.id, step, row.revision, await prepareHandoverPhotos(photos), notes.trim());
            await reload();
          }),
      },
    ]);
  };

  const tone = STATUS_TONE[row.status] ?? { bg: enterpriseColors.gray100, fg: enterpriseColors.gray700 };
  const order = row.delivery.orders;
  const when = (iso: string) =>
    new Date(iso).toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.product} numberOfLines={1}>
            {order.productName}
          </Text>
          <Text style={styles.code} numberOfLines={1}>
            {row.delivery.deliveryNumber} · {order.quantity} {order.unit}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: tone.bg }]}>
          <Text style={[styles.pillText, { color: tone.fg }]}>{t(`returnFlow.states.${row.status}`)}</Text>
        </View>
      </View>

      {row.destinationAddress ? (
        <View style={styles.line}>
          <MapPin size={13} color={enterpriseColors.gray600} strokeWidth={1.9} />
          <Text style={styles.lineText}>{row.destinationAddress}</Text>
        </View>
      ) : null}
      {row.instructions ? <Text style={styles.note}>{row.instructions}</Text> : null}

      {row.collectedAt || row.receivedAt ? (
        <View style={styles.facts}>
          {row.collectedAt ? (
            <View style={styles.fact}>
              <Text style={styles.factLabel}>{t('returnFlow.collectedAt')}</Text>
              <Text style={styles.factValue}>{when(row.collectedAt)}</Text>
            </View>
          ) : null}
          {row.receivedAt ? (
            <View style={styles.fact}>
              <Text style={styles.factLabel}>{t('returnFlow.receivedAt')}</Text>
              <Text style={styles.factValue}>{when(row.receivedAt)}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {row.status === 'RECEIVED' && row.stockStatus ? (
        <View style={styles.subBlock}>
          <Text style={styles.factLabel}>{t('returnDisposition.title')}</Text>
          <Text style={styles.factValue}>{t(`returnDisposition.states.${row.stockStatus}`)}</Text>
          <Text style={styles.note}>
            {row.dispositions?.[0] ? row.dispositions[0].notes : t('returnDisposition.initial')}
          </Text>
        </View>
      ) : null}

      {row.refund ? (
        <View style={styles.refund}>
          <Text style={styles.refundLabel}>{t(`returnFlow.refundStates.${row.refund.status}`)}</Text>
          <Text style={styles.refundValue}>{money(row.refund.amountCents, row.refund.currency, locale)}</Text>
        </View>
      ) : null}
      {row.refund?.reconciliation?.entries?.map((entry) => (
        <View key={entry.id} style={styles.recon}>
          <Text style={styles.lineText}>{t(`refundReconciliation.participantMethods.${entry.method}`)}</Text>
          <Text style={styles.reconValue}>{money(entry.amountCents, row.refund?.currency ?? 'EUR', locale)}</Text>
        </View>
      ))}

      <EnterpriseButton
        label={t('returnFlow.evidence')}
        disabled={busy}
        variant="secondary"
        onPress={() =>
          void run(async () => {
            const data = await returnsAPI.evidence(row.id);
            const inspection = data.dispositions?.[0]
              ? await returnsAPI.dispositionEvidence(row.id, data.dispositions[0].id)
              : null;
            setProof([...data.collectionPhotos, ...data.receiptPhotos, ...(inspection?.photos || [])]);
          })
        }
      />
      {proof.length > 0 ? (
        <View style={styles.photoGrid}>
          {proof.map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.photo} resizeMode="cover" />
          ))}
        </View>
      ) : null}

      {step ? (
        <View style={styles.action}>
          <Text style={styles.hint}>{t('returnFlow.proofHint')}</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={t('returnFlow.notes')}
            placeholderTextColor={enterpriseColors.gray600}
            accessibilityLabel={t('returnFlow.notes')}
            multiline
            maxLength={8000}
            editable={!busy}
            style={styles.input}
          />
          <View style={styles.photoGrid}>
            {photos.map((uri, i) => (
              <View key={uri + i} style={styles.photoWrap}>
                <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.photoRemove}
                  disabled={busy}
                  onPress={() => setPhotos((p) => p.filter((_, index) => index !== i))}
                  accessibilityRole="button"
                  accessibilityLabel={t('deliveryFlow.removePhoto')}
                >
                  <X size={13} color="#fff" strokeWidth={2.4} />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 6 ? (
              <TouchableOpacity
                style={[styles.photo, styles.addPhoto]}
                disabled={busy}
                onPress={() => void camera()}
                accessibilityRole="button"
                accessibilityLabel={t('deliveryFlow.addPhoto')}
              >
                <Camera size={20} color={enterpriseColors.primary} strokeWidth={1.8} />
                <Text style={styles.addPhotoText}>{photos.length}/6</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <EnterpriseButton
            label={t(`returnFlow.${step}`)}
            disabled={busy || photos.length < 2 || notes.trim().length < 10}
            loading={busy}
            onPress={submit}
          />
        </View>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export default function ReturnsScreen() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<ReturnCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true);
    setError('');
    try {
      const data = await returnsAPI.list();
      if (request === generation.current) setRows(data);
    } catch (e) {
      if (request !== generation.current) return;
      // 404 = returns module not on this server yet → no return cases, not an error.
      if (isAxiosError(e) && e.response?.status === 404) setRows([]);
      else setError(apiErrorMessage(e, t('returnFlow.error')));
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [t]);
  useFocusEffect(
    useCallback(() => {
      void reload();
      return () => {
        generation.current++;
      };
    }, [reload]),
  );

  return (
    <View style={styles.root}>
      <BioVeraSubpageHeader title={t('returnFlow.title')} left="back" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading && rows.length > 0}
            onRefresh={() => void reload()}
            tintColor={enterpriseColors.primary}
          />
        }
      >
        {loading && rows.length === 0 ? <ActivityIndicator color={enterpriseColors.primary} style={{ marginTop: 32 }} /> : null}
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {!loading && !error && !rows.length ? <EmptyState message={t('returnFlow.empty')} icon={PackageOpen} /> : null}
        {rows.map((row) => (
          <ReturnCard key={`${row.id}-${row.revision}-${row.stockRevision ?? 0}`} row={row} reload={reload} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: enterpriseColors.canvas },
  content: { padding: 16, paddingBottom: 40 },
  card: { ...enterpriseUi.inAppPanel, padding: 14, gap: 10, marginBottom: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  product: { fontSize: 15, fontWeight: '600', letterSpacing: -0.25, color: enterpriseColors.gray900 },
  code: { fontSize: 11.5, color: enterpriseColors.gray600, fontFamily: 'Menlo', marginTop: 2 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pillText: { fontSize: 11, fontWeight: '600' },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  lineText: { flex: 1, fontSize: 13, color: enterpriseColors.gray700, lineHeight: 18 },
  note: { fontSize: 13, color: enterpriseColors.gray600, lineHeight: 18 },
  facts: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
  },
  fact: { flex: 1 },
  factLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#6B7A67',
  },
  factValue: { fontSize: 13.5, fontWeight: '500', color: enterpriseColors.gray900, marginTop: 2 },
  subBlock: { gap: 2 },
  refund: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(45, 90, 39, 0.06)',
  },
  refundLabel: { flex: 1, fontSize: 12.5, color: enterpriseColors.gray700, lineHeight: 17 },
  refundValue: { fontSize: 15, fontWeight: '700', color: enterpriseColors.primary, fontVariant: ['tabular-nums'] },
  recon: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  reconValue: { fontSize: 13, fontWeight: '600', color: enterpriseColors.gray900, fontVariant: ['tabular-nums'] },
  action: {
    gap: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
  },
  hint: { fontSize: 12.5, color: enterpriseColors.gray600, lineHeight: 17 },
  input: {
    minHeight: 84,
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: enterpriseColors.gray900,
    backgroundColor: enterpriseColors.white,
    textAlignVertical: 'top',
  },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoWrap: { position: 'relative' },
  photo: { width: 92, height: 92, borderRadius: 12, backgroundColor: enterpriseColors.gray100 },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhoto: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(45, 90, 39, 0.35)',
    backgroundColor: 'rgba(45, 90, 39, 0.04)',
  },
  addPhotoText: { fontSize: 11, fontWeight: '600', color: enterpriseColors.primary },
  error: { fontSize: 13, color: enterpriseColors.destructive, lineHeight: 18 },
});
