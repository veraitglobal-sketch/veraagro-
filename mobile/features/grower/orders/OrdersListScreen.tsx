import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { useAppLocaleTag } from '../../../lib/date-locale';
import { Package, Calendar, Euro } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import { useOrdersListData } from './useOrdersListData';
import type { OrderFilterStatus } from './useOrdersListData';

/**
 * Orders list screen (producer): header, filters, list with refresh.
 */
export function OrdersListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const data = useOrdersListData();
  const p = useBioVeraScreenPadding();
  const dateLocale = useAppLocaleTag();

  const filterSpecs = useMemo(
    (): { id: OrderFilterStatus; labelKey: string }[] => [
      { id: 'all', labelKey: 'common.all' },
      { id: 'PENDING', labelKey: 'producer.orders.statusPending' },
      { id: 'CONFIRMED', labelKey: 'producer.orders.statusConfirmed' },
      { id: 'PREPARING', labelKey: 'producer.orders.statusPreparing' },
      { id: 'IN_TRANSIT', labelKey: 'producer.orders.statusInTransit' },
      { id: 'DELIVERED', labelKey: 'producer.orders.statusDelivered' },
      { id: 'CANCELLED', labelKey: 'producer.orders.statusCancelled' },
    ],
    [],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BioVeraSubpageHeader title={t('navigation.orders')} left="back" />

      <View
        style={{
        paddingLeft: p.screenPaddingLeft,
        paddingRight: p.screenPaddingRight,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
      }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            {filterSpecs.map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => data.setFilter(f.id)}
                style={{
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.borderRadius.sm,
                  borderWidth: 0.5,
                  borderColor: data.filter === f.id ? theme.colors.primary : 'rgba(0, 0, 0, 0.05)',
                  backgroundColor: data.filter === f.id ? `${theme.colors.primary}10` : 'transparent',
                }}
              >
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: data.filter === f.id ? theme.colors.primary : theme.colors.text.secondary,
                  letterSpacing: 0.3,
                }}>
                  {t(f.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={data.refreshing}
            onRefresh={data.onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View
          style={{
            paddingTop: theme.spacing.md,
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
            paddingBottom: Math.max(p.bottomInset, theme.spacing.lg),
          }}
        >
          {data.loading ? (
            <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
              <Text style={{ color: theme.colors.text.secondary, fontSize: 11, fontWeight: '300', letterSpacing: 0.3 }}>
                {t('producer.orders.loading')}
              </Text>
            </View>
          ) : data.filteredOrders.length === 0 ? (
            <View style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.xl,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.05)',
              alignItems: 'center',
            }}>
              <Package size={32} color={theme.colors.text.tertiary} strokeWidth={1} />
              <Text style={{ fontSize: 11, fontWeight: '300', color: theme.colors.text.secondary, marginTop: theme.spacing.sm, letterSpacing: 0.3, textAlign: 'center' }}>
                {t('producer.orders.listEmpty')}
              </Text>
            </View>
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {data.filteredOrders.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  onPress={() => router.push(`/(producer)/orders/${order.id}`)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.md,
                    borderWidth: 0.5,
                    borderColor: 'rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.sm }}>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: `${data.getStatusColor(order.status)}15`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: theme.spacing.sm,
                    }}>
                      <Package size={20} color={data.getStatusColor(order.status)} strokeWidth={1} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '300', color: theme.colors.text.primary, marginBottom: theme.spacing.xs, letterSpacing: 0.3 }}>
                        #{order.orderNumber || order.id.slice(0, 8)}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '300', color: theme.colors.text.secondary, letterSpacing: 0.2 }}>
                        {order.productName}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '300', color: theme.colors.text.secondary, marginTop: 2, letterSpacing: 0.2 }}>
                        {order.quantity} {order.unit}
                      </Text>
                    </View>
                    <View style={{
                      paddingHorizontal: theme.spacing.sm,
                      paddingVertical: theme.spacing.xs,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: `${data.getStatusColor(order.status)}15`,
                    }}>
                      <Text style={{ fontSize: 9, fontWeight: '300', color: data.getStatusColor(order.status), letterSpacing: 0.3 }}>
                        {data.getStatusLabel(order.status)}
                      </Text>
                    </View>
                  </View>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: theme.spacing.xs,
                    paddingTop: theme.spacing.xs,
                    borderTopWidth: 0.5,
                    borderTopColor: 'rgba(0, 0, 0, 0.05)',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Euro size={14} color={theme.colors.text.secondary} strokeWidth={1} />
                      <Text style={{ fontSize: 12, fontWeight: '300', color: theme.colors.text.primary, marginLeft: 4, letterSpacing: 0.2 }}>
                        {order.totalAmount.toLocaleString(dateLocale, { style: 'currency', currency: 'EUR' })}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Calendar size={11} color={theme.colors.text.secondary} strokeWidth={1} />
                      <Text style={{ fontSize: 9, fontWeight: '300', color: theme.colors.text.secondary, marginLeft: 4, letterSpacing: 0.2 }}>
                        {new Date(order.createdAt).toLocaleDateString(dateLocale)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
