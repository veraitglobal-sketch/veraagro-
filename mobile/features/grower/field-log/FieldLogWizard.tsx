import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { EnterpriseNotice } from '../../../components/enterprise/EnterpriseNotice';
import { useTranslation } from 'react-i18next';
import { Camera, MapPin, Check, ScanLine, Sprout } from 'lucide-react-native';
import { enterpriseColors, enterpriseUi, enterpriseStyles } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import {
  useFieldLogData,
  ACTIVITY_TYPES,
  ActivityType,
  PLANTING_NOTES_MIN,
  historyActivityLabelKey,
} from './useFieldLogData';
import { FieldLogHistoryCollapsible } from './FieldLogHistoryCollapsible';

const STEPS = 3;

const activityLabelKey: Record<ActivityType, string> = {
  PLANTING: 'planting',
  FERTILIZING: 'fertilizing',
  SPRAYING: 'spraying',
  HARVEST: 'harvest',
  TRANSPORT_COORD: 'transportCoord',
  PACKAGING: 'packaging',
};

const MATERIAL_ACTIVITIES = new Set<ActivityType>(['PLANTING', 'FERTILIZING', 'SPRAYING']);

function StepPanel({ step, title }: { step: number; title: string }) {
  const { t } = useTranslation();
  return (
    <View style={[enterpriseUi.authPanel, styles.stepPanel]}>
      <View style={enterpriseStyles.stepAccent} />
      <View style={styles.stepInner}>
        <Text style={enterpriseUi.inAppSectionLabel}>
          {t('producer.fieldLogForm.farmerStepFraction', { step, total: STEPS })}
        </Text>
        <Text style={enterpriseUi.inAppTitle}>{title}</Text>
      </View>
    </View>
  );
}

