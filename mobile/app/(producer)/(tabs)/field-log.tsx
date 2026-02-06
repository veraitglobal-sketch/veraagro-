import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Linking } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera, MapPin, Check, X } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { offlineStorage, PendingFieldEntry } from '../../../lib/offline-storage';
import { verifyGPS, materialValidator } from '../../../lib/integrity-guard';
import { theme } from '../../../lib/theme';
import { estatesAPI, Estate } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';

type ActivityType = 'PLANTING' | 'FERTILIZING' | 'SPRAYING' | 'HARVEST';

/**
 * Field Log Form
 * Heart of the system - offline-first entry form
 * Matches buyer dashboard styling
 */
export default function FieldLogScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [activityType, setActivityType] = useState<ActivityType | ''>('');
  const [materialID, setMaterialID] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsWarning, setGpsWarning] = useState(false);
  const [materialValid, setMaterialValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [estates, setEstates] = useState<Estate[]>([]);
  const [currentEstate, setCurrentEstate] = useState<Estate | null>(null);

  useEffect(() => {
    loadEstates();
    requestPermissions();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const checkScannedBarcode = async () => {
        try {
          const scannedBarcode = await AsyncStorage.getItem('last_scanned_barcode');
          if (scannedBarcode) {
            setMaterialID(scannedBarcode);
            await AsyncStorage.removeItem('last_scanned_barcode');
          }
        } catch (error) {
          // Ignore
        }
      };
      checkScannedBarcode();
    }, [])
  );

  useEffect(() => {
    if (materialID && materialID.trim().length >= 3) {
      // Debounce validation - wait 500ms after user stops typing
      const timeoutId = setTimeout(() => {
        validateMaterial();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else if (!materialID || materialID.trim().length === 0) {
      setMaterialValid(null);
    }
  }, [materialID, activityType]);

  const loadEstates = async () => {
    try {
      const data = await estatesAPI.getAll();
      setEstates(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setCurrentEstate(data[0]);
      }
    } catch (error) {
      console.error('Error loading estates:', error);
      setEstates([]);
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
      Alert.alert('Permissions', 'Camera and location permissions are required');
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      
      // First, check and request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions in your device settings to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const userLocation = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      };
      
      setLocation(userLocation);

      if (currentEstate && currentEstate.polygonCoordinates) {
        const isValid = verifyGPS(userLocation, {
          polygonCoordinates: currentEstate.polygonCoordinates as Array<{ lat: number; lng: number }>,
        });
        setGpsWarning(!isValid);
      }
    } catch (error: any) {
      console.error('Location error:', error);
      Alert.alert(
        'Location Error',
        error.message || 'Unable to get location. Please check your GPS settings and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAutoGPS = async () => {
      try {
        // First check permission before trying to get location
        const { status } = await Location.getPermissionsAsync();
        if (status !== 'granted') {
          return; // Don't try to get location if permission not granted
        }

        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const gpsAlways = await AsyncStorage.getItem('settings_gps_always');
        if (gpsAlways === 'true' && !location) {
          getCurrentLocation();
        }
      } catch (error) {
        // Ignore
      }
    };
    checkAutoGPS();
  }, []);

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open camera');
      console.error('Camera error:', error);
    }
  };

  const validateMaterial = async () => {
    if (!materialID.trim()) {
      setMaterialValid(null);
      return;
    }

    try {
      // Determine type based on activity type and barcode format
      let type: 'SEED' | 'FERTILIZER' | 'PESTICIDE' | undefined;
      const upperBarcode = materialID.trim().toUpperCase();
      
      if (activityType === 'PLANTING' || upperBarcode.startsWith('SEED')) {
        type = 'SEED';
      } else if (activityType === 'FERTILIZING' || activityType === 'SPRAYING') {
        type = activityType === 'FERTILIZING' ? 'FERTILIZER' : 'PESTICIDE';
      }

      const result = await materialValidator(materialID, type);
      setMaterialValid(result.valid);
      
      if (!result.valid) {
        // Don't show alert immediately - let user see the X icon
        // Alert will be shown on submit if still invalid
        console.warn('Material validation failed:', result.message);
      }
    } catch (error: any) {
      console.error('Validation error:', error);
      setMaterialValid(false);
      // Don't show alert on every keystroke, only on submit
    }
  };

  const handleSubmit = async () => {
    if (!activityType) {
      Alert.alert('Error', 'Select activity type');
      return;
    }

    if (!photoUri) {
      Alert.alert('Error', 'Photo is required');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Location is required');
      return;
    }

    if (materialID && materialValid === false) {
      Alert.alert('Error', 'Material is not valid. Please check the barcode or seed code.');
      return;
    }

    if (gpsWarning) {
      Alert.alert(
        'Warning',
        'You are not on your parcel! Do you want to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => saveEntry() },
        ]
      );
      return;
    }

    await saveEntry();
  };

  const saveEntry = async () => {
    try {
      setLoading(true);
      
      // Map English activity types to Serbian for backend compatibility
      const activityTypeMap: Record<ActivityType, string> = {
        'PLANTING': 'SETVA',
        'FERTILIZING': 'ĐUBRENJE',
        'SPRAYING': 'PRSKANJE',
        'HARVEST': 'ŽETVA',
      };
      
      await offlineStorage.savePendingEntry({
        activityType: activityTypeMap[activityType as ActivityType] as any,
        materialID: materialID || undefined,
        photoUri: photoUri!,
        location: location!,
      });

      Alert.alert('Success', 'Entry saved. Will be sent when online.');
      
      // Reset form
      setActivityType('');
      setMaterialID('');
      setPhotoUri(null);
      setLocation(null);
      setGpsWarning(false);
      setMaterialValid(null);
    } catch (error) {
      Alert.alert('Error', 'Unable to save entry');
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  const activityTypes: { value: ActivityType; label: string }[] = [
    { value: 'PLANTING', label: 'Planting' },
    { value: 'FERTILIZING', label: 'Fertilizing' },
    { value: 'SPRAYING', label: 'Spraying' },
    { value: 'HARVEST', label: 'Harvest' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: theme.spacing.md }}>
        {/* GPS Warning Banner */}
        {gpsWarning && (
          <View style={{
            backgroundColor: theme.colors.errorLight,
            borderWidth: 0.5,
            borderColor: 'rgba(239, 68, 68, 0.3)',
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.sm,
            marginBottom: theme.spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <X size={20} color={theme.colors.error} strokeWidth={1} />
            <Text style={{
              fontSize: 11,
              fontWeight: '300',
              color: theme.colors.error,
              marginLeft: theme.spacing.sm,
              flex: 1,
              letterSpacing: 0.2,
            }}>
              Warning: You are not on your parcel!
            </Text>
          </View>
        )}

        {/* Activity Type */}
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '300',
            color: theme.colors.text.primary,
            letterSpacing: 0.5,
            marginBottom: theme.spacing.sm,
          }}>
            Activity Type
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {activityTypes.map((type) => {
              const isSelected = activityType === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => setActivityType(type.value)}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.borderRadius.md,
                    borderWidth: 0.5,
                    borderColor: isSelected ? theme.colors.primary : 'rgba(0, 0, 0, 0.05)',
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                  }}
                >
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: isSelected ? theme.colors.background : theme.colors.text.primary,
                    letterSpacing: 0.3,
                  }}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Material ID */}
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '300',
            color: theme.colors.text.primary,
            letterSpacing: 0.5,
            marginBottom: theme.spacing.sm,
          }}>
            Material Barcode (optional)
          </Text>
          <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            borderWidth: 0.5,
            borderColor: 'rgba(0, 0, 0, 0.05)',
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <TextInput
              style={{
                flex: 1,
                fontSize: 11,
                fontWeight: '300',
                color: theme.colors.text.primary,
                letterSpacing: 0.2,
              }}
              placeholder="Scan or enter barcode"
              placeholderTextColor={theme.colors.text.tertiary}
              value={materialID}
              onChangeText={setMaterialID}
            />
            <TouchableOpacity
              onPress={() => router.push('/(producer)/scanner')}
              activeOpacity={0.7}
              style={{
                marginLeft: theme.spacing.xs,
                padding: theme.spacing.xs,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: `${theme.colors.primary}15`,
              }}
            >
              <Camera size={18} color={theme.colors.primary} strokeWidth={1.5} />
            </TouchableOpacity>
            {materialValid !== null && (
              materialValid ? (
                <Check size={20} color={theme.colors.success} strokeWidth={1} style={{ marginLeft: theme.spacing.xs }} />
              ) : (
                <X size={20} color={theme.colors.error} strokeWidth={1} style={{ marginLeft: theme.spacing.xs }} />
              )
            )}
          </View>
        </View>

        {/* Photo */}
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '300',
            color: theme.colors.text.primary,
            letterSpacing: 0.5,
            marginBottom: theme.spacing.sm,
          }}>
            Photo <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <TouchableOpacity
            onPress={takePhoto}
            activeOpacity={0.7}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.05)',
              padding: theme.spacing.lg,
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 150,
            }}
          >
            {photoUri ? (
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: theme.colors.success,
                  letterSpacing: 0.3,
                }}>
                  ✓ Photo loaded successfully
                </Text>
              </View>
            ) : (
              <>
                <Camera size={32} color={theme.colors.text.tertiary} strokeWidth={1} />
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: theme.colors.text.secondary,
                  marginTop: theme.spacing.xs,
                  letterSpacing: 0.2,
                }}>
                  Add photo
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Location */}
        <View style={{ marginBottom: theme.spacing.lg }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '300',
            color: theme.colors.text.primary,
            letterSpacing: 0.5,
            marginBottom: theme.spacing.sm,
          }}>
            Location <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <TouchableOpacity
            onPress={getCurrentLocation}
            disabled={loading}
            activeOpacity={0.7}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.05)',
              padding: theme.spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <MapPin size={20} color={theme.colors.primary} strokeWidth={1} />
              <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
                {location ? (
                  <>
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '300',
                      color: theme.colors.text.primary,
                      letterSpacing: 0.2,
                    }}>
                      GPS: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </Text>
                    <Text style={{
                      fontSize: 9,
                      fontWeight: '300',
                      color: theme.colors.success,
                      marginTop: 2,
                      letterSpacing: 0.2,
                    }}>
                      ✓ Location loaded
                    </Text>
                  </>
                ) : (
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    letterSpacing: 0.2,
                  }}>
                    Get current location
                  </Text>
                )}
              </View>
            </View>
            {loading && <ActivityIndicator size="small" color={theme.colors.primary} />}
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || !activityType || !photoUri || !location}
          activeOpacity={0.7}
          style={{
            backgroundColor: (!activityType || !photoUri || !location) 
              ? theme.colors.surface 
              : theme.colors.primary,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: (!activityType || !photoUri || !location)
              ? 'rgba(0, 0, 0, 0.05)'
              : theme.colors.primary,
            alignItems: 'center',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <Text style={{
              fontSize: 12,
              fontWeight: '300',
              color: (!activityType || !photoUri || !location) 
                ? theme.colors.text.secondary 
                : theme.colors.background,
              letterSpacing: 0.5,
            }}>
              Save Entry
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
