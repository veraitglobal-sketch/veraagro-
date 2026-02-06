import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useState, useEffect } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { retailLocationsAPI, RetailLocation } from '../lib/api';
import { theme } from '../lib/theme';
import { MapPin, ShoppingBag } from 'lucide-react-native';

interface SuppliersMapProps {
  onMarkerPress?: (location: RetailLocation) => void;
}

/**
 * Retail Locations Map Component
 * Shows all BioVera retail locations where products can be purchased
 * Works with Expo Go - no native build required
 */
export default function SuppliersMap({ onMarkerPress }: SuppliersMapProps) {
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
      const data = await retailLocationsAPI.getAllPublic();
      
      // Filter locations with valid coordinates
      const validLocations = data.filter(location => {
        return location.latitude && location.longitude && 
               location.latitude !== 0 && location.longitude !== 0;
      });
      
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
      <MapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {locations.map((location) => {
          if (!location.latitude || !location.longitude) return null;
          
          return (
            <Marker
              key={location.id}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              onPress={() => onMarkerPress?.(location)}
            >
              <View style={styles.markerContainer}>
                <View style={styles.marker}>
                  <ShoppingBag size={22} color={theme.colors.primary} strokeWidth={1.5} />
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
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: theme.colors.primary,
    ...theme.shadows.lg,
  },
  markerPulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${theme.colors.primary}20`,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
  },
});
