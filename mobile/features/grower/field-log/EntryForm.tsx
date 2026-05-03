import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import { useTranslation } from 'react-i18next';
import { Camera, MapPin, Check, X } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import {
  useFieldLogData,
  ACTIVITY_TYPES,
  ActivityType,
  MaterialKindForLog,
  PLANTING_NOTES_MIN,
  historyActivityLabelKey,
} from './useFieldLogData';
import { GROWTH_STAGE_PRESETS } from '../growth-journal/AddGrowthLogModal';

const activityLabelKey: Record<ActivityType, string> = {
  PLANTING: 'planting',
  FERTILIZING: 'fertilizing',
  SPRAYING: 'spraying',
  HARVEST: 'harvest',
};

const MATERIAL_KINDS: MaterialKindForLog[] = ['SEED', 'FERTILIZER', 'PESTICIDE'];

const materialKindLabelKey: Record<MaterialKindForLog, string> = {
  SEED: 'seed',
  FERTILIZER: 'fertilizer',
  PESTICIDE: 'pesticide',
};

export default function EntryForm() {
  const { t, i18n } = useTranslation();
  const {
    router,
    estates,
    currentEstate,
    selectEstateById,
    approvedParcels,
    selectedParcelId,
    setSelectedParcelId,
    parcelPlans,
    selectedHarvestPlanId,
    setSelectedHarvestPlanId,
    selectedHarvestPlan,
    plansLoading,
    growthStagePreset,
    setGrowthStagePreset,
    growthStageCustom,
    setGrowthStageCustom,
    journalNotes,
    setJournalNotes,
    activityType,
    setActivityType,
    materialID,
    setMaterialID,
    materialKind,
    setMaterialKind,
    photoUri,
    location,
    gpsWarning,
    materialValid,
    saveBusy,
    gpsLoading,
    getCurrentLocation,
    takePhoto,
    pickPhotoFromLibrary,
    handleSubmit,
    referenceRefreshing,
    refreshReferenceData,
    localHistory,
  } = useFieldLogData();

  const langSr = !!i18n.language?.startsWith('sr');

  const formatHistoryWhen = (iso: string) => {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      const tag = langSr ? 'sr-Latn' : 'en-GB';
      return d.toLocaleString(tag, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  const historyStatusStyle = (
    status: 'pending' | 'syncing' | 'synced' | 'error',
  ): { bg: string; color: string } => {
    if (status === 'synced') return { bg: `${theme.colors.success}18`, color: theme.colors.success };
    if (status === 'error') return { bg: theme.colors.errorLight, color: theme.colors.error };
    if (status === 'syncing') return { bg: `${theme.colors.primary}14`, color: theme.colors.primary };
    return { bg: `${theme.colors.warning}20`, color: theme.colors.warning };
  };

  const strictPlanting = selectedHarvestPlan?.announcementType === 'PLANTING';
  const growthStageReady = strictPlanting
    ? growthStagePreset === '__custom__'
      ? Boolean(growthStageCustom.trim())
      : Boolean(growthStagePreset.trim())
    : true;

  const submitBlocked =
    saveBusy ||
    !activityType ||
    !photoUri ||
    !location ||
    !selectedParcelId ||
    !selectedHarvestPlanId ||
    plansLoading ||
    (strictPlanting && (journalNotes.trim().length < PLANTING_NOTES_MIN || !growthStageReady)) ||
    (activityType !== 'HARVEST' && Boolean(materialID.trim()) && materialValid === false);

  return (
    <View style={{ flex: 1 }}>
      <BioVeraSubpageHeader title={t('producer.tabs.fieldLog')} left="back" />
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={referenceRefreshing}
            onRefresh={refreshReferenceData}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
      <View style={{ padding: theme.spacing.md }}>
        {gpsWarning && (
          <View
            style={{
              backgroundColor: theme.colors.errorLight,
              borderWidth: 0.5,
              borderColor: 'rgba(239, 68, 68, 0.3)',
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.sm,
              marginBottom: theme.spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <X size={20} color={theme.colors.error} strokeWidth={1} />
            <Text
              style={{
                fontSize: 15,
                fontWeight: '300',
                color: theme.colors.error,
                marginLeft: theme.spacing.sm,
                flex: 1,
                letterSpacing: 0.2,
              }}
            >
              {t('producer.fieldLogForm.warningNotOnParcel')}
            </Text>
          </View>
        )}

        <Text
          style={{
            fontSize: 16,
            fontWeight: '300',
            color: theme.colors.text.secondary,
            lineHeight: 18,
            marginBottom: theme.spacing.md,
          }}
        >
          {t('producer.fieldLogForm.introLead')}
        </Text>

        <View style={{ marginBottom: theme.spacing.lg }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.xs,
              letterSpacing: 0.2,
            }}
          >
            {t('producer.fieldLogForm.historyTitle')}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              lineHeight: 19,
              marginBottom: theme.spacing.sm,
            }}
          >
            {t('producer.fieldLogForm.historySubtitle')}
          </Text>
          {localHistory.length === 0 ? (
            <Text style={{ fontSize: 14, fontWeight: '300', color: theme.colors.text.tertiary, fontStyle: 'italic' }}>
              {t('producer.fieldLogForm.historyEmpty')}
            </Text>
          ) : (
            localHistory.map((h) => {
              const ss = historyStatusStyle(h.status);
              return (
                <View
                  key={h.id}
                  style={{
                    marginBottom: theme.spacing.sm,
                    padding: theme.spacing.sm,
                    borderRadius: theme.borderRadius.md,
                    borderWidth: 0.5,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceElevated,
                  }}
                >
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text.primary, flex: 1 }}>
                      {formatHistoryWhen(h.timestamp)}
                    </Text>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: ss.bg }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: ss.color }}>
                        {t(`producer.fieldLogForm.histStatus_${h.status}`, { defaultValue: h.status })}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '500', color: theme.colors.primary, marginTop: 6 }}>
                    {t(`producer.fieldLog.${historyActivityLabelKey(String(h.activityType))}`)}
                  </Text>
                  {h.growthStage ? (
                    <Text style={{ fontSize: 13, color: theme.colors.text.secondary, marginTop: 4 }}>{h.growthStage}</Text>
                  ) : null}
                  {h.journalNotesPreview.trim() ? (
                    <Text style={{ fontSize: 13, color: theme.colors.text.secondary, marginTop: 4, lineHeight: 19 }}>
                      {h.journalNotesPreview}
                      {h.journalNotesPreview.length >= 240 ? '…' : ''}
                    </Text>
                  ) : null}
                  {h.materialID?.trim() ? (
                    <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, marginTop: 6 }}>
                      {t('producer.fieldLogForm.histMaterial')}: {h.materialID.trim()}
                    </Text>
                  ) : null}
                  {h.status === 'error' && h.error ? (
                    <Text style={{ fontSize: 12, color: theme.colors.error, marginTop: 6, lineHeight: 17 }}>{h.error}</Text>
                  ) : null}
                </View>
              );
            })
          )}
        </View>

        {estates.length > 1 ? (
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '300',
                color: theme.colors.text.primary,
                letterSpacing: 0.5,
                marginBottom: theme.spacing.sm,
              }}
            >
              {t('producer.growthJournal.estateLabel')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              {estates.map((estate) => {
                const sel = currentEstate?.id === estate.id;
                return (
                  <TouchableOpacity
                    key={estate.id}
                    onPress={() => selectEstateById(estate.id)}
                    activeOpacity={0.7}
                    style={{
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.sm,
                      borderRadius: theme.borderRadius.md,
                      borderWidth: 0.5,
                      borderColor: sel ? theme.colors.primary : 'rgba(0, 0, 0, 0.08)',
                      backgroundColor: sel ? `${theme.colors.primary}12` : theme.colors.surface,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '300',
                        color: sel ? theme.colors.primary : theme.colors.text.primary,
                        letterSpacing: 0.3,
                      }}
                    >
                      {estate.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : currentEstate ? (
          <Text
            style={{
              fontSize: 14,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.md,
              letterSpacing: 0.2,
            }}
          >
            {t('producer.growthJournal.estateLabel')}: {currentEstate.name}
          </Text>
        ) : null}

        <View style={{ marginBottom: theme.spacing.md }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '300',
              color: theme.colors.text.primary,
              letterSpacing: 0.5,
              marginBottom: theme.spacing.sm,
            }}
          >
            {t('producer.growthJournal.parcelLabel')}
          </Text>
          {approvedParcels.length === 0 ? (
            <Text style={{ fontSize: 14, fontWeight: '300', color: theme.colors.text.secondary, lineHeight: 20 }}>
              {t('producer.growthJournalAlerts.parcelBody')}
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              {approvedParcels.map((parcel) => {
                const sel = selectedParcelId === parcel.id;
                return (
                  <TouchableOpacity
                    key={parcel.id}
                    onPress={() => setSelectedParcelId(parcel.id)}
                    activeOpacity={0.7}
                    style={{
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.sm,
                      borderRadius: theme.borderRadius.md,
                      borderWidth: 0.5,
                      borderColor: sel ? theme.colors.primary : 'rgba(0, 0, 0, 0.08)',
                      backgroundColor: sel ? `${theme.colors.primary}12` : theme.colors.surface,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '300',
                        color: sel ? theme.colors.primary : theme.colors.text.primary,
                        letterSpacing: 0.3,
                      }}
                    >
                      {parcel.cropType ||
                        t('producer.growthJournal.parcelShort', { id: parcel.id.slice(0, 4) })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {selectedParcelId ? (
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '300',
                color: theme.colors.text.primary,
                letterSpacing: 0.5,
                marginBottom: theme.spacing.sm,
              }}
            >
              {t('producer.growthJournal.planLabel')}
              {plansLoading ? ` (${t('producer.growthJournal.plansLoading')})` : ''}
            </Text>
            {!plansLoading && parcelPlans.length === 0 ? (
              <Text style={{ fontSize: 14, fontWeight: '300', color: theme.colors.text.secondary, lineHeight: 20 }}>
                {t('producer.growthJournal.noPlansForParcel')}
              </Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
                {parcelPlans.map((plan) => {
                  const sel = selectedHarvestPlanId === plan.id;
                  return (
                    <TouchableOpacity
                      key={plan.id}
                      onPress={() => setSelectedHarvestPlanId(plan.id)}
                      activeOpacity={0.7}
                      style={{
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: theme.spacing.sm,
                        borderRadius: theme.borderRadius.md,
                        borderWidth: 0.5,
                        borderColor: sel ? theme.colors.primary : 'rgba(0, 0, 0, 0.08)',
                        backgroundColor: sel ? `${theme.colors.primary}12` : theme.colors.surface,
                        maxWidth: '100%',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '300',
                          color: sel ? theme.colors.primary : theme.colors.text.primary,
                          letterSpacing: 0.2,
                        }}
                      >
                        {plan.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}

        <View style={{ marginBottom: theme.spacing.md }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '300',
              color: theme.colors.text.primary,
              letterSpacing: 0.5,
              marginBottom: theme.spacing.sm,
            }}
          >
            {t('producer.fieldLogForm.activityType')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {ACTIVITY_TYPES.map((type) => {
              const isSelected = activityType === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => setActivityType(type.value)}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.borderRadius.md,
                    borderWidth: 0.5,
                    borderColor: isSelected ? theme.colors.primary : 'rgba(0, 0, 0, 0.05)',
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '300',
                      color: isSelected ? theme.colors.background : theme.colors.text.primary,
                      letterSpacing: 0.3,
                    }}
                  >
                    {t(`producer.fieldLog.${activityLabelKey[type.value]}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {activityType && activityType !== 'HARVEST' ? (
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '300',
                color: theme.colors.text.primary,
                letterSpacing: 0.5,
                marginBottom: theme.spacing.sm,
              }}
            >
              {t('producer.fieldLogForm.materialKindPrompt')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
              {MATERIAL_KINDS.map((k) => {
                const isSelected = materialKind === k;
                return (
                  <TouchableOpacity
                    key={k}
                    onPress={() => setMaterialKind(k)}
                    activeOpacity={0.7}
                    style={{
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.sm,
                      borderRadius: theme.borderRadius.md,
                      borderWidth: 0.5,
                      borderColor: isSelected ? theme.colors.primary : 'rgba(0, 0, 0, 0.05)',
                      backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '400',
                        color: isSelected ? theme.colors.background : theme.colors.text.primary,
                        letterSpacing: 0.3,
                      }}
                    >
                      {t(`producer.materials.${materialKindLabelKey[k]}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '300',
                color: theme.colors.text.primary,
                letterSpacing: 0.5,
                marginBottom: theme.spacing.sm,
              }}
            >
              {t('producer.fieldLogForm.materialBarcode')}
            </Text>
            <View
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.05)',
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.2,
                }}
                placeholder={t('producer.fieldLogForm.materialPlaceholder')}
                placeholderTextColor={theme.colors.text.tertiary}
                value={materialID}
                onChangeText={setMaterialID}
              />
              <TouchableOpacity
                onPress={() => router.push('/(producer)/scanner')}
                activeOpacity={0.7}
                style={{
                  marginLeft: theme.spacing.xs,
                  padding: theme.spacing.xs,
                  borderRadius: theme.borderRadius.sm,
                  backgroundColor: `${theme.colors.primary}15`,
                }}
              >
                <Camera size={18} color={theme.colors.primary} strokeWidth={1.5} />
              </TouchableOpacity>
              {materialValid !== null &&
                (materialValid ? (
                  <Check
                    size={20}
                    color={theme.colors.success}
                    strokeWidth={1}
                    style={{ marginLeft: theme.spacing.xs }}
                  />
                ) : (
                  <X
                    size={20}
                    color={theme.colors.error}
                    strokeWidth={1}
                    style={{ marginLeft: theme.spacing.xs }}
                  />
                ))}
            </View>
          </View>
        ) : null}

        {strictPlanting ? (
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '300',
                color: theme.colors.text.primary,
                letterSpacing: 0.5,
                marginBottom: theme.spacing.sm,
              }}
            >
              {t('producer.growthJournal.growthStageLabelPlanting')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
              {GROWTH_STAGE_PRESETS.map((s) => {
                const sel = growthStagePreset === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => {
                      setGrowthStagePreset(sel ? '' : s);
                      setGrowthStageCustom('');
                    }}
                    activeOpacity={0.7}
                    style={{
                      paddingHorizontal: theme.spacing.sm,
                      paddingVertical: theme.spacing.xs,
                      borderRadius: theme.borderRadius.md,
                      borderWidth: 0.5,
                      borderColor: sel ? theme.colors.primary : 'rgba(0, 0, 0, 0.08)',
                      backgroundColor: sel ? `${theme.colors.primary}12` : theme.colors.surface,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '300',
                        color: sel ? theme.colors.primary : theme.colors.text.primary,
                      }}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() =>
                  setGrowthStagePreset((prev) => (prev === '__custom__' ? '' : '__custom__'))
                }
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  borderRadius: theme.borderRadius.md,
                  borderWidth: 0.5,
                  borderColor: growthStagePreset === '__custom__' ? theme.colors.primary : 'rgba(0, 0, 0, 0.08)',
                  backgroundColor:
                    growthStagePreset === '__custom__' ? `${theme.colors.primary}12` : theme.colors.surface,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '300',
                    color:
                      growthStagePreset === '__custom__' ? theme.colors.primary : theme.colors.text.primary,
                  }}
                >
                  {t('producer.growthJournal.customStage')}
                </Text>
              </TouchableOpacity>
            </View>
            {growthStagePreset === '__custom__' ? (
              <TextInput
                value={growthStageCustom}
                onChangeText={setGrowthStageCustom}
                placeholder={t('producer.growthJournal.customStagePlaceholder')}
                placeholderTextColor={theme.colors.text.tertiary}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.md,
                  borderWidth: 0.5,
                  borderColor: 'rgba(0, 0, 0, 0.08)',
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.sm,
                  fontSize: 15,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.sm,
                }}
              />
            ) : null}
          </View>
        ) : null}

        <View style={{ marginBottom: theme.spacing.md }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '300',
              color: theme.colors.text.primary,
              letterSpacing: 0.5,
              marginBottom: theme.spacing.sm,
            }}
          >
            {t(
              strictPlanting ? 'producer.growthJournal.notesLabelPlanting' : 'producer.growthJournal.notesLabel',
            )}
          </Text>
          <TextInput
            value={journalNotes}
            onChangeText={setJournalNotes}
            placeholder={t('producer.growthJournal.notesPlaceholder')}
            placeholderTextColor={theme.colors.text.tertiary}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.08)',
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.sm,
              fontSize: 15,
              fontWeight: '300',
              color: theme.colors.text.primary,
              minHeight: 88,
              textAlignVertical: 'top',
            }}
          />
        </View>

        <View style={{ marginBottom: theme.spacing.md }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '300',
              color: theme.colors.text.primary,
              letterSpacing: 0.5,
              marginBottom: theme.spacing.sm,
            }}
          >
            {t('producer.fieldLogForm.photo')} <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <TouchableOpacity
            onPress={takePhoto}
            activeOpacity={0.7}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.05)',
              padding: theme.spacing.lg,
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 150,
            }}
          >
            {photoUri ? (
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '300',
                  color: theme.colors.success,
                  letterSpacing: 0.3,
                }}
              >
                ✓ {t('producer.fieldLogForm.photoLoaded')}
              </Text>
            ) : (
              <>
                <Camera size={32} color={theme.colors.text.tertiary} strokeWidth={1} />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    marginTop: theme.spacing.xs,
                    letterSpacing: 0.2,
                  }}
                >
                  {t('producer.fieldLogForm.addPhoto')}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={pickPhotoFromLibrary}
            activeOpacity={0.7}
            style={{
              marginTop: theme.spacing.sm,
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              borderWidth: 0.5,
              borderColor: theme.colors.primary,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: theme.colors.primary,
                letterSpacing: 0.2,
              }}
            >
              {t('producer.fieldLogForm.chooseFromGallery')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: theme.spacing.lg }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '300',
              color: theme.colors.text.primary,
              letterSpacing: 0.5,
              marginBottom: theme.spacing.sm,
            }}
          >
            {t('producer.fieldLogForm.location')} <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <TouchableOpacity
            onPress={getCurrentLocation}
            disabled={gpsLoading}
            activeOpacity={0.7}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.05)',
              padding: theme.spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <MapPin size={20} color={theme.colors.primary} strokeWidth={1} />
              <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
                {location ? (
                  <>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '300',
                        color: theme.colors.text.primary,
                        letterSpacing: 0.2,
                      }}
                    >
                      GPS: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '300',
                        color: theme.colors.success,
                        marginTop: 2,
                        letterSpacing: 0.2,
                      }}
                    >
                      ✓ {t('producer.fieldLogForm.locationOk')}
                    </Text>
                  </>
                ) : (
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '300',
                      color: theme.colors.text.secondary,
                      letterSpacing: 0.2,
                    }}
                  >
                    {t('producer.fieldLogForm.getLocation')}
                  </Text>
                )}
              </View>
            </View>
            {gpsLoading && <ActivityIndicator size="small" color={theme.colors.primary} />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitBlocked}
          activeOpacity={0.7}
          style={{
            backgroundColor: submitBlocked ? theme.colors.surface : theme.colors.primary,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: submitBlocked ? 'rgba(0, 0, 0, 0.05)' : theme.colors.primary,
            alignItems: 'center',
            opacity: saveBusy ? 0.5 : 1,
          }}
        >
          {saveBusy ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <Text
              style={{
                fontSize: 16,
                fontWeight: '300',
                color: submitBlocked ? theme.colors.text.secondary : theme.colors.background,
                letterSpacing: 0.5,
              }}
            >
              {t('producer.fieldLogForm.saveEntry')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );
}
