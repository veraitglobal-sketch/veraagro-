import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
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
import { useCartCatalogue } from '../../hooks/useCartCatalogue';
import { cartLineTotalEur } from '../../lib/cart-catalogue';

/**
 * Shopping Cart Screen
 * Minimalist design with thin lines and simple quantity controls
 */
export default function CartScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useBioVeraScreenPadding();
  const priceLocale = useAppLocaleTag();
  const { items, changeQuantity, removeFromCart, getTotalPrice, reloadCart, loading } = useCart();
  const [refreshing, setRefreshing] = useState(false);
  const catalogue = useCartCatalogue();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([reloadCart(), catalogue.reload()]);
    } finally {
      setRefreshing(false);
    }
  }, [reloadCart, catalogue.reload]);

  const handleCheckout = () => {
    if (items.length > 0 && !catalogue.blocked) {
      router.push('/(buyer)/checkout');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, paddingTop: insets.topInset, backgroundColor: theme.colors.background }}>
        <EmptyState message={t('buyer.cart.empty')} icon={ShoppingBag} />
        <TouchableOpacity onPress={() => router.replace('/(buyer)')} style={{ padding: theme.spacing.lg, alignItems: 'center' }}>
          <Text style={{ color: theme.colors.primary }}>{t('buyer.cartReview.backToShop')}</Text>
        </TouchableOpacity>
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
          <Text style={{ color: theme.colors.text.secondary, marginBottom: theme.spacing.md }}>
            {t(catalogue.loading ? 'buyer.cartReview.checking' : catalogue.pricesChanged ? 'buyer.cartReview.pricesChanged' : 'buyer.cartReview.stockHint')}
          </Text>
          {catalogue.failed ? (
            <TouchableOpacity onPress={() => void catalogue.reload()} style={{ paddingVertical: theme.spacing.md }}>
              <Text style={{ color: theme.colors.error }}>{t('buyer.cartReview.loadFailed')}</Text>
            </TouchableOpacity>
          ) : null}
          {items.map((item) => {
            const catalogPack = item.packOptionId
              ? catalogue.ctx.catalogProducts
                  .find((p) => p.id === item.product.id)
                  ?.packOptions.find((o) => o.id === item.packOptionId)
              : undefined;
            const lineTotal = cartLineTotalEur(item);
            const lineKey = `${item.product.id}-${item.lineKind}-${item.packOptionId ?? ''}`;
            return (
            <View key={lineKey}>
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                paddingVertical: theme.spacing.lg,
                borderBottomWidth: 0.5,
                borderBottomColor: 'rgba(0, 0, 0, 0.1)',
              }}>
                {/* Product Info */}
                <View style={{ width: '100%', marginBottom: theme.spacing.md }}>
                  <TouchableOpacity accessibilityRole="button" onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.product.id, ...(item.lineKind === 'reservation' ? { mode: 'reserve' } : {}) } })}>
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
                  </TouchableOpacity>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '400',
                    color: theme.colors.text.secondary,
                    letterSpacing: 0.2,
                  }}>
                    {item.packOptionId && item.packLabel && item.pricePerPack
                      ? t('buyer.cart.packLine', {
                          defaultValue: '{{count}} × {{label}} · {{packPrice}} = {{total}}',
                          count: item.quantity,
                          label: item.packLabel,
                          packPrice: item.pricePerPack.toLocaleString(priceLocale, { style: 'currency', currency: 'EUR' }),
                          total: (lineTotal ?? 0).toLocaleString(priceLocale, { style: 'currency', currency: 'EUR' }),
                        })
                      : item.product.price != null && item.product.price > 0
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
                  {!catalogue.loading && !catalogue.failed && catalogue.issueFor(item) ? (
                    <Text style={{ color: theme.colors.error, marginTop: theme.spacing.xs }}>
                      {t(`buyer.cartReview.${catalogue.issueFor(item)}`, { quantity: item.product.quantity, unit: item.product.unit })}
                    </Text>
                  ) : null}
                  {item.checkoutKey ? <Text style={{ color: theme.colors.text.secondary }}>{t('buyer.cartReview.retryHint')}</Text> : null}
                </View>

                {/* Quantity Controls */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
                  <TouchableOpacity
                    onPress={() => changeQuantity(item.product.id, -1, item.lineKind, item.packOptionId)}
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
                    disabled={!item.checkoutKey && (catalogue.loading || catalogue.failed || !!catalogue.issueFor(item) || (() => {
                      const used = items.filter(line => line.product.id === item.product.id && line.packOptionId === item.packOptionId && !line.checkoutKey).reduce((sum, line) => sum + line.quantity, 0);
                      const max = catalogPack?.maxPacks ?? Number(item.product.quantity);
                      return used >= max;
                    })())}
                    onPress={() => {
                      const used = items.filter(line => line.product.id === item.product.id && line.packOptionId === item.packOptionId && !line.checkoutKey).reduce((sum, line) => sum + line.quantity, 0);
                      const max = catalogPack?.maxPacks ?? Number(item.product.quantity);
                      const remaining = max - used;
                      if (item.checkoutKey || remaining > 0) changeQuantity(item.product.id, item.checkoutKey ? 1 : Math.min(1, remaining), item.lineKind, item.packOptionId);
                    }}
                    style={{ padding: theme.spacing.xs }}
                    accessibilityRole="button"
                    accessibilityLabel={t('buyer.cart.increaseQty')}
                  >
                    <Plus size={18} color={theme.colors.text.primary} strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>

                {/* Remove Button */}
                <TouchableOpacity
                  onPress={() => removeFromCart(item.product.id, item.lineKind, item.packOptionId)}
                  style={{ marginLeft: 'auto', padding: theme.spacing.xs }}
                  accessibilityRole="button"
                  accessibilityLabel={t('buyer.cart.removeItem')}
                >
                  <Trash2 size={18} color={theme.colors.error} strokeWidth={1} />
                </TouchableOpacity>
              </View>
            </View>
          );})}
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
            {items.some(item => cartLineTotalEur(item) == null)
              ? t('buyer.cartReview.totalIncomplete')
              : getTotalPrice().toLocaleString(priceLocale, { style: 'currency', currency: 'EUR' })}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleCheckout}
          disabled={catalogue.blocked}
          style={{
            backgroundColor: theme.colors.primary,
            opacity: catalogue.blocked ? 0.5 : 1,
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
            {t('buyer.cartReview.checkoutCta')}
          </Text>
          <ArrowRight size={18} color={theme.colors.text.inverse} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
