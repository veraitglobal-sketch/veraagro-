import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Calendar, Package, MapPin, Check } from 'lucide-react-native';
import * as Location from 'expo-location';
import { offlineStorage } from '../../../lib/offline-storage';
import { verifyGPS } from '../../../lib/integrity-guard';
import { colors } from '../../../lib/colors';
import { estatesAPI, Estate } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';

/**
 * Harvest Report Screen
 * Form for reporting estimated harvest quantity
 */
export default function HarvestReportScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [cropType, setCropType] = useState('');
  const [estimatedQuantity, setEstimatedQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsWarning, setGpsWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [estates, setEstates] = useState<Estate[]>([]);
  const [currentEstate, setCurrentEstate] = useState<Estate | null>(null);

  useEffect(() => {
    loadEstates();
    requestPermissions();
  }, []);

  const loadEstates = async () => {
    try {
      const data = await estatesAPI.getAll();
      setEstates(data);
      if (data.length > 0) {
        setCurrentEstate(data[0]);
      }
    } catch (error) {
      console.error('Error loading estates:', error);
    }
  };

  const requestPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Dozvole', 'Potrebna je dozvola za lokaciju');
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const userLocation = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      };
      
      setLocation(userLocation);

      // Verify GPS if estate is loaded
      if (currentEstate && currentEstate.polygonCoordinates) {
        const isValid = verifyGPS(userLocation, {
          polygonCoordinates: currentEstate.polygonCoordinates as Array<{ lat: number; lng: number }>,
        });
        setGpsWarning(!isValid);
      }
    } catch (error) {
      Alert.alert('Greška', 'Ne mogu da dobijem lokaciju');
      console.error('Location error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!cropType.trim()) {
      Alert.alert('Greška', 'Unesi tip useva');
      return;
    }

    if (!estimatedQuantity || parseFloat(estimatedQuantity) <= 0) {
      Alert.alert('Greška', 'Unesi validnu količinu');
      return;
    }

    if (!location) {
      Alert.alert('Greška', 'Lokacija je obavezna');
      return;
    }

    if (gpsWarning) {
      Alert.alert(
        'Upozorenje',
        'Niste na svojoj parceli! Da li želite da nastavite?',
        [
          { text: 'Otkaži', style: 'cancel' },
          { text: 'Nastavi', onPress: () => saveHarvest() },
        ]
      );
      return;
    }

    await saveHarvest();
  };

  const saveHarvest = async () => {
    try {
      setLoading(true);
      
      // Save harvest report (similar to field entry but for harvest)
      const harvestData = {
        cropType: cropType.trim(),
        estimatedQuantity: parseFloat(estimatedQuantity),
        unit,
        harvestDate,
        location: location!,
        timestamp: new Date().toISOString(),
      };

      // For now, save to AsyncStorage (can be synced later)
      const existing = await offlineStorage.getPendingEntries();
      const harvestEntry = {
        id: `harvest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        activityType: 'Žetva' as const,
        materialID: undefined,
        photoUri: '', // Harvest doesn't require photo
        location: location!,
        timestamp: new Date().toISOString(),
        status: 'pending' as const,
        harvestData, // Additional harvest-specific data
      };
      
      existing.push(harvestEntry as any);
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('pending_field_entries', JSON.stringify(existing));

      Alert.alert('Uspešno', 'Prijava berbe je sačuvana. Biće poslata kada budeš online.');
      
      // Reset form
      setCropType('');
      setEstimatedQuantity('');
      setUnit('kg');
      setHarvestDate(new Date().toISOString().split('T')[0]);
      setLocation(null);
      setGpsWarning(false);
    } catch (error) {
      Alert.alert('Greška', 'Ne mogu da sačuvam prijavu berbe');
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cropTypes = ['Raspberry', 'Pepper', 'Tomato', 'Cucumber', 'Lettuce', 'Other'];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ padding: 16 }}>
        {/* GPS Warning Banner */}
        {gpsWarning && (
          <View style={{
            backgroundColor: '#FEF3C7',
            borderWidth: 0.5,
            borderColor: '#F59E0B',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Text style={{
              fontSize: 13,
              color: '#92400E',
              flex: 1,
            }}>
              Upozorenje: Niste na svojoj parceli!
            </Text>
          </View>
        )}

        {/* Crop Type */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '300',
            color: colors.text.primary,
            marginBottom: 12,
            letterSpacing: 0.5,
          }}>
            Tip useva <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {cropTypes.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setCropType(type)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 0.5,
                  backgroundColor: cropType === type ? colors.accent : colors.background,
                  borderColor: cropType === type ? colors.accent : colors.border,
                }}
                activeOpacity={0.7}
              >
                <Text style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: cropType === type ? colors.background : colors.text.primary,
                }}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Estimated Quantity */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '300',
            color: colors.text.primary,
            marginBottom: 12,
            letterSpacing: 0.5,
          }}>
            Procenjena količina <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              value={estimatedQuantity}
              onChangeText={setEstimatedQuantity}
              placeholder="0"
              keyboardType="numeric"
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: '300',
                color: colors.text.primary,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderWidth: 0.5,
                borderColor: colors.border,
                borderRadius: 8,
                backgroundColor: colors.background,
              }}
            />
            <View style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderWidth: 0.5,
              borderColor: colors.border,
              borderRadius: 8,
              backgroundColor: colors.background,
              justifyContent: 'center',
            }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '300',
                color: colors.text.primary,
              }}>
                {unit}
              </Text>
            </View>
          </View>
        </View>

        {/* Harvest Date */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '300',
            color: colors.text.primary,
            marginBottom: 12,
            letterSpacing: 0.5,
          }}>
            Datum berbe
          </Text>
          <TextInput
            value={harvestDate}
            onChangeText={setHarvestDate}
            placeholder="YYYY-MM-DD"
            style={{
              fontSize: 14,
              fontWeight: '300',
              color: colors.text.primary,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderWidth: 0.5,
              borderColor: colors.border,
              borderRadius: 8,
              backgroundColor: colors.background,
            }}
          />
        </View>

        {/* Location */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '300',
            color: colors.text.primary,
            marginBottom: 12,
            letterSpacing: 0.5,
          }}>
            Lokacija <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TouchableOpacity
            onPress={getCurrentLocation}
            disabled={loading}
            style={{
              backgroundColor: colors.background,
              borderWidth: 0.5,
              borderColor: colors.border,
              borderRadius: 8,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <MapPin size={20} color={colors.accent} strokeWidth={1} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                {location ? (
                  <>
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '300',
                      color: colors.text.primary,
                    }}>
                      GPS: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '300',
                      color: colors.success,
                      marginTop: 4,
                    }}>
                      ✓ Lokacija učitana
                    </Text>
                  </>
                ) : (
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '300',
                    color: colors.text.secondary,
                  }}>
                    Uzmi trenutnu lokaciju
                  </Text>
                )}
              </View>
            </View>
            {loading && <ActivityIndicator size="small" color={colors.accent} />}
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || !cropType || !estimatedQuantity || !location}
          style={{
            backgroundColor: (!cropType || !estimatedQuantity || !location) ? colors.surface : colors.accent,
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 8,
            alignItems: 'center',
            opacity: loading ? 0.5 : 1,
            borderWidth: 0.5,
            borderColor: colors.accent,
          }}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={{
              fontSize: 16,
              fontWeight: '300',
              color: (!cropType || !estimatedQuantity || !location) ? colors.text.secondary : colors.background,
              letterSpacing: 0.5,
            }}>
              Prijavi berbu
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
