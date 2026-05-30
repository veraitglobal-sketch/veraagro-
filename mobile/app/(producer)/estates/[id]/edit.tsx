import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  type NativeSyntheticEvent,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Save } from 'lucide-react-native';
import MapView from 'react-native-maps';
import {
  EstateBoundaryMap,
  animateEstateMapTo,
  DEFAULT_ESTATE_MAP_REGION,
} from '../../../../components/grower/EstateBoundaryMap';
import { theme } from '../../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../../lib/screen-insets';
import { BioVeraSubpageHeader } from '../../../../components/BioVeraSubpageHeader';
import { estatesAPI, Estate } from '../../../../lib/api';
import { apiErrorMessage } from '../../../../lib/api-error';
import { FormKeyboardWrap } from '../../../../components/FormKeyboardWrap';
import {
  appendPanSample,
  finalizeFreehandRing,
  type MapLonLat,
} from '../../../../lib/map-boundary-geometry';

/**
 * Edit Estate Screen
 * Edit estate name and GPS polygon
 */
export default function EditEstateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [estate, setEstate] = useState<Estate | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [polygonCoordinates, setPolygonCoordinates] = useState<Array<{ lat: number; lng: number }>>([]);
  const mapRef = useRef<MapView>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [drawStyle, setDrawStyle] = useState<'tap' | 'finger'>('tap');
  const [fingerStroke, setFingerStroke] = useState<MapLonLat[]>([]);

  const loadEstate = useCallback(
    async () => {
      if (!id) return;
      setInitialLoad(true);
      try {
        const data = await estatesAPI.getOne(id);
        setEstate(data);
        setName(data.name);
        setLocation(data.location || '');
        if (data.polygonCoordinates) {
          const coords = data.polygonCoordinates as Array<{ lat: number; lng: number }>;
          setPolygonCoordinates(coords);
          if (coords.length > 0) {
            const centerLat = coords.reduce((sum, p) => sum + p.lat, 0) / coords.length;
            const centerLng = coords.reduce((sum, p) => sum + p.lng, 0) / coords.length;
            requestAnimationFrame(() => animateEstateMapTo(mapRef, centerLat, centerLng));
          }
        } else {
          setPolygonCoordinates([]);
        }
      } catch (error) {
        console.error('Error loading estate:', error);
        Alert.alert(t('error'), t('producer.estates.loadFailed'));
      } finally {
        setInitialLoad(false);
      }
    },
    [id, t],
  );

  useEffect(() => {
    if (id) void loadEstate();
  }, [id, loadEstate]);

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
        t('producer.estates.editEstateTitle'),
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

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('error'), t('producer.estates.enterName'));
      return;
    }

    if (!id) return;

    try {
      setSaving(true);
      await estatesAPI.update(id, {
        name: name.trim(),
        polygonCoordinates: polygonCoordinates.length > 0 ? polygonCoordinates : undefined,
      });
      router.back();
    } catch (error: unknown) {
      Alert.alert(t('error'), apiErrorMessage(error, t('producer.estates.updateFailed')));
      console.error('Error updating estate:', error);
    } finally {
      setSaving(false);
    }
  };

  const clearPolygon = () => {
    setPolygonCoordinates([]);
    setFingerStroke([]);
  };

  if (initialLoad && !estate) {
    return (
      <View style={{ flex: 1, paddingTop: p.topInset, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <FormKeyboardWrap style={{ flex: 1, backgroundColor: theme.colors.surface }}>
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <BioVeraSubpageHeader
        title={t('producer.estates.editEstateTitle')}
        left="back"
        right={
          <TouchableOpacity onPress={handleSave} disabled={saving} hitSlop={8}>
            {saving ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Save size={24} color={theme.colors.primary} strokeWidth={1.5} />
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        scrollEnabled={!drawing}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            paddingTop: theme.spacing.md,
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
            paddingBottom: Math.max(p.bottomInset, theme.spacing.lg),
          }}
        >
          {/* Name Input */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text style={{
              fontSize: 13,
              fontWeight: '400',
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
              letterSpacing: 0.3,
            }}>
              {t('producer.estates.estateName')}
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. North field"
              style={{
                fontSize: 15,
                fontWeight: '400',
                color: theme.colors.text.primary,
                borderWidth: 0.5,
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.sm,
                padding: theme.spacing.md,
                backgroundColor: theme.colors.background,
              }}
            />
          </View>

          {/* Location Input */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text style={{
              fontSize: 13,
              fontWeight: '400',
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
              letterSpacing: 0.3,
            }}>
              {t('producer.estates.optionalLocation')}
            </Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Arilje, Serbia"
              style={{
                fontSize: 15,
                fontWeight: '400',
                color: theme.colors.text.primary,
                borderWidth: 0.5,
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.sm,
                padding: theme.spacing.md,
                backgroundColor: theme.colors.background,
              }}
            />
          </View>

          {/* Drawing Controls */}
          <Text
            style={{
              fontSize: 13,
              color: theme.colors.text.secondary,
              lineHeight: 19,
              marginBottom: theme.spacing.sm,
            }}
          >
            {t('producer.estates.drawFingerHint')}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              gap: theme.spacing.sm,
              marginBottom: theme.spacing.sm,
            }}
          >
            <TouchableOpacity
              onPress={() => setDrawStyleWrapped('tap')}
              disabled={fingerDrawingLocked && fingerStroke.length > 0}
              style={{
                flex: 1,
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: drawStyle === 'tap' ? `${theme.colors.primary}18` : theme.colors.background,
                borderWidth: 0.5,
                borderColor: drawStyle === 'tap' ? theme.colors.primary : theme.colors.border,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text.primary }}>
                {t('producer.estates.drawStyleTap')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setDrawStyleWrapped('finger')}
              disabled={fingerDrawingLocked && fingerStroke.length > 0}
              style={{
                flex: 1,
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: drawStyle === 'finger' ? `${theme.colors.primary}18` : theme.colors.background,
                borderWidth: 0.5,
                borderColor: drawStyle === 'finger' ? theme.colors.primary : theme.colors.border,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text.primary }}>
                {t('producer.estates.drawStyleFinger')}
              </Text>
            </TouchableOpacity>
          </View>
          <View
            style={{
              flexDirection: 'row',
              gap: theme.spacing.sm,
              marginBottom: theme.spacing.md,
            }}
          >
            <TouchableOpacity
              onPress={() => setDrawing(!drawing)}
              style={{
                flex: 1,
                padding: theme.spacing.md,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: drawing ? theme.colors.primary : theme.colors.background,
                borderWidth: 0.5,
                borderColor: drawing ? theme.colors.primary : theme.colors.border,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '400',
                  color: drawing ? theme.colors.background : theme.colors.text.primary,
                }}
              >
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
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.md,
                  borderRadius: theme.borderRadius.sm,
                  backgroundColor: theme.colors.primary,
                  borderWidth: 0.5,
                  borderColor: theme.colors.primary,
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.background }}>
                  {t('producer.estates.acceptFingerOutline')}
                </Text>
              </TouchableOpacity>
            )}
            {(polygonCoordinates.length > 0 || fingerStroke.length > 0) && (
              <TouchableOpacity
                onPress={clearPolygon}
                style={{
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.sm,
                  backgroundColor: theme.colors.background,
                  borderWidth: 0.5,
                  borderColor: theme.colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '400',
                    color: theme.colors.error,
                  }}
                >
                  {t('producer.estates.delete')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <EstateBoundaryMap
            ref={mapRef}
            height={400}
            initialRegion={DEFAULT_ESTATE_MAP_REGION}
            polygonCoordinates={polygonCoordinates}
            fingerStroke={fingerStroke}
            drawing={drawing}
            drawStyle={drawStyle}
            fingerDrawingLocked={fingerDrawingLocked}
            currentLocation={null}
            onMapPress={handleMapPress}
            onPanDrag={handlePanDrag}
            pointLabel={(index) => t('producer.estates.pointN', { n: index + 1 })}
            yourLocationTitle={t('producer.estates.yourLocation')}
          />

          {/* Polygon Info */}
          {(polygonCoordinates.length > 0 || fingerStroke.length > 0) && (
            <View style={{
              backgroundColor: theme.colors.background,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              borderWidth: 0.5,
              borderColor: theme.colors.border,
            }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '400',
                color: theme.colors.text.primary,
              }}>
                {t('producer.estates.boundaryPoints')}: {polygonCoordinates.length}
                {fingerDrawingLocked && fingerStroke.length > 0
                  ? ` · ${fingerStroke.length}`
                  : ''}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
    </FormKeyboardWrap>
  );
}
