import { View, Text } from 'react-native';
import { QrCode } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';
import { getBatchStatusColor, getBatchStatusLabel } from './useBatchDetailData';

export default function BatchHeaderBlock({ batch }: { batch: any }) {
  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 0.5,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <QrCode size={18} color={colors.text.primary} strokeWidth={1} />
        <Text style={{ fontSize: 15, fontWeight: '300', color: colors.text.primary, marginLeft: theme.spacing.xs, letterSpacing: 0.3 }}>
          {batch.batchId || batch.id}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.secondary }}>Status</Text>
        <View
          style={{
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: 4,
            borderRadius: theme.borderRadius.sm,
            backgroundColor: `${getBatchStatusColor(batch.status)}15`,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '300', color: getBatchStatusColor(batch.status), letterSpacing: 0.3 }}>
            {getBatchStatusLabel(batch.status)}
          </Text>
        </View>
      </View>
    </View>
  );
}
