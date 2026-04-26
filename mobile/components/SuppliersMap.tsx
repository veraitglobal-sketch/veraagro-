import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useState, useEffect } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { retailLocationsAPI, b2bSuppliersAPI, RetailLocation } from '../lib/api';
import { theme } from '../lib/theme';
import { ShoppingBag, Sprout, Info } from 'lucide-react-native';

interface SuppliersMapProps {
  onMarkerPress?: (location: RetailLocation) => void;
}

/**
 * Retail Locations Map Component
 * Shows all BioVera retail locations where products can be purchased
 * Works with Expo Go - no native build required
 */
export default function SuppliersMap({ onMarkerPress }: SuppliersMapProps) {
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
  }, []);

  const loadRetailLocations = async () => {
    try {
      setLoading(true);
      const [retail, suppliers] = await Promise.all([
        retailLocationsAPI.getAllPublic(),
        b2bSuppliersAPI.getPublicMap(),
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
          Loading map...
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
              tracksViewChanges={false}
              onPress={() => onMarkerPress?.(location)}
            >
              <View style={styles.markerContainer}>
                <View
                  style={[
                    styles.markerRing,
                    isSupplier ? styles.markerRingSupplier : styles.markerRingRetail,
                  ]}
                >
                  {isSupplier ? (
                    <Sprout size={20} color="#B45309" strokeWidth={2} />
                  ) : (
                    <ShoppingBag size={20} color={theme.colors.primary} strokeWidth={2} />
                  )}
                </View>
              </View>
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
    fontSize: 12,
    fontWeight: '300',
    lineHeight: 17,
    color: theme.colors.text.secondary,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Classic Bio Vera look: white disc + crisp brand border (retail = green, supplier = amber) */
  markerRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 4,
  },
  markerRingRetail: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  markerRingSupplier: {
    borderWidth: 2,
    borderColor: '#EA580C',
    backgroundColor: '#FFFFFF',
  },
});
