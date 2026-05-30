import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { MapPin, Package, ClipboardList, Wallet } from 'lucide-react-native';
import { EnterpriseNavSection } from '../../../components/enterprise/EnterpriseNavSection';
import { useAppLocaleTag } from '../../../lib/date-locale';
import type { OrdersFinancialSnapshot } from './fetchGrowerOrdersFinancial';

type ParcelStats = {
  loaded: boolean;
  total: number;
  pending: number;
  approved: number;
};

type Props = {
  estateCount: number;
  parcelSteps: ParcelStats;
  activeMissions: number;
  batchesReadyForTransport: number;
  activeBatches: number;
  offlinePending: number;
  ordersFinancial: OrdersFinancialSnapshot | null;
};

function euro(n: number, locale: string) {
  return n.toLocaleString(locale, { style: 'currency', currency: 'EUR' });
}

/**
 * Compact farm status — max 4 rows, each opens the right tab/screen.
 * Not a duplicate of the tab bar: only counts + deep links farmers need daily.
 */
export function HomeFarmSnapshot({
  estateCount,
  parcelSteps,
  activeMissions,
  batchesReadyForTransport,
  activeBatches,
  offlinePending,
  ordersFinancial,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const locale = useAppLocaleTag();

  const items = useMemo(() => {
    if (!parcelSteps.loaded) return [];

    const rows: Parameters<typeof EnterpriseNavSection>[0]['items'] = [];

    if (estateCount === 0) {
      rows.push({
        key: 'estates',
        title: t('producer.dashboard.homeSnapshot.addFieldTitle'),
        subtitle: t('producer.dashboard.homeSnapshot.addFieldSub'),
        icon: MapPin,
        onPress: () => router.push('/(producer)/estates/new'),
      });
      return rows;
    }

    rows.push({
      key: 'parcels',
      title: t('producer.dashboard.homeSnapshot.parcelsTitle'),
      subtitle:
        parcelSteps.total > 0
          ? parcelSteps.pending > 0
            ? t('producer.dashboard.homeSnapshot.parcelsPending', {
                approved: parcelSteps.approved,
                total: parcelSteps.total,
                pending: parcelSteps.pending,
              })
            : t('producer.dashboard.homeSnapshot.parcelsOk', {
                approved: parcelSteps.approved,
                total: parcelSteps.total,
              })
          : t('producer.dashboard.homeSnapshot.parcelsEmpty'),
      icon: MapPin,
      onPress: () => router.push('/(producer)/(tabs)/field'),
    });

    const chainSubtitle =
      batchesReadyForTransport > 0
        ? t('producer.dashboard.homeSnapshot.batchesReady', { count: batchesReadyForTransport })
        : activeMissions > 0
          ? t('producer.dashboard.homeSnapshot.missionsActive', { count: activeMissions })
          : activeBatches > 0
            ? t('producer.dashboard.homeSnapshot.batchesActive', { count: activeBatches })
            : t('producer.dashboard.homeSnapshot.chainIdle');

    rows.push({
      key: 'chain',
      title: t('producer.dashboard.homeSnapshot.chainTitle'),
      subtitle: chainSubtitle,
      icon: Package,
      onPress: () =>
        batchesReadyForTransport > 0 || activeMissions > 0
          ? router.push('/(producer)/missions')
          : router.push('/(producer)/(tabs)/chain'),
    });

    if (parcelSteps.approved > 0) {
      rows.push({
        key: 'field-log',
        title: t('producer.tabs.fieldLog'),
        subtitle:
          offlinePending > 0
            ? t('producer.dashboard.homeSnapshot.fieldLogPending', { count: offlinePending })
            : t('producer.dashboard.homeSnapshot.fieldLogSub'),
        icon: ClipboardList,
        onPress: () => router.push('/(producer)/(tabs)/field-log'),
      });
    }

    if (
      ordersFinancial &&
      ordersFinancial.dashboardRole !== 'PLATFORM' &&
      ordersFinancial.farmerShareInEscrow > 0
    ) {
      rows.push({
        key: 'wallet',
        title: t('producer.dashboard.homeFinanceTeaserTitle'),
        subtitle: t('producer.dashboard.homeSnapshot.walletEscrow', {
          amount: euro(ordersFinancial.farmerShareInEscrow, locale),
        }),
        icon: Wallet,
        onPress: () => router.push('/(producer)/wallet'),
      });
    }

    return rows.slice(0, 4);
  }, [
    t,
    router,
    locale,
    estateCount,
    parcelSteps.loaded,
    parcelSteps.total,
    parcelSteps.pending,
    parcelSteps.approved,
    activeMissions,
    batchesReadyForTransport,
    activeBatches,
    offlinePending,
    ordersFinancial,
  ]);

  if (items.length === 0) return null;

  return (
    <EnterpriseNavSection title={t('producer.dashboard.homeSnapshot.navTitle')} items={items} />
  );
}
