import { View, Text } from 'react-native';
import { Calendar, Clock } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';
import type { Order } from '../../../lib/api';
import { useTranslation } from 'react-i18next';
import { useAppLocaleTag } from '../../../lib/date-locale';
import { getOrderStatusColor, getOrderStatusLabel } from './useOrderDetailData';

const dateOpts = { day: '2-digit' as const, month: '2-digit' as const, year: 'numeric' as const, hour: '2-digit' as const, minute: '2-digit' as const };

export default function OrderTimelineBlock({ order }: { order: Order }) {
  const { t } = useTranslation();
  const dateLocale = useAppLocaleTag();
  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        borderWidth: 0.5,
        borderColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: '300', color: colors.text.primary, marginBottom: theme.spacing.md, letterSpacing: 0.3 }}>
        {t('producer.orders.timelineTitle')}
      </Text>
      <View style={{ gap: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ width: 2, height: 40, backgroundColor: colors.primary, marginRight: theme.spacing.sm }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.primary }}>{t('producer.orders.created')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Calendar size={11} color={colors.text.secondary} strokeWidth={1} />
              <Text style={{ fontSize: 11, fontWeight: '300', color: colors.text.secondary, marginLeft: 4 }}>
                {new Date(order.createdAt).toLocaleString(dateLocale, dateOpts)}
              </Text>
            </View>
          </View>
        </View>
        {order.updatedAt && order.updatedAt !== order.createdAt && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ width: 2, height: 40, backgroundColor: getOrderStatusColor(order.status), marginRight: theme.spacing.sm }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.primary }}>{getOrderStatusLabel(order.status, t)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Clock size={11} color={colors.text.secondary} strokeWidth={1} />
                <Text style={{ fontSize: 11, fontWeight: '300', color: colors.text.secondary, marginLeft: 4 }}>
                  {new Date(order.updatedAt).toLocaleString(dateLocale, dateOpts)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
