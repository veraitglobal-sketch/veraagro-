import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { missionStatusEnterpriseTone } from '../../../lib/mission-status';
import { growerUi, growerStyles } from '../../../lib/grower-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { missionsAPI, type Mission } from '../../../lib/api';
import {
  formatDriverName,
  formatVehicleLine,
  missionAssignedDriverFromApi,
  missionLogisticsPartnerLabel,
  missionVehicleFromApi,
} from '../../../lib/mission-logistics';
import { getMissionStatusLabelLocalized } from '../../../lib/mission-status';
import { useAppLocaleTag } from '../../../lib/date-locale';

type FilterId = 'all' | 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'COMPLETED';

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

  const filterBar = (
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
            activeOpacity={0.88}
            style={[growerUi.filterChip, active && growerUi.filterChipOn]}
          >
            <Text style={[growerUi.filterChipText, active && growerUi.filterChipTextOn]}>{f.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  return (
    <EnterpriseScreen
      refreshing={refreshing}
      onRefresh={() => void onRefresh()}
      contentPaddingBottom={Math.max(p.bottomInset, 20) + 12}
      header={
        <>
          <GrowerStackHeader
            title={t('producer.tabs.missions')}
            subtitle={t('producer.hubs.chain.missionsDesc')}
          />
          {filterBar}
        </>
      }
    >
      <View style={[growerUi.scrollContent, { paddingTop: 12 }]}>
        <TouchableOpacity
          onPress={() => router.push('/(producer)/missions-create')}
          activeOpacity={0.88}
          style={[enterpriseUi.authBtnPrimary, styles.requestBtn]}
          accessibilityRole="button"
        >
          <Text style={enterpriseUi.authBtnPrimaryText}>{t('navigation.requestTransport')}</Text>
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
          <View style={[enterpriseUi.inAppPanel, styles.list]}>
            {filteredMissions.map((mission, index) => {
              const tone = missionStatusEnterpriseTone(mission.status);
              const title =
                mission.missionNumber ||
                t('producer.missions.missionPrefix', { id: mission.id.slice(0, 8) });
              const batch = mission.batch as { batchId?: string } | undefined;
              const batchLine = batch?.batchId || mission.batchId
                ? `${t('producer.missionsCreate.batchLabel')}: ${batch?.batchId || mission.batchId}`
                : null;
              const dateLine = new Date(mission.createdAt).toLocaleDateString(dateLocale);
              const raw = mission as unknown as Record<string, unknown>;
              const driverLine = formatDriverName(missionAssignedDriverFromApi(raw));
              const partnerLine = missionLogisticsPartnerLabel(raw);
              const vehicleLine = formatVehicleLine(missionVehicleFromApi(raw));
              const logisticsLine = driverLine
                ? [driverLine, vehicleLine].filter(Boolean).join(' · ')
                : partnerLine
                  ? [t('producer.missions.assignmentLineCarrier', { name: partnerLine }), vehicleLine]
                      .filter(Boolean)
                      .join(' · ')
                  : '';

              return (
                <TouchableOpacity
                  key={mission.id}
                  onPress={() => router.push(`/(producer)/mission/${mission.id}`)}
                  activeOpacity={0.72}
                  style={[styles.row, index < filteredMissions.length - 1 && styles.rowBorder]}
                  accessibilityRole="button"
                >
                  <View style={styles.rowMain}>
                    <Text style={enterpriseUi.navRowTitle} numberOfLines={1}>
                      {title}
                    </Text>
                    {batchLine ? (
                      <Text style={enterpriseUi.navRowSubtitle} numberOfLines={1}>
                        {batchLine}
                      </Text>
                    ) : null}
                    {logisticsLine ? (
                      <Text style={enterpriseUi.navRowSubtitle} numberOfLines={2}>
                        {logisticsLine}
                      </Text>
                    ) : null}
                    <Text style={styles.rowDate}>{dateLine}</Text>
                  </View>
                  <View style={[growerStyles.statusPill, { backgroundColor: tone.bg }]}>
                    <Text style={[growerStyles.statusPillText, { color: tone.text }]}>
                      {getMissionStatusLabelLocalized(mission.status, t)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </EnterpriseScreen>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
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
  requestBtn: {
    marginBottom: 16,
  },
  list: {
    marginTop: 4,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    minHeight: 76,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
  },
  rowDate: {
    fontSize: 13,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    marginTop: 6,
  },
});
