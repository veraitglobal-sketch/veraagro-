import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  type NativeSyntheticEvent,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useState, useCallback, useRef } from 'react';
import { ArrowLeft, Save, ChevronRight, MapPin } from 'lucide-react-native';
import MapView from 'react-native-maps';
import { getCurrentGrowerPosition } from '../../../lib/grower-permissions';
import {
  EstateBoundaryMap,
  animateEstateMapTo,
  DEFAULT_ESTATE_MAP_REGION,
} from '../../../components/grower/EstateBoundaryMap';
import { FormKeyboardWrap } from '../../../components/FormKeyboardWrap';
import { FormHelperText } from '../../../components/FormHelperText';
import { farmerFormUi } from '../../../lib/farmer-form-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import {
  EnterpriseButton,
  EnterpriseTextField,
  EnterprisePanel,
  dsColors,
} from '../../../design-system';
import { estatesAPI, parcelsAPI, harvestAnnouncementsAPI, type CreateHarvestPlanBody } from '../../../lib/api';
import { apiErrorMessage, isLikelyNetworkError } from '../../../lib/api-error';
import { isDeviceOnline } from '../../../lib/network-utils';
import { offlineStorage } from '../../../lib/offline-storage';
import { syncService } from '../../../lib/sync-service';
import { plantingFormDateToEstimatedIsoUtc } from '../../../features/grower/plantings/planting-estimated-date';
import { CROP_HIERARCHY, getCropDisplayLabel } from '../../../lib/crops';
import { markStepComplete } from '../../../lib/grower-journey';
import {
  appendPanSample,
  finalizeFreehandRing,
  type MapLonLat,
} from '../../../lib/map-boundary-geometry';

type EstateStep = 1 | 2 | 3;
type PlantingType = 'NEW' | 'EXISTING';
type CategoryKey = 'fruits' | 'vegetables' | 'grains';

