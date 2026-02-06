import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Camera, MapPin, Calendar, Filter, Image as ImageIcon } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../lib/colors';
import { theme } from '../../lib/theme';
import { growthLogsAPI, GrowthLog, estatesAPI, Estate } from '../../lib/api';
import { verifyGPS } from '../../lib/integrity-guard';

/**
 * Growth Journal Screen
 * Chronological feed of growth evidence with GPS metadata
 */
export default function GrowthJournalScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState<GrowthLog[]>([]);
  const [estates, setEstates] = useState<Estate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterEstate, setFilterEstate] = useState<string>('all');
  const [filterParcel, setFilterParcel] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (filterEstate !== 'all' && filterEstate) {
      loadLogs();
    } else {
      setLogs([]);
    }
  }, [filterEstate, filterParcel]);

  const loadData = async () => {
    try {
      setLoading(true);
      const estatesData = await estatesAPI.getAll();
      setEstates(estatesData);
      if (estatesData.length > 0) {
        setFilterEstate(estatesData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    if (filterEstate === 'all') return;
    
    try {
      if (filterParcel !== 'all' && filterParcel) {
        const data = await growthLogsAPI.getAllByParcel(filterParcel);
        setLogs(data);
      } else {
        const data = await growthLogsAPI.getAllByEstate(filterEstate);
        setLogs(data);
      }
    } catch (error) {
      console.error('Error loading growth logs:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), loadLogs()]);
    setRefreshing(false);
  };

  const handleAddPhoto = async () => {
    if (estates.length === 0) {
      return;
    }

    // Request permissions
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

    if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
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
        // TODO: Upload to backend with GPS metadata
        // For now, just show success
        console.log('Photo taken:', result.assets[0].uri, location);
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const selectedEstate = estates.find(e => e.id === filterEstate);
  const parcels = selectedEstate?.parcels || [];

  // Sort logs by date (newest first)
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

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
          Growth Journal
        </Text>
        <TouchableOpacity
          onPress={handleAddPhoto}
          disabled={estates.length === 0}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Camera size={20} color={colors.background} strokeWidth={1.5} />
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
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '300',
                color: colors.text.secondary,
                marginRight: theme.spacing.xs,
              }}>
                Njiva:
              </Text>
              {estates.map((estate) => (
                <TouchableOpacity
                  key={estate.id}
                  onPress={() => {
                    setFilterEstate(estate.id);
                    setFilterParcel('all');
                  }}
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
            {parcels.length > 0 && (
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: colors.text.secondary,
                  marginRight: theme.spacing.xs,
                }}>
                  Parcela:
                </Text>
                <TouchableOpacity
                  onPress={() => setFilterParcel('all')}
                  style={{
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.borderRadius.sm,
                    borderWidth: 0.5,
                    borderColor: filterParcel === 'all' ? colors.primary : colors.border,
                    backgroundColor: filterParcel === 'all' ? `${colors.primary}10` : 'transparent',
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '300',
                    color: filterParcel === 'all' ? colors.primary : colors.text.secondary,
                    letterSpacing: 0.3,
                  }}>
                    Sve
                  </Text>
                </TouchableOpacity>
                {parcels.map((parcel) => (
                  <TouchableOpacity
                    key={parcel.id}
                    onPress={() => setFilterParcel(parcel.id)}
                    style={{
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.sm,
                      borderRadius: theme.borderRadius.sm,
                      borderWidth: 0.5,
                      borderColor: filterParcel === parcel.id ? colors.primary : colors.border,
                      backgroundColor: filterParcel === parcel.id ? `${colors.primary}10` : 'transparent',
                    }}
                  >
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '300',
                      color: filterParcel === parcel.id ? colors.primary : colors.text.secondary,
                      letterSpacing: 0.3,
                    }}>
                      {parcel.cropType || `Parcela ${parcel.id.slice(0, 4)}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Logs List */}
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
          ) : sortedLogs.length === 0 ? (
            <View 
              className="bg-white rounded-lg p-6 border-[0.5px] items-center"
              style={{ borderColor: colors.border }}
            >
              <ImageIcon size={32} color={colors.text.tertiary} strokeWidth={1} />
              <Text 
                className="text-[13px] mt-3 text-center"
                style={{ color: colors.text.secondary }}
              >
                Nema growth logova
              </Text>
              <Text 
                className="text-[11px] mt-2 text-center"
                style={{ color: colors.text.tertiary }}
              >
                Dodajte fotografije da biste pratili rast useva
              </Text>
            </View>
          ) : (
            <View style={{ gap: theme.spacing.md }}>
              {sortedLogs.map((log) => (
                <View
                  key={log.id}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.md,
                    borderWidth: 0.5,
                    borderColor: colors.border,
                  }}
                >
                  {log.imageUrl && (
                    <Image
                      source={{ uri: log.imageUrl }}
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
                      {log.gpsLatitude.toFixed(6)}, {log.gpsLongitude.toFixed(6)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
                    <Calendar size={14} color={colors.text.secondary} strokeWidth={1} />
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '300',
                      color: colors.text.secondary,
                      marginLeft: 4,
                    }}>
                      {new Date(log.createdAt).toLocaleDateString('sr-RS', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  {log.growthStage && (
                    <View style={{
                      marginTop: theme.spacing.xs,
                      paddingTop: theme.spacing.xs,
                      borderTopWidth: 0.5,
                      borderTopColor: colors.border,
                    }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '300',
                        color: colors.text.primary,
                      }}>
                        Faza: {log.growthStage}
                      </Text>
                    </View>
                  )}
                  {log.notes && (
                    <View style={{
                      marginTop: theme.spacing.xs,
                      paddingTop: theme.spacing.xs,
                      borderTopWidth: 0.5,
                      borderTopColor: colors.border,
                    }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '300',
                        color: colors.text.secondary,
                      }}>
                        {log.notes}
                      </Text>
                    </View>
                  )}
                  {log.parcel && (
                    <View style={{
                      marginTop: theme.spacing.xs,
                      paddingTop: theme.spacing.xs,
                      borderTopWidth: 0.5,
                      borderTopColor: colors.border,
                    }}>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '300',
                        color: colors.text.secondary,
                      }}>
                        Parcela: {log.parcel.cropType}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
