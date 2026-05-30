import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sprout, Plus, MapPin, Calendar, ChevronRight, Wheat, X } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { harvestAnnouncementsAPI, type CreateHarvestPlanBody } from '../../../lib/api';
import { isDeviceOnline } from '../../../lib/network-utils';
import { offlineStorage } from '../../../lib/offline-storage';
import { syncService } from '../../../lib/sync-service';
import { apiErrorMessage, axiosLikeMessage, isLikelyNetworkError } from '../../../lib/api-error';
import { usePlantingsData, type HaRow, type ParcelAug } from './usePlantingsData';
import { PlantingAddWizard } from './PlantingAddWizard';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { BioVeraBottomSheet } from '../../../components/enterprise/BioVeraBottomSheet';
import { EnterpriseNotice } from '../../../components/enterprise/EnterpriseNotice';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { formatArea } from './crop-catalog';
import EmptyState from '../../../components/EmptyState';
import { mapPlantingSaveError } from './map-planting-save-error';
import { plantingFormDateToEstimatedIsoUtc } from './planting-estimated-date';
import { normalizeHarvestParcelId } from '../harvest/useHarvestData';
import { useAppLocaleTag } from '../../../lib/date-locale';

function parcelLabelSnippet(ha: HaRow): string {
  const id = normalizeHarvestParcelId(ha.parcelId, ha.parcel ?? null);
  return id ? id.slice(0, 8) : '—';
}

