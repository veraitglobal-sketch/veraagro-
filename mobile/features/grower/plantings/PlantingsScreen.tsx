import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Dimensions,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Wheat, Plus, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { estatesAPI, harvestAnnouncementsAPI, parcelsAPI, type CreateHarvestPlanBody } from '../../../lib/api';
import { isDeviceOnline } from '../../../lib/network-utils';
import { offlineStorage } from '../../../lib/offline-storage';
import { syncService } from '../../../lib/sync-service';
import { apiErrorMessage, axiosLikeMessage, isLikelyNetworkError } from '../../../lib/api-error';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { theme } from '../../../lib/theme';
import {
  CROP_CATALOG,
  type CropCategoryId,
  type CropVarietyRow,
  cropTypeForLocale,
  formatArea,
} from './crop-catalog';
import { mapPlantingSaveError } from './map-planting-save-error';
import { plantingFormDateToEstimatedIsoUtc } from './planting-estimated-date';
import { parcelEligibleForHarvestPlan } from '../../../lib/parcel-eligible-for-harvest-plan';
import { normalizeHarvestParcelId } from '../harvest/useHarvestData';

type EstateRow = { id: string; name: string };
type ParcelAug = {
  id: string;
  cropType?: string | null;
  approvedAt?: string | null;
  status?: string | null;
  estateId: string;
  calculatedArea?: number;
  estateName: string;
};

type HaRow = {
  id: string;
  parcelId: string;
  announcementType: string;
  cropType: string;
  estimatedDate: string;
  status: string;
  notes?: string | null;
  createdAt?: string;
  estimatedQuantity?: number | null;
  /** Local-only row from offline harvest-announcements queue */
  localQueue?: {
    pendingId: string;
    queueStatus: 'pending' | 'syncing' | 'synced' | 'error';
    queueError?: string;
  };
  plantingProgress?: {
    intervalDays: number;
    lastGrowthLogAt: string | null;
    nextDueAt: string;
    isOverdue: boolean;
    daysOverdue: number;
  } | null;
  parcel?: {
    id: string;
    cropType?: string | null;
    calculatedArea?: number;
    estates?: { name: string } | null;
  } | null;
};

function parcelLabelSnippet(ha: HaRow): string {
  const id = normalizeHarvestParcelId(ha.parcelId, ha.parcel ?? null);
  return id ? id.slice(0, 8) : '—';
}

