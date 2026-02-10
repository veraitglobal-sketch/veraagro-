import { View, Text } from 'react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';
import type { Order } from '../../../lib/api';

export default function OrderLinesBlock({ order }: { order: Order }) {
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
      <Text style={{ fontSize: 15, fontWeight: '300', color: colors.text.primary, marginBottom: theme.spacing.sm, letterSpacing: 0.3 }}>
        Proizvod
      </Text>
      <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.secondary, marginBottom: theme.spacing.xs }}>
        {order.productName}
      </Text>
      <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.secondary }}>
        Količina: {order.quantity} {order.unit}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.sm, paddingTop: theme.spacing.sm, borderTopWidth: 0.5, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.secondary }}>Cena po jedinici</Text>
        <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.primary }}>
          {order.unitPrice.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.xs }}>
        <Text style={{ fontSize: 15, fontWeight: '300', color: colors.text.primary }}>Ukupno</Text>
        <Text style={{ fontSize: 15, fontWeight: '300', color: colors.primary }}>
          {order.totalAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
        </Text>
      </View>
    </View>
  );
}
