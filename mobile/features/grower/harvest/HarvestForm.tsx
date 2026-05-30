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
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { GrowerSelectField } from '../../../components/grower/GrowerSelectField';
import { GrowerDateField } from '../../../components/grower/GrowerDateField';
import { theme } from '../../../lib/theme';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { useHarvestData, CROP_TYPES } from './useHarvestData';
import { useAppLocaleTag, formatAppDate } from '../../../lib/date-locale';

const STEPS = 3;

export default function HarvestForm() {
  const { t, i18n } = useTranslation();
  const dateLocale = useAppLocaleTag();
  const router = useRouter();
  const routeParams = useLocalSearchParams<{ harvestParcelId?: string; harvestPlantingId?: string }>();

  const prefillIntent = useMemo(() => {
    const rawP = routeParams.harvestParcelId;
    const rawPl = routeParams.harvestPlantingId;
    const p = typeof rawP === 'string' ? rawP : Array.isArray(rawP) ? rawP[0] : '';
    const pl = typeof rawPl === 'string' ? rawPl : Array.isArray(rawPl) ? rawPl[0] : '';
    const parcelId = typeof p === 'string' ? p.trim() : '';
    if (!parcelId) return null;
    const plantingId = typeof pl === 'string' && pl.trim() ? pl.trim() : null;
    return { parcelId, plantingId };
  }, [routeParams.harvestParcelId, routeParams.harvestPlantingId]);

  const onPrefillConsumed = useCallback(() => {
    try {
      router.setParams({
        harvestParcelId: undefined,
        harvestPlantingId: undefined,
      });
    } catch {
      // ignore navigation param clear failures
    }
  }, [router]);

  const h = useHarvestData(prefillIntent, onPrefillConsumed);
  const [step, setStep] = useState(1);

  useEffect(() => {
    setStep(1);
  }, [h.planMode]);

  useEffect(() => {
    if (!prefillIntent?.parcelId) return;
    if (prefillIntent.plantingId && h.harvestDetailsReady) {
      setStep(3);
    } else if (h.parcelId) {
      setStep(2);
    }
  }, [prefillIntent, h.parcelId, h.harvestDetailsReady]);

  const formatPlanDate = (iso: string) => {
    try {
      return formatAppDate(iso, dateLocale, { dateStyle: 'medium' });
    } catch {
      return '—';
    }
  };

  const insets = useSafeAreaInsets();
  const tabBarPad = 58 + Math.max(insets.bottom, 6);
  const selectedParcel = h.approvedParcels.find((p) => p.id === h.parcelId);
  const progressPct = step / STEPS;

  const parcelSelectOptions = useMemo(
    () =>
      h.approvedParcels.map((p) => ({
        id: p.id,
        label: p.label,
        subtitle: p.harvestPlanEligible
          ? undefined
          : t('producer.harvest.parcelPendingHarvestOnly'),
      })),
    [h.approvedParcels, t],
  );

  const plantingSelectOptions = useMemo(
    () =>
      h.plantingsForParcel.map((pl) => ({
        id: pl.id,
        label: pl.cropType,
        subtitle: `${formatPlanDate(pl.estimatedDate)}${
          pl.id.startsWith('local:') ? ` · ${t('producer.harvest.plantingPendingSync')}` : ''
        }`,
      })),
    [h.plantingsForParcel, t],
  );

  const cropSelectOptions = useMemo(
    () => CROP_TYPES.map((type) => ({ id: type, label: type })),
    [],
  );

  const step1Ok =
    Boolean(h.parcelId) && (h.planMode === 'PLANTING' || h.selectedParcelHarvestEligible);
  const step2Ok =
    h.planMode === 'HARVEST'
      ? h.plantingsForParcel.length > 0 &&
        Boolean(h.selectedPlantingId) &&
        h.plantingsForParcel.some((p) => p.id === h.selectedPlantingId)
      : Boolean(h.cropType.trim());

  const headerSubtitle = t('producer.fieldLogForm.wizardStepOf', { step, total: STEPS });

  return (
    <View style={growerUi.canvas}>
      <GrowerStackHeader title={t('producer.tabs.harvest')} subtitle={headerSubtitle} />

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
          style={{ flex: 1 }}
          contentContainerStyle={[growerUi.scrollContent, { paddingBottom: tabBarPad + 88 }]}
          refreshControl={
            <RefreshControl
              refreshing={h.parcelsRefreshing}
              onRefresh={h.refreshParcels}
              tintColor={theme.colors.accent}
              colors={[theme.colors.accent]}
            />
          }
          keyboardShouldPersistTaps="handled"
        >
        {step === 1 ? (
        <>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => h.setPlanMode('PLANTING')}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 8,
              borderWidth: 0.5,
              backgroundColor: h.planMode === 'PLANTING' ? theme.colors.accent : theme.colors.background,
              borderColor: h.planMode === 'PLANTING' ? theme.colors.accent : theme.colors.border,
            }}
          >
            <Text style={{ fontSize: 14, color: h.planMode === 'PLANTING' ? theme.colors.background : theme.colors.text.primary }}>
              {t('producer.harvest.modePlanting')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => h.setPlanMode('HARVEST')}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 8,
              borderWidth: 0.5,
              backgroundColor: h.planMode === 'HARVEST' ? theme.colors.accent : theme.colors.background,
              borderColor: h.planMode === 'HARVEST' ? theme.colors.accent : theme.colors.border,
            }}
          >
            <Text style={{ fontSize: 14, color: h.planMode === 'HARVEST' ? theme.colors.background : theme.colors.text.primary }}>
              {t('producer.harvest.modeHarvest')}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 10 }}>
            {t('producer.harvest.stepParcel')}
          </Text>
            <Text style={{ fontSize: 13, color: theme.colors.text.secondary, marginBottom: 12, lineHeight: 18 }}>
              {t('producer.harvest.selectParcel')} <Text style={{ color: theme.colors.error }}>*</Text>
            </Text>
            {h.parcelsLoading ? (
              <ActivityIndicator size="small" color={enterpriseColors.primary} />
            ) : h.approvedParcels.length === 0 ? (
              <Text style={{ fontSize: 14, color: enterpriseColors.destructive }}>
                {t('producer.harvest.noApprovedParcels')}
              </Text>
            ) : (
              <GrowerSelectField
                label={t('producer.harvest.stepParcel')}
                placeholder={t('producer.select.parcel')}
                valueId={h.parcelId}
                options={parcelSelectOptions}
                onSelect={h.setParcelId}
              />
            )}
            {!h.parcelsLoading && h.planMode === 'HARVEST' && h.parcelId && !h.selectedParcelHarvestEligible ? (
              <Text style={{ fontSize: 13, color: theme.colors.error, marginTop: 12, lineHeight: 18 }}>
                {t('producer.harvest.harvestNeedsApprovedParcel')}
              </Text>
            ) : null}
        </View>
        </>
        ) : null}

        {step > 1 && selectedParcel ? (
          <View style={[enterpriseUi.inAppPanel, styles.contextChip]}>
            <MapPin size={18} color={enterpriseColors.gray600} strokeWidth={1.5} />
            <Text style={styles.contextText} numberOfLines={2}>
              {selectedParcel.label}
            </Text>
          </View>
        ) : null}

        {step === 2 && h.planMode === 'HARVEST' ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 10 }}>
              {t('producer.harvest.stepPlanting')}
            </Text>
            {h.plantingsForParcel.length === 0 ? (
              <View>
                <Text style={{ fontSize: 14, color: theme.colors.error, lineHeight: 20, marginBottom: 8 }}>
                  {t('producer.harvest.noPlantingsForParcel')}
                </Text>
                <Text style={{ fontSize: 13, color: theme.colors.text.secondary, lineHeight: 19 }}>
                  {t('producer.harvest.registerPlantingHint')}
                </Text>
              </View>
            ) : (
              <GrowerSelectField
                label={t('producer.harvest.stepPlanting')}
                placeholder={t('producer.select.planting')}
                valueId={h.selectedPlantingId ?? ''}
                options={plantingSelectOptions}
                onSelect={(id) => h.setSelectedPlantingId(id)}
              />
            )}
          </View>
        ) : null}

        {step === 2 && h.planMode === 'PLANTING' ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 10 }}>
              {t('producer.harvest.stepCropPlanting')}
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.text.secondary, marginBottom: 12, lineHeight: 18 }}>
              {t('producer.harvest.cropType')} <Text style={{ color: theme.colors.error }}>*</Text>
            </Text>
            <GrowerSelectField
              label={t('producer.harvest.cropType')}
              placeholder={t('producer.select.crop')}
              valueId={h.cropType}
              options={cropSelectOptions}
              onSelect={h.setCropType}
            />
          </View>
        ) : null}

        {step === 3 && h.planMode === 'HARVEST' && h.cropType.trim() ? (
          <View style={[enterpriseUi.inAppPanel, styles.contextChip, { marginBottom: 12 }]}>
            <Text style={styles.contextText} numberOfLines={1}>
              {h.cropType}
            </Text>
          </View>
        ) : null}

        {step === 3 ? (
          <>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 12 }}>
              {h.planMode === 'HARVEST' ? t('producer.harvest.stepHarvestDetails') : t('producer.harvest.stepPlantingDetails')}
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '400', color: theme.colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
                {h.planMode === 'HARVEST' ? t('producer.harvest.plannedHarvestDate') : t('producer.harvest.plantingPlanDate')}{' '}
                <Text style={{ color: theme.colors.error }}>*</Text>
              </Text>
              <Text style={{ fontSize: 14, color: theme.colors.text.secondary, marginBottom: 8, lineHeight: 17 }}>
                {h.planMode === 'HARVEST' ? t('producer.harvest.plannedHarvestDateHint') : null}
              </Text>
              <GrowerDateField value={h.harvestDate} onChange={h.setHarvestDate} />
            </View>

            {h.planMode === 'HARVEST' ? (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '400', color: theme.colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
                  {t('producer.harvest.estimatedQuantity')} <Text style={{ color: theme.colors.error }}>*</Text>
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={h.estimatedQuantity}
                    onChangeText={h.setEstimatedQuantity}
                    placeholder="0"
                    keyboardType="numeric"
                    style={{
                      flex: 1,
                      fontSize: 14,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderWidth: 0.5,
                      borderColor: theme.colors.border,
                      borderRadius: 8,
                      backgroundColor: theme.colors.background,
                    }}
                  />
                  <View
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderWidth: 0.5,
                      borderColor: theme.colors.border,
                      borderRadius: 8,
                      backgroundColor: theme.colors.background,
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 13, color: theme.colors.text.primary }}>{h.unit}</Text>
                  </View>
                </View>
              </View>
            ) : null}

            {h.planMode === 'HARVEST' ? (
              <>
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '400', color: theme.colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
                    {t('producer.harvest.plannedLoadDate')}
                  </Text>
                  <GrowerDateField value={h.plannedLoadDate} onChange={h.setPlannedLoadDate} />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '400', color: theme.colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
                    {t('producer.harvest.loadQuantity')}
                  </Text>
                  <TextInput
                    value={h.loadQuantity}
                    onChangeText={h.setLoadQuantity}
                    placeholder={t('producer.harvest.loadQuantityHint')}
                    keyboardType="numeric"
                    style={{
                      fontSize: 14,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderWidth: 0.5,
                      borderColor: theme.colors.border,
                      borderRadius: 8,
                      backgroundColor: theme.colors.background,
                    }}
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '400', color: theme.colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
                    {t('producer.harvest.channel')}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {(['INDUSTRIAL', 'RETAIL', 'MIXED'] as const).map((c) => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => h.setMarketChannel(h.marketChannel === c ? '' : c)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 8,
                          borderWidth: 0.5,
                          backgroundColor: h.marketChannel === c ? theme.colors.accent : theme.colors.background,
                          borderColor: h.marketChannel === c ? theme.colors.accent : theme.colors.border,
                        }}
                      >
                        <Text style={{ fontSize: 14, color: h.marketChannel === c ? theme.colors.background : theme.colors.text.primary }}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '400', color: theme.colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
                    {t('producer.harvest.qualityGrade')}
                  </Text>
                  <TextInput
                    value={h.qualityGrade}
                    onChangeText={h.setQualityGrade}
                    placeholder={t('producer.harvest.qualityPlaceholder')}
                    style={{
                      fontSize: 14,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderWidth: 0.5,
                      borderColor: theme.colors.border,
                      borderRadius: 8,
                      backgroundColor: theme.colors.background,
                    }}
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '400', color: theme.colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
                    {t('producer.harvest.sortingSpec')}
                  </Text>
                  <TextInput
                    value={h.sortingSpec}
                    onChangeText={h.setSortingSpec}
                    placeholder={t('producer.harvest.sortingPlaceholder')}
                    multiline
                    style={{
                      fontSize: 14,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderWidth: 0.5,
                      borderColor: theme.colors.border,
                      borderRadius: 8,
                      backgroundColor: theme.colors.background,
                      minHeight: 80,
                    }}
                  />
                </View>
              </>
            ) : null}

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '400', color: theme.colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
                {t('producer.harvest.notesOptional')}
              </Text>
              <TextInput
                value={h.growerNotes}
                onChangeText={h.setGrowerNotes}
                placeholder={t('producer.harvest.notesPlaceholder')}
                multiline
                style={{
                  fontSize: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderWidth: 0.5,
                  borderColor: theme.colors.border,
                  borderRadius: 8,
                  backgroundColor: theme.colors.background,
                  minHeight: 64,
                }}
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 14, color: theme.colors.text.secondary, marginBottom: 8 }}>{t('producer.harvest.gpsOptional')}</Text>
              <TouchableOpacity
                onPress={h.getCurrentLocation}
                disabled={h.loading}
                style={{
                  backgroundColor: theme.colors.background,
                  borderWidth: 0.5,
                  borderColor: theme.colors.border,
                  borderRadius: 8,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <MapPin size={20} color={theme.colors.accent} strokeWidth={1} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  {h.location ? (
                    <Text style={{ fontSize: 13, color: theme.colors.text.primary }}>
                      GPS: {h.location.lat.toFixed(6)}, {h.location.lng.toFixed(6)}
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 13, color: theme.colors.text.secondary }}>{t('producer.harvest.getCurrentLocation')}</Text>
                  )}
                </View>
                {h.loading && <ActivityIndicator size="small" color={theme.colors.accent} />}
              </TouchableOpacity>
            </View>
          </>
        ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + tabBarPad }]}>
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
              activeOpacity={0.88}
            >
              <Text style={enterpriseUi.authBtnPrimaryText}>{t('producer.fieldLogForm.farmerNext')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => void h.handleSubmit()}
              disabled={h.loading || !h.canSubmit}
              style={[
                enterpriseUi.authBtnPrimary,
                styles.footerPrimary,
                (!h.canSubmit || h.loading) && styles.footerDisabled,
              ]}
              activeOpacity={0.88}
            >
              {h.loading ? (
                <ActivityIndicator color={enterpriseColors.white} />
              ) : (
                <Text style={enterpriseUi.authBtnPrimaryText}>
                  {h.planMode === 'PLANTING' ? t('producer.harvest.sendPlanPlanting') : t('producer.harvest.sendPlanHarvest')}
                </Text>
              )}
            </TouchableOpacity>
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
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: enterpriseColors.canvas,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
  },
  footerSpacer: {
    width: 88,
  },
  footerPrimary: {
    flex: 1,
    minHeight: 52,
    justifyContent: 'center',
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
