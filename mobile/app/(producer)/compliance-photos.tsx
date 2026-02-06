import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Plus, Camera, MapPin, Calendar, Filter, Image as ImageIcon } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../lib/colors';
import { theme } from '../../lib/theme';
import { compliancePhotosAPI, CompliancePhoto, estatesAPI, Estate } from '../../lib/api';
import { verifyGPS } from '../../lib/integrity-guard';

/**
 * Compliance Photos Screen
 * Upload and view compliance photos with GPS validation
 */
export default function CompliancePhotosScreen() {
  const router = useRouter();
  const [photos, setPhotos] = useState<CompliancePhoto[]>([]);
  const [estates, setEstates] = useState<Estate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterEstate, setFilterEstate] = useState<string>('all');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [photosData, estatesData] = await Promise.all([
        compliancePhotosAPI.getAll().catch(() => []),
        estatesAPI.getAll().catch(() => []),
      ]);
      setPhotos(photosData);
      setEstates(estatesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUpload = async () => {
    if (estates.length === 0) {
      Alert.alert('Greška', 'Morate prvo kreirati njivu');
      return;
    }

    // Request permissions
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

    if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
      Alert.alert('Dozvole', 'Potrebne su dozvole za kameru i lokaciju');
      return;
    }

    // Get location first
    let location: { lat: number; lng: number } | null = null;
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      location = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      };
    } catch (error) {
      Alert.alert('Greška', 'Ne mogu da dobijem lokaciju');
      return;
    }

    // Take photo
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && location) {
        // Verify GPS if estate is selected
        const selectedEstate = estates.find(e => e.id === filterEstate);
        if (selectedEstate && selectedEstate.polygonCoordinates) {
          const isValid = verifyGPS(location, {
            polygonCoordinates: selectedEstate.polygonCoordinates as Array<{ lat: number; lng: number }>,
          });
          if (!isValid) {
            Alert.alert(
              'Upozorenje',
              'Niste na svojoj parceli! Da li želite da nastavite?',
              [
                { text: 'Otkaži', style: 'cancel' },
                { text: 'Nastavi', onPress: () => uploadPhoto(result.assets[0].uri, location, selectedEstate.id) },
              ]
            );
            return;
          }
        }

        const estateId = filterEstate !== 'all' ? filterEstate : estates[0].id;
        await uploadPhoto(result.assets[0].uri, location, estateId);
      }
    } catch (error) {
      Alert.alert('Greška', 'Ne mogu da otvorim kameru');
      console.error('Camera error:', error);
    }
  };

  const uploadPhoto = async (photoUri: string, location: { lat: number; lng: number }, estateId: string) => {
    try {
      setUploading(true);
      await compliancePhotosAPI.upload({
        estateId,
        photoUri,
        gpsLocation: location,
        type: 'COMPLIANCE',
      });
      await loadData();
      Alert.alert('Uspešno', 'Fotografija je sačuvana');
    } catch (error: any) {
      Alert.alert('Greška', error.message || 'Ne mogu da sačuvam fotografiju');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const filteredPhotos = filterEstate === 'all'
    ? photos
    : photos.filter(p => p.estateId === filterEstate);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Header */}
      <View 
        className="px-4 pt-12 pb-4 border-b-[0.5px] flex-row items-center justify-between"
        style={{ 
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        }}
      >
        <Text 
          className="text-lg flex-1"
          style={{ 
            color: colors.text.primary,
            fontWeight: '300',
            letterSpacing: 0.5,
          }}
        >
          Compliance Fotografije
        </Text>
        <TouchableOpacity
          onPress={handleUpload}
          disabled={uploading || estates.length === 0}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Camera size={20} color={colors.background} strokeWidth={1.5} />
          )}
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {estates.length > 0 && (
        <View 
          className="px-4 py-3 border-b-[0.5px]"
          style={{ 
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <TouchableOpacity
                onPress={() => setFilterEstate('all')}
                style={{
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.borderRadius.sm,
                  borderWidth: 0.5,
                  borderColor: filterEstate === 'all' ? colors.primary : colors.border,
                  backgroundColor: filterEstate === 'all' ? `${colors.primary}10` : 'transparent',
                }}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: filterEstate === 'all' ? colors.primary : colors.text.secondary,
                  letterSpacing: 0.3,
                }}>
                  Sve
                </Text>
              </TouchableOpacity>
              {estates.map((estate) => (
                <TouchableOpacity
                  key={estate.id}
                  onPress={() => setFilterEstate(estate.id)}
                  style={{
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.borderRadius.sm,
                    borderWidth: 0.5,
                    borderColor: filterEstate === estate.id ? colors.primary : colors.border,
                    backgroundColor: filterEstate === estate.id ? `${colors.primary}10` : 'transparent',
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '300',
                    color: filterEstate === estate.id ? colors.primary : colors.text.secondary,
                    letterSpacing: 0.3,
                  }}>
                    {estate.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Photos List */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={{ padding: theme.spacing.md }}>
          {loading ? (
            <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
              <Text style={{ color: colors.text.secondary, fontSize: 13 }}>
                Učitavanje...
              </Text>
            </View>
          ) : filteredPhotos.length === 0 ? (
            <View 
              className="bg-white rounded-lg p-6 border-[0.5px] items-center"
              style={{ borderColor: colors.border }}
            >
              <ImageIcon size={32} color={colors.text.tertiary} strokeWidth={1} />
              <Text 
                className="text-[13px] mt-3 text-center"
                style={{ color: colors.text.secondary }}
              >
                Nema fotografija
              </Text>
            </View>
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {filteredPhotos.map((photo) => (
                <View
                  key={photo.id}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.md,
                    borderWidth: 0.5,
                    borderColor: colors.border,
                  }}
                >
                  {photo.photoUrl && (
                    <Image
                      source={{ uri: photo.photoUrl }}
                      style={{
                        width: '100%',
                        height: 200,
                        borderRadius: theme.borderRadius.sm,
                        marginBottom: theme.spacing.sm,
                      }}
                      resizeMode="cover"
                    />
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
                    <MapPin size={14} color={colors.text.secondary} strokeWidth={1} />
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '300',
                      color: colors.text.secondary,
                      marginLeft: 4,
                    }}>
                      {photo.gpsLocation.lat.toFixed(6)}, {photo.gpsLocation.lng.toFixed(6)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Calendar size={14} color={colors.text.secondary} strokeWidth={1} />
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '300',
                      color: colors.text.secondary,
                      marginLeft: 4,
                    }}>
                      {new Date(photo.createdAt).toLocaleDateString('sr-RS', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
