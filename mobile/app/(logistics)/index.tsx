import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useCallback, useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Truck, Calendar, Clock, FileSignature, Bell } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { missionsAPI, Mission, notificationsAPI } from '../../lib/api';
import { getMissionStatusColor, getMissionStatusLabelLocalized } from '../../lib/mission-status';
import { useAuth } from '../../hooks/useAuth';
import { partnerSignInHref } from '../../lib/post-login-redirect';
import { useAppLocaleTag } from '../../lib/date-locale';

/**
 * Default screen for (logistics): pool (PENDING) + assigned runs.
 */
export default function LogisticsHomeScreen() {
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();
  const router = useRouter();
  const { logout } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'COMPLETED'>('all');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        try {
          const data = await notificationsAPI.getAll();
          const unread = Array.isArray(data) ? data.filter((n) => !n.read).length : 0;
          if (!cancelled) setUnreadNotifications(unread);
        } catch {
          if (!cancelled) setUnreadNotifications(0);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  useEffect(() => {
    void loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const data = await missionsAPI.getAll({ scope: 'logistics' });
      setMissions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading logistics missions:', error);
      setMissions([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMissions();
    try {
      const notifData = await notificationsAPI.getAll();
      setUnreadNotifications(
        Array.isArray(notifData) ? notifData.filter((n) => !n.read).length : 0,
      );
    } catch {
      setUnreadNotifications(0);
    }
    setRefreshing(false);
  };

  const dateLocale = useAppLocaleTag();

  const filteredMissions =
    filter === 'all' ? missions : missions.filter((m) => m.status === filter);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          paddingTop: p.headerTop,
          paddingBottom: theme.spacing.md,
          paddingLeft: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          backgroundColor: theme.colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(0, 0, 0, 0.08)',
        }}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '300',
                color: theme.colors.text.primary,
                letterSpacing: 0.5,
              }}
            >
              {t('logistics.missionsTitle')}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.text.secondary,
                marginTop: 4,
                lineHeight: 18,
              }}
            >
              {t('logistics.missionsSubtitle')}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push('/(logistics)/notifications')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('notificationsCenter.title')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <View style={{ position: 'relative' }}>
                <Bell size={18} color={theme.colors.text.primary} strokeWidth={1.5} />
                {unreadNotifications > 0 ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: -5,
                      right: -8,
                      minWidth: 15,
                      height: 15,
                      borderRadius: 8,
                      backgroundColor: theme.colors.error,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 3,
                    }}
                  >
                    <Text style={{ fontSize: 8, fontWeight: '700', color: theme.colors.background }}>
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(logistics)/handover-receiver')}
              hitSlop={8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <FileSignature size={14} color={theme.colors.primary} strokeWidth={1.5} />
              <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: '500' }}>
                {t('logistics.receiverProof.link')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                await logout();
                router.replace(partnerSignInHref() as any);
              }}
              hitSlop={12}
            >
              <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, fontWeight: '500' }}>
                {t('logistics.signOut')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View
        style={{
          paddingLeft: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          paddingVertical: theme.spacing.sm,
          backgroundColor: theme.colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(0, 0, 0, 0.08)',
        }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            {(
              [
                { id: 'all' as const, label: t('logistics.filterAll') },
                { id: 'PENDING' as const, label: t('logistics.filterPending') },
                { id: 'ASSIGNED' as const, label: t('logistics.filterAssigned') },
                { id: 'IN_TRANSIT' as const, label: t('logistics.filterInTransit') },
                { id: 'COMPLETED' as const, label: t('logistics.filterCompleted') },
              ] as const
            ).map((f) => (
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
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: filter === f.id ? theme.colors.primary : theme.colors.text.secondary,
                    letterSpacing: 0.3,
                  }}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

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
          {loading ? (
            <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
              <Text
                style={{
                  color: theme.colors.text.secondary,
                  fontSize: 11,
                  fontWeight: '300',
                  letterSpacing: 0.3,
                }}
              >
                {t('producer.missions.loading')}
              </Text>
            </View>
          ) : filteredMissions.length === 0 ? (
            <View
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.xl,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.05)',
                alignItems: 'center',
              }}
            >
              <Truck size={32} color={theme.colors.text.tertiary} strokeWidth={1} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: theme.colors.text.secondary,
                  marginTop: theme.spacing.sm,
                  letterSpacing: 0.3,
                  textAlign: 'center',
                }}
              >
                {t('logistics.emptyMissions')}
              </Text>
            </View>
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {filteredMissions.map((mission) => {
                const c = getMissionStatusColor(mission.status);
                return (
                  <TouchableOpacity
                    key={mission.id}
                    onPress={() => router.push(`/(logistics)/mission/${mission.id}`)}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.borderRadius.md,
                      padding: theme.spacing.md,
                      borderWidth: 0.5,
                      borderColor: 'rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <View
                      style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.sm }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: theme.borderRadius.sm,
                          backgroundColor: `${c}15`,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: theme.spacing.sm,
                        }}
                      >
                        <Truck size={20} color={c} strokeWidth={1} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '300',
                            color: theme.colors.text.primary,
                            marginBottom: theme.spacing.xs,
                            letterSpacing: 0.3,
                          }}
                        >
                          {mission.missionNumber ||
                            t('producer.missions.missionPrefix', { id: mission.id.slice(0, 8) })}
                        </Text>
                        {mission.batch && (
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '300',
                              color: theme.colors.text.secondary,
                              letterSpacing: 0.2,
                            }}
                          >
                            {t('producer.missionsCreate.batchLabel')}: {mission.batch.batchId || mission.batchId}
                          </Text>
                        )}
                      </View>
                      <View
                        style={{
                          paddingHorizontal: theme.spacing.sm,
                          paddingVertical: theme.spacing.xs,
                          borderRadius: theme.borderRadius.sm,
                          backgroundColor: `${c}15`,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 9,
                            fontWeight: '300',
                            color: c,
                            letterSpacing: 0.3,
                          }}
                        >
                          {getMissionStatusLabelLocalized(mission.status, t)}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: theme.spacing.md,
                        marginTop: theme.spacing.xs,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Calendar size={11} color={theme.colors.text.secondary} strokeWidth={1} />
                        <Text
                          style={{
                            fontSize: 9,
                            fontWeight: '300',
                            color: theme.colors.text.secondary,
                            marginLeft: 4,
                            letterSpacing: 0.2,
                          }}
                        >
                          {new Date(mission.createdAt).toLocaleDateString(dateLocale)}
                        </Text>
                      </View>
                      {mission.updatedAt ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Clock size={11} color={theme.colors.text.secondary} strokeWidth={1} />
                          <Text
                            style={{
                              fontSize: 9,
                              fontWeight: '300',
                              color: theme.colors.text.secondary,
                              marginLeft: 4,
                              letterSpacing: 0.2,
                            }}
                          >
                            {new Date(mission.updatedAt).toLocaleDateString(dateLocale)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
