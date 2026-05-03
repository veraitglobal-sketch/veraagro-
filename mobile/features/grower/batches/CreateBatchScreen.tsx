import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { estatesAPI, parcelsAPI, batchesAPI, harvestAnnouncementsAPI } from '../../../lib/api';
import { offlineStorage } from '../../../lib/offline-storage';
import { isDeviceOnline } from '../../../lib/network-utils';
import { parcelEligibleForHarvestPlan } from '../../../lib/parcel-eligible-for-harvest-plan';
import { plantingFormDateToEstimatedIsoUtc } from '../plantings/planting-estimated-date';
import { apiErrorMessage } from '../../../lib/api-error';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import { normalizeHarvestParcelId } from '../harvest/useHarvestData';

type ParcelRow = {
  id: string;
  estateId: string;
  estateName: string;
  cropType?: string | null;
};

export type HarvestPickRow = {
  id: string;
  parcelId: string;
  cropType: string;
  estimatedDate: string;
};

async function fetchHarvestPlanRows(): Promise<HarvestPickRow[]> {
  const pending = await offlineStorage.getPendingHarvestPlans();
  const local: HarvestPickRow[] = pending
    .filter((h) => String(h.payload?.announcementType ?? '').toUpperCase() === 'HARVEST')
    .map((h) => ({
      id: `local:${h.id}`,
      parcelId: normalizeHarvestParcelId(h.payload.parcelId, null),
      cropType: h.payload.cropType,
      estimatedDate: h.payload.estimatedDate,
    }))
    .filter((r) => r.parcelId.length > 0);
  let server: HarvestPickRow[] = [];
  try {
    const list = (await harvestAnnouncementsAPI.getMy()) as Array<{
      id: string;
      parcelId?: string;
      announcementType?: string;
      cropType: string;
      estimatedDate: string;
      parcel?: { id?: string } | null;
    }>;
    if (Array.isArray(list)) {
      server = list
        .filter((r) => String(r.announcementType ?? '').toUpperCase() === 'HARVEST')
        .map((r) => ({
          id: r.id,
          parcelId: normalizeHarvestParcelId(r.parcelId, r.parcel ?? null),
          cropType: r.cropType,
          estimatedDate: r.estimatedDate,
        }))
        .filter((r) => r.parcelId.length > 0);
    }
  } catch {
    // offline
  }
  return [...local, ...server];
}

const UNITS = ['kg', 'l', 'pcs', 'pack'];

