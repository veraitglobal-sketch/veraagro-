import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Truck, Package, MapPin, Calendar, Clock, User, Euro, MessageSquare } from 'lucide-react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { missionsAPI, Mission } from '../../../lib/api';

/**
 * Mission Details Screen
 * Shows mission details, journey map, timeline, consumer feedback, and financial status
 */
export default function MissionDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [mission, setMission] = useState<Mission | null>(null);
  const [journeyMap, setJourneyMap] = useState<any>(null);
  const [consumerFeedback, setConsumerFeedback] = useState<any>(null);
  const [financialStatus, setFinancialStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      loadMissionData();
    }
  }, [id]);

  const loadMissionData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [missionData, mapData] = await Promise.all([
        missionsAPI.getOne(id),
        missionsAPI.getJourneyMap(id).catch(() => null),
      ]);
      setMission(missionData);
      setJourneyMap(mapData);

      // Load consumer feedback and financial status if batchId exists
      if (missionData.batchId) {
        try {
          const [feedback, financial] = await Promise.all([
            missionsAPI.getConsumerFeedback(missionData.batchId).catch(() => null),
            missionsAPI.getFinancialStatus(missionData.batchId).catch(() => null),
          ]);
          setConsumerFeedback(feedback);
          setFinancialStatus(financial);
        } catch (error) {
          console.error('Error loading feedback/financial:', error);
        }
      }
    } catch (error) {
      console.error('Error loading mission:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMissionData();
    setRefreshing(false);
  };

  if (loading && !mission) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13 }}>
          Učitavanje...
        </Text>
      </View>
    );
  }

  if (!mission) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13 }}>
          Misija nije pronađena
        </Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return colors.warning;
      case 'ASSIGNED': return colors.accent;
      case 'IN_TRANSIT': return colors.primary;
      case 'DELIVERED': return colors.success || colors.primary;
      default: return colors.text.secondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Na čekanju';
      case 'ASSIGNED': return 'Dodeljeno';
      case 'IN_TRANSIT': return 'U transportu';
      case 'DELIVERED': return 'Isporučeno';
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
            letterSpacing: 0.3,
          }}
        >
          Detalji Misije
        </Text>
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
          {/* Mission Info */}
          <View style={{
            backgroundColor: colors.background,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              <Truck size={18} color={colors.text.primary} strokeWidth={1} />
              <Text style={{
                fontSize: 15,
                fontWeight: '300',
                color: colors.text.primary,
                marginLeft: theme.spacing.xs,
                letterSpacing: 0.3,
              }}>
                Misija #{mission.id.slice(0, 8)}
              </Text>
            </View>
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
                backgroundColor: `${getStatusColor(mission.status)}15`,
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: getStatusColor(mission.status),
                  letterSpacing: 0.3,
                }}>
                  {getStatusLabel(mission.status)}
                </Text>
              </View>
            </View>
          </View>

          {/* Batch Info */}
          {mission.batch && (
            <View style={{
              backgroundColor: colors.background,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.md,
              borderWidth: 0.5,
              borderColor: colors.border,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
                <Package size={18} color={colors.text.primary} strokeWidth={1} />
                <Text style={{
                  fontSize: 15,
                  fontWeight: '300',
                  color: colors.text.primary,
                  marginLeft: theme.spacing.xs,
                  letterSpacing: 0.3,
                }}>
                  Batch
                </Text>
              </View>
              <Text style={{
                fontSize: 13,
                fontWeight: '300',
                color: colors.text.secondary,
              }}>
                {mission.batch.batchId || mission.batchId}
              </Text>
              {mission.batch.productName && (
                <Text style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: colors.text.secondary,
                  marginTop: theme.spacing.xs,
                }}>
                  {mission.batch.productName}
                </Text>
              )}
            </View>
          )}

          {/* Journey Map */}
          {journeyMap && (
            <View style={{
              backgroundColor: colors.background,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.md,
              borderWidth: 0.5,
              borderColor: colors.border,
            }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '300',
                color: colors.text.primary,
                marginBottom: theme.spacing.md,
                letterSpacing: 0.3,
              }}>
                Mapa putovanja
              </Text>
              {journeyMap.route && journeyMap.route.length > 0 && (
                <View style={{
                  height: 250,
                  borderRadius: theme.borderRadius.sm,
                  overflow: 'hidden',
                  borderWidth: 0.5,
                  borderColor: colors.border,
                }}>
                  <MapView
                    style={{ flex: 1 }}
                    initialRegion={{
                      latitude: journeyMap.route[0]?.latitude || 44.0165,
                      longitude: journeyMap.route[0]?.longitude || 21.0059,
                      latitudeDelta: 2,
                      longitudeDelta: 2,
                    }}
                  >
                    {journeyMap.route.map((point: any, index: number) => (
                      <Marker
                        key={index}
                        coordinate={{
                          latitude: point.latitude,
                          longitude: point.longitude,
                        }}
                        title={point.name || `Tačka ${index + 1}`}
                      />
                    ))}
                    {journeyMap.route.length > 1 && (
                      <Polyline
                        coordinates={journeyMap.route.map((p: any) => ({
                          latitude: p.latitude,
                          longitude: p.longitude,
                        }))}
                        strokeColor={colors.primary}
                        strokeWidth={2}
                      />
                    )}
                  </MapView>
                </View>
              )}
            </View>
          )}

          {/* Timeline */}
          <View style={{
            backgroundColor: colors.background,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: colors.border,
          }}>
            <Text style={{
              fontSize: 15,
              fontWeight: '300',
              color: colors.text.primary,
              marginBottom: theme.spacing.md,
              letterSpacing: 0.3,
            }}>
              Timeline
            </Text>
            <View style={{ gap: theme.spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{
                  width: 2,
                  height: 40,
                  backgroundColor: colors.primary,
                  marginRight: theme.spacing.sm,
                }} />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '300',
                    color: colors.text.primary,
                  }}>
                    Kreirano
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Calendar size={11} color={colors.text.secondary} strokeWidth={1} />
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '300',
                      color: colors.text.secondary,
                      marginLeft: 4,
                    }}>
                      {new Date(mission.createdAt).toLocaleDateString('sr-RS', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              </View>
              {mission.status === 'ASSIGNED' && (
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={{
                    width: 2,
                    height: 40,
                    backgroundColor: colors.accent,
                    marginRight: theme.spacing.sm,
                  }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '300',
                      color: colors.text.primary,
                    }}>
                      Dodeljeno vozaču
                    </Text>
                    {mission.driver && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <User size={11} color={colors.text.secondary} strokeWidth={1} />
                        <Text style={{
                          fontSize: 11,
                          fontWeight: '300',
                          color: colors.text.secondary,
                          marginLeft: 4,
                        }}>
                          {mission.driver.firstName} {mission.driver.lastName}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
              {mission.status === 'IN_TRANSIT' && (
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={{
                    width: 2,
                    height: 40,
                    backgroundColor: colors.primary,
                    marginRight: theme.spacing.sm,
                  }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '300',
                      color: colors.text.primary,
                    }}>
                      U transportu
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <Truck size={11} color={colors.text.secondary} strokeWidth={1} />
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '300',
                        color: colors.text.secondary,
                        marginLeft: 4,
                      }}>
                        Na putu ka destinaciji
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              {mission.status === 'DELIVERED' && (
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={{
                    width: 2,
                    height: 40,
                    backgroundColor: colors.success || colors.primary,
                    marginRight: theme.spacing.sm,
                  }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '300',
                      color: colors.text.primary,
                    }}>
                      Isporučeno
                    </Text>
                    {mission.updatedAt && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <Clock size={11} color={colors.text.secondary} strokeWidth={1} />
                        <Text style={{
                          fontSize: 11,
                          fontWeight: '300',
                          color: colors.text.secondary,
                          marginLeft: 4,
                        }}>
                          {new Date(mission.updatedAt).toLocaleDateString('sr-RS', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Consumer Feedback */}
          {consumerFeedback && (
            <View style={{
              backgroundColor: colors.background,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.md,
              borderWidth: 0.5,
              borderColor: colors.border,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
                <MessageSquare size={18} color={colors.text.primary} strokeWidth={1} />
                <Text style={{
                  fontSize: 15,
                  fontWeight: '300',
                  color: colors.text.primary,
                  marginLeft: theme.spacing.xs,
                  letterSpacing: 0.3,
                }}>
                  Feedback kupca
                </Text>
              </View>
              {consumerFeedback.rating && (
                <Text style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: colors.text.secondary,
                  marginBottom: theme.spacing.xs,
                }}>
                  Ocena: {consumerFeedback.rating}/5
                </Text>
              )}
              {consumerFeedback.comment && (
                <Text style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: colors.text.primary,
                }}>
                  {consumerFeedback.comment}
                </Text>
              )}
            </View>
          )}

          {/* Financial Status */}
          {financialStatus && (
            <View style={{
              backgroundColor: colors.background,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              borderWidth: 0.5,
              borderColor: colors.border,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
                <Euro size={18} color={colors.text.primary} strokeWidth={1} />
                <Text style={{
                  fontSize: 15,
                  fontWeight: '300',
                  color: colors.text.primary,
                  marginLeft: theme.spacing.xs,
                  letterSpacing: 0.3,
                }}>
                  Finansijski status
                </Text>
              </View>
              {financialStatus.totalAmount && (
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between',
                  marginBottom: theme.spacing.xs,
                }}>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '300',
                    color: colors.text.secondary,
                  }}>
                    Ukupno
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '300',
                    color: colors.text.primary,
                  }}>
                    {financialStatus.totalAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </Text>
                </View>
              )}
              {financialStatus.farmerPayout && (
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between',
                  marginBottom: theme.spacing.xs,
                }}>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '300',
                    color: colors.text.secondary,
                  }}>
                    Vaša isplata
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '300',
                    color: colors.primary,
                  }}>
                    {financialStatus.farmerPayout.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </Text>
                </View>
              )}
              {financialStatus.status && (
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  marginTop: theme.spacing.xs,
                }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: colors.text.secondary,
                  }}>
                    Status: {financialStatus.status}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
