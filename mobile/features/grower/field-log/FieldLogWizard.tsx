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
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import { useTranslation } from 'react-i18next';
import { Camera, MapPin, Check, ScanLine, Sprout, ClipboardList } from 'lucide-react-native';
import { enterpriseColors } from '../../../lib/enterprise-ui';
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

const STEP_ACCENTS = ['#64748B', '#2D5A27', '#1D4ED8'] as const;

function StepChrome({
  step,
  icon,
  title,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
}) {
  const { t } = useTranslation();
  return (
    <View style={[styles.stepChrome, { borderLeftColor: STEP_ACCENTS[step - 1] }]}>
      <Text style={styles.stepFraction}>
        {t('producer.fieldLogForm.farmerStepFraction', { step, total: STEPS })}
      </Text>
      <View style={styles.stepTitleRow}>
        {icon}
        <Text style={styles.stepTitle}>{title}</Text>
      </View>
    </View>
  );
}

/** 1. Parcela → 2. Zasad (usev) → 3. Rad + slika */
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
      Boolean(data.materialID.trim()) &&
      data.materialValid === false);

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

  return (
    <View style={growerUi.canvas}>
      <BioVeraSubpageHeader title={t('producer.tabs.fieldLog')} left="back" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[growerUi.scrollContent, { paddingBottom: 110 }]}
          refreshControl={
            <RefreshControl
              refreshing={data.referenceRefreshing}
              onRefresh={data.refreshReferenceData}
              tintColor={enterpriseColors.primary}
            />
          }
        >
          {data.pendingFieldCount > 0 ? (
            <TouchableOpacity
              onPress={() => void data.syncQueueNow()}
              disabled={data.queueSyncBusy}
              style={styles.queuePill}
            >
              <Text style={styles.queuePillText}>
                {t('producer.fieldLogForm.queuePill', { count: data.pendingFieldCount })}
              </Text>
              {data.queueSyncBusy ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.queuePillAction}>{t('producer.fieldLogForm.sendQueueNow')}</Text>
              )}
            </TouchableOpacity>
          ) : null}

          {step > 1 && selectedParcelOpt ? (
            <View style={styles.contextPill}>
              <MapPin size={16} color={enterpriseColors.primary} />
              <Text style={styles.contextPillText} numberOfLines={1}>
                {selectedParcelOpt.parcel.cropType || selectedParcelOpt.parcel.id.slice(0, 8)}
                {' · '}
                {selectedParcelOpt.estate.name}
              </Text>
            </View>
          ) : null}

          {step > 2 && selectedPlan ? (
            <View style={[styles.contextPill, styles.contextPillGreen]}>
              <Sprout size={16} color={enterpriseColors.primary} />
              <Text style={styles.contextPillText} numberOfLines={1}>
                {selectedPlan.cropType || selectedPlan.label}
              </Text>
            </View>
          ) : null}

          {step === 1 ? (
            <>
              <StepChrome
                step={1}
                icon={<MapPin size={26} color={STEP_ACCENTS[0]} strokeWidth={2} />}
                title={t('producer.fieldLogForm.farmerStepParcel')}
              />
              {data.approvedParcelOptions.length === 0 ? (
                <TouchableOpacity
                  onPress={() => data.router.push('/(producer)/estates' as never)}
                  style={styles.parcelCard}
                >
                  <Text style={styles.parcelCardTitle}>{t('producer.fieldLogForm.setupEstatesCta')}</Text>
                </TouchableOpacity>
              ) : (
                data.approvedParcelOptions.map(({ parcel, estate }) => {
                  const sel = data.selectedParcelId === parcel.id;
                  const title =
                    parcel.cropType || t('producer.growthJournal.parcelShort', { id: parcel.id.slice(0, 4) });
                  return (
                    <TouchableOpacity
                      key={parcel.id}
                      onPress={() => {
                        data.setSelectedParcelId(parcel.id);
                        data.setSelectedHarvestPlanId('');
                      }}
                      style={[styles.parcelCard, sel && styles.parcelCardOn]}
                    >
                      <View style={styles.parcelCardInner}>
                        <MapPin size={22} color={sel ? '#fff' : STEP_ACCENTS[0]} strokeWidth={2} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.parcelCardTitle, sel && styles.parcelCardTitleOn]}>{title}</Text>
                          <Text style={[styles.parcelCardSub, sel && styles.parcelCardSubOn]}>{estate.name}</Text>
                        </View>
                        {sel ? <Check size={24} color="#fff" strokeWidth={2.5} /> : null}
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
                icon={<Sprout size={26} color={STEP_ACCENTS[1]} strokeWidth={2} />}
                title={t('producer.fieldLogForm.farmerStepCrop')}
              />
              {data.plansLoading ? (
                <ActivityIndicator color={enterpriseColors.primary} style={{ marginVertical: 24 }} />
              ) : data.parcelPlans.length === 0 ? (
                <View style={styles.emptyCrop}>
                  <Text style={styles.emptyCropText}>{t('producer.fieldLogForm.farmerNoPlanting')}</Text>
                  <TouchableOpacity onPress={goAddPlanting} style={styles.addCropBtn}>
                    <Sprout size={22} color="#fff" />
                    <Text style={styles.addCropBtnText}>{t('producer.fieldLogForm.farmerAddPlanting')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                data.parcelPlans.map((plan) => {
                  const sel = data.selectedHarvestPlanId === plan.id;
                  const isPlanting = plan.announcementType === 'PLANTING';
                  return (
                    <TouchableOpacity
                      key={plan.id}
                      onPress={() => data.setSelectedHarvestPlanId(plan.id)}
                      style={[styles.cropCard, sel && styles.cropCardOn]}
                    >
                      <Text style={[styles.cropName, sel && styles.cropNameOn]}>
                        {plan.cropType || plan.label}
                      </Text>
                      <Text style={[styles.cropMeta, sel && styles.cropMetaOn]}>
                        {isPlanting
                          ? t('producer.fieldLogForm.farmerCropKindPlanting')
                          : t('producer.fieldLogForm.farmerCropKindHarvest')}
                      </Text>
                      {sel ? <Check size={22} color="#fff" style={styles.cropCheck} /> : null}
                    </TouchableOpacity>
                  );
                })
              )}
              {data.parcelPlans.length > 0 ? (
                <TouchableOpacity onPress={goAddPlanting} style={styles.linkAddCrop}>
                  <Text style={styles.linkAddCropText}>+ {t('producer.fieldLogForm.farmerAddPlanting')}</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : null}

          {step === 3 ? (
            <>
              <StepChrome
                step={3}
                icon={<ClipboardList size={26} color={STEP_ACCENTS[2]} strokeWidth={2} />}
                title={t('producer.fieldLogForm.farmerStepWork')}
              />

              {data.gpsWarning ? (
                <Text style={styles.gpsWarn}>{t('producer.fieldLogForm.gpsWarnShort')}</Text>
              ) : null}

              {ACTIVITY_TYPES.map((type) => {
                const sel = data.activityType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => data.setActivityType(type.value)}
                    style={[styles.workBtn, sel && styles.workBtnOn]}
                  >
                    <Text style={[styles.workBtnText, sel && styles.workBtnTextOn]}>
                      {t(`producer.fieldLog.${activityLabelKey[type.value]}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {data.activityType ? (
                <>
                  <TouchableOpacity onPress={data.takePhoto} style={styles.heroBtn} activeOpacity={0.85}>
                    <Camera size={30} color="#fff" strokeWidth={1.5} />
                    <Text style={styles.heroBtnText}>
                      {data.photoUri
                        ? t('producer.fieldLogForm.photoLoaded')
                        : t('producer.fieldLogForm.farmerTapPhoto')}
                    </Text>
                    {data.photoUri ? <Check size={24} color="#fff" strokeWidth={2} /> : null}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={data.getCurrentLocation}
                    disabled={data.gpsLoading}
                    style={[styles.gpsBtn, data.location && styles.gpsBtnOk]}
                  >
                    <MapPin size={22} color={data.location ? enterpriseColors.primary : enterpriseColors.gray900} />
                    <Text style={styles.gpsBtnText}>
                      {data.location
                        ? t('producer.fieldLogForm.locationOk')
                        : t('producer.fieldLogForm.farmerTapGps')}
                    </Text>
                    {data.gpsLoading ? (
                      <ActivityIndicator color={enterpriseColors.primary} />
                    ) : data.location ? (
                      <Check size={20} color={enterpriseColors.primary} />
                    ) : null}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setShowOptional((v) => !v)} style={styles.optionalToggle}>
                    <Text style={styles.optionalToggleText}>
                      {showOptional ? '▾' : '▸'} {t('producer.fieldLogForm.farmerOptional')}
                    </Text>
                  </TouchableOpacity>

                  {showOptional ? (
                    <View style={styles.optionalBox}>
                      {MATERIAL_ACTIVITIES.has(data.activityType as ActivityType) ? (
                        <TouchableOpacity
                          onPress={() => data.router.push('/(producer)/scanner')}
                          style={styles.scanRow}
                        >
                          <ScanLine size={22} color={enterpriseColors.primary} />
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
                        style={styles.notesInput}
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
            <TouchableOpacity
              onPress={() => setStep((s) => s - 1)}
              style={styles.footerSecondary}
            >
              <Text style={styles.footerSecondaryText}>{t('producer.fieldLogForm.wizardBack')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.footerSpacer} />
          )}
          {step < STEPS ? (
            <TouchableOpacity
              onPress={() => setStep((s) => s + 1)}
              disabled={step === 1 ? !step1Ok : !step2Ok}
              style={[
                styles.footerPrimary,
                (step === 1 ? !step1Ok : !step2Ok) && { opacity: 0.45 },
              ]}
            >
              <Text style={styles.footerPrimaryText}>{t('producer.fieldLogForm.farmerNext')}</Text>
            </TouchableOpacity>
          ) : data.activityType ? (
            <TouchableOpacity
              onPress={() => void data.handleSubmit()}
              disabled={data.saveBusy}
              style={[styles.footerPrimary, (data.saveBusy || submitBlocked) && { opacity: 0.55 }]}
            >
              {data.saveBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.footerPrimaryText}>{t('producer.fieldLogForm.farmerSave')}</Text>
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
  stepChrome: {
    borderLeftWidth: 5,
    paddingLeft: 14,
    marginBottom: 18,
    marginTop: 4,
  },
  stepFraction: { fontSize: 14, fontWeight: '600', color: enterpriseColors.gray600, marginBottom: 6 },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: enterpriseColors.gray900, flex: 1 },
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
  contextPillText: { fontSize: 15, fontWeight: '600', color: enterpriseColors.gray900, flex: 1 },
  queuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#B45309',
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    marginBottom: 12,
    gap: 8,
  },
  queuePillText: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 },
  queuePillAction: { color: '#fff', fontSize: 15, fontWeight: '700', textDecorationLine: 'underline' },
  parcelCard: {
    backgroundColor: enterpriseColors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    padding: 16,
    minHeight: 72,
    marginBottom: 12,
  },
  parcelCardOn: { backgroundColor: '#475569', borderColor: '#475569' },
  parcelCardInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  parcelCardTitle: { fontSize: 20, fontWeight: '700', color: enterpriseColors.gray900 },
  parcelCardTitleOn: { color: '#fff' },
  parcelCardSub: { fontSize: 15, color: enterpriseColors.gray600, marginTop: 4 },
  parcelCardSubOn: { color: 'rgba(255,255,255,0.85)' },
  cropCard: {
    backgroundColor: `${enterpriseColors.primary}0A`,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: enterpriseColors.primary,
    padding: 18,
    minHeight: 80,
    marginBottom: 12,
    justifyContent: 'center',
  },
  cropCardOn: { backgroundColor: enterpriseColors.primary },
  cropName: { fontSize: 24, fontWeight: '800', color: enterpriseColors.primary },
  cropNameOn: { color: '#fff' },
  cropMeta: { fontSize: 15, fontWeight: '600', color: enterpriseColors.gray600, marginTop: 6 },
  cropMetaOn: { color: 'rgba(255,255,255,0.9)' },
  cropCheck: { position: 'absolute', top: 14, right: 14 },
  emptyCrop: { alignItems: 'center', paddingVertical: 20, gap: 16 },
  emptyCropText: { fontSize: 17, color: enterpriseColors.gray600, textAlign: 'center', lineHeight: 24 },
  addCropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: enterpriseColors.primary,
    borderRadius: 14,
    paddingHorizontal: 24,
    minHeight: 60,
    justifyContent: 'center',
  },
  addCropBtnText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  linkAddCrop: { paddingVertical: 12, alignItems: 'center' },
  linkAddCropText: { fontSize: 17, fontWeight: '600', color: enterpriseColors.primary },
  workBtn: {
    backgroundColor: enterpriseColors.white,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: enterpriseColors.gray200,
    minHeight: 58,
    marginBottom: 10,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  workBtnOn: { backgroundColor: STEP_ACCENTS[2], borderColor: STEP_ACCENTS[2] },
  workBtnText: { fontSize: 18, fontWeight: '700', color: enterpriseColors.gray900, textAlign: 'center' },
  workBtnTextOn: { color: '#fff' },
  gpsWarn: { fontSize: 15, fontWeight: '600', color: '#B45309', marginBottom: 12 },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: enterpriseColors.primary,
    borderRadius: 16,
    minHeight: 68,
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  heroBtnText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: enterpriseColors.white,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: enterpriseColors.gray200,
    minHeight: 56,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  gpsBtnOk: { borderColor: enterpriseColors.primary },
  gpsBtnText: { flex: 1, fontSize: 17, fontWeight: '600', color: enterpriseColors.gray900 },
  optionalToggle: { paddingVertical: 10 },
  optionalToggleText: { fontSize: 16, fontWeight: '600', color: enterpriseColors.gray600 },
  optionalBox: { marginBottom: 8 },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: enterpriseColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    paddingHorizontal: 12,
    minHeight: 52,
    marginBottom: 8,
    gap: 8,
  },
  scanInput: { flex: 1, fontSize: 17, color: enterpriseColors.gray900 },
  notesInput: {
    backgroundColor: enterpriseColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    padding: 12,
    fontSize: 17,
    minHeight: 72,
    textAlignVertical: 'top',
    color: enterpriseColors.gray900,
  },
  saveHint: {
    fontSize: 15,
    fontWeight: '600',
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
  footerSpacer: { width: 72 },
  footerPrimary: {
    flex: 1,
    backgroundColor: enterpriseColors.primary,
    borderRadius: 14,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerPrimaryText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  footerSecondary: {
    minHeight: 56,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
  },
  footerSecondaryText: { fontSize: 18, fontWeight: '600', color: enterpriseColors.gray900 },
});
