import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Package, Edit, Trash2 } from 'lucide-react-native';
import MapView, { Polygon, Marker } from 'react-native-maps';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { estatesAPI, Estate } from '../../../lib/api';

/**
 * Estate Details Screen
 * Shows estate details, map, parcels, and certification status
 */
export default function EstateDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [estate, setEstate] = useState<Estate | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      loadEstate();
    }
  }, [id]);

  const loadEstate = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await estatesAPI.getOne(id);
      setEstate(data);
    } catch (error) {
      console.error('Error loading estate:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEstate();
    setRefreshing(false);
  };

  if (loading && !estate) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13 }}>
          {t('producer.estates.loading')}
        </Text>
      </View>
    );
  }

  if (!estate) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13 }}>
          {t('producer.estates.notFound')}
        </Text>
      </View>
    );
  }

  const polygonCoords = estate.polygonCoordinates as Array<{ lat: number; lng: number }> | undefined;
  const centerLat = polygonCoords && polygonCoords.length > 0
    ? polygonCoords.reduce((sum, p) => sum + p.lat, 0) / polygonCoords.length
    : 44.0165;
  const centerLng = polygonCoords && polygonCoords.length > 0
    ? polygonCoords.reduce((sum, p) => sum + p.lng, 0) / polygonCoords.length
    : 21.0059;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CERTIFIED': return colors.primary;
      case 'ACTIVE': return colors.accent;
      case 'PENDING_SETUP': return colors.warning;
      default: return colors.text.secondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CERTIFIED': return 'Certified';
      case 'ACTIVE': return 'Active';
      case 'PENDING_SETUP': return 'In progress';
      default: return status;
    }
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
          {estate.name}
        </Text>
        <TouchableOpacity
          onPress={() => router.push(`/(producer)/estates/${id}/edit`)}
          style={{ marginRight: theme.spacing.sm }}
        >
          <Edit size={20} color={colors.text.secondary} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

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
          {/* Status */}
          <View style={{
            backgroundColor: colors.background,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '300',
                color: colors.text.secondary,
              }}>
                Status
              </Text>
              <View style={{
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: 4,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: `${getStatusColor(estate.status)}15`,
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: getStatusColor(estate.status),
                  letterSpacing: 0.3,
                }}>
                  {getStatusLabel(estate.status)}
                </Text>
              </View>
            </View>
          </View>

          {/* Location Info */}
          <View style={{
            backgroundColor: colors.background,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              <MapPin size={16} color={colors.text.secondary} strokeWidth={1} />
              <Text style={{
                fontSize: 13,
                fontWeight: '300',
                color: colors.text.primary,
                marginLeft: theme.spacing.xs,
              }}>
                {estate.location || t('producer.estates.locationNotSpecified')}
              </Text>
            </View>
            {estate.calculatedArea > 0 && (
              <Text style={{
                fontSize: 11,
                fontWeight: '300',
                color: colors.text.secondary,
                marginTop: theme.spacing.xs,
              }}>
                {t('producer.estates.area')}: {estate.calculatedArea.toFixed(2)} m²
              </Text>
            )}
          </View>

          {/* Map */}
          {polygonCoords && polygonCoords.length > 0 && (
            <View style={{
              height: 300,
              borderRadius: theme.borderRadius.md,
              overflow: 'hidden',
              borderWidth: 0.5,
              borderColor: colors.border,
              marginBottom: theme.spacing.md,
            }}>
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: centerLat,
                  longitude: centerLng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsUserLocation={true}
              >
                <Polygon
                  coordinates={polygonCoords.map(coord => ({
                    latitude: coord.lat,
                    longitude: coord.lng,
                  }))}
                  fillColor={`${colors.primary}30`}
                  strokeColor={colors.primary}
                  strokeWidth={2}
                />
              </MapView>
            </View>
          )}

          {/* Parcels */}
          {estate.parcels && estate.parcels.length > 0 && (
            <View style={{ marginBottom: theme.spacing.md }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '300',
                color: colors.text.primary,
                marginBottom: theme.spacing.sm,
                letterSpacing: 0.3,
              }}>
                {t('producer.estates.parcelsWithCount', { count: estate.parcels.length })}
              </Text>
              <View style={{ gap: theme.spacing.sm }}>
                {estate.parcels.map((parcel) => (
                  <View
                    key={parcel.id}
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: theme.borderRadius.md,
                      padding: theme.spacing.md,
                      borderWidth: 0.5,
                      borderColor: colors.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
                      <Package size={14} color={colors.text.secondary} strokeWidth={1} />
                      <Text style={{
                        fontSize: 13,
                        fontWeight: '300',
                        color: colors.text.primary,
                        marginLeft: theme.spacing.xs,
                      }}>
                        {parcel.cropType || t('producer.products.unknownProduct')}
                      </Text>
                    </View>
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '300',
                      color: colors.text.secondary,
                    }}>
                      {t('producer.estates.area')}: {parcel.calculatedArea.toFixed(2)} m²
                    </Text>
                    {parcel.plantingDate && (
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '300',
                        color: colors.text.secondary,
                        marginTop: 2,
                      }}>
                        {t('producer.recentActivity.planting')}: {new Date(parcel.plantingDate).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Certification Info */}
          {estate.certificationStartDate && (
            <View style={{
              backgroundColor: colors.background,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              borderWidth: 0.5,
              borderColor: colors.border,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
                <Calendar size={16} color={colors.text.secondary} strokeWidth={1} />
                <Text style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: colors.text.primary,
                  marginLeft: theme.spacing.xs,
                }}>
                  Certification
                </Text>
              </View>
              <Text style={{
                fontSize: 11,
                fontWeight: '300',
                color: colors.text.secondary,
              }}>
                {t('producer.estates.started')}: {new Date(estate.certificationStartDate).toLocaleDateString()}
              </Text>
              {estate.daysRemaining !== undefined && estate.daysRemaining !== null && (
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: colors.text.secondary,
                  marginTop: 2,
                }}>
                  {t('producer.estates.daysRemaining', { count: estate.daysRemaining ?? 0 })}
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
