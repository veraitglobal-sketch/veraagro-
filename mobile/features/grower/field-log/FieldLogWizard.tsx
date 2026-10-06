import { FIELD_OPERATION_TYPES, type FieldOperationType } from '../../../../shared/passport/field-operation';
import FieldOperationFields from '../../../components/grower/FieldOperationFields';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { smartLockAPI } from '../../../lib/api/grower';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { WorkflowSteps } from '../../../components/grower/WorkflowSteps';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { GrowerSelectField } from '../../../components/grower/GrowerSelectField';
import { EnterpriseNotice } from '../../../components/enterprise/EnterpriseNotice';
import { useTranslation } from 'react-i18next';
import { useAppLocaleTag } from '../../../lib/date-locale';
import { Camera, MapPin, Check, ScanLine, Sprout } from 'lucide-react-native';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { EnterpriseButton, EnterpriseTextField, EnterpriseTextArea } from '../../../design-system';
import {
  useFieldLogData,
  ACTIVITY_TYPES,
  ActivityType,
  PLANTING_NOTES_MIN,
} from './useFieldLogData';
import { FieldLogHistoryPanel } from './FieldLogHistoryPanel';
import WeatherObservationForm from '../../../components/grower/WeatherObservationForm';
import { isSimulatedDevice } from '../../../lib/device-environment';

const STEPS = 3;

const activityLabelKey: Record<ActivityType, string> = {
  PLANTING: 'planting',
  FERTILIZING: 'fertilizing',
  SPRAYING: 'spraying',
  HARVEST: 'harvest',
  TRANSPORT_COORD: 'transportCoord',
  PACKAGING: 'packaging',
  IRRIGATION: 'irrigation',
  INSPECTION: 'inspection',
};

const MATERIAL_ACTIVITIES = new Set<ActivityType>(['PLANTING', 'FERTILIZING', 'SPRAYING']);

