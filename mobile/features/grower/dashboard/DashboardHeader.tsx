import { View, Text, StyleSheet, ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import SyncStatus from '../../../components/SyncStatus';
import { enterpriseColors } from '../../../lib/enterprise-ui';

interface DashboardHeaderProps {
  farmName: string;
  partnerCode?: string;
  statusLine?: string | null;
  refreshing?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function DashboardHeader({
  farmName,
  partnerCode,
  statusLine,
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
              {t('producer.dashboard.partner')}: {partnerCode}
            </Text>
          ) : null}
          {statusLine ? (
            <Text style={styles.status} numberOfLines={1}>
              {statusLine}
            </Text>
          ) : null}
        </View>
        <View style={styles.syncCol}>
          {refreshing ? (
            <ActivityIndicator size="small" color={enterpriseColors.primary} style={styles.refreshSpin} />
          ) : null}
          <SyncStatus />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  farmName: {
    fontSize: 18,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 13,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    marginTop: 2,
  },
  status: {
    fontSize: 13,
    fontWeight: '400',
    color: enterpriseColors.primary,
    marginTop: 4,
    letterSpacing: -0.1,
  },
  syncCol: {
    alignItems: 'flex-end',
    minWidth: 72,
  },
  refreshSpin: {
    marginBottom: 4,
  },
});
