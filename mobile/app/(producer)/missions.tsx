import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Truck, Calendar, Clock } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { missionsAPI, Mission } from '../../lib/api';
import {
  getMissionStatusColor,
  getMissionStatusLabelLocalized,
} from '../../lib/mission-status';
import { useAppLocaleTag } from '../../lib/date-locale';

/**
 * Grower missions list — readable type and tap targets (aligned with batches list UX).
 */
export default function MissionsScreen() {
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'COMPLETED'>('all');

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const data = await missionsAPI.getAll({ scope: 'grower' });
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

  const filteredMissions =
    filter === 'all' ? missions : missions.filter((m) => m.status === filter);

  const dateLocale = useAppLocaleTag();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: p.headerTop,
        paddingBottom: theme.spacing.md,
        paddingLeft: p.screenPaddingLeft,
        paddingRight: p.screenPaddingRight,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ marginRight: theme.spacing.md, minWidth: 44, minHeight: 44, justifyContent: 'center' }}
        >
          <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={{
          fontSize: 20,
          fontWeight: '600',
          color: theme.colors.text.primary,
          letterSpacing: 0.2,
          flex: 1,
        }}>
          {t('producer.tabs.missions')}
        </Text>
      </View>

      {/* Filters */}
      <View style={{
        paddingLeft: p.screenPaddingLeft,
        paddingRight: p.screenPaddingRight,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
      }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            {([
              { id: 'all' as const, label: t('logistics.filterAll') },
              { id: 'PENDING' as const, label: t('logistics.filterPending') },
              { id: 'ASSIGNED' as const, label: t('logistics.filterAssigned') },
              { id: 'IN_TRANSIT' as const, label: t('logistics.filterInTransit') },
              { id: 'COMPLETED' as const, label: t('logistics.filterCompleted') },
            ]).map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  minHeight: 44,
                  justifyContent: 'center',
                  borderRadius: theme.borderRadius.md,
                  borderWidth: 0.5,
                  borderColor: filter === f.id ? theme.colors.primary : 'rgba(0, 0, 0, 0.05)',
                  backgroundColor: filter === f.id ? `${theme.colors.primary}10` : 'transparent',
                }}
              >
                <Text style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: filter === f.id ? theme.colors.primary : theme.colors.text.secondary,
                  letterSpacing: 0.2,
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
        <View
          style={{
            paddingTop: theme.spacing.md,
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
            paddingBottom: Math.max(p.bottomInset, theme.spacing.lg),
          }}
        >
          <TouchableOpacity
            onPress={() => router.push('/(producer)/missions-create')}
            activeOpacity={0.8}
            style={{
              marginBottom: theme.spacing.md,
              minHeight: 52,
              paddingVertical: 16,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.primary,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Truck size={22} color={theme.colors.text.inverse} strokeWidth={1.75} />
            <Text style={{ fontSize: 17, fontWeight: '600', color: theme.colors.text.inverse }}>
              {t('producer.missionsCreate.title')}
            </Text>
          </TouchableOpacity>
          {loading ? (
            <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
              <Text style={{
                color: theme.colors.text.secondary,
                fontSize: 16,
                fontWeight: '500',
                letterSpacing: 0.2,
              }}>
                {t('producer.missions.loading')}
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
              <Truck size={40} color={theme.colors.text.tertiary} strokeWidth={1.25} />
              <Text style={{
                fontSize: 16,
                fontWeight: '500',
                color: theme.colors.text.secondary,
                marginTop: theme.spacing.sm,
                letterSpacing: 0.2,
                textAlign: 'center',
                lineHeight: 24,
                paddingHorizontal: theme.spacing.md,
              }}>
                {t('producer.missions.listEmpty')}
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
                    padding: theme.spacing.md + 2,
                    borderWidth: 0.5,
                    borderColor: 'rgba(0, 0, 0, 0.05)',
                    minHeight: 88,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.sm }}>
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: `${getMissionStatusColor(mission.status)}15`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: theme.spacing.sm,
                    }}>
                      <Truck size={22} color={getMissionStatusColor(mission.status)} strokeWidth={1.5} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: 17,
                        fontWeight: '600',
                        color: theme.colors.text.primary,
                        marginBottom: theme.spacing.xs,
                        letterSpacing: 0.2,
                      }}>
                        {mission.missionNumber ||
                          t('producer.missions.missionPrefix', { id: mission.id.slice(0, 8) })}
                      </Text>
                      {mission.batch && (
                        <Text style={{
                          fontSize: 15,
                          fontWeight: '500',
                          color: theme.colors.text.secondary,
                          letterSpacing: 0.1,
                        }}>
                          {t('producer.missionsCreate.batchLabel')}: {mission.batch.batchId || mission.batchId}
                        </Text>
                      )}
                    </View>
                    <View style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: `${getMissionStatusColor(mission.status)}15`,
                    }}>
                      <Text style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: getMissionStatusColor(mission.status),
                        letterSpacing: 0.2,
                      }}>
                        {getMissionStatusLabelLocalized(mission.status, t)}
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
                      <Calendar size={16} color={theme.colors.text.secondary} strokeWidth={1.5} />
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: theme.colors.text.secondary,
                        marginLeft: 6,
                        letterSpacing: 0.1,
                      }}>
                        {new Date(mission.createdAt).toLocaleDateString(dateLocale)}
                      </Text>
                    </View>
                    {mission.updatedAt && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Clock size={16} color={theme.colors.text.secondary} strokeWidth={1.5} />
                        <Text style={{
                          fontSize: 14,
                          fontWeight: '500',
                          color: theme.colors.text.secondary,
                          marginLeft: 6,
                          letterSpacing: 0.1,
                        }}>
                          {new Date(mission.updatedAt).toLocaleDateString(dateLocale)}
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
