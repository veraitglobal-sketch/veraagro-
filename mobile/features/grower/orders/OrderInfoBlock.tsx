import { View, Text } from 'react-native';
import { Package } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';
import type { Order } from '../../../lib/api';
import { getOrderStatusColor, getOrderStatusLabel } from './useOrderDetailData';

export default function OrderInfoBlock({ order }: { order: Order }) {
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
        <Package size={18} color={colors.text.primary} strokeWidth={1} />
        <Text style={{ fontSize: 15, fontWeight: '300', color: colors.text.primary, marginLeft: theme.spacing.xs, letterSpacing: 0.3 }}>
          #{(order as any).orderNumber || order.id.slice(0, 8)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.secondary }}>Status</Text>
        <View
          style={{
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: 4,
            borderRadius: theme.borderRadius.sm,
            backgroundColor: `${getOrderStatusColor(order.status)}15`,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '300', color: getOrderStatusColor(order.status), letterSpacing: 0.3 }}>
            {getOrderStatusLabel(order.status)}
          </Text>
        </View>
      </View>
    </View>
  );
}
