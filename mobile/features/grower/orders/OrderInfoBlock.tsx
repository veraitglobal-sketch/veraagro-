import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import type { Order } from '../../../lib/api';
import { getOrderStatusColor, getOrderStatusLabel } from './useOrderDetailData';

export default function OrderInfoBlock({ order }: { order: Order }) {
  const { t } = useTranslation();
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
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <Package size={18} color={theme.colors.text.primary} strokeWidth={1} />
        <Text style={{ fontSize: 15, fontWeight: '400', color: theme.colors.text.primary, marginLeft: theme.spacing.xs, letterSpacing: 0.3 }}>
          #{(order as any).orderNumber || order.id.slice(0, 8)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.secondary }}>{t('producer.missions.statusFieldLabel')}</Text>
        <View
          style={{
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: 4,
            borderRadius: theme.borderRadius.sm,
            backgroundColor: `${getOrderStatusColor(order.status)}15`,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '400', color: getOrderStatusColor(order.status), letterSpacing: 0.3 }}>
            {getOrderStatusLabel(order.status, t)}
          </Text>
        </View>
      </View>
    </View>
  );
}
