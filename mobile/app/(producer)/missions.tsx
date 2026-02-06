import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Truck, Package, MapPin, Calendar, Clock } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import { missionsAPI, Mission } from '../../lib/api';

/**
 * Missions Screen
 * List of all missions with status tracking
 * Matches buyer dashboard styling
 */
export default function MissionsScreen() {
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED'>('all');

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const data = await missionsAPI.getAll();
      setMissions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading missions:', error);
      setMissions([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMissions();
    setRefreshing(false);
  };

  const filteredMissions = filter === 'all' 
    ? missions 
    : missions.filter(m => m.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return theme.colors.warning;
      case 'ASSIGNED': return theme.colors.accent;
      case 'IN_TRANSIT': return theme.colors.primary;
      case 'DELIVERED': return theme.colors.success || theme.colors.primary;
      default: return theme.colors.text.secondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'ASSIGNED': return 'Assigned';
      case 'IN_TRANSIT': return 'In Transit';
      case 'DELIVERED': return 'Delivered';
      default: return status;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: 60,
        paddingBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ marginRight: theme.spacing.md }}
        >
          <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={{
          fontSize: 18,
          fontWeight: '300',
          color: theme.colors.text.primary,
          letterSpacing: 0.5,
          flex: 1,
        }}>
          Missions
        </Text>
      </View>

      {/* Filters */}
      <View style={{
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
      }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            {[
              { id: 'all' as const, label: 'All' },
              { id: 'PENDING' as const, label: 'Pending' },
              { id: 'ASSIGNED' as const, label: 'Assigned' },
              { id: 'IN_TRANSIT' as const, label: 'In Transit' },
              { id: 'DELIVERED' as const, label: 'Delivered' },
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.borderRadius.sm,
                  borderWidth: 0.5,
                  borderColor: filter === f.id ? theme.colors.primary : 'rgba(0, 0, 0, 0.05)',
                  backgroundColor: filter === f.id ? `${theme.colors.primary}10` : 'transparent',
                }}
              >
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: filter === f.id ? theme.colors.primary : theme.colors.text.secondary,
                  letterSpacing: 0.3,
                }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Missions List */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={{ padding: theme.spacing.md }}>
          {loading ? (
            <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
              <Text style={{
                color: theme.colors.text.secondary,
                fontSize: 11,
                fontWeight: '300',
                letterSpacing: 0.3,
              }}>
                Loading...
              </Text>
            </View>
          ) : filteredMissions.length === 0 ? (
            <View style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.xl,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.05)',
              alignItems: 'center',
            }}>
              <Truck size={32} color={theme.colors.text.tertiary} strokeWidth={1} />
              <Text style={{
                fontSize: 11,
                fontWeight: '300',
                color: theme.colors.text.secondary,
                marginTop: theme.spacing.sm,
                letterSpacing: 0.3,
                textAlign: 'center',
              }}>
                No Missions
              </Text>
            </View>
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {filteredMissions.map((mission) => (
                <TouchableOpacity
                  key={mission.id}
                  onPress={() => router.push(`/(producer)/mission/${mission.id}`)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.md,
                    borderWidth: 0.5,
                    borderColor: 'rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.sm }}>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: `${getStatusColor(mission.status)}15`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: theme.spacing.sm,
                    }}>
                      <Truck size={20} color={getStatusColor(mission.status)} strokeWidth={1} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '300',
                        color: theme.colors.text.primary,
                        marginBottom: theme.spacing.xs,
                        letterSpacing: 0.3,
                      }}>
                        Mission #{mission.id.slice(0, 8)}
                      </Text>
                      {mission.batch && (
                        <Text style={{
                          fontSize: 11,
                          fontWeight: '300',
                          color: theme.colors.text.secondary,
                          letterSpacing: 0.2,
                        }}>
                          Batch: {mission.batch.batchId || mission.batchId}
                        </Text>
                      )}
                    </View>
                    <View style={{
                      paddingHorizontal: theme.spacing.sm,
                      paddingVertical: theme.spacing.xs,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: `${getStatusColor(mission.status)}15`,
                    }}>
                      <Text style={{
                        fontSize: 9,
                        fontWeight: '300',
                        color: getStatusColor(mission.status),
                        letterSpacing: 0.3,
                      }}>
                        {getStatusLabel(mission.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.md,
                    marginTop: theme.spacing.xs,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Calendar size={11} color={theme.colors.text.secondary} strokeWidth={1} />
                      <Text style={{
                        fontSize: 9,
                        fontWeight: '300',
                        color: theme.colors.text.secondary,
                        marginLeft: 4,
                        letterSpacing: 0.2,
                      }}>
                        {new Date(mission.createdAt).toLocaleDateString('en-US')}
                      </Text>
                    </View>
                    {mission.updatedAt && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Clock size={11} color={theme.colors.text.secondary} strokeWidth={1} />
                        <Text style={{
                          fontSize: 9,
                          fontWeight: '300',
                          color: theme.colors.text.secondary,
                          marginLeft: 4,
                          letterSpacing: 0.2,
                        }}>
                          {new Date(mission.updatedAt).toLocaleDateString('en-US')}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
