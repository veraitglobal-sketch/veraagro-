import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MapPin, Sprout, Package, Check } from 'lucide-react-native';
import { estatesAPI, parcelsAPI, batchesAPI, harvestAnnouncementsAPI } from '../../../lib/api';
import { offlineStorage } from '../../../lib/offline-storage';
import { isDeviceOnline } from '../../../lib/network-utils';
import { parcelEligibleForHarvestPlan } from '../../../lib/parcel-eligible-for-harvest-plan';
import { plantingFormDateToEstimatedIsoUtc } from '../plantings/planting-estimated-date';
import { apiErrorMessage } from '../../../lib/api-error';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { EnterpriseButton, EnterpriseTextField } from '../../../design-system';
import { normalizeHarvestParcelId } from '../harvest/useHarvestData';
import { harvestPlanLink } from '../../../lib/harvest-batch-link';
import { useAppLocaleTag } from '../../../lib/date-locale';

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

const STEPS = 3;
const STEP_ACCENTS = ['#4B5563', '#2D5A27', '#374151'] as const;
const UNITS = ['kg', 'l', 'pcs', 'pack'];

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
      status?: string;
      cropType: string;
      estimatedDate: string;
      parcel?: { id?: string } | null;
    }>;
    if (Array.isArray(list)) {
      server = list
        .filter((r) => String(r.announcementType ?? '').toUpperCase() === 'HARVEST' && r.status !== 'CANCELLED')
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

function StepChrome({
  step,
  icon,
  title,
  fractionLabel,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  fractionLabel: string;
}) {
  return (
    <View style={[styles.stepChrome, { borderLeftColor: STEP_ACCENTS[step - 1] }]}>
      <Text style={styles.stepFraction}>{fractionLabel}</Text>
      <View style={styles.stepTitleRow}>
        {icon}
        <Text style={styles.stepTitle}>{title}</Text>
      </View>
    </View>
  );
}

export default function CreateBatchScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const route = useLocalSearchParams<{ harvestAnnouncementId?: string; parcelId?: string }>();
  const requestedPlanId = typeof route.harvestAnnouncementId === 'string' ? route.harvestAnnouncementId : '';
  const appliedPlan = useRef('');
  const p = useBioVeraScreenPadding();
  const langSr = !!i18n.language?.startsWith('sr');
  const dateLocale = useAppLocaleTag();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [parcelsRows, setParcelsRows] = useState<ParcelRow[]>([]);
  const [harvestAnnouncements, setHarvestAnnouncements] = useState<HarvestPickRow[]>([]);
  const [parcelId, setParcelId] = useState('');
  const [selectedHarvestPlanId, setSelectedHarvestPlanId] = useState<string | null>(null);

  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('50');
  const [unit, setUnit] = useState('kg');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
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
      setHarvestAnnouncements(await fetchHarvestPlanRows());

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

  useEffect(() => {
    if (!parcelId) {
      setSelectedHarvestPlanId(null);
      return;
    }
    if (harvestForParcel.length === 0) {
      setSelectedHarvestPlanId(null);
      setProductName(selectedParcel?.cropType?.trim() ? String(selectedParcel.cropType) : '');
      return;
    }
    setSelectedHarvestPlanId((prev) => {
      if (prev && harvestForParcel.some((x) => x.id === prev)) return prev;
      const sorted = [...harvestForParcel].sort(
        (a, b) => new Date(b.estimatedDate).getTime() - new Date(a.estimatedDate).getTime(),
      );
      return sorted[0]?.id ?? null;
    });
  }, [parcelId, harvestForParcel, selectedParcel?.cropType]);

  useEffect(() => {
    if (!selectedHarvestPlanId) return;
    const row = harvestAnnouncements.find((h) => h.id === selectedHarvestPlanId);
    if (row) setProductName(row.cropType);
  }, [selectedHarvestPlanId, harvestAnnouncements]);

  const requestedPlan = harvestAnnouncements.find(plan => plan.id === requestedPlanId &&
    (!route.parcelId || plan.parcelId === route.parcelId) && parcelsRows.some(parcel => parcel.id === plan.parcelId));
  const requestedPlanUnavailable = Boolean(requestedPlanId && !loading && !requestedPlan);
  useEffect(() => {
    if (loading || !requestedPlan || appliedPlan.current === requestedPlanId) return;
    appliedPlan.current = requestedPlanId;
    setParcelId(requestedPlan.parcelId);
    setSelectedHarvestPlanId(requestedPlan.id);
    setProductName(requestedPlan.cropType);
  }, [loading, requestedPlan, requestedPlanId]);

  const formatWhen = useCallback(
    (iso: string) => {
      try {
        return new Date(iso).toLocaleDateString(dateLocale, { dateStyle: 'medium' });
      } catch {
        return iso;
      }
    },
    [dateLocale],
  );

  const step1Ok = Boolean(parcelId) && !requestedPlanUnavailable;
  const step2Ok =
    Boolean(parcelId) &&
    (harvestForParcel.length === 0
      ? Boolean(productName.trim())
      : Boolean(selectedHarvestPlanId));

  const qtyNum = parseFloat(String(quantity).replace(',', '.'));
  const step3Ok = productName.trim().length > 0 && !Number.isNaN(qtyNum) && qtyNum > 0;

  const submit = async () => {
    if (savingRef.current) return;
    if (requestedPlanUnavailable) { setFormErr(t('harvestWorkflow.planUnavailable')); return; }
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
    const harvestDate = new Date().toISOString().slice(0, 10);
    const parsed = plantingFormDateToEstimatedIsoUtc(harvestDate);
    if (!parsed.ok) {
      Alert.alert(t('error'), t('producer.batches.createDateInvalid'));
      return;
    }
    let planLink: { harvestAnnouncementId?: string };
    try {
      planLink = harvestPlanLink(selectedHarvestPlanId, selectedParcel.id, harvestAnnouncements);
    } catch (error) {
      const key = error instanceof Error && error.message === 'PLAN_NOT_SYNCED' ? 'planNotSynced' : 'planUnavailable';
      setFormErr(t(`harvestWorkflow.${key}`));
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      if (!(await isDeviceOnline())) {
        Alert.alert(t('error'), t('producer.batches.createOffline'));
        return;
      }
      const created = await batchesAPI.create({
        ...planLink,
        estateId: selectedParcel.estateId,
        parcelId: selectedParcel.id,
        productName: productName.trim(),
        quantity: q,
        unit,
        harvestDate: parsed.iso.slice(0, 10),
      });
      Alert.alert(t('alerts.success'), t('producer.batches.createSuccess'), [
        { text: t('common.ok'), onPress: () => router.replace(created?.id ? { pathname: '/(producer)/batch/[id]', params: { id: created.id } } : '/(producer)/batches') },
      ]);
    } catch (e: unknown) {
      setFormErr(apiErrorMessage(e, t('producer.batches.createFailed')));
      Alert.alert(t('error'), apiErrorMessage(e, t('producer.batches.createFailed')));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const fraction = t('producer.fieldLogForm.farmerStepFraction', { step, total: STEPS });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={growerUi.canvas}>
        <BioVeraSubpageHeader title={t('producer.batches.createScreenTitle')} left="back" />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[growerUi.scrollContent, { paddingBottom: 120 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={enterpriseColors.primary}
            />
          }
        >
          <Text style={styles.flowLead}>{t('producer.batches.createFlowLead')}</Text>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 24 }} color={enterpriseColors.primary} />
          ) : (
            <>
              {requestedPlanUnavailable ? <Text style={{ color: enterpriseColors.destructive }}>{t('harvestWorkflow.planUnavailable')}</Text> : null}
          {formErr ? (
                <View style={styles.errBanner}>
                  <Text style={styles.errBannerText}>{formErr}</Text>
                </View>
              ) : null}

              {step > 1 && selectedParcel ? (
                <View style={styles.contextPill}>
                  <MapPin size={16} color={enterpriseColors.primary} />
                  <Text style={styles.contextPillText} numberOfLines={1}>
                    {selectedParcel.estateName}
                    {selectedParcel.cropType ? ` · ${selectedParcel.cropType}` : ''}
                  </Text>
                </View>
              ) : null}

              {step > 2 && productName.trim() ? (
                <View style={[styles.contextPill, styles.contextPillGreen]}>
                  <Sprout size={16} color={enterpriseColors.primary} />
                  <Text style={styles.contextPillText} numberOfLines={1}>
                    {productName.trim()}
                  </Text>
                </View>
              ) : null}

              {step === 1 ? (
                <>
                  <StepChrome
                    step={1}
                    fractionLabel={fraction}
                    icon={<MapPin size={26} color={STEP_ACCENTS[0]} strokeWidth={2} />}
                    title={t('producer.batches.createStepParcel')}
                  />
                  {parcelsRows.length === 0 ? (
                    <Text style={styles.warnText}>{t('producer.batches.createNoParcels')}</Text>
                  ) : (
                    parcelsRows.map((row) => {
                      const sel = parcelId === row.id;
                      return (
                        <TouchableOpacity
                          key={row.id}
                          onPress={() => {
                            setParcelId(row.id);
                            setFormErr(null);
                          }}
                          activeOpacity={0.85}
                          style={[styles.parcelCard, sel && styles.parcelCardOn]}
                        >
                          <View style={styles.parcelCardInner}>
                            <MapPin size={18} color={sel ? enterpriseColors.primary : STEP_ACCENTS[0]} strokeWidth={2} />
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.parcelTitle, sel && styles.parcelTitleOn]}>{row.estateName}</Text>
                              <Text style={[styles.parcelSub, sel && styles.parcelSubOn]}>
                                {row.cropType?.trim() || row.id.slice(0, 8)}
                              </Text>
                            </View>
                            {sel ? <Check size={18} color={enterpriseColors.primary} strokeWidth={2.5} /> : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <StepChrome
                    step={2}
                    fractionLabel={fraction}
                    icon={<Sprout size={26} color={STEP_ACCENTS[1]} strokeWidth={2} />}
                    title={t('producer.batches.createStepCrop')}
                  />
                  <Text style={styles.stepLead}>{t('producer.batches.createStepCropLead')}</Text>

                  {harvestForParcel.length === 0 ? (
                    <View style={styles.cropCard}>
                      <Text style={styles.cropName}>
                        {productName.trim() || t('producer.batches.createNoHarvestUseParcel')}
                      </Text>
                      <Text style={styles.cropMeta}>{t('producer.batches.createNoHarvestPlans')}</Text>
                    </View>
                  ) : (
                    harvestForParcel.map((h) => {
                      const sel = selectedHarvestPlanId === h.id;
                      return (
                        <TouchableOpacity
                          key={h.id}
                          onPress={() => {
                            setSelectedHarvestPlanId(h.id);
                            setFormErr(null);
                          }}
                          activeOpacity={0.85}
                          style={[styles.cropCard, sel && styles.cropCardOn]}
                        >
                          <Text style={[styles.cropName, sel && styles.cropNameOn]}>{h.cropType}</Text>
                          <Text style={[styles.cropMeta, sel && styles.cropMetaOn]}>
                            {t('producer.batches.plannedHarvestShort')}: {formatWhen(h.estimatedDate)}
                          </Text>
                          {h.id.startsWith('local:') ? (
                            <Text style={[styles.cropMeta, sel && styles.cropMetaOn, { fontStyle: 'italic' }]}>
                              {t('producer.batches.createLocalHarvestPending')}
                            </Text>
                          ) : null}
                          {sel ? <Check size={18} color="#fff" style={styles.cropCheck} /> : null}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <StepChrome
                    step={3}
                    fractionLabel={fraction}
                    icon={<Package size={26} color={STEP_ACCENTS[2]} strokeWidth={2} />}
                    title={t('producer.batches.createStepQty')}
                  />
                  <Text style={styles.stepLead}>{t('producer.batches.createStepQtyLead')}</Text>

                  <EnterpriseTextField
                    label={t('producer.batches.createQuantity')}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    size="farmer"
                  />

                  <Text style={[styles.fieldLabel, { marginTop: 16 }]}>{t('producer.batches.createUnit')}</Text>
                  <View style={styles.unitRow}>
                    {UNITS.map((u) => {
                      const sel = unit === u;
                      return (
                        <TouchableOpacity
                          key={u}
                          onPress={() => setUnit(u)}
                          style={[styles.unitChip, sel && styles.unitChipOn]}
                        >
                          <Text style={[styles.unitChipText, sel && styles.unitChipTextOn]}>{u}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              ) : null}
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step > 1 ? (
            <EnterpriseButton
              label={t('producer.fieldLogForm.wizardBack')}
              onPress={() => setStep((s) => s - 1)}
              variant="secondary"
            />
          ) : (
            <View style={styles.footerSpacer} />
          )}
          {step < STEPS ? (
            <EnterpriseButton
              label={t('producer.fieldLogForm.farmerNext')}
              onPress={() => setStep((s) => s + 1)}
              disabled={step === 1 ? !step1Ok : !step2Ok}
              style={styles.footerPrimaryBtn}
              size="large"
            />
          ) : (
            <EnterpriseButton
              label={t('producer.batches.createSubmit')}
              onPress={() => void submit()}
              loading={saving}
              disabled={saving || !step3Ok}
              style={styles.footerPrimaryBtn}
              size="large"
            />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flowLead: {
    fontSize: 16,
    color: enterpriseColors.gray600,
    lineHeight: 24,
    marginBottom: 16,
  },
  errBanner: {
    padding: 14,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F59E0B40',
  },
  errBannerText: { fontSize: 13.5, color: '#92400E', lineHeight: 19 },
  stepChrome: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    marginBottom: 14,
    marginTop: 4,
  },
  stepFraction: { fontSize: 11, fontWeight: '600', letterSpacing: 0.9, textTransform: 'uppercase', color: '#6B7A67', marginBottom: 4 },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepTitle: { fontSize: 19, fontWeight: '700', letterSpacing: -0.4, color: enterpriseColors.gray900, flex: 1 },
  stepLead: { fontSize: 13.5, color: enterpriseColors.gray600, lineHeight: 19, marginBottom: 12 },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: enterpriseColors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
  },
  contextPillGreen: { borderColor: `${enterpriseColors.primary}40`, backgroundColor: `${enterpriseColors.primary}08` },
  contextPillText: { fontSize: 13.5, fontWeight: '600', color: enterpriseColors.gray900, flex: 1 },
  warnText: { fontSize: 13.5, color: '#B45309', lineHeight: 19 },
  parcelCard: {
    backgroundColor: enterpriseColors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(17, 24, 39, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 60,
    marginBottom: 8,
  },
  parcelCardOn: { backgroundColor: 'rgba(45, 90, 39, 0.06)', borderColor: enterpriseColors.primary },
  parcelCardInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  parcelTitle: { fontSize: 15.5, fontWeight: '600', letterSpacing: -0.25, color: enterpriseColors.gray900 },
  parcelTitleOn: { color: enterpriseColors.primary },
  parcelSub: { fontSize: 12.5, color: enterpriseColors.gray600, marginTop: 2 },
  parcelSubOn: { color: enterpriseColors.gray700 },
  cropCard: {
    backgroundColor: `${enterpriseColors.primary}0A`,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(45, 90, 39, 0.35)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 64,
    marginBottom: 8,
    justifyContent: 'center',
  },
  cropCardOn: { backgroundColor: enterpriseColors.primary },
  cropName: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, color: enterpriseColors.primary },
  cropNameOn: { color: '#fff' },
  cropMeta: { fontSize: 12.5, fontWeight: '500', color: enterpriseColors.gray600, marginTop: 3 },
  cropMetaOn: { color: 'rgba(255,255,255,0.9)' },
  cropCheck: { position: 'absolute', top: 12, right: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', color: '#6B7A67', marginBottom: 6 },
  qtyInput: {
    borderWidth: 1.5,
    borderColor: 'rgba(17, 24, 39, 0.12)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: '700',
    color: enterpriseColors.gray900,
    backgroundColor: enterpriseColors.white,
    textAlign: 'center',
  },
  unitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  unitChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.1)',
    backgroundColor: enterpriseColors.white,
    minWidth: 60,
    alignItems: 'center',
  },
  unitChipOn: { borderColor: '#1F3D1B', backgroundColor: '#1F3D1B' },
  unitChipText: { fontSize: 14, fontWeight: '600', color: enterpriseColors.gray900 },
  unitChipTextOn: { color: '#fff' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: enterpriseColors.canvas,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
  },
  footerSpacer: { width: 72 },
  footerPrimaryBtn: { flex: 1 },
});
