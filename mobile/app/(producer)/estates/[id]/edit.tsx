import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Save, MapPin } from 'lucide-react-native';
import * as Location from 'expo-location';
import MapView, { Polygon, Marker } from 'react-native-maps';
import { colors } from '../../../../lib/colors';
import { theme } from '../../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../../lib/screen-insets';
import { BioVeraSubpageHeader } from '../../../../components/BioVeraSubpageHeader';
import { estatesAPI, Estate } from '../../../../lib/api';
import { apiErrorMessage } from '../../../../lib/api-error';

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
  const [region, setRegion] = useState({
    latitude: 44.0165,
    longitude: 21.0059,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [initialLoad, setInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawing, setDrawing] = useState(false);

  const loadEstate = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!id) return;
      if (mode === 'refresh') setRefreshing(true);
      else setInitialLoad(true);
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
            setRegion({
              latitude: centerLat,
              longitude: centerLng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        } else {
          setPolygonCoordinates([]);
        }
      } catch (error) {
        console.error('Error loading estate:', error);
        Alert.alert(t('error'), t('producer.estates.loadFailed'));
      } finally {
        if (mode === 'refresh') setRefreshing(false);
        else setInitialLoad(false);
      }
    },
    [id, t],
  );

  useEffect(() => {
    if (id) void loadEstate('initial');
  }, [id, loadEstate]);

  const handleMapPress = (event: any) => {
    if (!drawing) return;
    
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setPolygonCoordinates([...polygonCoordinates, { lat: latitude, lng: longitude }]);
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
  };

  if (initialLoad && !estate) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <BioVeraSubpageHeader
        title={t('producer.estates.editEstateTitle')}
        left="back"
        right={
          <TouchableOpacity onPress={handleSave} disabled={saving} hitSlop={8}>
            {saving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Save size={24} color={colors.primary} strokeWidth={1.5} />
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadEstate('refresh')}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
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
              fontWeight: '300',
              color: colors.text.secondary,
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
                fontWeight: '300',
                color: colors.text.primary,
                borderWidth: 0.5,
                borderColor: colors.border,
                borderRadius: theme.borderRadius.sm,
                padding: theme.spacing.md,
                backgroundColor: colors.background,
              }}
            />
          </View>

          {/* Location Input */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text style={{
              fontSize: 13,
              fontWeight: '300',
              color: colors.text.secondary,
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
                fontWeight: '300',
                color: colors.text.primary,
                borderWidth: 0.5,
                borderColor: colors.border,
                borderRadius: theme.borderRadius.sm,
                padding: theme.spacing.md,
                backgroundColor: colors.background,
              }}
            />
          </View>

          {/* Drawing Controls */}
          <View style={{ 
            flexDirection: 'row', 
            gap: theme.spacing.sm, 
            marginBottom: theme.spacing.md 
          }}>
            <TouchableOpacity
              onPress={() => setDrawing(!drawing)}
              style={{
                flex: 1,
                padding: theme.spacing.md,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: drawing ? colors.primary : colors.background,
                borderWidth: 0.5,
                borderColor: drawing ? colors.primary : colors.border,
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: '300',
                color: drawing ? colors.background : colors.text.primary,
              }}>
                {drawing ? t('producer.estates.drawingActive') : t('producer.estates.enableDrawing')}
              </Text>
            </TouchableOpacity>
            {polygonCoordinates.length > 0 && (
              <TouchableOpacity
                onPress={clearPolygon}
                style={{
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.sm,
                  backgroundColor: colors.background,
                  borderWidth: 0.5,
                  borderColor: colors.border,
                }}
              >
                <Text style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: colors.error,
                }}>
                  {t('producer.estates.delete')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Map */}
          <View style={{
            height: 400,
            borderRadius: theme.borderRadius.md,
            overflow: 'hidden',
            borderWidth: 0.5,
            borderColor: colors.border,
            marginBottom: theme.spacing.md,
          }}>
            <MapView
              style={{ flex: 1 }}
              region={region}
              onPress={handleMapPress}
              showsUserLocation={true}
            >
              {polygonCoordinates.length > 0 && (
                <Polygon
                  coordinates={polygonCoordinates.map(coord => ({
                    latitude: coord.lat,
                    longitude: coord.lng,
                  }))}
                  fillColor={`${colors.primary}30`}
                  strokeColor={colors.primary}
                  strokeWidth={2}
                />
              )}
              {polygonCoordinates.map((coord, index) => (
                <Marker
                  key={index}
                  coordinate={{
                    latitude: coord.lat,
                    longitude: coord.lng,
                  }}
                  title={t('producer.estates.pointN', { n: index + 1 })}
                />
              ))}
            </MapView>
          </View>

          {/* Polygon Info */}
          {polygonCoordinates.length > 0 && (
            <View style={{
              backgroundColor: colors.background,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              borderWidth: 0.5,
              borderColor: colors.border,
            }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '300',
                color: colors.text.primary,
              }}>
                {t('producer.estates.boundaryPoints')}: {polygonCoordinates.length}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
