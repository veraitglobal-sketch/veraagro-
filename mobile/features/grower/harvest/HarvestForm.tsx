import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCallback, useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { useHarvestData, CROP_TYPES } from './useHarvestData';

export default function HarvestForm() {
  const { t, i18n } = useTranslation();
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

  const formatPlanDate = (iso: string) => {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '—';
      const tag = i18n.language?.startsWith('sr') ? 'sr-Latn' : 'en-GB';
      return d.toLocaleDateString(tag, { dateStyle: 'medium' });
    } catch {
      return '—';
    }
  };

  const showHarvestPlantingStep = h.planMode === 'HARVEST' && !!h.parcelId;
  const showPlantingCropStep = h.planMode === 'PLANTING' && !!h.parcelId;
  const showQuantityAndRest = !!h.parcelId && h.harvestDetailsReady;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      refreshControl={
        <RefreshControl
          refreshing={h.parcelsRefreshing}
          onRefresh={h.refreshParcels}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => h.setPlanMode('PLANTING')}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 8,
              borderWidth: 0.5,
              backgroundColor: h.planMode === 'PLANTING' ? colors.accent : colors.background,
              borderColor: h.planMode === 'PLANTING' ? colors.accent : colors.border,
            }}
          >
            <Text style={{ fontSize: 12, color: h.planMode === 'PLANTING' ? colors.background : colors.text.primary }}>
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
              backgroundColor: h.planMode === 'HARVEST' ? colors.accent : colors.background,
              borderColor: h.planMode === 'HARVEST' ? colors.accent : colors.border,
            }}
          >
            <Text style={{ fontSize: 12, color: h.planMode === 'HARVEST' ? colors.background : colors.text.primary }}>
              {t('producer.harvest.modeHarvest')}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 16, lineHeight: 18 }}>
          {h.planMode === 'PLANTING' ? t('producer.harvest.planIntroPlanting') : t('producer.harvest.planIntroHarvest')}
        </Text>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 10 }}>
            {t('producer.harvest.stepParcel')}
          </Text>
          <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 12, lineHeight: 18 }}>
            {t('producer.harvest.selectParcel')} <Text style={{ color: colors.error }}>*</Text>
          </Text>
          {h.parcelsLoading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : h.approvedParcels.length === 0 ? (
            <Text style={{ fontSize: 14, color: colors.error }}>{t('producer.harvest.noApprovedParcels')}</Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {h.approvedParcels.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => h.setParcelId(p.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 8,
                    borderWidth: 0.5,
                    backgroundColor: h.parcelId === p.id ? colors.accent : colors.background,
                    borderColor: h.parcelId === p.id ? colors.accent : colors.border,
                    maxWidth: '100%',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: h.parcelId === p.id ? colors.background : colors.text.primary,
                    }}
                    numberOfLines={2}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {showHarvestPlantingStep ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 10 }}>
              {t('producer.harvest.stepPlanting')}
            </Text>
            {h.plantingsForParcel.length === 0 ? (
              <View>
                <Text style={{ fontSize: 14, color: colors.error, lineHeight: 20, marginBottom: 8 }}>
                  {t('producer.harvest.noPlantingsForParcel')}
                </Text>
                <Text style={{ fontSize: 13, color: colors.text.secondary, lineHeight: 19 }}>
                  {t('producer.harvest.registerPlantingHint')}
                </Text>
              </View>
            ) : (
              <>
                <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 10, lineHeight: 18 }}>
                  {t('producer.harvest.selectPlantingLead')}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {h.plantingsForParcel.map((pl) => {
                    const sel = h.selectedPlantingId === pl.id;
                    return (
                      <TouchableOpacity
                        key={pl.id}
                        onPress={() => h.setSelectedPlantingId(pl.id)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderRadius: 8,
                          borderWidth: 0.5,
                          backgroundColor: sel ? colors.accent : colors.background,
                          borderColor: sel ? colors.accent : colors.border,
                          maxWidth: '100%',
                          minWidth: '44%',
                          flexGrow: 1,
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: sel ? colors.background : colors.text.primary }}>
                          {pl.cropType}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            marginTop: 4,
                            color: sel ? colors.background : colors.text.secondary,
                            opacity: sel ? 0.95 : 1,
                          }}
                        >
                          {formatPlanDate(pl.estimatedDate)}
                        </Text>
                        {pl.id.startsWith('local:') ? (
                          <Text
                            style={{
                              fontSize: 10,
                              marginTop: 4,
                              color: sel ? colors.background : colors.text.tertiary,
                              fontStyle: 'italic',
                            }}
                          >
                            {t('producer.harvest.plantingPendingSync')}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {!h.selectedPlantingId ? (
                  <Text style={{ fontSize: 13, color: colors.text.secondary, marginTop: 10, lineHeight: 18 }}>
                    {t('producer.harvest.selectPlantingBeforeDetails')}
                  </Text>
                ) : null}
              </>
            )}
          </View>
        ) : null}

        {showPlantingCropStep ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 10 }}>
              {t('producer.harvest.stepCropPlanting')}
            </Text>
            <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 12, lineHeight: 18 }}>
              {t('producer.harvest.cropType')} <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CROP_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => h.setCropType(type)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 8,
                    borderWidth: 0.5,
                    backgroundColor: h.cropType === type ? colors.accent : colors.background,
                    borderColor: h.cropType === type ? colors.accent : colors.border,
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 13, color: h.cropType === type ? colors.background : colors.text.primary }}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {h.planMode === 'HARVEST' && h.selectedPlantingId && h.cropType.trim() ? (
          <View
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 8,
              borderWidth: 0.5,
              borderColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.text.secondary, marginBottom: 6 }}>{t('producer.harvest.cropFromPlanting')}</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text.primary }}>{h.cropType}</Text>
          </View>
        ) : null}

        {showQuantityAndRest ? (
          <>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 12 }}>
              {h.planMode === 'HARVEST' ? t('producer.harvest.stepHarvestDetails') : t('producer.harvest.stepPlantingDetails')}
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
                {t('producer.harvest.estimatedQuantity')} <Text style={{ color: colors.error }}>*</Text>
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
                    borderColor: colors.border,
                    borderRadius: 8,
                    backgroundColor: colors.background,
                  }}
                />
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderWidth: 0.5,
                    borderColor: colors.border,
                    borderRadius: 8,
                    backgroundColor: colors.background,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 13, color: colors.text.primary }}>{h.unit}</Text>
                </View>
              </View>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
                {h.planMode === 'HARVEST' ? t('producer.harvest.plannedHarvestDate') : t('producer.harvest.plantingPlanDate')}{' '}
                <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <Text style={{ fontSize: 12, color: colors.text.secondary, marginBottom: 8, lineHeight: 17 }}>
                {h.planMode === 'HARVEST' ? t('producer.harvest.plannedHarvestDateHint') : null}
              </Text>
              <TextInput
                value={h.harvestDate}
                onChangeText={h.setHarvestDate}
                placeholder="YYYY-MM-DD"
                style={{
                  fontSize: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderWidth: 0.5,
                  borderColor: colors.border,
                  borderRadius: 8,
                  backgroundColor: colors.background,
                }}
              />
            </View>

            {h.planMode === 'HARVEST' ? (
              <>
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
                    {t('producer.harvest.plannedLoadDate')}
                  </Text>
                  <TextInput
                    value={h.plannedLoadDate}
                    onChangeText={h.setPlannedLoadDate}
                    placeholder="YYYY-MM-DD"
                    style={{
                      fontSize: 14,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderWidth: 0.5,
                      borderColor: colors.border,
                      borderRadius: 8,
                      backgroundColor: colors.background,
                    }}
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
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
                      borderColor: colors.border,
                      borderRadius: 8,
                      backgroundColor: colors.background,
                    }}
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
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
                          backgroundColor: h.marketChannel === c ? colors.accent : colors.background,
                          borderColor: h.marketChannel === c ? colors.accent : colors.border,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: h.marketChannel === c ? colors.background : colors.text.primary }}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
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
                      borderColor: colors.border,
                      borderRadius: 8,
                      backgroundColor: colors.background,
                    }}
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
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
                      borderColor: colors.border,
                      borderRadius: 8,
                      backgroundColor: colors.background,
                      minHeight: 80,
                    }}
                  />
                </View>
              </>
            ) : null}

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, marginBottom: 12, letterSpacing: 0.5 }}>
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
                  borderColor: colors.border,
                  borderRadius: 8,
                  backgroundColor: colors.background,
                  minHeight: 64,
                }}
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 14, color: colors.text.secondary, marginBottom: 8 }}>{t('producer.harvest.gpsOptional')}</Text>
              <TouchableOpacity
                onPress={h.getCurrentLocation}
                disabled={h.loading}
                style={{
                  backgroundColor: colors.background,
                  borderWidth: 0.5,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <MapPin size={20} color={colors.accent} strokeWidth={1} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  {h.location ? (
                    <Text style={{ fontSize: 13, color: colors.text.primary }}>
                      GPS: {h.location.lat.toFixed(6)}, {h.location.lng.toFixed(6)}
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 13, color: colors.text.secondary }}>{t('producer.harvest.getCurrentLocation')}</Text>
                  )}
                </View>
                {h.loading && <ActivityIndicator size="small" color={colors.accent} />}
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        <TouchableOpacity
          onPress={h.handleSubmit}
          disabled={!h.canSubmit}
          style={{
            backgroundColor: !h.canSubmit ? colors.surface : colors.accent,
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 8,
            alignItems: 'center',
            opacity: h.loading ? 0.5 : 1,
            borderWidth: 0.5,
            borderColor: colors.accent,
          }}
          activeOpacity={0.7}
        >
          {h.loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: h.canSubmit ? colors.background : colors.text.secondary,
                letterSpacing: 0.3,
              }}
            >
              {h.planMode === 'PLANTING' ? t('producer.harvest.sendPlanPlanting') : t('producer.harvest.sendPlanHarvest')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