/** 1. Parcela → 2. Zasad → 3. Rad + slika + GPS */
export default function FieldLogWizard({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation();
  const dateLocale = useAppLocaleTag();
  const data = useFieldLogData();
  const historyOnly = data.historyOnly;
  const [step, setStep] = useState(1);
  const [showNewEntry, setShowNewEntry] = useState(!historyOnly);
  const [showOptional, setShowOptional] = useState(false);
  const [plantedBags, setPlantedBags] = useState<{
    count: number;
    totalKg: number;
    lots: string[];
  } | null>(null);

  const loadPlantedBags = useCallback(async (parcelId: string) => {
    try {
      const status = await smartLockAPI.getParcelStatus(parcelId);
      const pb = status?.plantedBags;
      if (pb && pb.count > 0) {
        setPlantedBags({ count: pb.count, totalKg: pb.totalKg, lots: pb.lots ?? [] });
      } else {
        setPlantedBags(null);
      }
    } catch {
      setPlantedBags(null);
    }
  }, []);

  useEffect(() => {
    if (!data.selectedParcelId) {
      setPlantedBags(null);
      return;
    }
    void loadPlantedBags(data.selectedParcelId);
  }, [data.selectedParcelId, loadPlantedBags]);

  const formatHistoryWhen = (iso: string) => {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleString(dateLocale, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  const selectedParcelOpt = data.approvedParcelOptions.find((o) => o.parcel.id === data.selectedParcelId);
  const selectedPlan = data.parcelPlans.find((p) => p.id === data.selectedHarvestPlanId);

  const parcelSelectOptions = useMemo(
    () =>
      data.approvedParcelOptions.map(({ parcel, estate }) => ({
        id: parcel.id,
        label:
          parcel.cropType || t('producer.growthJournal.parcelShort', { id: parcel.id.slice(0, 4) }),
        subtitle: estate.name,
      })),
    [data.approvedParcelOptions, t],
  );

  const planSelectOptions = useMemo(
    () =>
      data.parcelPlans.map((plan) => ({
        id: plan.id,
        label: plan.cropType || plan.label,
        subtitle:
          plan.announcementType === 'PLANTING'
            ? t('producer.fieldLogForm.farmerCropKindPlanting')
            : t('producer.fieldLogForm.farmerCropKindHarvest'),
      })),
    [data.parcelPlans, t],
  );

  const activitySelectOptions = useMemo(
    () =>
      ACTIVITY_TYPES.map((type) => ({
        id: type.value,
        label: t(`producer.fieldLog.${activityLabelKey[type.value]}`),
      })),
    [t],
  );

  const documentedOperation = FIELD_OPERATION_TYPES.includes(data.activityType as FieldOperationType);

  const strictPlanting =
    selectedPlan?.announcementType === 'PLANTING' && data.activityType === 'PLANTING';
  const growthStageReady = strictPlanting
    ? data.growthStagePreset === '__custom__'
      ? Boolean(data.growthStageCustom.trim())
      : Boolean(data.growthStagePreset.trim())
    : true;

  const submitBlocked =
    data.saveBusy ||
    !data.activityType ||
    !data.photoUri ||
    !data.location ||
    !data.selectedParcelId ||
    !data.selectedHarvestPlanId ||
    data.plansLoading ||
    (strictPlanting && (data.journalNotes.trim().length < PLANTING_NOTES_MIN || !growthStageReady)) ||
    (MATERIAL_ACTIVITIES.has(data.activityType as ActivityType) &&
      (!data.materialID.trim() || data.materialValid !== true));

  const step1Ok = Boolean(data.selectedParcelId);
  const step2Ok = Boolean(data.selectedHarvestPlanId) && !data.plansLoading;

  useEffect(() => {
    if (step !== 3 || data.location || data.gpsLoading) return;
    void data.getCurrentLocation();
  }, [step, data.location, data.gpsLoading, data.getCurrentLocation]);

  useEffect(() => {
    if (data.activityType === 'PLANTING') setShowOptional(true);
  }, [data.activityType]);

  const goAddPlanting = () => {
    data.router.push({
      pathname: '/(producer)/plantings',
      params: { openAdd: '1', parcelId: data.selectedParcelId },
    } as never);
  };

  const headerSubtitle = historyOnly && !showNewEntry
    ? t('producer.fieldLogForm.historySubtitle')
    : t('producer.fieldLogForm.wizardStepOf', { step, total: STEPS });

  const showWizard = !historyOnly || showNewEntry;

  return (
    <View style={[growerUi.canvas, embedded && styles.embeddedRoot]}>
      {!embedded ? (
        <GrowerStackHeader title={t('producer.tabs.fieldLog')} subtitle={headerSubtitle} />
      ) : null}

      {showWizard ? (
      <View style={styles.progressWrap}>
        <WorkflowSteps current={step - 1} labels={[
          t('workflowSteps.parcel'),
          t('workflowSteps.crop'),
          t('workflowSteps.work'),
        ]} />
      </View>
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[growerUi.scrollContent, { paddingTop: 20, paddingBottom: 24 }]}
          refreshControl={
            <RefreshControl
              refreshing={data.referenceRefreshing}
              onRefresh={data.refreshReferenceData}
              tintColor={enterpriseColors.primary}
            />
          }
        >
          {data.historySyncError ? (
            <EnterpriseNotice
              title={t('producer.fieldLogForm.historySyncErrorTitle')}
              body={data.historySyncError}
            />
          ) : null}

          {historyOnly && !showNewEntry ? (
            <FieldLogHistoryPanel
              items={data.localHistory}
              formatWhen={formatHistoryWhen}
              onDiscard={data.discardQueueItem}
              collapsible={false}
              defaultExpanded
            />
          ) : null}

          {historyOnly && !showNewEntry ? (
            <EnterpriseButton
              label={t('producer.fieldLogForm.newEntry')}
              onPress={() => setShowNewEntry(true)}
              style={{ marginBottom: 12 }}
            />
          ) : null}

          {data.pendingFieldCount > 0 ? (
            <EnterpriseNotice
              title={t('producer.fieldLogForm.queuePill', { count: data.pendingFieldCount })}
              body={t('producer.fieldLogForm.queueBannerShort', { count: data.pendingFieldCount })}
              onPress={data.queueSyncBusy ? undefined : () => void data.syncQueueNow()}
              actionLabel={
                data.queueSyncBusy ? undefined : t('producer.fieldLogForm.sendQueueNow')
              }
            />
          ) : null}

          {showWizard && step > 1 && selectedParcelOpt ? (
            <View style={[enterpriseUi.inAppPanel, styles.contextChip]}>
              <MapPin size={18} color={enterpriseColors.gray600} strokeWidth={1.5} />
              <Text style={styles.contextText} numberOfLines={1}>
                {selectedParcelOpt.parcel.cropType || selectedParcelOpt.parcel.id.slice(0, 8)}
                {' · '}
                {selectedParcelOpt.estate.name}
              </Text>
            </View>
          ) : null}

          {showWizard && step > 2 && selectedPlan ? (
            <View style={[enterpriseUi.inAppPanel, styles.contextChip]}>
              <Sprout size={18} color={enterpriseColors.gray600} strokeWidth={1.5} />
              <Text style={styles.contextText} numberOfLines={1}>
                {selectedPlan.cropType || selectedPlan.label}
              </Text>
            </View>
          ) : null}

          {showWizard && step === 1 ? (
            <>
              {data.approvedParcelOptions.length === 0 ? (
                <TouchableOpacity
                  onPress={() => data.router.push('/(producer)/estates' as never)}
                  style={enterpriseUi.authBtnPrimary}
                  activeOpacity={0.88}
                >
                  <Text style={enterpriseUi.authBtnPrimaryText}>
                    {t('producer.fieldLogForm.setupEstatesCta')}
                  </Text>
                </TouchableOpacity>
              ) : (
                <GrowerSelectField
                  label={t('producer.fieldLogForm.farmerStepParcel')}
                  placeholder={t('producer.select.parcel')}
                  valueId={data.selectedParcelId}
                  options={parcelSelectOptions}
                  onSelect={(id) => {
                    data.setSelectedParcelId(id);
                    data.setSelectedHarvestPlanId('');
                  }}
                />
              )}
              {plantedBags ? (
                <View style={[enterpriseUi.inAppPanel, styles.plantedBagsCard]}>
                  <Text style={styles.plantedBagsTitle}>{t('seedScan.plantedBagsTitle')}</Text>
                  <Text style={styles.plantedBagsBody}>
                    {t('seedScan.plantedBagsSummary', {
                      count: plantedBags.count,
                      kg: plantedBags.totalKg,
                      lots: plantedBags.lots.join(', '),
                    })}
                  </Text>
                </View>
              ) : null}
            </>
          ) : null}

          {showWizard && step === 2 ? (
            <>
              {data.plansLoading ? (
                <ActivityIndicator color={enterpriseColors.primary} style={{ marginVertical: 24 }} />
              ) : data.parcelPlans.length === 0 ? (
                <View style={[enterpriseUi.authPanel, styles.emptyCrop]}>
                  <Text style={enterpriseUi.inAppLead}>{t('producer.fieldLogForm.farmerNoPlanting')}</Text>
                  <TouchableOpacity onPress={goAddPlanting} style={enterpriseUi.authBtnPrimary}>
                    <View style={styles.addCropInner}>
                      <Sprout size={20} color={enterpriseColors.white} strokeWidth={1.5} />
                      <Text style={enterpriseUi.authBtnPrimaryText}>
                        {t('producer.fieldLogForm.farmerAddPlanting')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ) : (
                <GrowerSelectField
                  label={t('producer.fieldLogForm.farmerStepCrop')}
                  placeholder={t('producer.select.planting')}
                  valueId={data.selectedHarvestPlanId}
                  options={planSelectOptions}
                  onSelect={data.setSelectedHarvestPlanId}
                />
              )}
              {data.parcelPlans.length > 0 ? (
                <TouchableOpacity onPress={goAddPlanting} style={styles.linkAdd}>
                  <Text style={styles.linkAddText}>+ {t('producer.fieldLogForm.farmerAddPlanting')}</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : null}

          {showWizard && step === 3 ? (
            <>
              {data.currentEstate?.id && data.selectedParcelId ? <WeatherObservationForm
                key={`${data.selectedParcelId}:${data.selectedHarvestPlanId}`}
                farmId={data.currentEstate.id} parcelId={data.selectedParcelId}
                plantingId={selectedPlan?.announcementType === 'PLANTING' ? selectedPlan.id : selectedPlan?.sourcePlantingId}
                onSaved={() => void data.reloadLocalHistory()}
              /> : null}

              {data.gpsWarning ? (
                <Text style={styles.gpsWarn}>{t('producer.fieldLog.notOnParcel')}</Text>
              ) : null}

              <GrowerSelectField
                label={t('producer.fieldLog.activityType')}
                placeholder={t('producer.select.work')}
                valueId={data.activityType}
                options={activitySelectOptions}
                onSelect={(id) => data.setActivityType(id as ActivityType)}
              />

              {data.activityType ? (
                <>
                  {documentedOperation ? <FieldOperationFields type={data.activityType as FieldOperationType}
                    value={data.operationForm} onChange={data.setOperationForm}
                    notes={data.journalNotes} onNotesChange={data.setJournalNotes} /> : null}
                  {MATERIAL_ACTIVITIES.has(data.activityType as ActivityType) ? (
                    <View style={styles.scanRow}>
                      <TouchableOpacity onPress={() => data.router.push('/(producer)/scanner')} accessibilityRole="button"
                        accessibilityLabel={t('producer.fieldLogForm.materialPlaceholder')} style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}>
                        <ScanLine size={20} color={enterpriseColors.primary} />
                      </TouchableOpacity>
                      <EnterpriseTextField label={t('producer.fieldLogForm.materialPlaceholder')} value={data.materialID}
                        onChangeText={data.setMaterialID} containerStyle={styles.scanField} />
                    </View>
                  ) : null}
                  <Text style={enterpriseUi.inAppSectionLabel}>{t('producer.fieldLog.photo')}</Text>
                  <TouchableOpacity
                    onPress={data.takePhoto}
                    style={[enterpriseUi.authBtnPrimary, styles.photoBtn]}
                    activeOpacity={0.88}
                  >
                    <Camera size={24} color={enterpriseColors.white} strokeWidth={1.5} />
                    <Text style={[enterpriseUi.authBtnPrimaryText, styles.photoBtnText]}>
                      {data.photoUri
                        ? t('producer.fieldLog.photoLoaded')
                        : t('producer.fieldLog.addPhoto')}
                    </Text>
                    {data.photoUri ? <Check size={22} color={enterpriseColors.white} strokeWidth={2} /> : null}
                  </TouchableOpacity>

                  <Text style={enterpriseUi.inAppSectionLabel}>{t('producer.fieldLog.location')}</Text>
                  <TouchableOpacity
                    onPress={data.getCurrentLocation}
                    disabled={data.gpsLoading}
                    style={[
                      enterpriseUi.inAppPanel,
                      styles.gpsRow,
                      data.location && styles.gpsRowOk,
                    ]}
                  >
                    <MapPin
                      size={20}
                      color={data.location ? enterpriseColors.primary : enterpriseColors.gray600}
                      strokeWidth={1.5}
                    />
                    <Text style={enterpriseUi.navRowTitle}>
                      {data.location
                        ? t('producer.fieldLogForm.locationOk')
                        : t('producer.fieldLog.getLocation')}
                    </Text>
                    {data.gpsLoading ? (
                      <ActivityIndicator color={enterpriseColors.primary} />
                    ) : data.location ? (
                      <Check size={20} color={enterpriseColors.primary} strokeWidth={2} />
                    ) : null}
                  </TouchableOpacity>
                  {isSimulatedDevice() ? (
                    <Text style={styles.gpsSimulated}>{t('producer.fieldLogForm.simulatedGps')}</Text>
                  ) : null}

                  {!documentedOperation ? <TouchableOpacity onPress={() => setShowOptional((v) => !v)} style={styles.optionalToggle}>
                    <Text style={enterpriseUi.inAppSectionLabel}>
                      {showOptional ? '▾' : '▸'} {t('producer.fieldLogForm.farmerOptional')}
                    </Text>
                  </TouchableOpacity> : null}

                  {showOptional && !documentedOperation ? (
                    <View style={[enterpriseUi.authPanel, styles.optionalBox]}>
                      <EnterpriseTextArea
                        value={data.journalNotes}
                        onChangeText={data.setJournalNotes}
                        placeholder={
                          strictPlanting
                            ? t('producer.fieldLogForm.farmerNotesPlanting')
                            : t('producer.fieldLogForm.farmerNotesOptional')
                        }
                        minRows={3}
                        containerStyle={{ marginBottom: 0 }}
                      />
                    </View>
                  ) : null}

                  {submitBlocked && !data.saveBusy ? (
                    <Text style={styles.saveHint}>{t('producer.fieldLogForm.farmerSaveHint')}</Text>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}

          {showWizard && data.localHistory.length > 0 ? (
            <FieldLogHistoryPanel
              items={data.localHistory}
              formatWhen={formatHistoryWhen}
              onDiscard={data.discardQueueItem}
              defaultExpanded={false}
            />
          ) : null}
        </ScrollView>
        </TouchableWithoutFeedback>

        {showWizard ? (
        <View style={styles.footer}>
          {step > 1 ? (
            <EnterpriseButton
              label={t('producer.fieldLogForm.wizardBack')}
              onPress={() => setStep((s) => s - 1)}
              variant="secondary"
            />
          ) : null}
          {step < STEPS ? (
            <EnterpriseButton
              label={t('producer.fieldLogForm.farmerNext')}
              onPress={() => setStep((s) => s + 1)}
              disabled={step === 1 ? !step1Ok : !step2Ok}
              style={styles.footerPrimary}
              size="default"
            />
          ) : data.activityType ? (
            <EnterpriseButton
              label={t('producer.fieldLog.saveEntry')}
              onPress={() => void data.handleSubmit()}
              loading={data.saveBusy}
              disabled={data.saveBusy || submitBlocked}
              style={styles.footerPrimary}
              size="default"
            />
          ) : (
            <View style={styles.footerSpacer} />
          )}
        </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  progressWrap: {
    paddingHorizontal: 20,
    backgroundColor: enterpriseColors.canvas,
  },
  contextChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  contextText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
    color: enterpriseColors.gray900,
    letterSpacing: -0.15,
  },
  emptyCrop: {
    alignItems: 'stretch',
    gap: 16,
    marginBottom: 12,
  },
  addCropInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  linkAdd: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  linkAddText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: enterpriseColors.primary,
    letterSpacing: -0.2,
  },
  workChip: {
    marginBottom: 10,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsWarn: {
    fontSize: 13.5,
    fontWeight: '500',
    color: enterpriseColors.gray700,
    marginBottom: 12,
    lineHeight: 19,
  },
  gpsSimulated: {
    fontSize: 12.5,
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    lineHeight: 18,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 6,
    marginBottom: 10,
  },
  photoBtnText: {
    flex: 0,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
    marginBottom: 8,
  },
  gpsRowOk: {
    borderColor: enterpriseColors.primary,
    backgroundColor: enterpriseColors.primaryTint,
  },
  optionalToggle: {
    paddingVertical: 10,
    marginBottom: 4,
  },
  optionalBox: {
    marginBottom: 8,
    gap: 4,
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  plantedBagsCard: {
    marginTop: 12,
    padding: 14,
  },
  plantedBagsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: enterpriseColors.primary,
    marginBottom: 4,
  },
  plantedBagsBody: {
    fontSize: 14,
    color: enterpriseColors.gray700,
    lineHeight: 20,
  },
  scanField: {
    flex: 1,
    marginBottom: 0,
  },
  saveHint: {
    fontSize: 13.5,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 19,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: enterpriseColors.canvas,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
  },
  footerSpacer: {
    width: 88,
  },
  footerPrimary: {
    flex: 1,
    borderRadius: 8,
  },
  embeddedRoot: {
    flex: 1,
    minHeight: 0,
  },
});
