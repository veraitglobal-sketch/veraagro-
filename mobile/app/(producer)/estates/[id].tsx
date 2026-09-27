import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { MapPin, Calendar, Package, Edit, Trash2 } from 'lucide-react-native';
import MapView, { Polygon, Marker } from 'react-native-maps';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import { estatesAPI, Estate } from '../../../lib/api';
import { growerOfflineCache } from '../../../lib/grower-offline-cache';
import { useGrowerDashboard } from '../../../contexts/GrowerDashboardContext';
import { useAppLocaleTag } from '../../../lib/date-locale';

/**
 * Estate Details Screen
 * Shows estate details, map, parcels, and certification status
 */
export default function EstateDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { estates: dashboardEstates } = useGrowerDashboard();
  const seeded =
    dashboardEstates.find((e) => e.id === id) ?? null;
  const [estate, setEstate] = useState<Estate | null>(seeded);
  const [loading, setLoading] = useState(!seeded);
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    if (estate || !id) return;
    let cancelled = false;
    void growerOfflineCache.loadEstates().then((cached) => {
      if (cancelled || !cached) return;
      const found = cached.find((e) => e.id === id);
      if (found) {
        setEstate(found);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, estate]);

  const loadEstate = useCallback(async (opts?: { background?: boolean }) => {
    if (!id) return;
    const background = opts?.background === true;
    if (!background) setLoading(true);
    try {
      const data = await estatesAPI.getOne(id);
      setEstate(data);
    } catch (error) {
      console.error('Error loading estate:', error);
    } finally {
      if (!background) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) void loadEstate({ background: seeded != null });
  }, [id, loadEstate, seeded]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadEstate({ background: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadEstate]);

  const dateLocale = useAppLocaleTag();

  if (loading && !estate) {
    return (
      <View style={{ flex: 1, paddingTop: p.topInset, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.text.secondary, fontSize: 13 }}>
          {t('producer.estates.loading')}
        </Text>
      </View>
    );
  }

  if (!estate) {
    return (
      <View style={{ flex: 1, paddingTop: p.topInset, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.text.secondary, fontSize: 13 }}>
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
      case 'CERTIFIED': return theme.colors.primary;
      case 'ACTIVE': return theme.colors.accent;
      case 'PENDING_SETUP': return theme.colors.warning;
      default: return theme.colors.text.secondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CERTIFIED': return t('producer.estates.certStatusCertified');
      case 'ACTIVE': return t('producer.estates.certStatusActive');
      case 'PENDING_SETUP': return t('producer.estates.certStatusPendingSetup');
      default: return status;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <BioVeraSubpageHeader
        title={estate.name}
        left="back"
        right={
          <TouchableOpacity
            onPress={() => router.push(`/(producer)/estates/${id}/edit`)}
            hitSlop={8}
          >
            <Edit size={20} color={theme.colors.text.secondary} strokeWidth={1.5} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            progressViewOffset={10}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
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
          {/* Status */}
          <View style={{
            backgroundColor: theme.colors.background,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: theme.colors.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '400',
                color: theme.colors.text.secondary,
              }}>
                {t('producer.missions.statusFieldLabel')}
              </Text>
              <View style={{
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: 4,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: `${getStatusColor(estate.status)}15`,
              }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '400',
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
            backgroundColor: theme.colors.background,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: theme.colors.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              <MapPin size={16} color={theme.colors.text.secondary} strokeWidth={1} />
              <Text style={{
                fontSize: 13,
                fontWeight: '400',
                color: theme.colors.text.primary,
                marginLeft: theme.spacing.xs,
              }}>
                {estate.location || t('producer.estates.locationNotSpecified')}
              </Text>
            </View>
            {estate.calculatedArea > 0 && (
              <Text style={{
                fontSize: 14,
                fontWeight: '400',
                color: theme.colors.text.secondary,
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
              borderColor: theme.colors.border,
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
                  fillColor={`${theme.colors.primary}30`}
                  strokeColor={theme.colors.primary}
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
                fontWeight: '400',
                color: theme.colors.text.primary,
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
                      backgroundColor: theme.colors.background,
                      borderRadius: theme.borderRadius.md,
                      padding: theme.spacing.md,
                      borderWidth: 0.5,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs, flexWrap: 'wrap', gap: 8 }}>
                      <Package size={14} color={theme.colors.text.secondary} strokeWidth={1} />
                      <Text style={{
                        fontSize: 13,
                        fontWeight: '400',
                        color: theme.colors.text.primary,
                        marginLeft: theme.spacing.xs,
                        flex: 1,
                        minWidth: 120,
                      }}>
                        {parcel.cropType || t('producer.batches.unknownProduct')}
                      </Text>
                      {(() => {
                        const ok =
                          Boolean(parcel.approvedAt) ||
                          parcel.status === 'ACTIVE' ||
                          parcel.status === 'CERTIFIED';
                        return (
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: theme.borderRadius.sm,
                              backgroundColor: ok ? `${theme.colors.success}18` : `${theme.colors.warning}22`,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: '600',
                                color: ok ? theme.colors.success : theme.colors.warning,
                              }}
                            >
                              {ok ? t('producer.estates.parcelApproved') : t('producer.estates.parcelPendingApproval')}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '400',
                      color: theme.colors.text.secondary,
                    }}>
                      {t('producer.estates.area')}: {parcel.calculatedArea.toFixed(2)} m²
                    </Text>
                    {parcel.plantingDate && (
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '400',
                        color: theme.colors.text.secondary,
                        marginTop: 2,
                      }}>
                        {t('producer.recentActivity.planting')}: {new Date(parcel.plantingDate).toLocaleDateString(dateLocale)}
                      </Text>
                    )}
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/(producer)/plot-mapper',
                          params: {
                            parcelId: parcel.id,
                            parcelLabel: encodeURIComponent(
                              `${estate.name} · ${parcel.cropType || t('producer.batches.unknownProduct')}`,
                            ),
                          },
                        })
                      }
                      style={{
                        alignSelf: 'flex-start',
                        marginTop: theme.spacing.sm,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: theme.borderRadius.md,
                        borderWidth: 1,
                        borderColor: theme.colors.primary,
                        backgroundColor: `${theme.colors.primary}0D`,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.primary }}>
                        {t('producer.plotMapper.openPlanForParcel')} →
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Certification Info */}
          {estate.certificationStartDate && (
            <View style={{
              backgroundColor: theme.colors.background,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              borderWidth: 0.5,
              borderColor: theme.colors.border,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
                <Calendar size={16} color={theme.colors.text.secondary} strokeWidth={1} />
                <Text style={{
                  fontSize: 13,
                  fontWeight: '400',
                  color: theme.colors.text.primary,
                  marginLeft: theme.spacing.xs,
                }}>
                  {t('producer.estates.certificationSectionHeading')}
                </Text>
              </View>
              <Text style={{
                fontSize: 14,
                fontWeight: '400',
                color: theme.colors.text.secondary,
              }}>
                {t('producer.estates.started')}: {new Date(estate.certificationStartDate).toLocaleDateString(dateLocale)}
              </Text>
              {estate.daysRemaining !== undefined && estate.daysRemaining !== null && (
                <Text style={{
                  fontSize: 14,
                  fontWeight: '400',
                  color: theme.colors.text.secondary,
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
