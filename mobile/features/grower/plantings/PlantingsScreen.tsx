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
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Wheat, Plus, X, MapPin, Sprout, Check, ChevronRight, Calendar } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { harvestAnnouncementsAPI, type CreateHarvestPlanBody } from '../../../lib/api';
import { isDeviceOnline } from '../../../lib/network-utils';
import { offlineStorage } from '../../../lib/offline-storage';
import { syncService } from '../../../lib/sync-service';
import { apiErrorMessage, axiosLikeMessage, isLikelyNetworkError } from '../../../lib/api-error';
import { usePlantingsData, type HaRow, type ParcelAug } from './usePlantingsData';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { theme } from '../../../lib/theme';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import {
  CROP_CATALOG,
  type CropVarietyRow,
  cropTypeForLocale,
  formatArea,
} from './crop-catalog';
import { mapPlantingSaveError } from './map-planting-save-error';
import { plantingFormDateToEstimatedIsoUtc } from './planting-estimated-date';
import { parcelEligibleForHarvestPlan } from '../../../lib/parcel-eligible-for-harvest-plan';
import { normalizeHarvestParcelId } from '../harvest/useHarvestData';

function parcelLabelSnippet(ha: HaRow): string {
  const id = normalizeHarvestParcelId(ha.parcelId, ha.parcel ?? null);
  return id ? id.slice(0, 8) : '—';
}

