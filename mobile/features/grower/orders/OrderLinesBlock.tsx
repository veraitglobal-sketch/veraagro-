import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../../lib/theme';
import { useAppLocaleTag } from '../../../lib/date-locale';
import type { Order } from '../../../lib/api';

export default function OrderLinesBlock({ order }: { order: Order }) {
  const { t } = useTranslation();
  const dateLocale = useAppLocaleTag();
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
      <Text style={{ fontSize: 13.5, fontWeight: '400', color: theme.colors.text.primary, marginBottom: theme.spacing.sm, letterSpacing: 0.3 }}>
        {t('producer.orders.product')}
      </Text>
      <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.secondary, marginBottom: theme.spacing.xs }}>
        {order.productName}
      </Text>
      <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.secondary }}>
        {t('producer.orders.quantity')}: {order.quantity} {order.unit}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.sm, paddingTop: theme.spacing.sm, borderTopWidth: 0.5, borderTopColor: theme.colors.border }}>
        <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.secondary }}>{t('producer.orders.unitPrice')}</Text>
        <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.primary }}>
          {order.unitPrice.toLocaleString(dateLocale, { style: 'currency', currency: 'EUR' })}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.xs }}>
        <Text style={{ fontSize: 13.5, fontWeight: '400', color: theme.colors.text.primary }}>{t('producer.orders.total')}</Text>
        <Text style={{ fontSize: 13.5, fontWeight: '400', color: theme.colors.primary }}>
          {order.totalAmount.toLocaleString(dateLocale, { style: 'currency', currency: 'EUR' })}
        </Text>
      </View>
    </View>
  );
}
