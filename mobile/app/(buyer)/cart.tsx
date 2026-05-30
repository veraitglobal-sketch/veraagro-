import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../hooks/useCart';
import { theme } from '../../lib/theme';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { bioVeraScrollProps } from '../../lib/scroll-view-props';
import { useAppLocaleTag } from '../../lib/date-locale';
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react-native';
import EmptyState from '../../components/EmptyState';

/**
 * Shopping Cart Screen
 * Minimalist design with thin lines and simple quantity controls
 */
export default function CartScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useBioVeraScreenPadding();
  const priceLocale = useAppLocaleTag();
  const { items, updateQuantity, removeFromCart, getTotalPrice, reloadCart } = useCart();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reloadCart();
    } finally {
      setRefreshing(false);
    }
  }, [reloadCart]);

  const handleCheckout = () => {
    if (items.length > 0) {
      router.push('/(buyer)/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, paddingTop: insets.topInset, backgroundColor: theme.colors.background }}>
        <EmptyState message={t('buyer.cart.empty')} icon={ShoppingBag} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.topInset, backgroundColor: theme.colors.background }}>
      <ScrollView
        {...bioVeraScrollProps}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressViewOffset={10}
          />
        }
      >
        <View style={{ padding: theme.spacing.lg }}>
          {items.map((item) => (
            <View key={`${item.product.id}-${item.lineKind}`}>
              <View style={{
                flexDirection: 'row',
                paddingVertical: theme.spacing.lg,
                borderBottomWidth: 0.5,
                borderBottomColor: 'rgba(0, 0, 0, 0.1)',
              }}>
                {/* Product Info */}
                <View style={{ flex: 1, marginRight: theme.spacing.md }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '400',
                    color: theme.colors.text.primary,
                    marginBottom: theme.spacing.xs,
                    letterSpacing: 0.3,
                  }}>
                    {item.product.productName}
                    {item.lineKind === 'reservation' && (
                      <Text style={{ fontSize: 14, color: theme.colors.primary }}>
                        {t('buyer.cart.reservationBadge')}
                      </Text>
                    )}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '400',
                    color: theme.colors.text.secondary,
                    letterSpacing: 0.2,
                  }}>
                    {item.product.price != null && item.product.price > 0
                      ? t('buyer.cart.linePrice', {
                          price: item.product.price.toLocaleString(priceLocale, {
                            style: 'currency',
                            currency: 'EUR',
                          }),
                          unit: item.product.unit ?? '',
                        })
                      : t('buyer.cart.priceOnRequestWithUnit', {
                          unit: item.product.unit ?? '—',
                        })}
                  </Text>
                </View>

                {/* Quantity Controls */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.product.id, item.quantity - 1, item.lineKind)}
                    style={{ padding: theme.spacing.xs }}
                    accessibilityRole="button"
                    accessibilityLabel={t('buyer.cart.decreaseQty')}
                  >
                    <Minus size={18} color={theme.colors.text.primary} strokeWidth={1.5} />
                  </TouchableOpacity>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '400',
                    color: theme.colors.text.primary,
                    minWidth: 30,
                    textAlign: 'center',
                    letterSpacing: 0.5,
                  }}>
                    {item.quantity}
                  </Text>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.product.id, item.quantity + 1, item.lineKind)}
                    style={{ padding: theme.spacing.xs }}
                    accessibilityRole="button"
                    accessibilityLabel={t('buyer.cart.increaseQty')}
                  >
                    <Plus size={18} color={theme.colors.text.primary} strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>

                {/* Remove Button */}
                <TouchableOpacity
                  onPress={() => removeFromCart(item.product.id, item.lineKind)}
                  style={{ marginLeft: theme.spacing.md, padding: theme.spacing.xs }}
                  accessibilityRole="button"
                  accessibilityLabel={t('buyer.cart.removeItem')}
                >
                  <Trash2 size={18} color={theme.colors.error} strokeWidth={1} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={{
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.md,
        }}>
          <Text style={{
            fontSize: 13,
            fontWeight: '400',
            color: theme.colors.text.secondary,
            letterSpacing: 0.5,
          }}>
            {t('buyer.cart.total')}
          </Text>
          <Text style={{
            fontSize: 20,
            fontWeight: '400',
            color: theme.colors.text.primary,
            letterSpacing: 0.5,
          }}>
            {getTotalPrice().toLocaleString(priceLocale, { style: 'currency', currency: 'EUR' })}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleCheckout}
          style={{
            backgroundColor: theme.colors.primary,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.borderRadius.md,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: theme.spacing.sm,
          }}
        >
          <Text style={{
            fontSize: 14,
            fontWeight: '400',
            color: theme.colors.text.inverse,
            letterSpacing: 1,
          }}>
            {t('buyer.cart.checkout')}
          </Text>
          <ArrowRight size={18} color={theme.colors.text.inverse} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