export default function NewEstateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const [step, setStep] = useState<EstateStep>(1);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [polygonCoordinates, setPolygonCoordinates] = useState<Array<{ lat: number; lng: number }>>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<MapView>(null);
  const [loading, setLoading] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [drawStyle, setDrawStyle] = useState<'tap' | 'finger'>('tap');
  const [fingerStroke, setFingerStroke] = useState<MapLonLat[]>([]);
  const [locationRefreshing, setLocationRefreshing] = useState(false);
  const [plantingType, setPlantingType] = useState<PlantingType | null>(null);
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [cropId, setCropId] = useState<string | null>(null);
  const [varietyId, setVarietyId] = useState<string | null>(null);

  const refreshDeviceLocation = useCallback(async () => {
    if (step !== 1) return;
    setLocationRefreshing(true);
    try {
      const pos = await getCurrentGrowerPosition(t);
      if (!pos) return;
      const userLocation = { lat: pos.lat, lng: pos.lng };
      setCurrentLocation(userLocation);
      animateEstateMapTo(mapRef, userLocation.lat, userLocation.lng);
    } finally {
      setLocationRefreshing(false);
    }
  }, [step, t]);

  const handleMapPress = (event: NativeSyntheticEvent<{ coordinate: { latitude: number; longitude: number } }>) => {
    if (!drawing || drawStyle !== 'tap') return;
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setPolygonCoordinates((prev) => [...prev, { lat: latitude, lng: longitude }]);
  };

  const fingerDrawingLocked = drawing && drawStyle === 'finger';

  const handlePanDrag = (event: NativeSyntheticEvent<{ coordinate: { latitude: number; longitude: number } }>) => {
    if (!fingerDrawingLocked) return;
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setFingerStroke((prev) => appendPanSample(prev, latitude, longitude));
  };

  const handleAcceptFingerOutline = () => {
    const done = finalizeFreehandRing(fingerStroke);
    if (!done.ok) {
      Alert.alert(
        t('producer.estates.newEstate'),
        done.reason === 'few'
          ? t('producer.estates.fingerOutlineTooFew')
          : t('producer.estates.fingerOutlineNotClosed'),
      );
      return;
    }
    setPolygonCoordinates(done.ring);
    setFingerStroke([]);
    setDrawing(false);
  };

  const setDrawStyleWrapped = (next: 'tap' | 'finger') => {
    setDrawStyle(next);
    if (next === 'tap') setFingerStroke([]);
  };

  const canProceedStep1 = name.trim().length > 0 && polygonCoordinates.length >= 3;
  const canProceedStep2 = plantingType !== null;
  const canProceedStep3 = category !== null && cropId !== null && varietyId !== null;

  const handleNextStep = () => {
    if (step === 1 && canProceedStep1) setStep(2);
    else if (step === 2 && canProceedStep2) setStep(3);
  };

  const handleSave = async () => {
    if (!canProceedStep3) return;
    const cropLabel = getCropDisplayLabel(category!, cropId!, varietyId!);
    try {
      setLoading(true);
      const estate = await estatesAPI.create({
        name: name.trim(),
        polygonCoordinates,
      });
      const cropTypeStr = `${cropLabel} (${plantingType === 'NEW' ? t('producer.estates.newPlanting') : t('producer.estates.existingPlanting')})`;
      const parcel = await parcelsAPI.create(estate.id, {
        polygonCoordinates,
        cropType: cropTypeStr,
      });

      const parsedEst = plantingFormDateToEstimatedIsoUtc(new Date().toISOString().slice(0, 10));
      const plantingPayload: CreateHarvestPlanBody = {
        parcelId: parcel.id,
        announcementType: 'PLANTING',
        cropType: cropTypeStr.slice(0, 500),
        estimatedDate: parsedEst.ok ? parsedEst.iso : new Date().toISOString(),
      };
      try {
        if (await isDeviceOnline()) {
          try {
            await harvestAnnouncementsAPI.create(plantingPayload);
          } catch (e) {
            if (isLikelyNetworkError(e)) {
              await offlineStorage.savePendingHarvestPlan({ payload: plantingPayload });
              void syncService.getSyncStatus();
            }
          }
        } else {
          await offlineStorage.savePendingHarvestPlan({ payload: plantingPayload });
          void syncService.getSyncStatus();
        }
      } catch {
        // planting queue failed — estate was still created
      }

      await markStepComplete(2);
      router.back();
    } catch (error: unknown) {
      Alert.alert(t('error'), apiErrorMessage(error, t('producer.estates.createFailed')));
    } finally {
      setLoading(false);
    }
  };

  const clearPolygon = () => {
    setPolygonCoordinates([]);
    setFingerStroke([]);
  };

  const categoryLabels: Record<CategoryKey, string> = {
    fruits: t('producer.estates.cropCategory.fruits'),
    vegetables: t('producer.estates.cropCategory.vegetables'),
    grains: t('producer.estates.cropCategory.grains'),
  };

  return (
    <FormKeyboardWrap style={styles.flexCanvas}>
    <View style={styles.flexCanvas}>
      <View style={[styles.header, { paddingTop: p.headerTop }]}>
        <TouchableOpacity
          onPress={() => (step > 1 ? setStep((s) => (s - 1) as EstateStep) : router.back())}
          style={styles.backBtn}
        >
          <ArrowLeft size={24} color={dsColors.gray900} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('producer.estates.newEstate')} · {t('producer.estates.step')} {step}/3
        </Text>
        {step === 3 && (
          <TouchableOpacity onPress={handleSave} disabled={loading || !canProceedStep3}>
            {loading ? (
              <ActivityIndicator size="small" color={dsColors.primary} />
            ) : (
              <Save size={24} color={dsColors.primary} strokeWidth={1.5} />
            )}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} scrollEnabled={step !== 1 || !drawing} keyboardShouldPersistTaps="handled">
        <View style={{ padding: 16 }}>
          {/* Step 1: Name, location, map */}
          {step === 1 && (
            <>
              <FormHelperText style={{ marginBottom: 16 }}>{t('form.helper.estateStep1')}</FormHelperText>
              <EnterpriseTextField
                label={t('producer.estates.estateName')}
                hint={t('form.helper.estateName')}
                value={name}
                onChangeText={setName}
                placeholder={t('producer.estates.estateNamePlaceholder')}
                required
                size="farmer"
              />
              <EnterpriseTextField
                label={t('producer.estates.locationOptional')}
                hint={t('form.helper.estateLocation')}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Arilje, Serbia"
                size="farmer"
              />
              <EnterprisePanel variant="tint" style={{ marginBottom: 24 }}>
                <Text style={styles.infoText}>{t('producer.estates.drawFingerHint')}</Text>
                {drawStyle === 'tap' ? (
                  <Text style={styles.infoSubtext}>{t('producer.estates.atLeast3Points')}</Text>
                ) : null}
              </EnterprisePanel>
              <View style={styles.drawStyleRow}>
                <TouchableOpacity
                  onPress={() => setDrawStyleWrapped('tap')}
                  disabled={fingerDrawingLocked && fingerStroke.length > 0}
                  style={[styles.mapBtn, drawStyle === 'tap' && styles.mapBtnActive]}
                >
                  <Text style={[styles.mapBtnText, drawStyle === 'tap' && styles.mapBtnTextActive]}>
                    {t('producer.estates.drawStyleTap')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDrawStyleWrapped('finger')}
                  disabled={fingerDrawingLocked && fingerStroke.length > 0}
                  style={[styles.mapBtn, drawStyle === 'finger' && styles.mapBtnActive]}
                >
                  <Text style={[styles.mapBtnText, drawStyle === 'finger' && styles.mapBtnTextActive]}>
                    {t('producer.estates.drawStyleFinger')}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.mapToolbar}>
                <TouchableOpacity
                  onPress={() => setDrawing(!drawing)}
                  style={[styles.mapBtn, drawing && styles.mapBtnDrawing]}
                >
                  <Text style={[styles.mapBtnText, drawing && styles.mapBtnTextOnPrimary]}>
                    {drawing
                      ? drawStyle === 'finger'
                        ? t('producer.estates.drawStyleFinger')
                        : t('producer.estates.drawingActive')
                      : t('producer.estates.enableDrawingBtn')}
                  </Text>
                </TouchableOpacity>
                {fingerDrawingLocked && fingerStroke.length > 2 && (
                  <EnterpriseButton
                    label={t('producer.estates.acceptFingerOutline')}
                    onPress={handleAcceptFingerOutline}
                    size="default"
                    style={styles.acceptOutlineBtn}
                  />
                )}
                {(polygonCoordinates.length > 0 || fingerStroke.length > 0) && (
                  <TouchableOpacity onPress={clearPolygon} style={[styles.mapBtn, styles.mapBtnCompact]}>
                    <Text style={[styles.mapBtnText, styles.deleteText]}>{t('producer.estates.delete')}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => void refreshDeviceLocation()}
                  disabled={locationRefreshing}
                  style={[styles.mapBtn, styles.mapBtnCompact]}
                  accessibilityLabel={t('producer.estates.yourLocation')}
                >
                  {locationRefreshing ? (
                    <ActivityIndicator size="small" color={dsColors.primary} />
                  ) : (
                    <MapPin size={20} color={dsColors.primary} strokeWidth={1.5} />
                  )}
                </TouchableOpacity>
              </View>
              <EstateBoundaryMap
                ref={mapRef}
                initialRegion={DEFAULT_ESTATE_MAP_REGION}
                polygonCoordinates={polygonCoordinates}
                fingerStroke={fingerStroke}
                drawing={drawing}
                drawStyle={drawStyle}
                fingerDrawingLocked={fingerDrawingLocked}
                currentLocation={currentLocation}
                onMapPress={handleMapPress}
                onPanDrag={handlePanDrag}
                pointLabel={(index) => t('producer.estates.pointN', { n: index + 1 })}
                yourLocationTitle={t('producer.estates.yourLocation')}
              />
              {(polygonCoordinates.length > 0 || fingerStroke.length > 0) && (
                <Text style={styles.boundaryCount}>
                  {t('producer.estates.boundaryPoints')}: {polygonCoordinates.length}
                  {fingerDrawingLocked && fingerStroke.length > 0 ? ` · ${fingerStroke.length}` : ''}
                </Text>
              )}
              <EnterpriseButton
                label={t('common.next')}
                onPress={handleNextStep}
                disabled={!canProceedStep1}
                fullWidth
                size="large"
                icon={<ChevronRight size={18} color={dsColors.white} strokeWidth={2} />}
              />
            </>
          )}

          {/* Step 2: New or existing plantings */}
          {step === 2 && (
            <>
              <FormHelperText style={{ marginBottom: 16 }}>{t('form.helper.estateStep2')}</FormHelperText>
              <Text style={styles.stepLead}>{t('producer.estates.plantingTypePrompt')}</Text>
              <TouchableOpacity
                onPress={() => setPlantingType('NEW')}
                style={[styles.optionCard, plantingType === 'NEW' && styles.optionCardActive]}
              >
                <Text style={[styles.optionCardTitle, plantingType === 'NEW' && styles.optionCardTitleActive]}>
                  {t('producer.estates.newPlanting')}
                </Text>
                <Text style={styles.optionCardDesc}>{t('producer.estates.newPlantingDesc')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPlantingType('EXISTING')}
                style={[styles.optionCard, plantingType === 'EXISTING' && styles.optionCardActive]}
              >
                <Text style={[styles.optionCardTitle, plantingType === 'EXISTING' && styles.optionCardTitleActive]}>
                  {t('producer.estates.existingPlanting')}
                </Text>
                <Text style={styles.optionCardDesc}>{t('producer.estates.existingPlantingDesc')}</Text>
              </TouchableOpacity>
              <EnterpriseButton
                label={t('common.next')}
                onPress={handleNextStep}
                disabled={!canProceedStep2}
                fullWidth
                size="large"
                icon={<ChevronRight size={18} color={dsColors.white} strokeWidth={2} />}
              />
            </>
          )}

          {/* Step 3: Crop selection */}
          {step === 3 && (
            <>
              <FormHelperText style={{ marginBottom: 16 }}>{t('form.helper.estateStep3')}</FormHelperText>
              <Text style={styles.stepLead}>{t('producer.estates.whatPlanted')}</Text>
              <Text style={styles.fieldLabel}>{t('producer.estates.cropCategory.label')}</Text>
              <View style={styles.chipRow}>
                {(Object.keys(CROP_HIERARCHY) as CategoryKey[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => { setCategory(cat); setCropId(null); setVarietyId(null); }}
                    style={[styles.chip, category === cat && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                      {categoryLabels[cat]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {category && (
                <>
                  <Text style={styles.fieldLabel}>{t('producer.estates.cropSelection')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropScroll}>
                    <View style={styles.chipRowInline}>
                      {CROP_HIERARCHY[category].map((crop) => (
                        <TouchableOpacity
                          key={crop.id}
                          onPress={() => { setCropId(crop.id); setVarietyId(null); }}
                          style={[styles.chip, cropId === crop.id && styles.chipActive]}
                        >
                          <Text style={[styles.chipText, cropId === crop.id && styles.chipTextActive]}>
                            {crop.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </>
              )}
              {category && cropId && (
                <>
                  <Text style={styles.fieldLabel}>{t('producer.estates.variety')}</Text>
                  <View style={styles.chipRow}>
                    {CROP_HIERARCHY[category].find((c) => c.id === cropId)?.varieties.map((v) => (
                      <TouchableOpacity
                        key={v.id}
                        onPress={() => setVarietyId(v.id)}
                        style={[styles.chip, varietyId === v.id && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, varietyId === v.id && styles.chipTextActive]}>
                          {v.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              <EnterpriseButton
                label={t('producer.estates.saveEstate')}
                onPress={handleSave}
                loading={loading}
                disabled={!canProceedStep3}
                fullWidth
                size="large"
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
    </FormKeyboardWrap>
  );
}

const styles = StyleSheet.create({
  flexCanvas: {
    flex: 1,
    backgroundColor: dsColors.canvas,
  },
  header: {
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: dsColors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: dsColors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
    ...farmerFormUi.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: dsColors.gray900,
  },
  infoText: {
    fontSize: 13,
    color: dsColors.gray900,
  },
  infoSubtext: {
    fontSize: 14,
    color: dsColors.muted,
    marginTop: 6,
  },
  drawStyleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  mapToolbar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  mapBtn: {
    flex: 1,
    ...farmerFormUi.touchTarget,
    borderRadius: 8,
    backgroundColor: dsColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: dsColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBtnCompact: {
    flex: 0,
    minWidth: 52,
  },
  mapBtnActive: {
    borderColor: dsColors.primary,
    backgroundColor: dsColors.primaryTint,
  },
  mapBtnDrawing: {
    backgroundColor: dsColors.primary,
    borderColor: dsColors.primary,
  },
  mapBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: dsColors.gray900,
  },
  mapBtnTextActive: {
    fontWeight: '700',
  },
  mapBtnTextOnPrimary: {
    color: dsColors.white,
  },
  deleteText: {
    color: dsColors.destructive,
  },
  acceptOutlineBtn: {
    flex: 1,
    minWidth: 120,
  },
  boundaryCount: {
    fontSize: 14,
    color: dsColors.muted,
    marginBottom: 12,
  },
  stepLead: {
    fontSize: 15,
    color: dsColors.muted,
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: dsColors.muted,
    marginBottom: 6,
  },
  optionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dsColors.border,
    backgroundColor: dsColors.surface,
    marginBottom: 24,
    minHeight: 48,
  },
  optionCardActive: {
    borderColor: dsColors.primary,
    backgroundColor: dsColors.primaryTint,
  },
  optionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: dsColors.gray900,
    marginBottom: 4,
  },
  optionCardTitleActive: {
    color: dsColors.primary,
  },
  optionCardDesc: {
    fontSize: 13,
    color: dsColors.muted,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chipRowInline: {
    flexDirection: 'row',
    gap: 8,
  },
  cropScroll: {
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dsColors.border,
    backgroundColor: dsColors.surface,
  },
  chipActive: {
    borderColor: dsColors.primary,
    backgroundColor: dsColors.primaryTint,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: dsColors.gray900,
  },
  chipTextActive: {
    color: dsColors.primary,
  },
});