function SelectCard({
  selected,
  onPress,
  title,
  subtitle,
  icon: Icon,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  subtitle?: string;
  icon?: typeof MapPin;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={[
        enterpriseUi.inAppPanel,
        styles.selectCard,
        selected && styles.selectCardOn,
      ]}
    >
      <View style={styles.selectRow}>
        {Icon ? (
          <View style={[enterpriseUi.navRowIcon, selected && styles.selectIconOn]}>
            <Icon
              size={20}
              color={selected ? enterpriseColors.primary : enterpriseColors.gray600}
              strokeWidth={1.5}
            />
          </View>
        ) : null}
        <View style={styles.selectCopy}>
          <Text style={[enterpriseUi.navRowTitle, selected && styles.selectTitleOn]}>{title}</Text>
          {subtitle ? (
            <Text style={enterpriseUi.navRowSubtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {selected ? <Check size={22} color={enterpriseColors.primary} strokeWidth={2} /> : null}
      </View>
    </TouchableOpacity>
  );
}

/** 1. Parcela → 2. Zasad → 3. Rad + slika + GPS */
export default function FieldLogWizard() {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(1);
  const [showOptional, setShowOptional] = useState(false);
  const data = useFieldLogData();

  const langSr = !!i18n.language?.startsWith('sr');

  const formatHistoryWhen = (iso: string) => {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleString(langSr ? 'sr-Latn' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  const selectedParcelOpt = data.approvedParcelOptions.find((o) => o.parcel.id === data.selectedParcelId);
  const selectedPlan = data.parcelPlans.find((p) => p.id === data.selectedHarvestPlanId);

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

  const headerSubtitle = t('producer.fieldLogForm.wizardStepOf', { step, total: STEPS });

  const progressPct = step / STEPS;

  return (
    <View style={growerUi.canvas}>
      <GrowerStackHeader title={t('producer.tabs.fieldLog')} subtitle={headerSubtitle} />

      <View style={styles.progressWrap}>
        <View style={enterpriseUi.progressTrack}>
          <View style={[enterpriseUi.progressFill, { width: `${progressPct * 100}%` }]} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[growerUi.scrollContent, { paddingBottom: 120 }]}
          refreshControl={
            <RefreshControl
              refreshing={data.referenceRefreshing}
              onRefresh={data.refreshReferenceData}
              tintColor={enterpriseColors.primary}
            />
          }
        >
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

          {step > 1 && selectedParcelOpt ? (
            <View style={[enterpriseUi.inAppPanel, styles.contextChip]}>
              <MapPin size={18} color={enterpriseColors.gray600} strokeWidth={1.5} />
              <Text style={styles.contextText} numberOfLines={1}>
                {selectedParcelOpt.parcel.cropType || selectedParcelOpt.parcel.id.slice(0, 8)}
                {' · '}
                {selectedParcelOpt.estate.name}
              </Text>
            </View>
          ) : null}

          {step > 2 && selectedPlan ? (
            <View style={[enterpriseUi.inAppPanel, styles.contextChip]}>
              <Sprout size={18} color={enterpriseColors.gray600} strokeWidth={1.5} />
              <Text style={styles.contextText} numberOfLines={1}>
                {selectedPlan.cropType || selectedPlan.label}
              </Text>
            </View>
          ) : null}

          {step === 1 ? (
            <>
              <StepPanel step={1} title={t('producer.fieldLogForm.farmerStepParcel')} />
              {data.approvedParcelOptions.length === 0 ? (
                <SelectCard
                  selected={false}
                  onPress={() => data.router.push('/(producer)/estates' as never)}
                  title={t('producer.fieldLogForm.setupEstatesCta')}
                  icon={MapPin}
                />
              ) : (
                data.approvedParcelOptions.map(({ parcel, estate }) => {
                  const sel = data.selectedParcelId === parcel.id;
                  const title =
                    parcel.cropType || t('producer.growthJournal.parcelShort', { id: parcel.id.slice(0, 4) });
                  return (
                    <SelectCard
                      key={parcel.id}
                      selected={sel}
                      onPress={() => {
                        data.setSelectedParcelId(parcel.id);
                        data.setSelectedHarvestPlanId('');
                      }}
                      title={title}
                      subtitle={estate.name}
                      icon={MapPin}
                    />
                  );
                })
              )}
            </>
          ) : null}

          {step === 2 ? (
            <>
              <StepPanel step={2} title={t('producer.fieldLogForm.farmerStepCrop')} />
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
                data.parcelPlans.map((plan) => {
                  const sel = data.selectedHarvestPlanId === plan.id;
                  return (
                    <SelectCard
                      key={plan.id}
                      selected={sel}
                      onPress={() => data.setSelectedHarvestPlanId(plan.id)}
                      title={plan.cropType || plan.label}
                      subtitle={
                        plan.announcementType === 'PLANTING'
                          ? t('producer.fieldLogForm.farmerCropKindPlanting')
                          : t('producer.fieldLogForm.farmerCropKindHarvest')
                      }
                      icon={Sprout}
                    />
                  );
                })
              )}
              {data.parcelPlans.length > 0 ? (
                <TouchableOpacity onPress={goAddPlanting} style={styles.linkAdd}>
                  <Text style={styles.linkAddText}>+ {t('producer.fieldLogForm.farmerAddPlanting')}</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : null}

          {step === 3 ? (
            <>
              <StepPanel step={3} title={t('producer.fieldLogForm.farmerStepWork')} />

              {data.gpsWarning ? (
                <Text style={styles.gpsWarn}>{t('producer.fieldLogForm.gpsWarnShort')}</Text>
              ) : null}

              {ACTIVITY_TYPES.map((type) => {
                const sel = data.activityType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => data.setActivityType(type.value)}
                    style={[growerUi.filterChip, styles.workChip, sel && growerUi.filterChipOn]}
                  >
                    <Text style={[growerUi.filterChipText, sel && growerUi.filterChipTextOn]}>
                      {t(`producer.fieldLog.${activityLabelKey[type.value]}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {data.activityType ? (
                <>
                  <TouchableOpacity
                    onPress={data.takePhoto}
                    style={[enterpriseUi.authBtnPrimary, styles.photoBtn]}
                    activeOpacity={0.88}
                  >
                    <Camera size={24} color={enterpriseColors.white} strokeWidth={1.5} />
                    <Text style={[enterpriseUi.authBtnPrimaryText, styles.photoBtnText]}>
                      {data.photoUri
                        ? t('producer.fieldLogForm.photoLoaded')
                        : t('producer.fieldLogForm.farmerTapPhoto')}
                    </Text>
                    {data.photoUri ? <Check size={22} color={enterpriseColors.white} strokeWidth={2} /> : null}
                  </TouchableOpacity>

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
                        : t('producer.fieldLogForm.farmerTapGps')}
                    </Text>
                    {data.gpsLoading ? (
                      <ActivityIndicator color={enterpriseColors.primary} />
                    ) : data.location ? (
                      <Check size={20} color={enterpriseColors.primary} strokeWidth={2} />
                    ) : null}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setShowOptional((v) => !v)} style={styles.optionalToggle}>
                    <Text style={enterpriseUi.inAppSectionLabel}>
                      {showOptional ? '▾' : '▸'} {t('producer.fieldLogForm.farmerOptional')}
                    </Text>
                  </TouchableOpacity>

                  {showOptional ? (
                    <View style={[enterpriseUi.authPanel, styles.optionalBox]}>
                      {MATERIAL_ACTIVITIES.has(data.activityType as ActivityType) ? (
                        <TouchableOpacity
                          onPress={() => data.router.push('/(producer)/scanner')}
                          style={styles.scanRow}
                        >
                          <ScanLine size={20} color={enterpriseColors.primary} strokeWidth={1.5} />
                          <TextInput
                            style={styles.scanInput}
                            placeholder={t('producer.fieldLogForm.materialPlaceholder')}
                            placeholderTextColor={enterpriseColors.gray600}
                            value={data.materialID}
                            onChangeText={data.setMaterialID}
                          />
                        </TouchableOpacity>
                      ) : null}
                      <TextInput
                        style={[growerUi.formInput, styles.notesInput]}
                        value={data.journalNotes}
                        onChangeText={data.setJournalNotes}
                        placeholder={
                          strictPlanting
                            ? t('producer.fieldLogForm.farmerNotesPlanting')
                            : t('producer.fieldLogForm.farmerNotesOptional')
                        }
                        placeholderTextColor={enterpriseColors.gray600}
                        multiline
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

          {data.localHistory.length > 0 ? (
            <FieldLogHistoryCollapsible
              items={data.localHistory}
              formatWhen={formatHistoryWhen}
              activityLabel={(a) => t(`producer.fieldLog.${historyActivityLabelKey(a)}`)}
              onDiscard={data.discardQueueItem}
            />
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          {step > 1 ? (
            <TouchableOpacity onPress={() => setStep((s) => s - 1)} style={styles.footerBack}>
              <Text style={styles.footerBackText}>{t('producer.fieldLogForm.wizardBack')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.footerSpacer} />
          )}
          {step < STEPS ? (
            <TouchableOpacity
              onPress={() => setStep((s) => s + 1)}
              disabled={step === 1 ? !step1Ok : !step2Ok}
              style={[
                enterpriseUi.authBtnPrimary,
                styles.footerPrimary,
                (step === 1 ? !step1Ok : !step2Ok) && styles.footerDisabled,
              ]}
            >
              <Text style={enterpriseUi.authBtnPrimaryText}>{t('producer.fieldLogForm.farmerNext')}</Text>
            </TouchableOpacity>
          ) : data.activityType ? (
            <TouchableOpacity
              onPress={() => void data.handleSubmit()}
              disabled={data.saveBusy}
              style={[
                enterpriseUi.authBtnPrimary,
                styles.footerPrimary,
                (data.saveBusy || submitBlocked) && styles.footerDisabled,
              ]}
            >
              {data.saveBusy ? (
                <ActivityIndicator color={enterpriseColors.white} />
              ) : (
                <Text style={enterpriseUi.authBtnPrimaryText}>{t('producer.fieldLogForm.farmerSave')}</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.footerSpacer} />
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  progressWrap: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: enterpriseColors.canvas,
  },
  stepPanel: {
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  stepInner: {
    paddingLeft: 8,
  },
  selectCard: {
    marginBottom: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 72,
  },
  selectCardOn: {
    borderColor: enterpriseColors.primary,
    borderWidth: 1.5,
    backgroundColor: enterpriseColors.primaryTint,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  selectIconOn: {
    borderColor: enterpriseColors.primary,
    backgroundColor: enterpriseColors.white,
  },
  selectCopy: {
    flex: 1,
    minWidth: 0,
  },
  selectTitleOn: {
    color: enterpriseColors.primary,
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
    fontSize: 15,
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
    fontSize: 16,
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
    fontSize: 15,
    fontWeight: '500',
    color: enterpriseColors.gray700,
    marginBottom: 12,
    lineHeight: 21,
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
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  scanInput: {
    flex: 1,
    fontSize: 16,
    color: enterpriseColors.gray900,
    minHeight: 44,
  },
  notesInput: {
    marginBottom: 0,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  saveHint: {
    fontSize: 15,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
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
  footerSpacer: {
    width: 88,
  },
  footerPrimary: {
    flex: 1,
  },
  footerDisabled: {
    opacity: 0.5,
  },
  footerBack: {
    minHeight: 52,
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
  },
  footerBackText: {
    fontSize: 16,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    letterSpacing: -0.2,
  },
});
