import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { QrCode } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { getBatchStatusLabel } from './batch-status-i18n';
import { getBatchStatusColor } from './useBatchDetailData';
import LotIdsBlock from './LotIdsBlock';

export default function BatchHeaderBlock({ batch }: { batch: any }) {
  const { t } = useTranslation();
  const statusLabel = getBatchStatusLabel(t, batch.status);
  return (
    <View
      style={{
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.sm, gap: 8 }}>
        <QrCode size={18} color={theme.colors.text.primary} strokeWidth={1} style={{ marginTop: 2 }} />
        <LotIdsBlock lot={batch} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.secondary }}>{t('common.status')}</Text>
        <View
          style={{
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: 4,
            borderRadius: theme.borderRadius.sm,
            backgroundColor: `${getBatchStatusColor(batch.status)}15`,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '400', color: getBatchStatusColor(batch.status), letterSpacing: 0.3 }}>
            {statusLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}