export default function CreateBatchScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const langSr = !!i18n.language?.startsWith('sr');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [parcelsRows, setParcelsRows] = useState<ParcelRow[]>([]);
  const [harvestAnnouncements, setHarvestAnnouncements] = useState<HarvestPickRow[]>([]);
  const [parcelId, setParcelId] = useState('');
  const [selectedHarvestPlanId, setSelectedHarvestPlanId] = useState<string | null>(null);

  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('50');
  const [unit, setUnit] = useState('kg');
  const [harvestDate, setHarvestDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFormErr(null);
    setLoading(true);
    try {
      const estates = (await estatesAPI.getAll()) as Array<{ id: string; name: string }>;
      const out: ParcelRow[] = [];
      for (const e of estates || []) {
        const ps = (await parcelsAPI.getByEstate(e.id).catch(() => [])) as Array<{
          id: string;
          estateId: string;
          cropType?: string | null;
          approvedAt?: string | null;
          status?: string | null;
        }>;
        for (const par of ps || []) {
          if (parcelEligibleForHarvestPlan(par)) {
            out.push({
              id: par.id,
              estateId: par.estateId,
              estateName: e.name,
              cropType: par.cropType,
            });
          }
        }
      }
      setParcelsRows(out);
      const harvests = await fetchHarvestPlanRows();
      setHarvestAnnouncements(harvests);

      setParcelId((prev) => {
        if (out.some((r) => r.id === prev)) return prev;
        if (out.length === 1) return out[0].id;
        return '';
      });
    } catch (e) {
      setFormErr(apiErrorMessage(e, t('producer.batches.createLoadFailed')));
      setParcelsRows([]);
      setHarvestAnnouncements([]);
      setParcelId('');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const harvestForParcel = useMemo(() => {
    const sel = normalizeHarvestParcelId(parcelId, null);
    if (!sel) return [];
    return harvestAnnouncements.filter((h) => normalizeHarvestParcelId(h.parcelId, null) === sel);
  }, [harvestAnnouncements, parcelId]);

  const selectedParcel = useMemo(() => parcelsRows.find((r) => r.id === parcelId), [parcelsRows, parcelId]);

  /** Default to newest plan row for this parcel so submit is not blocked when several plans exist. */
  useEffect(() => {
    if (!parcelId) {
      setSelectedHarvestPlanId(null);
      return;
    }
    const list = harvestAnnouncements.filter(
      (h) => normalizeHarvestParcelId(h.parcelId, null) === normalizeHarvestParcelId(parcelId, null),
    );
    if (list.length === 0) {
      setSelectedHarvestPlanId(null);
      return;
    }
    setSelectedHarvestPlanId((prev) => {
      if (prev && list.some((x) => x.id === prev)) return prev;
      const sorted = [...list].sort(
        (a, b) => new Date(a.estimatedDate).getTime() - new Date(b.estimatedDate).getTime(),
      );
      return sorted[0]?.id ?? null;
    });
  }, [parcelId, harvestAnnouncements]);

  useEffect(() => {
    if (!parcelId || !selectedParcel) return;
    if (selectedHarvestPlanId) {
      const row = harvestAnnouncements.find((h) => h.id === selectedHarvestPlanId);
      if (row) {
        setProductName(row.cropType);
        const d = new Date(row.estimatedDate);
        if (!Number.isNaN(d.getTime())) setHarvestDate(d.toISOString().slice(0, 10));
      }
      return;
    }
    setProductName(selectedParcel.cropType?.trim() ? String(selectedParcel.cropType) : '');
  }, [parcelId, selectedHarvestPlanId, selectedParcel, harvestAnnouncements]);

  const formatWhen = useCallback(
    (iso: string) => {
      try {
        const tag = langSr ? 'sr-Latn' : 'en-GB';
        return new Date(iso).toLocaleDateString(tag, { dateStyle: 'medium' });
      } catch {
        return iso;
      }
    },
    [langSr],
  );

  const harvestDetailsGate =
    !!parcelId && (!!selectedHarvestPlanId || harvestForParcel.length === 0);

  const qtyNum = parseFloat(String(quantity).replace(',', '.'));
  const canSubmit =
    !!selectedParcel &&
    harvestDetailsGate &&
    productName.trim().length > 0 &&
    !Number.isNaN(qtyNum) &&
    qtyNum > 0 &&
    !saving &&
    !loading;

  const inputStyle = {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.surface,
  } as const;

  const submit = async () => {
    setFormErr(null);
    if (!selectedParcel) {
      Alert.alert(t('error'), t('producer.batches.createSelectParcel'));
      return;
    }
    if (!productName.trim()) {
      Alert.alert(t('error'), t('producer.batches.createNeedProduct'));
      return;
    }
    const q = parseFloat(String(quantity).replace(',', '.'));
    if (Number.isNaN(q) || q <= 0) {
      Alert.alert(t('error'), t('producer.batches.createNeedQty'));
      return;
    }
    const parsed = plantingFormDateToEstimatedIsoUtc(harvestDate);
    if (!parsed.ok) {
      Alert.alert(t('error'), t('producer.batches.createDateInvalid'));
      return;
    }
    if (!(await isDeviceOnline())) {
      Alert.alert(t('error'), t('producer.batches.createOffline'));
      return;
    }

    const dateStr = parsed.iso.slice(0, 10);

    setSaving(true);
    try {
      await batchesAPI.create({
        estateId: selectedParcel.estateId,
        parcelId: selectedParcel.id,
        productName: productName.trim(),
        quantity: q,
        unit,
        harvestDate: dateStr,
      });
      Alert.alert(t('alerts.success'), t('producer.batches.createSuccess'), [
        { text: t('common.ok'), onPress: () => router.replace('/(producer)/batches') },
      ]);
    } catch (e: unknown) {
      setFormErr(apiErrorMessage(e, t('producer.batches.createFailed')));
      Alert.alert(t('error'), apiErrorMessage(e, t('producer.batches.createFailed')));
    } finally {
      setSaving(false);
    }
  };

  const warningBannerBg = theme.colors.warningLight;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <BioVeraSubpageHeader title={t('producer.batches.createScreenTitle')} left="back" />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={{
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
            paddingBottom: Math.max(p.bottomInset, theme.spacing.xl),
          }}
        >
          <Text style={{ fontSize: 14, color: theme.colors.text.secondary, lineHeight: 20, marginBottom: theme.spacing.md }}>
            {t('producer.batches.createIntro')}
          </Text>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 24 }} color={theme.colors.primary} />
          ) : (
            <>
              {formErr ? (
                <View
                  style={{
                    padding: theme.spacing.md,
                    backgroundColor: warningBannerBg,
                    borderRadius: theme.borderRadius.md,
                    marginBottom: theme.spacing.md,
                    borderWidth: 1,
                    borderColor: `${theme.colors.warning}40`,
                  }}
                >
                  <Text style={{ fontSize: 14, color: theme.colors.warning }}>{formErr}</Text>
                </View>
              ) : null}

              <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: theme.spacing.sm, color: theme.colors.text.primary }}>
                {t('producer.batches.createStepParcel')}
              </Text>
              {parcelsRows.length === 0 ? (
                <Text style={{ fontSize: 14, color: theme.colors.warning, marginBottom: theme.spacing.md }}>
                  {t('producer.batches.createNoParcels')}
                </Text>
              ) : (
                <View style={{ gap: theme.spacing.xs, marginBottom: theme.spacing.lg }}>
                  {parcelsRows.map((row) => {
                    const sel = parcelId === row.id;
                    return (
                      <TouchableOpacity
                        key={row.id}
                        onPress={() => {
                          setParcelId(row.id);
                          setFormErr(null);
                        }}
                        activeOpacity={0.85}
                        style={{
                          padding: theme.spacing.md,
                          borderRadius: theme.borderRadius.md,
                          borderWidth: 2,
                          borderColor: sel ? theme.colors.primary : theme.colors.border,
                          backgroundColor: sel ? theme.colors.primaryLight : theme.colors.surface,
                        }}
                      >
                        <Text style={{ fontWeight: '700', color: theme.colors.text.primary }}>{row.estateName}</Text>
                        <Text style={{ fontSize: 13, color: theme.colors.text.secondary, marginTop: 4 }}>
                          {row.cropType?.trim() || row.id.slice(0, 8)}…
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {parcelId ? (
                <>
                  <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: theme.spacing.sm, color: theme.colors.text.primary }}>
                    {t('producer.batches.createStepHarvest')}
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.colors.text.secondary, marginBottom: theme.spacing.sm, lineHeight: 18 }}>
                    {t('producer.batches.createHarvestLead')}
                  </Text>
                  {harvestForParcel.length === 0 ? (
                    <Text style={{ fontSize: 13, color: theme.colors.text.tertiary, marginBottom: theme.spacing.md, lineHeight: 18 }}>
                      {t('producer.batches.createNoHarvestPlans')}
                    </Text>
                  ) : (
                    <View style={{ gap: theme.spacing.xs, marginBottom: theme.spacing.lg }}>
                      {harvestForParcel.map((h) => {
                        const sel = selectedHarvestPlanId === h.id;
                        return (
                          <TouchableOpacity
                            key={h.id}
                            onPress={() => {
                              setSelectedHarvestPlanId(h.id);
                              setFormErr(null);
                            }}
                            activeOpacity={0.85}
                            style={{
                              padding: theme.spacing.md,
                              borderRadius: theme.borderRadius.md,
                              borderWidth: 2,
                              borderColor: sel ? theme.colors.primary : theme.colors.border,
                              backgroundColor: sel ? theme.colors.primaryLight : theme.colors.surface,
                            }}
                          >
                            <Text style={{ fontWeight: '700', color: theme.colors.text.primary }}>{h.cropType}</Text>
                            <Text style={{ fontSize: 12, color: theme.colors.text.secondary, marginTop: 4 }}>
                              {t('producer.batches.plannedHarvestShort')}: {formatWhen(h.estimatedDate)}
                            </Text>
                            {h.id.startsWith('local:') ? (
                              <Text style={{ fontSize: 11, color: theme.colors.text.tertiary, marginTop: 4, fontStyle: 'italic' }}>
                                {t('producer.batches.createLocalHarvestPending')}
                              </Text>
                            ) : null}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {harvestDetailsGate ? (
                    <>
                      <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: theme.spacing.sm, color: theme.colors.text.primary }}>
                        {t('producer.batches.createStepLot')}
                      </Text>
                      <Text style={{ fontSize: 13, marginBottom: 6, color: theme.colors.text.secondary }}>
                        {t('producer.batches.createProduct')}
                      </Text>
                      <TextInput
                        style={[inputStyle, { marginBottom: theme.spacing.md }]}
                        value={productName}
                        onChangeText={(v) => {
                          setProductName(v);
                          setFormErr(null);
                        }}
                        placeholder={t('producer.batches.createProductPh')}
                        placeholderTextColor={theme.colors.text.tertiary}
                      />

                      <Text style={{ fontSize: 13, marginBottom: 6, color: theme.colors.text.secondary }}>
                        {t('producer.batches.createQuantity')} *
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: theme.spacing.md }}>
                        <TextInput
                          style={[inputStyle, { flex: 1 }]}
                          value={quantity}
                          onChangeText={setQuantity}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor={theme.colors.text.tertiary}
                        />
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center', maxWidth: 140 }}>
                          {UNITS.map((u) => (
                            <TouchableOpacity
                              key={u}
                              onPress={() => setUnit(u)}
                              style={{
                                paddingHorizontal: 10,
                                paddingVertical: 8,
                                borderRadius: theme.borderRadius.sm,
                                borderWidth: 1,
                                borderColor: unit === u ? theme.colors.primary : theme.colors.border,
                                backgroundColor: unit === u ? theme.colors.primaryLight : theme.colors.surface,
                              }}
                            >
                              <Text style={{ fontSize: 13, fontWeight: unit === u ? '700' : '500' }}>{u}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      <Text style={{ fontSize: 13, marginBottom: 6, color: theme.colors.text.secondary }}>
                        {t('producer.batches.createHarvestDate')} *
                      </Text>
                      <Text style={{ fontSize: 11, marginBottom: 6, color: theme.colors.text.tertiary, lineHeight: 16 }}>
                        {t('producer.batches.createHarvestDateHint')}
                      </Text>
                      <TextInput
                        style={[inputStyle, { marginBottom: theme.spacing.xl }]}
                        value={harvestDate}
                        onChangeText={setHarvestDate}
                        placeholder={t('producer.plantings.fieldDatePlaceholder')}
                        placeholderTextColor={theme.colors.text.tertiary}
                      />

                      <TouchableOpacity
                        onPress={() => void submit()}
                        disabled={!canSubmit}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          paddingVertical: 16,
                          borderRadius: theme.borderRadius.md,
                          backgroundColor: canSubmit ? theme.colors.primary : theme.colors.text.tertiary,
                          opacity: saving ? 0.85 : 1,
                        }}
                      >
                        {saving ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Plus size={22} color="#fff" strokeWidth={2} />
                        )}
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{t('producer.batches.createSubmit')}</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={{ fontSize: 13, color: theme.colors.text.secondary, lineHeight: 18 }}>
                      {t('producer.batches.createPickHarvest')}
                    </Text>
                  )}
                </>
              ) : null}
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
