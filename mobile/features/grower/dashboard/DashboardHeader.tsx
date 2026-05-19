import { View, Text, ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import SyncStatus from '../../../components/SyncStatus';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { homeUi } from '../../../lib/home-ui';

interface DashboardHeaderProps {
  farmName: string;
  partnerCode?: string;
  statusLine?: string | null;
  /** Keeps header height stable while parcel stats load. */
  reserveStatusLine?: boolean;
  refreshing?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Compact mobile home header — name, code, sync only. */
export default function DashboardHeader({
  farmName,
  partnerCode,
  statusLine,
  reserveStatusLine = false,
  refreshing = false,
  style,
}: DashboardHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.bar, style]}>
      <View style={styles.row}>
        <View style={styles.titleBlock}>
          <Text style={styles.farmName} numberOfLines={1} accessibilityRole="header">
            {farmName}
          </Text>
          {partnerCode ? (
            <Text style={styles.meta} numberOfLines={1}>
              {t('producer.dashboard.partner')} {partnerCode}
            </Text>
          ) : null}
          {statusLine ? (
            <Text style={styles.status} numberOfLines={1}>
              {statusLine}
            </Text>
          ) : reserveStatusLine ? (
            <View style={styles.statusPlaceholder} />
          ) : null}
        </View>
        <View style={styles.syncCol}>
          {refreshing ? (
            <ActivityIndicator size="small" color={enterpriseColors.primary} style={styles.spin} />
          ) : null}
          <SyncStatus />
        </View>
      </View>
    </View>
  );
}

const styles = {
  bar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: enterpriseColors.canvas,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  farmName: {
    ...homeUi.heroFarmName,
  },
  meta: {
    ...homeUi.heroMeta,
  },
  status: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: enterpriseColors.primary,
    marginTop: 8,
    lineHeight: 20,
  },
  statusPlaceholder: {
    height: 19,
    marginTop: 6,
  },
  syncCol: {
    alignItems: 'flex-end' as const,
    minWidth: 72,
  },
  spin: {
    marginBottom: 4,
  },
};
