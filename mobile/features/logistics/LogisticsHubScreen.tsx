import { useCallback, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import {
  LayoutDashboard,
  ClipboardList,
  Truck,
  Users,
  ArrowLeftRight,
  FileSignature,
  Bell,
} from 'lucide-react-native';
import { EnterpriseScreen } from '../../components/enterprise/EnterpriseScreen';
import { TabRootBody } from '../../components/enterprise/TabRootBody';
import { EnterpriseNavSection } from '../../components/enterprise/EnterpriseNavSection';
import { GrowerTabHeader } from '../../components/grower/GrowerTabHeader';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { missionsAPI, notificationsAPI, logisticsVehiclesAPI, type Mission } from '../../lib/api';

export default function LogisticsHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [availableVehicles, setAvailableVehicles] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, v, n] = await Promise.all([
        missionsAPI.getAll({ scope: 'logistics' }),
        logisticsVehiclesAPI.list().catch(() => []),
        notificationsAPI.getAll().catch(() => []),
      ]);
      const list = Array.isArray(m) ? m : [];
      setMissions(list);
      const vehicles = Array.isArray(v) ? v : [];
      setVehicleCount(vehicles.length);
      setAvailableVehicles(vehicles.filter((x) => x.status === 'AVAILABLE' && x.hasFrigo).length);
      setUnreadNotifications(Array.isArray(n) ? n.filter((x) => !x.read).length : 0);
    } catch {
      setMissions([]);
      setVehicleCount(0);
      setAvailableVehicles(0);
      setUnreadNotifications(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const pendingCount = useMemo(
    () => missions.filter((m) => m.status === 'PENDING' && !m.logisticsPartnerId).length,
    [missions],
  );
  const activeCount = useMemo(
    () =>
      missions.filter((m) =>
        ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'PICKED_UP', 'IN_TRANSIT', 'READY_FOR_LOADING'].includes(
          m.status ?? '',
        ),
      ).length,
    [missions],
  );

  return (
    <EnterpriseScreen
      fillViewport
      withTopWash
      refreshing={refreshing}
      onRefresh={() => void onRefresh()}
      contentPaddingBottom={Math.max(p.bottomInset, 16) + 12}
      header={
        <GrowerTabHeader
          title={t('logistics.hub.title')}
          subtitle={t('logistics.hub.subtitle')}
          right={
            unreadNotifications > 0 ? (
              <View
                style={{
                  minWidth: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: '#c53030',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Text>
              </View>
            ) : null
          }
        />
      }
    >
      <TabRootBody>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 20,
          }}
        >
          {[
            { label: t('logistics.hub.metricPending'), value: pendingCount },
            { label: t('logistics.hub.metricActive'), value: activeCount },
            { label: t('logistics.hub.metricFrigoFree'), value: availableVehicles },
          ].map((chip) => (
            <View
              key={chip.label}
              style={{
                flex: 1,
                minWidth: '28%',
                paddingVertical: 12,
                paddingHorizontal: 10,
                borderRadius: 12,
                borderWidth: 0.5,
                borderColor: 'rgba(0,0,0,0.08)',
                backgroundColor: '#fff',
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: '600', color: '#2D5A27' }}>{chip.value}</Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>{chip.label}</Text>
            </View>
          ))}
        </View>

        <EnterpriseNavSection
          title={t('logistics.hub.sectionRuns')}
          items={[
            {
              key: 'missions',
              title: t('logistics.hub.missions'),
              subtitle: t('logistics.hub.missionsDesc', { pending: pendingCount, active: activeCount }),
              icon: ClipboardList,
              onPress: () => router.push('/(logistics)/(tabs)/missions'),
            },
            {
              key: 'notifications',
              title: t('notificationsCenter.title'),
              subtitle:
                unreadNotifications > 0
                  ? t('logistics.hub.notificationsUnread', { count: unreadNotifications })
                  : t('logistics.hub.notificationsOk'),
              icon: Bell,
              onPress: () => router.push('/(logistics)/notifications'),
            },
          ]}
        />

        <EnterpriseNavSection
          title={t('logistics.hub.sectionFleet')}
          items={[
            {
              key: 'vehicles',
              title: t('logistics.hub.vehicles'),
              subtitle: t('logistics.hub.vehiclesDesc', { count: vehicleCount, free: availableVehicles }),
              icon: Truck,
              onPress: () => router.push('/(logistics)/vehicles'),
            },
            {
              key: 'drivers',
              title: t('logistics.hub.drivers'),
              subtitle: t('logistics.hub.driversDesc'),
              icon: Users,
              onPress: () => router.push('/(logistics)/drivers'),
            },
          ]}
        />

        <EnterpriseNavSection
          title={t('logistics.hub.sectionHandover')}
          items={[
            {
              key: 'loading',
              title: t('logistics.loadingHandover.link'),
              subtitle: t('logistics.hub.loadingDesc'),
              icon: ArrowLeftRight,
              onPress: () => router.push('/(logistics)/handover-loading'),
            },
            {
              key: 'receiver',
              title: t('logistics.receiverProof.link'),
              subtitle: t('logistics.hub.receiverDesc'),
              icon: FileSignature,
              onPress: () => router.push('/(logistics)/handover-receiver'),
            },
          ]}
        />

        <EnterpriseNavSection
          title={t('logistics.hub.sectionMore')}
          items={[
            {
              key: 'profile',
              title: t('logistics.hub.profile'),
              subtitle: t('logistics.hub.profileDesc'),
              icon: LayoutDashboard,
              onPress: () => router.push('/(logistics)/(tabs)/profile'),
            },
          ]}
        />
      </TabRootBody>
    </EnterpriseScreen>
  );
}
