import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCallback, useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Truck, Calendar, Clock, Bell, MapPin } from 'lucide-react-native';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';
import { growerUi } from '../../lib/grower-ui';
import { theme } from '../../lib/theme';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { missionsAPI, Mission, notificationsAPI } from '../../lib/api';
import { canClaimLogisticsMission } from '../../lib/logistics-mission-helpers';
import { getMissionStatusColor, getMissionStatusLabelLocalized } from '../../lib/mission-status';
import { useAppLocaleTag } from '../../lib/date-locale';
import { GrowerTabHeader } from '../../components/grower/GrowerTabHeader';
import EmptyState from '../../components/EmptyState';

/** Pool (PENDING) + assigned runs — claim, filters, mission detail. */
export default function LogisticsMissionsScreen() {
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'COMPLETED'>('all');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [claimingId, setClaimingId] = useState<string | null>(null);

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

  const claimMission = async (missionId: string) => {
    setClaimingId(missionId);
    try {
      await missionsAPI.claimMission(missionId);
      await loadMissions();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data
        ?.message;
      const text =
        typeof msg === 'string' ? msg : Array.isArray(msg) ? msg.join(' ') : t('logistics.claim.errFallback');
      Alert.alert(t('logistics.claim.errTitle'), text);
    } finally {
      setClaimingId(null);
    }
  };

  const notifButton = (
    <TouchableOpacity
      onPress={() => router.push('/(logistics)/notifications')}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t('notificationsCenter.title')}
    >
      <View style={{ position: 'relative' }}>
        <Bell size={20} color={theme.colors.text.primary} strokeWidth={1.5} />
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
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.background }}>
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: enterpriseColors.canvas }}>
      <GrowerTabHeader
        title={t('logistics.missionsTitle')}
        subtitle={t('logistics.missionsSubtitle')}
        right={notifButton}
      />

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {(
            [
              { id: 'all' as const, label: t('logistics.filterAll') },
              { id: 'PENDING' as const, label: t('logistics.filterPending') },
              { id: 'ASSIGNED' as const, label: t('logistics.filterAssigned') },
              { id: 'IN_TRANSIT' as const, label: t('logistics.filterInTransit') },
              { id: 'COMPLETED' as const, label: t('logistics.filterCompleted') },
            ] as const
          ).map((f) => {
            const on = filter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.7}
                style={[growerUi.filterChip, on && growerUi.filterChipOn]}
              >
                <Text style={[growerUi.filterChipText, on && growerUi.filterChipTextOn]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(p.bottomInset, 16) + 16 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={enterpriseColors.primary} />
        }
      >
        {loading ? (
          <ActivityIndicator color={enterpriseColors.primary} style={{ marginTop: 32 }} />
        ) : filteredMissions.length === 0 ? (
          <EmptyState message={t('logistics.emptyMissions')} icon={Truck} />
        ) : (
          filteredMissions.map((mission) => {
            const c = getMissionStatusColor(mission.status);
            const lotCode = mission.batch?.batchId?.trim();
            const product = mission.batch?.productName?.trim();
            const pickup = (mission as { pickupAddress?: string | null }).pickupAddress?.trim();
            const claimable = canClaimLogisticsMission(mission);
            return (
              <View key={mission.id} style={styles.card}>
                <TouchableOpacity
                  onPress={() => router.push(`/(logistics)/mission/${mission.id}`)}
                  activeOpacity={0.6}
                  accessibilityRole="button"
                >
                  <View style={styles.cardHead}>
                    <View style={[styles.icon, { backgroundColor: `${c}18` }]}>
                      <Truck size={18} color={c} strokeWidth={1.9} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.title} numberOfLines={1}>
                        {product || mission.missionNumber || t('producer.missions.missionPrefix', { id: mission.id.slice(0, 8) })}
                      </Text>
                      <Text style={styles.code} numberOfLines={1}>
                        {[mission.missionNumber, lotCode].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    <View style={[styles.pill, { backgroundColor: `${c}18` }]}>
                      <Text style={[styles.pillText, { color: c }]} numberOfLines={1}>
                        {getMissionStatusLabelLocalized(mission.status, t)}
                      </Text>
                    </View>
                  </View>
                  {pickup ? (
                    <View style={styles.metaRow}>
                      <MapPin size={13} color={enterpriseColors.gray600} strokeWidth={1.9} />
                      <Text style={styles.meta} numberOfLines={1}>{pickup}</Text>
                    </View>
                  ) : null}
                  <View style={styles.metaRow}>
                    <Calendar size={13} color={enterpriseColors.gray600} strokeWidth={1.9} />
                    <Text style={styles.meta}>{new Date(mission.createdAt).toLocaleDateString(dateLocale)}</Text>
                    {mission.updatedAt ? (
                      <>
                        <Clock size={13} color={enterpriseColors.gray600} strokeWidth={1.9} style={{ marginLeft: 10 }} />
                        <Text style={styles.meta}>{new Date(mission.updatedAt).toLocaleDateString(dateLocale)}</Text>
                      </>
                    ) : null}
                  </View>
                </TouchableOpacity>
                {claimable ? (
                  <TouchableOpacity
                    onPress={() => void claimMission(mission.id)}
                    disabled={claimingId === mission.id}
                    activeOpacity={0.8}
                    style={[styles.claim, claimingId === mission.id && { opacity: 0.6 }]}
                    accessibilityRole="button"
                  >
                    {claimingId === mission.id ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.claimText}>{t('logistics.claim.cta')}</Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  filterBar: { backgroundColor: enterpriseColors.canvas, paddingBottom: 10 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 2 },
  list: { paddingHorizontal: 16, paddingTop: 4, gap: 10 },
  card: { ...enterpriseUi.inAppPanel, padding: 14 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '600', letterSpacing: -0.25, color: enterpriseColors.gray900 },
  code: { fontSize: 11, color: enterpriseColors.gray600, fontFamily: 'Menlo', marginTop: 2 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, maxWidth: 130 },
  pillText: { fontSize: 11, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, paddingLeft: 52 },
  meta: { fontSize: 12.5, color: enterpriseColors.gray600, flexShrink: 1, fontVariant: ['tabular-nums'] },
  claim: {
    marginTop: 12,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: enterpriseColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimText: { fontSize: 14.5, fontWeight: '600', color: '#fff' },
});