export default function PlantingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const routeParams = useLocalSearchParams<{ openAdd?: string; parcelId?: string }>();
  const p = useBioVeraScreenPadding();
  const langSr = !!i18n.language?.startsWith('sr');

  const {
    loading,
    refreshing,
    err,
    announcementsWarn,
    announcementsWarnDetail,
    announcements,
    parcelList,
    reload,
  } = usePlantingsData();
  const [saving, setSaving] = useState(false);

  /** Add modal — step 1: parcel, step 2: crop */
  const [addOpen, setAddOpen] = useState(false);
  const [addWizardStep, setAddWizardStep] = useState<1 | 2>(1);
  const [formParcelId, setFormParcelId] = useState('');
  const [selectedVariety, setSelectedVariety] = useState<CropVarietyRow | null>(null);
  const [customCropOther, setCustomCropOther] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formNotes, setFormNotes] = useState('');
  const [showCropOther, setShowCropOther] = useState(false);
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

  const resetAddForm = useCallback(() => {
    setFormParcelId('');
    setAddWizardStep(1);
    setSelectedVariety(null);
    setCustomCropOther('');
    setShowCropOther(false);
    setAddFormErr(null);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormNotes('');
  }, []);

  /** When modal opens with exactly one parcel, bind it reliably (e.g. list finished loading after open). */
  useEffect(() => {
    if (!addOpen) return;
    if (parcelList.length === 1) setFormParcelId(parcelList[0].id);
  }, [addOpen, parcelList]);

  const openAdd = useCallback(
    (presetParcelId?: string) => {
      setAddFormErr(null);
      setSelectedVariety(null);
      setCustomCropOther('');
      setShowCropOther(false);
      setFormDate(new Date().toISOString().slice(0, 10));
      setFormNotes('');
      const pid = presetParcelId ?? (parcelList.length === 1 ? parcelList[0].id : '');
      setFormParcelId(pid);
      setAddWizardStep(pid ? 2 : 1);
      setAddOpen(true);
    },
    [parcelList],
  );

  useEffect(() => {
    if (routeParams.openAdd !== '1') return;
    const pid = routeParams.parcelId ? String(routeParams.parcelId) : undefined;
    openAdd(pid);
  }, [routeParams.openAdd, routeParams.parcelId, openAdd]);

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
      void reload();
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
    try {
      if (!(await isDeviceOnline())) {
        await offlineStorage.savePendingHarvestPlan({ payload });
        void syncService.getSyncStatus();
        Alert.alert(t('alerts.success'), t('producer.harvest.queuedOffline'));
        setAddOpen(false);
        resetAddForm();
        await reload();
        return;
      }
      await harvestAnnouncementsAPI.create(payload);
      Alert.alert(t('alerts.success'), t('producer.plantings.savedOk'));
      setAddOpen(false);
      resetAddForm();
      await reload();
    } catch (e: unknown) {
      if (isLikelyNetworkError(e)) {
        try {
          await offlineStorage.savePendingHarvestPlan({ payload });
          void syncService.getSyncStatus();
          Alert.alert(t('alerts.success'), t('producer.harvest.queuedOffline'));
          setAddOpen(false);
          resetAddForm();
          await reload();
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

  const inputStyle = growerUi.formInput;

  const allCropVarieties = useMemo(
    () => CROP_CATALOG.flatMap((c) => c.items),
    [],
  );

  const cropChosen = Boolean(selectedVariety || customCropOther.trim());

  const sheetHeight = Math.round(Dimensions.get('window').height * 0.88);

  return (
    <View style={growerUi.canvas}>
      <BioVeraSubpageHeader
        title={t('producer.plantings.screenTitle')}
        left="back"
        right={
          <TouchableOpacity
            onPress={() => openAdd()}
            disabled={loading || saving}
            accessibilityLabel={t('producer.plantings.addAccessibility')}
            hitSlop={10}
            style={{ opacity: loading || saving ? 0.35 : 1, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
          >
            <Plus size={26} color={enterpriseColors.primary} strokeWidth={2} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void reload()}
            tintColor={enterpriseColors.primary}
          />
        }
        contentContainerStyle={[growerUi.scrollContent, { paddingBottom: Math.max(p.bottomInset, 24) }]}
      >
        <View style={styles.leadBox}>
          <Text style={styles.leadTitle}>{t('producer.plantings.listTitle')}</Text>
          <Text style={styles.leadText}>{t('producer.plantings.introShort')}</Text>
          <Text style={styles.leadHint}>{t('producer.plantings.progressRuleShort', { days: 18 })}</Text>
        </View>

        {err ? (
          <View style={styles.errBanner}>
            <Text style={styles.errBannerText}>{err}</Text>
          </View>
        ) : null}

        {announcementsWarn && !err ? (
          <View style={styles.warnBanner}>
            <Text style={styles.warnBannerText}>{announcementsWarn}</Text>
            {announcementsWarnDetail ? (
              <Text style={styles.warnBannerDetail}>{announcementsWarnDetail}</Text>
            ) : null}
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={enterpriseColors.primary} />
        ) : (
          <>
            <Text style={growerUi.sectionLabel}>{t('producer.plantings.sectionPlantings')}</Text>

            {plantingsSorted.length === 0 ? (
              <View style={styles.emptyCard}>
                <Sprout size={40} color={enterpriseColors.gray600} strokeWidth={1.5} />
                <Text style={styles.emptyText}>{t('producer.plantings.empty')}</Text>
                {parcelList.some((par) => (par.cropType ?? '').trim().length > 0) ? (
                  <Text style={styles.emptyHint}>{t('producer.plantings.emptyHintParcelCrop')}</Text>
                ) : null}
                <TouchableOpacity onPress={() => openAdd()} style={styles.emptyCta} activeOpacity={0.85}>
                  <Text style={styles.emptyCtaText}>{t('producer.plantings.addAccessibility')}</Text>
                </TouchableOpacity>
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
                    style={({ pressed }) => [styles.plantingCard, pressed && styles.cardPressed]}
                  >
                    <View style={styles.cardTopRow}>
                      <View style={styles.cardIconWrapGreen}>
                        <Sprout size={22} color={enterpriseColors.primary} strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cropTitle}>{a.cropType}</Text>
                        {a.localQueue ? (
                          <Text
                            style={[
                              styles.queueLabel,
                              a.localQueue.queueStatus === 'error' && styles.queueLabelError,
                            ]}
                          >
                            {a.localQueue.queueStatus === 'error'
                              ? t('producer.plantings.localQueueError')
                              : a.localQueue.queueStatus === 'syncing'
                                ? t('producer.plantings.localQueueSyncing')
                                : t('producer.plantings.localQueuePending')}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.statusPill}>
                        <Text style={styles.statusPillText}>
                          {t(`producer.plantings.ha_${a.status}`, { defaultValue: a.status })}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.parcelRow}>
                      <MapPin size={16} color={enterpriseColors.gray600} strokeWidth={2} />
                      <Text style={styles.parcelText} numberOfLines={2}>
                        {pr?.estateName ?? a.parcel?.estates?.name ?? ''}
                        {' · '}
                        {pr?.cropType ?? a.parcel?.cropType ?? parcelLabelSnippet(a)}
                        {areaM2 != null ? ` · ${formatArea(areaM2, langSr)}` : ''}
                      </Text>
                    </View>

                    <View style={styles.dateRow}>
                      <Calendar size={15} color={enterpriseColors.gray600} strokeWidth={1.5} />
                      <Text style={styles.dateText}>{formatWhen(a.estimatedDate)}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => goHarvestForPlanting(a)}
                      activeOpacity={0.85}
                      style={styles.secondaryBtn}
                    >
                      <Text style={styles.secondaryBtnText}>{t('producer.plantings.openHarvestPlanCta')}</Text>
                      <ChevronRight size={18} color={enterpriseColors.primary} strokeWidth={2} />
                    </TouchableOpacity>

                    {a.localQueue?.queueStatus === 'error' && a.localQueue.queueError ? (
                      <Text style={styles.inlineError}>{a.localQueue.queueError}</Text>
                    ) : null}

                    {a.plantingProgress ? (
                      <View style={styles.progressBox}>
                        <Text
                          style={[
                            styles.progressText,
                            a.plantingProgress.isOverdue && styles.progressTextOverdue,
                          ]}
                        >
                          {a.plantingProgress.isOverdue
                            ? t('producer.plantings.progressOverdue', { days: a.plantingProgress.daysOverdue })
                            : t('producer.plantings.progressOk', {
                                date: formatDateShort(a.plantingProgress.nextDueAt),
                              })}
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/(producer)/growth-journal')} hitSlop={8}>
                          <Text style={styles.progressLink}>{t('producer.plantings.progressOpenJournal')}</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })
            )}

            <Text style={[growerUi.sectionLabel, { marginTop: 8 }]}>{t('producer.plantings.sectionHarvests')}</Text>

            {harvestsSorted.length === 0 ? (
              <View style={styles.emptyCardCompact}>
                <Text style={styles.emptyText}>{t('producer.plantings.harvestEmpty')}</Text>
              </View>
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
                    style={({ pressed }) => [styles.harvestCard, pressed && styles.cardPressed]}
                  >
                    <View style={styles.cardTopRow}>
                      <View style={styles.cardIconWrapBlue}>
                        <Wheat size={22} color="#1D4ED8" strokeWidth={2} />
                      </View>
                      <Text style={styles.cropTitle}>{a.cropType}</Text>
                      <ChevronRight size={20} color={enterpriseColors.gray600} />
                    </View>
                    <View style={styles.parcelRow}>
                      <MapPin size={16} color={enterpriseColors.gray600} strokeWidth={2} />
                      <Text style={styles.parcelText} numberOfLines={2}>
                        {pr?.estateName ?? a.parcel?.estates?.name ?? ''}
                        {' · '}
                        {pr?.cropType ?? a.parcel?.cropType ?? ''}
                        {areaM2 != null ? ` · ${formatArea(areaM2, langSr)}` : ''}
                      </Text>
                    </View>
                    <View style={styles.dateRow}>
                      <Calendar size={15} color={enterpriseColors.gray600} strokeWidth={1.5} />
                      <Text style={styles.dateText}>
                        {formatWhen(a.estimatedDate)} · {t(`producer.plantings.ha_${a.status}`, { defaultValue: a.status })}
                      </Text>
                    </View>
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
                <View style={{ flex: 1, borderLeftWidth: 5, borderLeftColor: addWizardStep === 1 ? '#64748B' : theme.colors.primary, paddingLeft: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text.secondary, marginBottom: 4 }}>
                    {t('producer.fieldLogForm.farmerStepFraction', { step: addWizardStep, total: 2 })}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {addWizardStep === 1 ? (
                      <MapPin size={22} color="#64748B" strokeWidth={2} />
                    ) : (
                      <Sprout size={22} color={theme.colors.primary} strokeWidth={2} />
                    )}
                    <Text style={{ fontSize: 20, fontWeight: '800', flex: 1, color: theme.colors.text.primary }}>
                      {addWizardStep === 1
                        ? t('producer.plantings.wizardStepParcel')
                        : t('producer.plantings.wizardStepCrop')}
                    </Text>
                  </View>
                </View>
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
                <Text style={{ paddingVertical: theme.spacing.lg, color: theme.colors.warning }}>
                  {t('producer.plantings.noParcelsHint')}
                </Text>
              ) : (
                <>
                  <ScrollView
                    style={{ flex: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: theme.spacing.sm }}
                  >
                    {addWizardStep === 1 ? (
                      <>
                        <Text style={{ fontSize: 16, color: theme.colors.text.secondary, marginBottom: theme.spacing.md, lineHeight: 22 }}>
                          {t('producer.plantings.wizardParcelLead')}
                        </Text>
                        {parcelList.map((par) => {
                          const sel = formParcelId === par.id;
                          return (
                            <TouchableOpacity
                              key={par.id}
                              onPress={() => {
                                setFormParcelId(par.id);
                                setAddFormErr(null);
                              }}
                              activeOpacity={0.85}
                              style={{
                                padding: 16,
                                borderRadius: 16,
                                borderWidth: 2,
                                borderColor: sel ? '#475569' : '#CBD5E1',
                                backgroundColor: sel ? '#475569' : theme.colors.surface,
                                minHeight: 72,
                                marginBottom: 12,
                              }}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                                <MapPin size={22} color={sel ? '#fff' : '#64748B'} strokeWidth={2} />
                                <View style={{ flex: 1 }}>
                                  <Text style={{ fontSize: 20, fontWeight: '700', color: sel ? '#fff' : theme.colors.text.primary }}>
                                    {par.estateName}
                                  </Text>
                                  <Text style={{ fontSize: 15, color: sel ? 'rgba(255,255,255,0.85)' : theme.colors.text.secondary, marginTop: 4 }}>
                                    {par.cropType || `${par.id.slice(0, 8)}…`}
                                  </Text>
                                </View>
                                {sel ? <Check size={24} color="#fff" strokeWidth={2.5} /> : null}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </>
                    ) : (
                      <>
                        {formParcelId ? (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 8,
                              padding: theme.spacing.sm,
                              marginBottom: theme.spacing.md,
                              borderRadius: theme.borderRadius.md,
                              backgroundColor: theme.colors.surfaceElevated,
                            }}
                          >
                            <MapPin size={16} color="#64748B" />
                            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text.secondary }}>
                              {t('producer.plantings.wizardParcelLocked')}:
                            </Text>
                            <Text style={{ fontSize: 15, fontWeight: '700', flex: 1, color: theme.colors.text.primary }}>
                              {parcelById.get(formParcelId)?.estateName ?? '—'}
                            </Text>
                            {parcelList.length > 1 ? (
                              <TouchableOpacity onPress={() => setAddWizardStep(1)} hitSlop={8}>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.primary }}>
                                  {t('producer.fieldLogForm.wizardBack')}
                                </Text>
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        ) : null}

                        <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: theme.spacing.md, color: theme.colors.text.primary }}>
                          {t('producer.plantings.wizardCropLead')}
                        </Text>

                        {allCropVarieties.map((row) => {
                          const label = cropTypeForLocale(row, langSr);
                          const picked =
                            selectedVariety?.cropTypeSr === row.cropTypeSr &&
                            selectedVariety?.cropTypeEn === row.cropTypeEn;
                          return (
                            <TouchableOpacity
                              key={`${row.cropTypeEn}-${row.cropTypeSr}`}
                              onPress={() => {
                                setSelectedVariety(row);
                                setCustomCropOther('');
                                setShowCropOther(false);
                                setAddFormErr(null);
                              }}
                              activeOpacity={0.85}
                              style={{
                                padding: 18,
                                borderRadius: 16,
                                borderWidth: 2,
                                borderColor: theme.colors.primary,
                                backgroundColor: picked ? theme.colors.primary : `${theme.colors.primary}0A`,
                                minHeight: 72,
                                marginBottom: 12,
                                justifyContent: 'center',
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 22,
                                  fontWeight: '800',
                                  color: picked ? '#fff' : theme.colors.primary,
                                }}
                              >
                                {label}
                              </Text>
                              {picked ? (
                                <Check size={22} color="#fff" style={{ position: 'absolute', top: 14, right: 14 }} />
                              ) : null}
                            </TouchableOpacity>
                          );
                        })}

                        <TouchableOpacity
                          onPress={() => setShowCropOther((v) => !v)}
                          style={{ paddingVertical: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                        >
                          <ChevronRight
                            size={18}
                            color={enterpriseColors.gray600}
                            strokeWidth={2}
                            style={{ transform: [{ rotate: showCropOther ? '90deg' : '0deg' }] }}
                          />
                          <Text style={{ fontSize: 16, fontWeight: '600', color: enterpriseColors.gray600 }}>
                            {t('producer.plantings.customCropHint')}
                          </Text>
                        </TouchableOpacity>

                        {showCropOther ? (
                          <TextInput
                            style={[inputStyle, { marginBottom: theme.spacing.sm, paddingVertical: 14, fontSize: 18 }]}
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
                        ) : null}
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
                      onPress={() => {
                        if (addWizardStep === 1) {
                          if (!formParcelId.trim()) {
                            setAddFormErr(t('producer.plantings.validationParcel'));
                            return;
                          }
                          setAddFormErr(null);
                          setAddWizardStep(2);
                          return;
                        }
                        void submitPlanting();
                      }}
                      disabled={saving || (addWizardStep === 1 ? !formParcelId.trim() : !cropChosen)}
                      style={{
                        paddingVertical: 16,
                        borderRadius: theme.borderRadius.lg,
                        alignItems: 'center',
                        minHeight: 56,
                        backgroundColor:
                          saving || (addWizardStep === 1 ? !formParcelId.trim() : !cropChosen)
                            ? theme.colors.text.tertiary
                            : theme.colors.primary,
                        opacity: saving ? 0.85 : 1,
                      }}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>
                          {addWizardStep === 1
                            ? t('producer.fieldLogForm.farmerNext')
                            : t('producer.plantings.submit')}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  leadBox: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: `${enterpriseColors.primary}08`,
    borderWidth: 1,
    borderColor: `${enterpriseColors.primary}25`,
    marginBottom: 16,
  },
  leadTitle: { fontSize: 18, fontWeight: '600', color: enterpriseColors.gray900, marginBottom: 6 },
  leadText: { fontSize: 15, color: enterpriseColors.gray600, lineHeight: 22 },
  leadHint: { fontSize: 14, color: enterpriseColors.gray600, lineHeight: 20, marginTop: 8 },
  errBanner: {
    padding: 14,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errBannerText: { fontSize: 15, color: '#991B1B', lineHeight: 22 },
  warnBanner: {
    padding: 14,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warnBannerText: { fontSize: 15, color: enterpriseColors.gray900, lineHeight: 22 },
  warnBannerDetail: { fontSize: 14, color: enterpriseColors.gray600, marginTop: 8, lineHeight: 20 },
  emptyCard: {
    alignItems: 'center',
    padding: 28,
    borderRadius: 16,
    backgroundColor: enterpriseColors.white,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    marginBottom: 12,
  },
  emptyCardCompact: {
    padding: 20,
    borderRadius: 14,
    backgroundColor: enterpriseColors.white,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    marginBottom: 12,
  },
  emptyText: { fontSize: 16, color: enterpriseColors.gray600, textAlign: 'center', lineHeight: 24, marginTop: 12 },
  emptyHint: { fontSize: 14, color: enterpriseColors.gray600, textAlign: 'center', lineHeight: 20, marginTop: 8 },
  emptyCta: {
    marginTop: 16,
    backgroundColor: enterpriseColors.primary,
    borderRadius: 14,
    paddingHorizontal: 24,
    minHeight: 52,
    justifyContent: 'center',
  },
  emptyCtaText: { fontSize: 17, fontWeight: '600', color: '#fff' },
  plantingCard: {
    backgroundColor: enterpriseColors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    padding: 16,
    marginBottom: 12,
  },
  harvestCard: {
    backgroundColor: enterpriseColors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1D4ED8',
  },
  cardPressed: { opacity: 0.92 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  cardIconWrapGreen: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${enterpriseColors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconWrapBlue: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropTitle: { fontSize: 20, fontWeight: '800', color: enterpriseColors.gray900, flex: 1 },
  queueLabel: { fontSize: 12, fontWeight: '600', color: '#B45309', marginTop: 4 },
  queueLabelError: { color: '#DC2626' },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: `${enterpriseColors.primary}12`,
  },
  statusPillText: { fontSize: 11, fontWeight: '700', color: enterpriseColors.primary },
  parcelRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  parcelText: { flex: 1, fontSize: 15, fontWeight: '500', color: enterpriseColors.gray600, lineHeight: 21 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dateText: { fontSize: 14, color: enterpriseColors.gray600, fontWeight: '500' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: enterpriseColors.primary,
    minHeight: 48,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '700', color: enterpriseColors.primary },
  inlineError: { fontSize: 13, color: '#DC2626', marginTop: 8, lineHeight: 18 },
  progressBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: enterpriseColors.gray200,
  },
  progressText: { fontSize: 14, color: enterpriseColors.gray600, lineHeight: 20 },
  progressTextOverdue: { color: '#DC2626', fontWeight: '600' },
  progressLink: { fontSize: 15, fontWeight: '700', color: enterpriseColors.primary, marginTop: 6 },
});

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
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 14,
            paddingHorizontal: theme.spacing.md,
            borderRadius: 14,
            backgroundColor: enterpriseColors.primary,
            minHeight: 52,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#fff' }}>{t('producer.plantings.openHarvestPlanCta')}</Text>
          <ChevronRight size={20} color="#fff" strokeWidth={2} />
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