export default function PlantingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const langSr = !!i18n.language?.startsWith('sr');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [announcementsWarn, setAnnouncementsWarn] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<HaRow[]>([]);
  const [parcelList, setParcelList] = useState<ParcelAug[]>([]);

  /** Add modal */
  const [addOpen, setAddOpen] = useState(false);
  const [formParcelId, setFormParcelId] = useState('');
  const [selectedVariety, setSelectedVariety] = useState<CropVarietyRow | null>(null);
  const [customCropOther, setCustomCropOther] = useState('');
  const [cropFilter, setCropFilter] = useState<CropCategoryId | 'all'>('all');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formNotes, setFormNotes] = useState('');
  const [cropSearch, setCropSearch] = useState('');
  const [addFormErr, setAddFormErr] = useState<string | null>(null);

  /** Detail */
  const [detailHa, setDetailHa] = useState<HaRow | null>(null);

  const parcelById = useMemo(() => new Map(parcelList.map((q) => [q.id, q])), [parcelList]);

  const goHarvestForPlanting = useCallback(
    (ha: HaRow) => {
      const parcelIdEff = normalizeHarvestParcelId(ha.parcelId, ha.parcel ?? null);
      if (!parcelIdEff) {
        Alert.alert(t('error'), t('producer.plantings.harvestLinkMissing'));
        return;
      }
      setDetailHa(null);
      router.push({
        pathname: '/(producer)/(tabs)/harvest',
        params: {
          harvestParcelId: parcelIdEff,
          harvestPlantingId: ha.id,
        },
      });
    },
    [router, t],
  );

  const load = useCallback(async () => {
    setErr(null);
    setAnnouncementsWarn(null);
    try {
      const estates = (await estatesAPI.getAll()) as EstateRow[];
      const rows: ParcelAug[] = [];
      for (const e of estates || []) {
        const parcels = (await parcelsAPI.getByEstate(e.id).catch(() => [])) as Array<
          ParcelAug & { calculatedArea?: number }
        >;
        for (const par of parcels || []) {
          if (parcelEligibleForHarvestPlan(par)) {
            rows.push({
              id: par.id,
              cropType: par.cropType,
              approvedAt: par.approvedAt,
              status: par.status,
              estateId: par.estateId,
              calculatedArea: typeof par.calculatedArea === 'number' ? par.calculatedArea : undefined,
              estateName: e.name,
            });
          }
        }
      }
      setParcelList(rows);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('producer.plantings.loadError'));
      setParcelList([]);
      setAnnouncements([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const list = (await harvestAnnouncementsAPI.getMy()) as HaRow[];
      const serverRows = Array.isArray(list) ? list : [];

      const pending = await offlineStorage.getPendingHarvestPlans();
      const localPlantings: HaRow[] = pending
        .filter((h) => String(h.payload?.announcementType ?? '').toUpperCase() === 'PLANTING')
        .map((h) => {
          const payload = h.payload;
          const q = h.status;
          const statusFlag =
            q === 'error' ? 'LOCAL_ERROR' : q === 'syncing' ? 'LOCAL_SYNCING' : 'LOCAL_QUEUED';
          return {
            id: `local:${h.id}`,
            parcelId: normalizeHarvestParcelId(payload.parcelId, null) || String(payload.parcelId ?? ''),
            announcementType: 'PLANTING',
            cropType: payload.cropType,
            estimatedDate: payload.estimatedDate,
            status: statusFlag,
            notes: payload.notes ?? null,
            createdAt: h.createdAt,
            estimatedQuantity: payload.estimatedQuantity ?? null,
            localQueue: { pendingId: h.id, queueStatus: q, queueError: h.error },
          };
        });

      setAnnouncements([...localPlantings, ...serverRows.map((r) => ({
        ...r,
        parcelId: normalizeHarvestParcelId(r.parcelId, r.parcel ?? null) || r.parcelId,
      }))]);
    } catch (e: unknown) {
      if (__DEV__) {
        const msg =
          axiosLikeMessage(e) ||
          apiErrorMessage(e, '') ||
          (e instanceof Error ? e.message : typeof e === 'string' ? e : '');
        console.warn('[PlantingsScreen] harvest-announcements getMy failed:', msg || e);
      }
      try {
        const pending = await offlineStorage.getPendingHarvestPlans();
        const localOnly: HaRow[] = pending
          .filter((h) => String(h.payload?.announcementType ?? '').toUpperCase() === 'PLANTING')
          .map((h) => {
            const payload = h.payload;
            const q = h.status;
            const statusFlag =
              q === 'error' ? 'LOCAL_ERROR' : q === 'syncing' ? 'LOCAL_SYNCING' : 'LOCAL_QUEUED';
            return {
              id: `local:${h.id}`,
              parcelId: normalizeHarvestParcelId(payload.parcelId, null) || String(payload.parcelId ?? ''),
              announcementType: 'PLANTING',
              cropType: payload.cropType,
              estimatedDate: payload.estimatedDate,
              status: statusFlag,
              notes: payload.notes ?? null,
              createdAt: h.createdAt,
              estimatedQuantity: payload.estimatedQuantity ?? null,
              localQueue: { pendingId: h.id, queueStatus: q, queueError: h.error },
            };
          });
        setAnnouncements(localOnly);
      } catch {
        setAnnouncements([]);
      }
      setAnnouncementsWarn(t('producer.plantings.announcementsLoadWarn'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetAddForm = useCallback(() => {
    setFormParcelId('');
    setSelectedVariety(null);
    setCustomCropOther('');
    setCropFilter('all');
    setCropSearch('');
    setAddFormErr(null);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormNotes('');
  }, []);

  /** When modal opens with exactly one parcel, bind it reliably (e.g. list finished loading after open). */
  useEffect(() => {
    if (!addOpen) return;
    if (parcelList.length === 1) setFormParcelId(parcelList[0].id);
  }, [addOpen, parcelList]);

  const openAdd = useCallback(() => {
    setErr(null);
    setAddFormErr(null);
    setSelectedVariety(null);
    setCustomCropOther('');
    setCropFilter('all');
    setCropSearch('');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormNotes('');
    setFormParcelId(parcelList.length === 1 ? parcelList[0].id : '');
    setAddOpen(true);
  }, [parcelList]);

  const plantingsSorted = useMemo(() => {
    const list = announcements.filter(
      (a) => String(a.announcementType ?? '').toUpperCase() === 'PLANTING',
    );
    return [...list].sort((a, b) => {
      const ta = new Date(a.createdAt || a.estimatedDate).getTime();
      const tb = new Date(b.createdAt || b.estimatedDate).getTime();
      return tb - ta;
    });
  }, [announcements]);

  const harvestsSorted = useMemo(() => {
    const list = announcements.filter((a) => String(a.announcementType ?? '').toUpperCase() === 'HARVEST');
    return [...list].sort((a, b) => {
      const ta = new Date(a.createdAt || a.estimatedDate).getTime();
      const tb = new Date(b.createdAt || b.estimatedDate).getTime();
      return tb - ta;
    });
  }, [announcements]);

  const formatWhen = useCallback(
    (iso: string) => {
      try {
        const tag = langSr ? 'sr-Latn' : 'en-GB';
        return new Date(iso).toLocaleString(tag, { dateStyle: 'short', timeStyle: 'short' });
      } catch {
        return iso;
      }
    },
    [langSr],
  );

  const formatDateShort = useCallback(
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

  const cropLabelChosen = (): string => {
    const custom = customCropOther.trim();
    if (custom) return custom;
    if (selectedVariety) return cropTypeForLocale(selectedVariety, langSr);
    return '';
  };

  const submitPlanting = async () => {
    setAddFormErr(null);
    const crop = cropLabelChosen().trim();
    if (!formParcelId.trim()) {
      setAddFormErr(t('producer.plantings.validationParcel'));
      return;
    }
    if (!parcelList.some((p) => p.id === formParcelId)) {
      setAddFormErr(t('producer.plantings.errSaveAccess'));
      void load();
      return;
    }
    if (!crop) {
      setAddFormErr(t('producer.plantings.validationCrop'));
      return;
    }
    if (crop.length > 500) {
      setAddFormErr(t('producer.plantings.errCropTooLong'));
      return;
    }
    if (!formDate.trim()) {
      setAddFormErr(t('producer.plantings.validationDate'));
      return;
    }

    const parsedDate = plantingFormDateToEstimatedIsoUtc(formDate);
    if (!parsedDate.ok) {
      setAddFormErr(t('producer.plantings.validationDateFormat'));
      return;
    }

    const payload: CreateHarvestPlanBody = {
      parcelId: formParcelId,
      announcementType: 'PLANTING',
      cropType: crop,
      estimatedDate: parsedDate.iso,
      notes: formNotes.trim() || undefined,
    };

    setSaving(true);
    setErr(null);
    try {
      if (!(await isDeviceOnline())) {
        await offlineStorage.savePendingHarvestPlan({ payload });
        void syncService.getSyncStatus();
        Alert.alert(t('alerts.success'), t('producer.harvest.queuedOffline'));
        setAddOpen(false);
        resetAddForm();
        await load();
        return;
      }
      await harvestAnnouncementsAPI.create(payload);
      Alert.alert(t('alerts.success'), t('producer.plantings.savedOk'));
      setAddOpen(false);
      resetAddForm();
      await load();
    } catch (e: unknown) {
      if (isLikelyNetworkError(e)) {
        try {
          await offlineStorage.savePendingHarvestPlan({ payload });
          void syncService.getSyncStatus();
          Alert.alert(t('alerts.success'), t('producer.harvest.queuedOffline'));
          setAddOpen(false);
          resetAddForm();
          await load();
          return;
        } catch {
          // fall through
        }
      }
      const fromApi =
        axiosLikeMessage(e) || apiErrorMessage(e, e instanceof Error ? e.message : '');
      const friendly = mapPlantingSaveError(fromApi, t);
      setAddFormErr(friendly);
    } finally {
      setSaving(false);
    }
  };

  const resolvedParcelFor = (ha: HaRow): ParcelAug | undefined => {
    const pid = normalizeHarvestParcelId(ha.parcelId, ha.parcel ?? null);
    const local = parcelById.get(pid);
    if (local) return local;
    if (ha.parcel?.id) {
      return {
        id: ha.parcel.id,
        cropType: ha.parcel.cropType,
        estateId: '',
        calculatedArea: ha.parcel.calculatedArea,
        estateName: ha.parcel.estates?.name || '—',
        approvedAt: 'x',
      };
    }
    return undefined;
  };

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

  const visibleVarieties = useMemo(() => {
    if (cropFilter === 'all') {
      return CROP_CATALOG.flatMap((c) => c.items.map((it) => ({ cat: c.id, row: it })));
    }
    const cat = CROP_CATALOG.find((c) => c.id === cropFilter);
    return (cat?.items ?? []).map((row) => ({ cat: cropFilter, row }));
  }, [cropFilter]);

  const filteredVarieties = useMemo(() => {
    const q = cropSearch.trim().toLowerCase();
    if (!q) return visibleVarieties;
    return visibleVarieties.filter(({ row }) => {
      const sr = row.cropTypeSr.toLowerCase();
      const en = row.cropTypeEn.toLowerCase();
      const loc = cropTypeForLocale(row, langSr).toLowerCase();
      return sr.includes(q) || en.includes(q) || loc.includes(q);
    });
  }, [visibleVarieties, cropSearch, langSr]);

  const sheetHeight = Math.round(Dimensions.get('window').height * 0.88);
  const parcelChosen = parcelList.length === 1 || formParcelId.trim().length > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <BioVeraSubpageHeader
        title={t('producer.plantings.screenTitle')}
        left="back"
        right={
          <TouchableOpacity
            onPress={() => openAdd()}
            disabled={loading || saving}
            accessibilityLabel={t('producer.plantings.addAccessibility')}
            hitSlop={10}
            style={{ opacity: loading || saving ? 0.35 : 1 }}
          >
            <Plus size={26} color={theme.colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
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
        <Text style={{ fontSize: 14, color: theme.colors.text.secondary, lineHeight: 20, marginBottom: theme.spacing.sm }}>
          {t('producer.plantings.introShort')}
        </Text>
        <Text style={{ fontSize: 13, color: theme.colors.primary, lineHeight: 20, marginBottom: theme.spacing.md }}>
          {t('producer.plantings.progressRuleShort', { days: 18 })}
        </Text>

        {err ? (
          <View
            style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.errorLight,
              borderRadius: theme.borderRadius.md,
              marginBottom: theme.spacing.md,
            }}
          >
            <Text style={{ color: theme.colors.error, fontSize: 14 }}>{err}</Text>
          </View>
        ) : null}

        {announcementsWarn && !err ? (
          <View
            style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.warningLight,
              borderRadius: theme.borderRadius.md,
              marginBottom: theme.spacing.md,
              borderWidth: 1,
              borderColor: `${theme.colors.warning}35`,
            }}
          >
            <Text style={{ color: theme.colors.text.primary, fontSize: 14 }}>{announcementsWarn}</Text>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={theme.colors.primary} />
        ) : (
          <>
            <Text style={{ fontSize: 17, fontWeight: '700', color: theme.colors.text.primary, marginBottom: theme.spacing.sm }}>
              {t('producer.plantings.listTitle')}
            </Text>

            {plantingsSorted.length === 0 ? (
              <View style={{ marginBottom: theme.spacing.lg }}>
                <Text style={{ fontSize: 14, color: theme.colors.text.secondary }}>
                  {t('producer.plantings.empty')}
                </Text>
                {parcelList.some((p) => (p.cropType ?? '').trim().length > 0) ? (
                  <Text
                    style={{
                      fontSize: 13,
                      color: theme.colors.text.tertiary,
                      marginTop: theme.spacing.sm,
                      lineHeight: 19,
                    }}
                  >
                    {t('producer.plantings.emptyHintParcelCrop')}
                  </Text>
                ) : null}
              </View>
            ) : (
              plantingsSorted.map((a) => {
                const pr = resolvedParcelFor(a);
                const areaM2 =
                  typeof pr?.calculatedArea === 'number'
                    ? pr.calculatedArea
                    : typeof a.parcel?.calculatedArea === 'number'
                      ? a.parcel.calculatedArea
                      : null;
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => setDetailHa(a)}
                    style={({ pressed }) => ({
                      padding: theme.spacing.md,
                      marginBottom: theme.spacing.sm,
                      borderRadius: theme.borderRadius.lg,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: pressed ? theme.colors.primaryLight : theme.colors.surfaceElevated,
                    })}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text.primary }}>{a.cropType}</Text>
                    {a.localQueue ? (
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color:
                            a.localQueue.queueStatus === 'error'
                              ? theme.colors.error
                              : a.localQueue.queueStatus === 'syncing'
                                ? theme.colors.primary
                                : theme.colors.warning,
                          marginTop: 4,
                        }}
                      >
                        {a.localQueue.queueStatus === 'error'
                          ? t('producer.plantings.localQueueError')
                          : a.localQueue.queueStatus === 'syncing'
                            ? t('producer.plantings.localQueueSyncing')
                            : t('producer.plantings.localQueuePending')}
                      </Text>
                    ) : null}
                    <Text style={{ fontSize: 14, color: theme.colors.primary, marginTop: 6, fontWeight: '600' }}>
                      📍{' '}
                      {pr?.estateName ?? a.parcel?.estates?.name ?? ''}
                      {' — '}
                      {pr?.cropType ?? a.parcel?.cropType ?? parcelLabelSnippet(a)}
                      {areaM2 != null ? ` · ${formatArea(areaM2, langSr)}` : ''}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, marginTop: 8 }}>
                      {formatWhen(a.estimatedDate)} ·{' '}
                      {t(`producer.plantings.ha_${a.status}`, { defaultValue: a.status })}
                    </Text>
                    <TouchableOpacity
                      onPress={() => goHarvestForPlanting(a)}
                      activeOpacity={0.85}
                      style={{
                        marginTop: 12,
                        alignSelf: 'flex-start',
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        borderRadius: theme.borderRadius.md,
                        backgroundColor: theme.colors.primary,
                        minHeight: 44,
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>
                        {t('producer.plantings.openHarvestPlanCta')} →
                      </Text>
                    </TouchableOpacity>
                    {a.localQueue?.queueStatus === 'error' && a.localQueue.queueError ? (
                      <Text style={{ fontSize: 12, color: theme.colors.error, marginTop: 6 }}>
                        {a.localQueue.queueError}
                      </Text>
                    ) : null}
                    {a.plantingProgress ? (
                      <View style={{ marginTop: 8 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            color: a.plantingProgress.isOverdue ? theme.colors.error : theme.colors.text.secondary,
                            lineHeight: 18,
                          }}
                        >
                          {a.plantingProgress.isOverdue
                            ? t('producer.plantings.progressOverdue', { days: a.plantingProgress.daysOverdue })
                            : t('producer.plantings.progressOk', {
                                date: formatDateShort(a.plantingProgress.nextDueAt),
                              })}
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/(producer)/growth-journal')} hitSlop={{ top: 8, bottom: 8 }}>
                          <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: '600', marginTop: 4 }}>
                            {t('producer.plantings.progressOpenJournal')} →
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })
            )}

            <Text
              style={{
                fontSize: 17,
                fontWeight: '700',
                color: theme.colors.text.primary,
                marginTop: theme.spacing.lg,
                marginBottom: theme.spacing.sm,
              }}
            >
              {t('producer.plantings.sectionHarvests')}
            </Text>
            {harvestsSorted.length === 0 ? (
              <Text style={{ fontSize: 14, color: theme.colors.text.secondary }}>{t('producer.plantings.harvestEmpty')}</Text>
            ) : (
              harvestsSorted.map((a) => {
                const pr = resolvedParcelFor(a);
                const areaM2 =
                  typeof pr?.calculatedArea === 'number'
                    ? pr.calculatedArea
                    : typeof a.parcel?.calculatedArea === 'number'
                      ? a.parcel.calculatedArea
                      : null;
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => setDetailHa(a)}
                    style={({ pressed }) => ({
                      padding: theme.spacing.md,
                      marginBottom: theme.spacing.sm,
                      borderRadius: theme.borderRadius.lg,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: pressed ? theme.colors.primaryLight : theme.colors.surfaceElevated,
                    })}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Wheat size={18} color={theme.colors.primary} strokeWidth={2} />
                      <Text style={{ fontSize: 15, fontWeight: '700', flex: 1 }}>{a.cropType}</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: theme.colors.primary, fontWeight: '600' }}>
                      📍 {pr?.estateName ?? a.parcel?.estates?.name ?? ''}
                      {' — '}
                      {pr?.cropType ?? a.parcel?.cropType ?? ''}
                      {areaM2 != null ? ` · ${formatArea(areaM2, langSr)}` : ''}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, marginTop: 8 }}>
                      {formatWhen(a.estimatedDate)} · {t(`producer.plantings.ha_${a.status}`, { defaultValue: a.status })}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* Detail modal */}
      <Modal visible={detailHa != null} animationType="slide" transparent presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: theme.colors.background,
              borderTopLeftRadius: theme.borderRadius.lg,
              borderTopRightRadius: theme.borderRadius.lg,
              paddingHorizontal: p.screenPaddingLeft,
              paddingBottom: Math.max(p.bottomInset, theme.spacing.md),
              maxHeight: '88%',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme.spacing.sm }}>
              <Text style={{ fontSize: 18, fontWeight: '700', flex: 1 }}>{t('producer.plantings.detailTitle')}</Text>
              <TouchableOpacity onPress={() => setDetailHa(null)} hitSlop={12}>
                <X size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
            {detailHa ? (
              <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled">
                <DetailBody
                  ha={detailHa}
                  pr={resolvedParcelFor(detailHa)}
                  langSr={langSr}
                  t={t}
                  formatWhen={formatWhen}
                  formatDateShort={formatDateShort}
                  formatAreaFn={formatArea}
                  onOpenHarvest={
                    String(detailHa.announcementType ?? '').toUpperCase() === 'PLANTING'
                      ? () => goHarvestForPlanting(detailHa)
                      : undefined
                  }
                />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Add planting modal — fixed footer save, compact crop list + search */}
      <Modal visible={addOpen} animationType="slide" transparent presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{
              height: sheetHeight,
              backgroundColor: theme.colors.background,
              borderTopLeftRadius: theme.borderRadius.lg,
              borderTopRightRadius: theme.borderRadius.lg,
              paddingHorizontal: p.screenPaddingLeft,
            }}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme.spacing.sm }}>
                <Text style={{ fontSize: 18, fontWeight: '700', flex: 1 }}>{t('producer.plantings.formSectionTitle')}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setAddFormErr(null);
                    setAddOpen(false);
                  }}
                  hitSlop={12}
                >
                  <X size={24} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {parcelList.length === 0 ? (
                <Text style={{ paddingVertical: theme.spacing.lg, color: theme.colors.warning }}>{t('producer.plantings.approvedOnlyHint')}</Text>
              ) : (
                <>
                  <ScrollView
                    style={{ flex: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: theme.spacing.sm }}
                  >
                    {parcelList.length === 1 ? (
                      <View
                        style={{
                          padding: theme.spacing.sm,
                          marginBottom: theme.spacing.md,
                          borderRadius: theme.borderRadius.md,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          backgroundColor: theme.colors.surfaceElevated,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: theme.colors.text.tertiary }}>{t('producer.plantings.parcelLockedHint')}</Text>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text.primary, marginTop: 6 }}>
                          {parcelList[0].estateName}
                        </Text>
                        <Text style={{ fontSize: 13, color: theme.colors.text.secondary, marginTop: 4 }}>
                          {parcelList[0].cropType || '—'}
                          {typeof parcelList[0].calculatedArea === 'number'
                            ? ` · ${formatArea(parcelList[0].calculatedArea, langSr)}`
                            : ''}
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 8, color: theme.colors.text.secondary }}>
                          {t('producer.plantings.selectParcel')}
                        </Text>
                        {/* Avoid nested ScrollView (Android): parcel tiles scroll with parent sheet */}
                        <View style={{ gap: theme.spacing.xs, marginBottom: theme.spacing.md }}>
                          {parcelList.map((par) => {
                            const sel = formParcelId === par.id;
                            const aM2 =
                              typeof par.calculatedArea === 'number'
                                ? `${formatArea(par.calculatedArea, langSr)}`
                                : '—';
                            return (
                              <TouchableOpacity
                                key={par.id}
                                onPress={() => {
                                  setFormParcelId(par.id);
                                  setAddFormErr(null);
                                }}
                                activeOpacity={0.85}
                                style={{
                                  padding: theme.spacing.sm,
                                  borderRadius: theme.borderRadius.md,
                                  borderWidth: 2,
                                  borderColor: sel ? theme.colors.primary : theme.colors.border,
                                  backgroundColor: sel ? theme.colors.primaryLight : theme.colors.surface,
                                }}
                              >
                                <Text style={{ fontWeight: '700', color: theme.colors.text.primary }}>{par.estateName}</Text>
                                <Text style={{ fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 }}>
                                  {par.cropType || `${par.id.slice(0, 8)}…`} · {aM2}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </>
                    )}

                    {parcelList.length > 1 && !parcelChosen ? (
                      <Text
                        style={{
                          fontSize: 13,
                          color: theme.colors.text.secondary,
                          marginBottom: theme.spacing.md,
                          lineHeight: 19,
                        }}
                      >
                        {t('producer.plantings.selectParcelBeforeCrop')}
                      </Text>
                    ) : null}

                    {!parcelChosen && parcelList.length > 1 ? null : (
                      <>
                        <Text style={{ fontSize: 15, fontWeight: '700', marginBottom: theme.spacing.xs }}>
                          {t('producer.plantings.createPlantingHeading')}
                        </Text>

                        <Text style={{ fontSize: 12, marginBottom: 6, color: theme.colors.text.secondary }}>
                          {t('producer.plantings.pickCategory')}
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: theme.spacing.sm }}>
                          <TouchableOpacity onPress={() => setCropFilter('all')} style={chipStyles(cropFilter === 'all', theme)}>
                            <Text style={{ fontWeight: '600', fontSize: 13 }}>{t('producer.plantings.filterAll')}</Text>
                          </TouchableOpacity>
                          {CROP_CATALOG.map((c) => (
                            <TouchableOpacity key={c.id} onPress={() => setCropFilter(c.id)} style={chipStyles(cropFilter === c.id, theme)}>
                              <Text style={{ fontWeight: '600', fontSize: 13 }}>{langSr ? c.labelSr : c.labelEn}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>

                        <Text style={{ fontSize: 12, marginBottom: 6, color: theme.colors.text.secondary }}>
                          {t('producer.plantings.pickVariety')}
                        </Text>
                        <TextInput
                          style={[inputStyle, { marginBottom: 8, paddingVertical: 10 }]}
                          value={cropSearch}
                          onChangeText={setCropSearch}
                          placeholder={t('producer.plantings.cropSearchPlaceholder')}
                          placeholderTextColor={theme.colors.text.tertiary}
                        />

                        <View
                          style={{
                            maxHeight: 168,
                            marginBottom: theme.spacing.sm,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            borderRadius: theme.borderRadius.md,
                            backgroundColor: theme.colors.surface,
                            overflow: 'hidden',
                          }}
                        >
                          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
                            {filteredVarieties.length === 0 ? (
                              <Text style={{ fontSize: 13, color: theme.colors.text.tertiary, padding: theme.spacing.md }}>
                                {t('producer.plantings.noCropMatch')}
                              </Text>
                            ) : (
                              filteredVarieties.map(({ row }, idx) => {
                                const label = cropTypeForLocale(row, langSr);
                                const picked =
                                  selectedVariety?.cropTypeSr === row.cropTypeSr &&
                                  selectedVariety?.cropTypeEn === row.cropTypeEn;
                                return (
                                  <TouchableOpacity
                                    key={`${row.cropTypeEn}-${idx}`}
                                    onPress={() => {
                                      setSelectedVariety(row);
                                      setCustomCropOther('');
                                      setAddFormErr(null);
                                    }}
                                    style={{
                                      paddingVertical: 12,
                                      paddingHorizontal: theme.spacing.md,
                                      borderBottomWidth: idx < filteredVarieties.length - 1 ? 1 : 0,
                                      borderBottomColor: theme.colors.border,
                                      backgroundColor: picked ? theme.colors.primaryLight : theme.colors.surface,
                                    }}
                                  >
                                    <Text style={{ fontSize: 15, color: theme.colors.text.primary, fontWeight: picked ? '700' : '500' }}>
                                      {label}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })
                            )}
                          </ScrollView>
                        </View>

                        <Text style={{ fontSize: 12, marginBottom: 4, color: theme.colors.text.secondary }}>
                          {t('producer.plantings.customCropHint')}
                        </Text>
                        <TextInput
                          style={[inputStyle, { marginBottom: theme.spacing.sm, paddingVertical: 10 }]}
                          value={customCropOther}
                          onChangeText={(txt) => {
                            setCustomCropOther(txt);
                            if (txt.trim()) {
                              setSelectedVariety(null);
                              setAddFormErr(null);
                            }
                          }}
                          placeholder={t('producer.plantings.customCropPlaceholder')}
                          placeholderTextColor={theme.colors.text.tertiary}
                        />

                        <Text style={{ fontSize: 12, marginBottom: 4, color: theme.colors.text.secondary }}>
                          {t('producer.plantings.fieldDate')}
                        </Text>
                        <Text style={{ fontSize: 11, color: theme.colors.text.tertiary, marginBottom: 4 }}>
                          {t('producer.plantings.fieldDateHint')}
                        </Text>
                        <TextInput
                          style={[inputStyle, { marginBottom: theme.spacing.sm, paddingVertical: 10 }]}
                          value={formDate}
                          onChangeText={(v) => {
                            setFormDate(v);
                            setAddFormErr(null);
                          }}
                          placeholder={t('producer.plantings.fieldDatePlaceholder')}
                          placeholderTextColor={theme.colors.text.tertiary}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />

                        <Text style={{ fontSize: 12, marginBottom: 4, color: theme.colors.text.secondary }}>
                          {t('producer.plantings.fieldNotes')}
                        </Text>
                        <TextInput
                          style={[inputStyle, { minHeight: 56, marginBottom: 4, paddingVertical: 10 }]}
                          value={formNotes}
                          onChangeText={setFormNotes}
                          multiline
                          placeholderTextColor={theme.colors.text.tertiary}
                        />
                      </>
                    )}
                  </ScrollView>

                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: theme.colors.border,
                      paddingTop: theme.spacing.sm,
                      paddingBottom: Math.max(p.bottomInset, theme.spacing.sm),
                    }}
                  >
                    {addFormErr ? (
                      <Text
                        style={{
                          color: theme.colors.error,
                          fontSize: 13,
                          marginBottom: theme.spacing.sm,
                          lineHeight: 18,
                        }}
                      >
                        {addFormErr}
                      </Text>
                    ) : null}
                    <TouchableOpacity
                      onPress={() => void submitPlanting()}
                      disabled={saving || !parcelChosen}
                      style={{
                        paddingVertical: 14,
                        borderRadius: theme.borderRadius.md,
                        alignItems: 'center',
                        backgroundColor: saving || !parcelChosen ? theme.colors.text.tertiary : theme.colors.primary,
                        opacity: saving ? 0.85 : 1,
                      }}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{t('producer.plantings.submit')}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function chipStyles(active: boolean, th: typeof theme): object {
  return {
    marginRight: 8,
    marginBottom: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: th.borderRadius.md,
    borderWidth: 2,
    borderColor: active ? th.colors.primary : th.colors.border,
    backgroundColor: active ? th.colors.primaryLight : th.colors.surface,
  };
}

function DetailBody({
  ha,
  pr,
  langSr,
  t,
  formatWhen,
  formatDateShort,
  formatAreaFn,
  onOpenHarvest,
}: {
  ha: HaRow;
  pr?: ParcelAug;
  langSr: boolean;
  t: (k: string, o?: Record<string, unknown>) => string;
  formatWhen: (iso: string) => string;
  formatDateShort: (iso: string) => string;
  formatAreaFn: (m2: number, lng: boolean) => string;
  onOpenHarvest?: () => void;
}) {
  const areaM2 =
    typeof pr?.calculatedArea === 'number'
      ? pr.calculatedArea
      : typeof ha.parcel?.calculatedArea === 'number'
        ? ha.parcel.calculatedArea
        : null;
  return (
    <View style={{ paddingBottom: theme.spacing.lg }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: theme.colors.text.primary }}>{ha.cropType}</Text>
      <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, marginTop: 6 }}>
        {String(ha.announcementType ?? '').toUpperCase() === 'PLANTING'
          ? t('producer.plantings.typePlanting')
          : t('producer.plantings.typeHarvest')}
      </Text>

      <Text style={{ fontSize: 14, fontWeight: '700', marginTop: theme.spacing.md, color: theme.colors.text.primary }}>{t('producer.plantings.detailParcel')}</Text>
      <Text style={{ fontSize: 15, color: theme.colors.text.secondary, marginTop: 4 }}>
        {pr?.estateName ?? ha.parcel?.estates?.name ?? '—'}
      </Text>
      <Text style={{ fontSize: 15, color: theme.colors.text.secondary, marginTop: 4 }}>
        {t('producer.plantings.detailBlock')}: {pr?.cropType ?? ha.parcel?.cropType ?? parcelLabelSnippet(ha)}
      </Text>
      {areaM2 != null ? (
        <Text style={{ fontSize: 15, color: theme.colors.text.secondary, marginTop: 4 }}>
          {t('producer.plantings.detailArea')}: {formatAreaFn(areaM2, langSr)}
        </Text>
      ) : null}

      <Text style={{ fontSize: 14, fontWeight: '700', marginTop: theme.spacing.md }}>{t('producer.plantings.detailPlanDate')}</Text>
      <Text style={{ marginTop: 4, color: theme.colors.text.secondary }}>{formatWhen(ha.estimatedDate)}</Text>

      {ha.createdAt ? (
        <>
          <Text style={{ fontSize: 14, fontWeight: '700', marginTop: theme.spacing.md }}>{t('producer.plantings.detailRecorded')}</Text>
          <Text style={{ marginTop: 4, color: theme.colors.text.tertiary, fontSize: 13 }}>{formatWhen(ha.createdAt)}</Text>
        </>
      ) : null}

      {typeof ha.estimatedQuantity === 'number' ? (
        <>
          <Text style={{ fontSize: 14, fontWeight: '700', marginTop: theme.spacing.md }}>{t('producer.plantings.detailQtyKg')}</Text>
          <Text style={{ marginTop: 4, color: theme.colors.text.secondary }}>{ha.estimatedQuantity} kg</Text>
        </>
      ) : null}

      <Text style={{ fontSize: 14, fontWeight: '700', marginTop: theme.spacing.md }}>{t('producer.plantings.detailStatus')}</Text>
      <Text style={{ marginTop: 4, color: theme.colors.text.secondary }}>{t(`producer.plantings.ha_${ha.status}`, { defaultValue: ha.status })}</Text>

      {ha.localQueue ? (
        <View
          style={{
            marginTop: theme.spacing.md,
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            borderWidth: 1,
            borderColor: theme.colors.warning,
            backgroundColor: theme.colors.warningLight,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text.primary }}>
            {ha.localQueue.queueStatus === 'error'
              ? t('producer.plantings.localQueueError')
              : ha.localQueue.queueStatus === 'syncing'
                ? t('producer.plantings.localQueueSyncing')
                : t('producer.plantings.localQueuePending')}
          </Text>
          {ha.localQueue.queueError ? (
            <Text style={{ fontSize: 12, color: theme.colors.error, marginTop: 8, lineHeight: 18 }}>
              {ha.localQueue.queueError}
            </Text>
          ) : null}
        </View>
      ) : null}

      {String(ha.announcementType ?? '').toUpperCase() === 'PLANTING' && ha.plantingProgress ? (
        <View
          style={{
            marginTop: theme.spacing.md,
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            borderWidth: 1,
            borderColor: ha.plantingProgress.isOverdue ? theme.colors.errorLight : theme.colors.border,
            backgroundColor: ha.plantingProgress.isOverdue ? theme.colors.errorLight : theme.colors.surfaceElevated,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text.primary }}>
            {t('producer.plantings.detailProgressTitle')}
          </Text>
          <Text style={{ fontSize: 13, color: theme.colors.text.secondary, marginTop: 8, lineHeight: 20 }}>
            {t('producer.plantings.detailProgressInterval', {
              days: ha.plantingProgress.intervalDays,
              last: ha.plantingProgress.lastGrowthLogAt
                ? formatDateShort(ha.plantingProgress.lastGrowthLogAt)
                : '—',
            })}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              marginTop: 6,
              color: ha.plantingProgress.isOverdue ? theme.colors.error : theme.colors.primary,
            }}
          >
            {ha.plantingProgress.isOverdue
              ? t('producer.plantings.detailProgressOverdue', { days: ha.plantingProgress.daysOverdue })
              : t('producer.plantings.detailProgressNext', { date: formatDateShort(ha.plantingProgress.nextDueAt) })}
          </Text>
        </View>
      ) : null}

      {String(ha.announcementType ?? '').toUpperCase() === 'PLANTING' && onOpenHarvest ? (
        <TouchableOpacity
          onPress={onOpenHarvest}
          activeOpacity={0.85}
          style={{
            marginTop: theme.spacing.lg,
            paddingVertical: 14,
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            backgroundColor: theme.colors.primary,
            alignItems: 'center',
            minHeight: 48,
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>{t('producer.plantings.openHarvestPlanCta')} →</Text>
        </TouchableOpacity>
      ) : null}

      {ha.notes ? (
        <>
          <Text style={{ fontSize: 14, fontWeight: '700', marginTop: theme.spacing.md }}>{t('producer.plantings.fieldNotes')}</Text>
          <Text style={{ marginTop: 4, color: theme.colors.text.secondary, lineHeight: 22 }}>{ha.notes}</Text>
        </>
      ) : null}
    </View>
  );
}
