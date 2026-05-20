import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import SyncStatus from '../../../components/SyncStatus';
import { GrowerTabShellHeader } from '../../../components/enterprise/GrowerTabShellHeader';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { parcelStatusLine, type ParcelStats } from './parcelStatusLine';

type Props = {
  farmName: string;
  greetingLine: string;
  partnerCode?: string | null;
  parcelSteps: ParcelStats;
  estateCount: number;
};

/** Enterprise home header — farm name + parcel status. */
export function HomeDashboardHeader({
  farmName,
  greetingLine,
  partnerCode,
  parcelSteps,
  estateCount,
}: Props) {
  const { t } = useTranslation();
  const status = parcelStatusLine(t, estateCount, parcelSteps);

  const partnerFooter = partnerCode ? (
    <View style={styles.partnerPill} accessibilityLabel={`${t('producer.dashboard.partner')} ${partnerCode}`}>
      <Text style={styles.partnerLabel}>{t('producer.dashboard.partner')}</Text>
      <Text style={styles.partnerCode}>{partnerCode}</Text>
    </View>
  ) : null;

  return (
    <GrowerTabShellHeader
      showBrandRow
      eyebrow={greetingLine}
      title={farmName}
      statusLine={status}
      leftSlot={<SyncStatus />}
      footer={partnerFooter}
    />
  );
}

const styles = StyleSheet.create({
  partnerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
  },
  partnerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: enterpriseColors.gray600,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  partnerCode: {
    fontSize: 14,
    fontWeight: '500',
    color: enterpriseColors.primary,
    fontVariant: ['tabular-nums'],
  },
});
