import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ordersAPI, Order } from '../../lib/api';
import { theme } from '../../lib/theme';
import { ArrowRight, Package } from 'lucide-react-native';

/**
 * Buyer Orders Screen
 * Order history for customers
 */
export default function OrdersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersAPI.getAll();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: theme.spacing.lg }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '300',
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.lg,
          letterSpacing: 1,
        }}>
          {t('buyer.orders.title')}
        </Text>

        {loading ? (
          <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: theme.colors.text.secondary }}>
              Loading...
            </Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.xl,
            alignItems: 'center',
            borderWidth: 0.5,
            borderColor: 'rgba(0, 0, 0, 0.05)',
          }}>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: theme.borderRadius.md,
              backgroundColor: `${theme.colors.primary}08`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.spacing.md,
            }}>
              <Package size={32} color={theme.colors.text.tertiary} strokeWidth={1} />
            </View>
            <Text style={{
              fontSize: 13,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              textAlign: 'center',
              letterSpacing: 0.3,
            }}>
              {t('buyer.orders.empty') || 'No orders yet'}
            </Text>
          </View>
        ) : (
          <View style={{ gap: theme.spacing.md }}>
            {orders.map((order) => (
              <TouchableOpacity
                key={order.id}
                onPress={() => router.push(`/(buyer)/order/${order.id}`)}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.lg,
                  borderWidth: 0.5,
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '300',
                    color: theme.colors.text.primary,
                    marginBottom: theme.spacing.xs,
                    letterSpacing: 0.3,
                  }}>
                    {order.productName}
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    letterSpacing: 0.5,
                  }}>
                    {order.orderNumber}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '300',
                    color: theme.colors.text.primary,
                    marginTop: theme.spacing.xs,
                  }}>
                    {order.totalAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </Text>
                </View>
                <ArrowRight size={18} color={theme.colors.text.secondary} strokeWidth={1} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
