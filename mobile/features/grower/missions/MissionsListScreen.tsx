import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react-native';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { growerUi, growerStyles } from '../../../lib/grower-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { missionsAPI, type Mission } from '../../../lib/api';
import { getMissionStatusLabelLocalized } from '../../../lib/mission-status';
import { useAppLocaleTag } from '../../../lib/date-locale';

type FilterId = 'all' | 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'COMPLETED';

function statusTone(status: string): { bg: string; text: string } {
  switch (status) {
    case 'IN_TRANSIT':
    case 'PICKED_UP':
      return { bg: enterpriseColors.primaryTint, text: enterpriseColors.primary };
    case 'COMPLETED':
    case 'DELIVERED':
      return { bg: enterpriseColors.gray100, text: enterpriseColors.gray600 };
    case 'CANCELLED':
      return { bg: enterpriseColors.gray100, text: enterpriseColors.gray600 };
    default:
      return { bg: 'rgba(217, 119, 6, 0.1)', text: '#92400E' };
  }
}

export default function MissionsListScreen() {
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();
  const router = useRouter();
  const dateLocale = useAppLocaleTag();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterId>('all');

  const loadMissions = useCallback(async () => {
    try {
      const data = await missionsAPI.getAll({ scope: 'grower' });
      setMissions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading missions:', error);
      setMissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMissions();
  }, [loadMissions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMissions();
    setRefreshing(false);
  };

  const filteredMissions = filter === 'all' ? missions : missions.filter((m) => m.status === filter);

  const filters: { id: FilterId; label: string }[] = [
    { id: 'all', label: t('logistics.filterAll') },
    { id: 'PENDING', label: t('logistics.filterPending') },
    { id: 'ASSIGNED', label: t('logistics.filterAssigned') },
    { id: 'IN_TRANSIT', label: t('logistics.filterInTransit') },
    { id: 'COMPLETED', label: t('logistics.filterCompleted') },
  ];

  return (
    <View style={growerUi.canvas}>
      <GrowerStackHeader
        title={t('producer.tabs.missions')}
        subtitle={t('producer.hubs.chain.missionsDesc')}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {filters.map((f) => {
          const active = filter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => setFilter(f.id)}
              activeOpacity={0.7}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          ...growerUi.scrollContent,
          paddingTop: 12,
          paddingBottom: Math.max(p.bottomInset, 20) + 12,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={enterpriseColors.primary}
            colors={[enterpriseColors.primary]}
          />
        }
      >
        <TouchableOpacity
          onPress={() => router.push('/(producer)/missions-create')}
          activeOpacity={0.88}
          style={growerUi.btnPrimary}
          accessibilityRole="button"
        >
          <Text style={growerUi.btnPrimaryText}>{t('navigation.requestTransport')}</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color={enterpriseColors.primary} />
          </View>
        ) : filteredMissions.length === 0 ? (
          <View style={[growerUi.emptyCard, { marginTop: 20 }]}>
            <Text style={styles.emptyTitle}>{t('producer.missions.listEmpty')}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredMissions.map((mission) => {
              const tone = statusTone(mission.status);
              const title =
                mission.missionNumber ||
                t('producer.missions.missionPrefix', { id: mission.id.slice(0, 8) });
              const batchLine = mission.batch
                ? `${t('producer.missionsCreate.batchLabel')}: ${mission.batch.batchId || mission.batchId}`
                : null;
              const dateLine = new Date(mission.createdAt).toLocaleDateString(dateLocale);

              return (
                <TouchableOpacity
                  key={mission.id}
                  onPress={() => router.push(`/(producer)/mission/${mission.id}`)}
                  activeOpacity={0.72}
                  style={styles.row}
                  accessibilityRole="button"
                >
                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {title}
                    </Text>
                    {batchLine ? (
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        {batchLine}
                      </Text>
                    ) : null}
                    <Text style={styles.rowDate}>{dateLine}</Text>
                  </View>
                  <View style={styles.rowEnd}>
                    <View style={[growerStyles.statusPill, { backgroundColor: tone.bg }]}>
                      <Text style={[growerStyles.statusPillText, { color: tone.text }]}>
                        {getMissionStatusLabelLocalized(mission.status, t)}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={enterpriseColors.gray600} strokeWidth={1.5} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  filterScroll: {
    flexGrow: 0,
    backgroundColor: enterpriseColors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
  },
  filterChipActive: {
    borderColor: enterpriseColors.primary,
    backgroundColor: enterpriseColors.primaryTint,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: enterpriseColors.gray600,
    letterSpacing: -0.1,
  },
  filterChipTextActive: {
    color: enterpriseColors.primary,
    fontWeight: '600',
  },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: -0.15,
  },
  list: {
    marginTop: 16,
    backgroundColor: enterpriseColors.white,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: enterpriseColors.gray200,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 72,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
    gap: 12,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    letterSpacing: -0.25,
  },
  rowMeta: {
    fontSize: 14,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    marginTop: 4,
    letterSpacing: -0.1,
  },
  rowDate: {
    fontSize: 13,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    marginTop: 6,
    opacity: 0.85,
  },
  rowEnd: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
});
