import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Save, MapPin } from 'lucide-react-native';
import * as Location from 'expo-location';
import MapView, { Polygon, Marker } from 'react-native-maps';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { estatesAPI } from '../../../lib/api';

/**
 * New Estate Screen
 * Create new estate with GPS polygon drawing
 */
export default function NewEstateScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [polygonCoordinates, setPolygonCoordinates] = useState<Array<{ lat: number; lng: number }>>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [region, setRegion] = useState({
    latitude: 44.0165, // Serbia default
    longitude: 21.0059,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [loading, setLoading] = useState(false);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    requestPermissions();
    getCurrentLocation();
  }, []);

  const requestPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Dozvole', 'Potrebna je dozvola za lokaciju');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const userLocation = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      };
      setCurrentLocation(userLocation);
      setRegion({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleMapPress = (event: any) => {
    if (!drawing) return;
    
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setPolygonCoordinates([...polygonCoordinates, { lat: latitude, lng: longitude }]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Greška', 'Unesite naziv njive');
      return;
    }

    if (polygonCoordinates.length < 3) {
      Alert.alert('Greška', 'Označite najmanje 3 tačke na mapi da formirate granicu');
      return;
    }

    try {
      setLoading(true);
      await estatesAPI.create({
        name: name.trim(),
        polygonCoordinates,
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Greška', error.message || 'Ne mogu da kreiram njivu');
      console.error('Error creating estate:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearPolygon = () => {
    setPolygonCoordinates([]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Header */}
      <View 
        className="px-4 pt-12 pb-4 border-b-[0.5px] flex-row items-center"
        style={{ 
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: theme.spacing.md }}
        >
          <ArrowLeft size={24} color={colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text 
          className="text-lg flex-1"
          style={{ 
            color: colors.text.primary,
            fontWeight: '300',
            letterSpacing: 0.5,
          }}
        >
          Nova Njiva
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Save size={24} color={colors.primary} strokeWidth={1.5} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: theme.spacing.md }}>
          {/* Name Input */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text style={{
              fontSize: 13,
              fontWeight: '300',
              color: colors.text.secondary,
              marginBottom: theme.spacing.xs,
              letterSpacing: 0.3,
            }}>
              Naziv njive
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="npr. Glavna njiva"
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

          {/* Location Input (Optional) */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text style={{
              fontSize: 13,
              fontWeight: '300',
              color: colors.text.secondary,
              marginBottom: theme.spacing.xs,
              letterSpacing: 0.3,
            }}>
              Lokacija (opciono)
            </Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="npr. Arilje, Srbija"
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

          {/* Map Drawing Instructions */}
          <View style={{
            backgroundColor: `${colors.primary}10`,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: colors.primary,
          }}>
            <Text style={{
              fontSize: 13,
              fontWeight: '300',
              color: colors.text.primary,
              marginBottom: theme.spacing.xs,
            }}>
              {drawing ? 'Kliknite na mapu da dodate tačke granice' : 'Uključite crtanje da označite granice'}
            </Text>
            <Text style={{
              fontSize: 11,
              fontWeight: '300',
              color: colors.text.secondary,
            }}>
              Potrebno je najmanje 3 tačke da formirate granicu njive
            </Text>
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
                {drawing ? 'Crtanje aktivno' : 'Uključi crtanje'}
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
                  Obriši
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
              showsMyLocationButton={true}
            >
              {currentLocation && (
                <Marker
                  coordinate={{
                    latitude: currentLocation.lat,
                    longitude: currentLocation.lng,
                  }}
                  title="Vaša lokacija"
                />
              )}
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
                  title={`Tačka ${index + 1}`}
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
                marginBottom: theme.spacing.xs,
              }}>
                Tačke granice: {polygonCoordinates.length}
              </Text>
              {polygonCoordinates.length < 3 && (
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: colors.warning,
                }}>
                  Potrebno je najmanje 3 tačke
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
