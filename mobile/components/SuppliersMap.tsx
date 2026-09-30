import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useState, useEffect } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { retailLocationsAPI, b2bSuppliersAPI, RetailLocation } from '../lib/api';
import { theme } from '../lib/theme';
import { Info } from 'lucide-react-native';
import { MAP_PIN_ANCHOR, MapLocationPin } from './map/MapLocationPin';

interface SuppliersMapProps {
  onMarkerPress?: (location: RetailLocation) => void;
  category?: string;
  bioVeraOnly?: boolean;
}

/**
 * Retail Locations Map Component
 * Shows all BioVera retail locations where products can be purchased
 * Works with Expo Go - no native build required
 */
export default function SuppliersMap({ onMarkerPress, category, bioVeraOnly }: SuppliersMapProps) {
  const { t } = useTranslation();
  const [locations, setLocations] = useState<RetailLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState({
    latitude: 53.5511, // Hamburg default
    longitude: 9.9937,
    latitudeDelta: 2,
    longitudeDelta: 2,
  });

  useEffect(() => {
    loadRetailLocations();
  }, [category, bioVeraOnly]);

  const loadRetailLocations = async () => {
    try {
      setLoading(true);
      const [retail, suppliers] = await Promise.all([
        retailLocationsAPI.getAllPublic(),
        b2bSuppliersAPI.getPublicMap({ category, bioVeraOnly }),
      ]);
      const retailMapped = (retail || []).map((r) => ({ ...r, kind: 'retail' as const }));
      const merged = [...retailMapped, ...(suppliers || [])].filter(
        (location) =>
          location.latitude &&
          location.longitude &&
          location.latitude !== 0 &&
          location.longitude !== 0
      );
      const validLocations = merged;
      
      setLocations(validLocations);
      
      // Calculate center point if we have locations
      if (validLocations.length > 0) {
        const avgLat = validLocations.reduce((sum, l) => sum + l.latitude, 0) / validLocations.length;
        const avgLng = validLocations.reduce((sum, l) => sum + l.longitude, 0) / validLocations.length;
        
        setRegion({
          latitude: avgLat,
          longitude: avgLng,
          latitudeDelta: 2,
          longitudeDelta: 2,
        });
      }
    } catch (error) {
      console.error('Error loading retail locations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{
          marginTop: theme.spacing.md,
          fontSize: 13,
          fontWeight: '400',
          color: theme.colors.text.secondary,
          letterSpacing: 0.3,
        }}>
          {t('map.loading', 'Loading map…')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {locations.length === 0 && (
        <View
          style={styles.hintBox}
        >
          <Info size={18} color={theme.colors.text.secondary} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hintTitle}>{t('map.emptyTitle')}</Text>
            <Text style={styles.hintBody}>{t('map.emptyBody')}</Text>
          </View>
        </View>
      )}
      <MapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
      >
        {locations.map((location) => {
          if (!location.latitude || !location.longitude) return null;
          const isSupplier = location.kind === 'supplier';
          const key = `${location.kind ?? 'retail'}-${location.id}`;

          return (
            <Marker
              key={key}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              anchor={MAP_PIN_ANCHOR}
              tracksViewChanges={false}
              onPress={() => onMarkerPress?.(location)}
            >
              <MapLocationPin variant={isSupplier ? 'supplier' : 'retail'} />
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  hintTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  hintBody: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 17,
    color: theme.colors.text.secondary,
  },
  map: {
    flex: 1,
  },
});