export default function PlantingsScreen({ embedded = false }: { embedded?: boolean }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const routeParams = useLocalSearchParams<{ openAdd?: string; parcelId?: string }>();
  const p = useBioVeraScreenPadding();
  const langSr = !!i18n.language?.startsWith('sr');
  const dateLocale = useAppLocaleTag();

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
  const [addOpen, setAddOpen] = useState(false);
  const [addFormErr, setAddFormErr] = useState<string | null>(null);
  const [detailHa, setDetailHa] = useState<HaRow | null>(null);
  const [presetParcelId, setPresetParcelId] = useState<string | undefined>();

  const parcelById = useMemo(() => new Map(parcelList.map((q) => [q.id, q])), [parcelList]);

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

  const harvestCount = useMemo(
    () =>
      announcements.filter((a) => String(a.announcementType ?? '').toUpperCase() === 'HARVEST').length,
    [announcements],
  );

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(producer)/(tabs)/field');
  };

  const openAdd = useCallback((pid?: string) => {
    setAddFormErr(null);
    setPresetParcelId(pid);
    setAddOpen(true);
  }, []);

  useEffect(() => {
    if (routeParams.openAdd !== '1') return;
    openAdd(routeParams.parcelId ? String(routeParams.parcelId) : undefined);
  }, [routeParams.openAdd, routeParams.parcelId, openAdd]);

  const formatWhen = useCallback(
    (iso: string) => {
      try {
        return new Date(iso).toLocaleString(dateLocale, { dateStyle: 'short', timeStyle: 'short' });
      } catch {
        return iso;
      }
    },
    [dateLocale],
  );

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
        label: ha.parcel.cropType || parcelLabelSnippet(ha),
      };
    }
    return undefined;
  };

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
        params: { harvestParcelId: parcelIdEff, harvestPlantingId: ha.id },
      });
    },
    [router, t],
  );

  const openGrowthJournal = useCallback(
    (ha: HaRow) => {
      const parcelIdEff = normalizeHarvestParcelId(ha.parcelId, ha.parcel ?? null);
      router.push({
        pathname: '/(producer)/growth-journal',
        params: {
          parcelId: parcelIdEff || undefined,
          plantingId: ha.id.startsWith('local:') ? undefined : ha.id,
        },
      });
    },
    [router],
  );

  const submitPlanting = async (payload: {
    parcelId: string;
    crop: string;
    date: string;
    notes: string;
  }) => {
    setAddFormErr(null);
    const crop = payload.crop.trim();
    if (!payload.parcelId.trim()) {
      setAddFormErr(t('producer.plantings.validationParcel'));
      return;
    }
    if (!parcelList.some((par) => par.id === payload.parcelId)) {
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
    const parsedDate = plantingFormDateToEstimatedIsoUtc(payload.date);
    if (!parsedDate.ok) {
      setAddFormErr(t('producer.plantings.validationDateFormat'));
      return;
    }

    const body: CreateHarvestPlanBody = {
      parcelId: payload.parcelId,
      announcementType: 'PLANTING',
      cropType: crop,
      estimatedDate: parsedDate.iso,
      notes: payload.notes.trim() || undefined,
    };

    setSaving(true);
    try {
      if (!(await isDeviceOnline())) {
        await offlineStorage.savePendingHarvestPlan({ payload: body });
        void syncService.getSyncStatus();
        Alert.alert(t('alerts.success'), t('producer.harvest.queuedOffline'));
        setAddOpen(false);
        await reload();
        return;
      }
      await harvestAnnouncementsAPI.create(body);
      Alert.alert(t('alerts.success'), t('producer.plantings.savedOk'));
      setAddOpen(false);
      await reload();
    } catch (e: unknown) {
      if (isLikelyNetworkError(e)) {
        try {
          await offlineStorage.savePendingHarvestPlan({ payload: body });
          void syncService.getSyncStatus();
          Alert.alert(t('alerts.success'), t('producer.harvest.queuedOffline'));
          setAddOpen(false);
          await reload();
          return;
        } catch {
          // fall through
        }
      }
      const fromApi =
        axiosLikeMessage(e) || apiErrorMessage(e, e instanceof Error ? e.message : '');
      setAddFormErr(mapPlantingSaveError(fromApi, t));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[growerUi.canvas, embedded && styles.embeddedRoot]}>
      {!embedded ? (
        <GrowerStackHeader
          title={t('producer.plantings.screenTitle')}
          subtitle={t('producer.plantings.introShort')}
          onBack={goBack}
        />
      ) : null}

      <View style={styles.headerActions}>
        <TouchableOpacity
          onPress={() => openAdd()}
          disabled={loading || saving}
          style={[enterpriseUi.authBtnPrimary, styles.addHeaderBtn, (loading || saving) && styles.disabled]}
          accessibilityRole="button"
          accessibilityLabel={t('producer.plantings.addAccessibility')}
        >
          <Plus size={20} color={enterpriseColors.white} strokeWidth={2} />
          <Text style={enterpriseUi.authBtnPrimaryText}>{t('producer.plantings.addAccessibility')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void reload()}
            tintColor={enterpriseColors.primary}
          />
        }
        contentContainerStyle={[growerUi.scrollContent, { paddingBottom: Math.max(p.bottomInset, 24) }]}
        keyboardShouldPersistTaps="handled"
      >
        {err ? <EnterpriseNotice title={err} /> : null}
        {announcementsWarn && !err ? (
          <EnterpriseNotice
            title={announcementsWarn}
            body={announcementsWarnDetail ?? undefined}
          />
        ) : null}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={enterpriseColors.primary} />
        ) : (
          <>
            {plantingsSorted.length === 0 ? (
              <>
                <EmptyState message={t('producer.plantings.empty')} icon={Sprout} />
                {parcelList.length === 0 ? (
                  <Text style={[styles.emptyHint, { textAlign: 'center', marginTop: 8 }]}>
                    {t('producer.plantings.noParcelsHint')}
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={() => openAdd()}
                    style={[enterpriseUi.authBtnPrimary, styles.emptyCta]}
                    activeOpacity={0.88}
                  >
                    <Text style={enterpriseUi.authBtnPrimaryText}>{t('producer.plantings.addAccessibility')}</Text>
                  </TouchableOpacity>
                )}
              </>
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
                    style={({ pressed }) => [growerUi.card, pressed && styles.cardPressed]}
                  >
                    <View style={styles.cardTop}>
                      <View style={styles.iconWrap}>
                        <Sprout size={22} color={enterpriseColors.primary} strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cropTitle}>{a.cropType}</Text>
                        {a.localQueue ? (
                          <Text
                            style={[
                              styles.queueLabel,
                              a.localQueue.queueStatus === 'error' && styles.queueError,
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
                      <Text style={styles.statusPill}>
                        {t(`producer.plantings.ha_${a.status}`, { defaultValue: a.status })}
                      </Text>
                    </View>

                    <View style={styles.metaRow}>
                      <MapPin size={16} color={enterpriseColors.gray600} />
                      <Text style={styles.metaText} numberOfLines={2}>
                        {pr?.label ?? pr?.cropType ?? parcelLabelSnippet(a)}
                        {areaM2 != null ? ` · ${formatArea(areaM2, langSr)}` : ''}
                      </Text>
                    </View>

                    <View style={styles.metaRow}>
                      <Calendar size={15} color={enterpriseColors.gray600} />
                      <Text style={styles.metaText}>{formatWhen(a.estimatedDate)}</Text>
                    </View>

                    {a.plantingProgress?.isOverdue ? (
                      <View style={styles.progressBox}>
                        <Text style={[styles.progressText, styles.progressOverdue]}>
                          {t('producer.plantings.progressOverdue', {
                            days: a.plantingProgress.daysOverdue,
                          })}
                        </Text>
                        <TouchableOpacity onPress={() => openGrowthJournal(a)} hitSlop={8}>
                          <Text style={styles.progressLink}>
                            {t('producer.plantings.progressOpenJournal')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })
            )}

            <TouchableOpacity
              onPress={() => router.push('/(producer)/(tabs)/harvest')}
              style={[growerUi.card, styles.harvestLink]}
              activeOpacity={0.88}
            >
              <View style={styles.harvestLinkRow}>
                <Wheat size={22} color={enterpriseColors.primary} strokeWidth={1.5} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.harvestLinkTitle}>{t('producer.plantings.sectionHarvestsShort')}</Text>
                  <Text style={styles.harvestLinkDesc}>
                    {harvestCount > 0
                      ? t('producer.plantings.harvestLinkCountShort', { count: harvestCount })
                      : t('producer.plantings.harvestEmpty')}
                  </Text>
                </View>
                <ChevronRight size={20} color={enterpriseColors.gray600} />
              </View>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <PlantingAddWizard
        visible={addOpen}
        saving={saving}
        parcels={parcelList}
        presetParcelId={presetParcelId}
        formErr={addFormErr}
        onClose={() => !saving && setAddOpen(false)}
        onSubmit={(payload) => void submitPlanting(payload)}
      />

      <BioVeraBottomSheet visible={detailHa != null} onClose={() => setDetailHa(null)}>
        <View style={{ paddingHorizontal: p.screenPaddingLeft, paddingBottom: Math.max(p.bottomInset, 16) }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('producer.plantings.detailTitle')}</Text>
            <TouchableOpacity onPress={() => setDetailHa(null)} hitSlop={12}>
              <X size={24} color={enterpriseColors.gray600} />
            </TouchableOpacity>
          </View>
          {detailHa ? (
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.detailCrop}>{detailHa.cropType}</Text>
              {(() => {
                const pr = resolvedParcelFor(detailHa);
                if (!pr) return null;
                const parcelLine = pr.cropType?.trim() || pr.label;
                return (
                  <>
                    <Text style={styles.detailLabel}>{t('producer.plantings.detailEstate')}</Text>
                    <Text style={styles.detailValue}>{pr.estateName || '—'}</Text>
                    <Text style={styles.detailLabel}>{t('producer.plantings.detailParcel')}</Text>
                    <Text style={styles.detailValue}>{parcelLine || '—'}</Text>
                  </>
                );
              })()}
              <Text style={styles.detailMeta}>{formatWhen(detailHa.estimatedDate)}</Text>
              <Text style={styles.detailStatus}>
                {t(`producer.plantings.ha_${detailHa.status}`, { defaultValue: detailHa.status })}
              </Text>
              {detailHa.notes ? <Text style={styles.detailNotes}>{detailHa.notes}</Text> : null}
              <TouchableOpacity
                onPress={() => goHarvestForPlanting(detailHa)}
                style={[enterpriseUi.authBtnPrimary, styles.detailBtn]}
              >
                <Text style={enterpriseUi.authBtnPrimaryText}>
                  {t('producer.plantings.openHarvestPlanCta')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setDetailHa(null);
                  openGrowthJournal(detailHa);
                }}
                style={[styles.detailBtnSecondary]}
              >
                <Text style={styles.detailBtnSecondaryText}>
                  {t('producer.plantings.progressOpenJournal')}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          ) : null}
        </View>
      </BioVeraBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
  },
  disabled: { opacity: 0.5 },
  emptyText: {
    fontSize: 16,
    color: enterpriseColors.gray600,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 14,
    color: enterpriseColors.gray600,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  emptyCta: {
    marginTop: 16,
    paddingHorizontal: 24,
    minHeight: 52,
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  cardPressed: { opacity: 0.92 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: enterpriseColors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropTitle: { fontSize: 18, fontWeight: '600', color: enterpriseColors.gray900 },
  queueLabel: { fontSize: 14, fontWeight: '600', color: enterpriseColors.gray700, marginTop: 4 },
  queueError: { color: enterpriseColors.destructive },
  statusPill: {
    fontSize: 14,
    fontWeight: '600',
    color: enterpriseColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: enterpriseColors.primaryTint,
    borderRadius: 8,
    overflow: 'hidden',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  metaText: { flex: 1, fontSize: 15, color: enterpriseColors.gray600, lineHeight: 21 },
  progressBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
  },
  progressText: { fontSize: 14, color: enterpriseColors.gray600, lineHeight: 20 },
  progressOverdue: { color: enterpriseColors.destructive, fontWeight: '600' },
  progressLink: { fontSize: 15, fontWeight: '600', color: enterpriseColors.primary, marginTop: 6 },
  harvestLink: { marginTop: 4 },
  harvestLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  harvestLinkTitle: { fontSize: 17, fontWeight: '600', color: enterpriseColors.gray900 },
  harvestLinkDesc: { fontSize: 14, color: enterpriseColors.gray600, marginTop: 2 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: enterpriseColors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '88%',
    paddingTop: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: enterpriseColors.gray900, flex: 1 },
  detailCrop: { fontSize: 22, fontWeight: '600', color: enterpriseColors.gray900 },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: enterpriseColors.gray600,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: { fontSize: 16, color: enterpriseColors.gray900, marginTop: 4 },
  detailMeta: { fontSize: 15, color: enterpriseColors.gray600, marginTop: 8, lineHeight: 22 },
  detailStatus: { fontSize: 14, color: enterpriseColors.gray600, marginTop: 8 },
  detailNotes: { fontSize: 15, color: enterpriseColors.gray700, marginTop: 12, lineHeight: 22 },
  detailBtn: { marginTop: 20, minHeight: 52, justifyContent: 'center' },
  detailBtnSecondary: {
    marginTop: 10,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: enterpriseColors.primary,
  },
  detailBtnSecondaryText: { fontSize: 16, fontWeight: '600', color: enterpriseColors.primary },
  embeddedRoot: {
    flex: 1,
    minHeight: 0,
  },
});
