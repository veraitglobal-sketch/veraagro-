import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  type NativeSyntheticEvent,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, ChevronRight } from 'lucide-react-native';
import * as Location from 'expo-location';
import MapView, { Polygon, Polyline, Marker } from 'react-native-maps';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
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
  const [step, setStep] = useState<EstateStep>(1);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [polygonCoordinates, setPolygonCoordinates] = useState<Array<{ lat: number; lng: number }>>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [region, setRegion] = useState({
    latitude: 44.0165,
    longitude: 21.0059,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [loading, setLoading] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [drawStyle, setDrawStyle] = useState<'tap' | 'finger'>('tap');
  const [fingerStroke, setFingerStroke] = useState<MapLonLat[]>([]);
  const [locationRefreshing, setLocationRefreshing] = useState(false);
  const [plantingType, setPlantingType] = useState<PlantingType | null>(null);
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [cropId, setCropId] = useState<string | null>(null);
  const [varietyId, setVarietyId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const userLocation = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setCurrentLocation(userLocation);
        setRegion({ latitude: userLocation.lat, longitude: userLocation.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      } catch {
        // ignore
      }
    })();
  }, []);

  const refreshDeviceLocation = useCallback(async () => {
    if (step !== 1) return;
    setLocationRefreshing(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const userLocation = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setCurrentLocation(userLocation);
      setRegion({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch {
      // ignore
    } finally {
      setLocationRefreshing(false);
    }
  }, [step]);

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
            } else if (__DEV__) {
              console.warn('[NewEstateScreen] PLANTING record not created', e);
            }
          }
        } else {
          await offlineStorage.savePendingHarvestPlan({ payload: plantingPayload });
          void syncService.getSyncStatus();
        }
      } catch (q) {
        if (__DEV__) console.warn('[NewEstateScreen] planting queue failed', q);
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
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View
        style={{
          paddingTop: 56,
          paddingBottom: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity onPress={() => (step > 1 ? setStep((s) => (s - 1) as EstateStep) : router.back())} style={{ marginRight: theme.spacing.md }}>
          <ArrowLeft size={24} color={colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '600', color: colors.text.primary }}>
          {t('producer.estates.newEstate')} · {t('producer.estates.step')} {step}/3
        </Text>
        {step === 3 && (
          <TouchableOpacity onPress={handleSave} disabled={loading || !canProceedStep3}>
            {loading ? <ActivityIndicator size="small" color={colors.primary} /> : <Save size={24} color={colors.primary} strokeWidth={1.5} />}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          step === 1 ? (
            <RefreshControl
              refreshing={locationRefreshing}
              onRefresh={refreshDeviceLocation}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
      >
        <View style={{ padding: theme.spacing.md }}>
          {/* Step 1: Name, location, map */}
          {step === 1 && (
            <>
              <View style={{ marginBottom: theme.spacing.md }}>
                <Text style={labelStyle}>{t('producer.estates.estateName')}</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t('producer.estates.estateNamePlaceholder')}
                  style={inputStyle}
                />
              </View>
              <View style={{ marginBottom: theme.spacing.md }}>
                <Text style={labelStyle}>{t('producer.estates.locationOptional')}</Text>
                <TextInput value={location} onChangeText={setLocation} placeholder="e.g. Arilje, Serbia" style={inputStyle} />
              </View>
              <View style={infoBoxStyle}>
                <Text style={{ fontSize: 13, color: colors.text.primary }}>{t('producer.estates.drawFingerHint')}</Text>
                {drawStyle === 'tap' ? (
                  <Text style={{ fontSize: 11, color: colors.text.secondary, marginTop: 6 }}>{t('producer.estates.atLeast3Points')}</Text>
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
                <TouchableOpacity
                  onPress={() => setDrawStyleWrapped('tap')}
                  disabled={fingerDrawingLocked && fingerStroke.length > 0}
                  style={[
                    buttonStyle,
                    drawStyle === 'tap' && { borderColor: colors.primary, backgroundColor: `${colors.primary}12` },
                  ]}
                >
                  <Text style={[buttonTextStyle, drawStyle === 'tap' && { fontWeight: '700' }]}>
                    {t('producer.estates.drawStyleTap')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDrawStyleWrapped('finger')}
                  disabled={fingerDrawingLocked && fingerStroke.length > 0}
                  style={[
                    buttonStyle,
                    drawStyle === 'finger' && { borderColor: colors.primary, backgroundColor: `${colors.primary}12` },
                  ]}
                >
                  <Text style={[buttonTextStyle, drawStyle === 'finger' && { fontWeight: '700' }]}>
                    {t('producer.estates.drawStyleFinger')}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md, flexWrap: 'wrap' }}>
                <TouchableOpacity
                  onPress={() => setDrawing(!drawing)}
                  style={[buttonStyle, drawing && { backgroundColor: colors.primary }]}
                >
                  <Text style={[buttonTextStyle, drawing && { color: colors.background }]}>
                    {drawing
                      ? drawStyle === 'finger'
                        ? t('producer.estates.drawStyleFinger')
                        : t('producer.estates.drawingActive')
                      : t('producer.estates.enableDrawingBtn')}
                  </Text>
                </TouchableOpacity>
                {fingerDrawingLocked && fingerStroke.length > 2 && (
                  <TouchableOpacity
                    onPress={handleAcceptFingerOutline}
                    style={{
                      flex: 1,
                      minWidth: 120,
                      padding: theme.spacing.md,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: colors.primary,
                      borderWidth: 0.5,
                      borderColor: colors.primary,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.background }}>
                      {t('producer.estates.acceptFingerOutline')}
                    </Text>
                  </TouchableOpacity>
                )}
                {(polygonCoordinates.length > 0 || fingerStroke.length > 0) && (
                  <TouchableOpacity onPress={clearPolygon} style={[buttonStyle, { flex: 0 }]}>
                    <Text style={[buttonTextStyle, { color: colors.error }]}>{t('producer.estates.delete')}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ height: 360, borderRadius: theme.borderRadius.md, overflow: 'hidden', borderWidth: 0.5, borderColor: colors.border, marginBottom: theme.spacing.md }}>
                <MapView
                  style={{ flex: 1 }}
                  region={region}
                  onRegionChangeComplete={(r) =>
                    setRegion({
                      latitude: r.latitude,
                      longitude: r.longitude,
                      latitudeDelta: r.latitudeDelta,
                      longitudeDelta: r.longitudeDelta,
                    })
                  }
                  scrollEnabled={!fingerDrawingLocked}
                  zoomEnabled={!fingerDrawingLocked}
                  rotateEnabled={!fingerDrawingLocked}
                  onPress={handleMapPress}
                  onPanDrag={handlePanDrag}
                  showsUserLocation
                  showsMyLocationButton
                >
                  {currentLocation && (
                    <Marker coordinate={{ latitude: currentLocation.lat, longitude: currentLocation.lng }} title={t('producer.estates.yourLocation')} />
                  )}
                  {polygonCoordinates.length > 0 && !(fingerDrawingLocked && fingerStroke.length >= 2) ? (
                    <Polygon
                      coordinates={polygonCoordinates.map((c) => ({ latitude: c.lat, longitude: c.lng }))}
                      fillColor={`${colors.primary}30`}
                      strokeColor={colors.primary}
                      strokeWidth={2}
                    />
                  ) : null}
                  {polygonCoordinates.length > 0 && fingerDrawingLocked && fingerStroke.length >= 2 ? (
                    <Polygon
                      coordinates={polygonCoordinates.map((c) => ({ latitude: c.lat, longitude: c.lng }))}
                      fillColor={`${colors.primary}14`}
                      strokeColor={colors.primary}
                      strokeWidth={1}
                    />
                  ) : null}
                  {fingerDrawingLocked && fingerStroke.length >= 2 ? (
                    <Polyline
                      coordinates={fingerStroke.map((c) => ({ latitude: c.lat, longitude: c.lng }))}
                      strokeColor={colors.primary}
                      strokeWidth={3}
                    />
                  ) : null}
                  {drawStyle === 'tap'
                    ? polygonCoordinates.map((coord, index) => (
                        <Marker
                          key={`v-${coord.lat}-${coord.lng}-${index}`}
                          coordinate={{ latitude: coord.lat, longitude: coord.lng }}
                          title={t('producer.estates.pointN', { n: index + 1 })}
                        />
                      ))
                    : null}
                </MapView>
              </View>
              {(polygonCoordinates.length > 0 || fingerStroke.length > 0) && (
                <Text style={{ fontSize: 12, color: colors.text.secondary, marginBottom: theme.spacing.md }}>
                  {t('producer.estates.boundaryPoints')}: {polygonCoordinates.length}
                  {fingerDrawingLocked && fingerStroke.length > 0 ? ` · ${fingerStroke.length}` : ''}
                </Text>
              )}
              <TouchableOpacity
                onPress={handleNextStep}
                disabled={!canProceedStep1}
                style={[primaryButtonStyle, !canProceedStep1 && { opacity: 0.5 }]}
              >
                <Text style={{ color: colors.background, fontWeight: '600' }}>{t('common.next')}</Text>
                <ChevronRight size={18} color={colors.background} strokeWidth={2} />
              </TouchableOpacity>
            </>
          )}

          {/* Step 2: New or existing plantings */}
          {step === 2 && (
            <>
              <Text style={{ fontSize: 15, color: colors.text.secondary, marginBottom: theme.spacing.lg }}>{t('producer.estates.plantingTypePrompt')}</Text>
              <TouchableOpacity
                onPress={() => setPlantingType('NEW')}
                style={[optionCardStyle, plantingType === 'NEW' && optionCardActiveStyle]}
              >
                <Text style={[optionCardTitleStyle, plantingType === 'NEW' && { color: colors.primary }]}>{t('producer.estates.newPlanting')}</Text>
                <Text style={optionCardDescStyle}>{t('producer.estates.newPlantingDesc')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPlantingType('EXISTING')}
                style={[optionCardStyle, plantingType === 'EXISTING' && optionCardActiveStyle]}
              >
                <Text style={[optionCardTitleStyle, plantingType === 'EXISTING' && { color: colors.primary }]}>{t('producer.estates.existingPlanting')}</Text>
                <Text style={optionCardDescStyle}>{t('producer.estates.existingPlantingDesc')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNextStep} disabled={!canProceedStep2} style={[primaryButtonStyle, !canProceedStep2 && { opacity: 0.5 }]}>
                <Text style={{ color: colors.background, fontWeight: '600' }}>{t('common.next')}</Text>
                <ChevronRight size={18} color={colors.background} strokeWidth={2} />
              </TouchableOpacity>
            </>
          )}

          {/* Step 3: Crop selection */}
          {step === 3 && (
            <>
              <Text style={{ fontSize: 15, color: colors.text.secondary, marginBottom: theme.spacing.lg }}>{t('producer.estates.whatPlanted')}</Text>
              <Text style={labelStyle}>{t('producer.estates.cropCategory.label')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing.lg }}>
                {(Object.keys(CROP_HIERARCHY) as CategoryKey[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => { setCategory(cat); setCropId(null); setVarietyId(null); }}
                    style={[chipStyle, category === cat && chipActiveStyle]}
                  >
                    <Text style={[chipTextStyle, category === cat && { color: colors.primary }]}>{categoryLabels[cat]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {category && (
                <>
                  <Text style={labelStyle}>{t('producer.estates.cropSelection')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: theme.spacing.md }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {CROP_HIERARCHY[category].map((crop) => (
                        <TouchableOpacity
                          key={crop.id}
                          onPress={() => { setCropId(crop.id); setVarietyId(null); }}
                          style={[chipStyle, cropId === crop.id && chipActiveStyle]}
                        >
                          <Text style={[chipTextStyle, cropId === crop.id && { color: colors.primary }]}>{crop.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </>
              )}
              {category && cropId && (
                <>
                  <Text style={labelStyle}>{t('producer.estates.variety')}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing.lg }}>
                    {CROP_HIERARCHY[category].find((c) => c.id === cropId)?.varieties.map((v) => (
                      <TouchableOpacity key={v.id} onPress={() => setVarietyId(v.id)} style={[chipStyle, varietyId === v.id && chipActiveStyle]}>
                        <Text style={[chipTextStyle, varietyId === v.id && { color: colors.primary }]}>{v.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              <TouchableOpacity onPress={handleSave} disabled={loading || !canProceedStep3} style={[primaryButtonStyle, (loading || !canProceedStep3) && { opacity: 0.5 }]}>
                {loading ? <ActivityIndicator color={colors.background} /> : <Text style={{ color: colors.background, fontWeight: '600' }}>{t('producer.estates.saveEstate')}</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const labelStyle: TextStyle = {
  fontSize: 13,
  fontWeight: '500',
  color: colors.text.secondary,
  marginBottom: 6,
};
const inputStyle: TextStyle = {
  fontSize: 15,
  color: colors.text.primary,
  borderWidth: 0.5,
  borderColor: colors.border,
  borderRadius: theme.borderRadius.sm,
  padding: theme.spacing.md,
  backgroundColor: colors.background,
};
const infoBoxStyle: ViewStyle = {
  backgroundColor: `${colors.primary}10`,
  borderRadius: theme.borderRadius.md,
  padding: theme.spacing.md,
  marginBottom: theme.spacing.md,
  borderWidth: 0.5,
  borderColor: colors.primary,
};
const buttonStyle: ViewStyle = {
  flex: 1,
  padding: theme.spacing.md,
  borderRadius: theme.borderRadius.sm,
  backgroundColor: colors.background,
  borderWidth: 0.5,
  borderColor: colors.border,
  alignItems: 'center',
};
const buttonTextStyle: TextStyle = { fontSize: 13, fontWeight: '500', color: colors.text.primary };
const primaryButtonStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  backgroundColor: colors.primary,
  paddingVertical: 14,
  borderRadius: theme.borderRadius.md,
};
const optionCardStyle: ViewStyle = {
  padding: theme.spacing.lg,
  borderRadius: theme.borderRadius.lg,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.background,
  marginBottom: theme.spacing.md,
};
const optionCardActiveStyle: ViewStyle = { borderColor: colors.primary, backgroundColor: `${colors.primary}08` };
const optionCardTitleStyle: TextStyle = {
  fontSize: 16,
  fontWeight: '600',
  color: colors.text.primary,
  marginBottom: 4,
};
const optionCardDescStyle: TextStyle = { fontSize: 13, color: colors.text.secondary };
const chipStyle: ViewStyle = {
  paddingHorizontal: 14,
  paddingVertical: 10,
  borderRadius: theme.borderRadius.md,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.background,
};
const chipActiveStyle: ViewStyle = { borderColor: colors.primary, backgroundColor: `${colors.primary}10` };
const chipTextStyle: TextStyle = { fontSize: 14, fontWeight: '500', color: colors.text.primary };
