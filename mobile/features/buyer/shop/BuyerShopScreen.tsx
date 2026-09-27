import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ShoppingCart, Sprout, Package, Apple, Carrot, Wheat, ChevronRight, Bell } from 'lucide-react-native';
import { inventoryAPI, Product, notificationsAPI } from '../../../lib/api';
import ProductCard from '../../../components/ProductCard';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorMessage from '../../../components/ErrorMessage';
import Card from '../../../components/ui/Card';
import { useCart } from '../../../hooks/useCart';
import { theme } from '../../../lib/theme';
import { bioVeraScrollProps, TAB_SCROLL_PADDING_BOTTOM } from '../../../lib/scroll-view-props';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import EmptyState from '../../../components/EmptyState';

/**
 * Buyer Shop Screen
 * Marketplace catalog with products
 * Light, appetizing design
 */
export default function ShopScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const { getTotalItems } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        try {
          const data = await notificationsAPI.getAll();
          const unread = Array.isArray(data) ? data.filter((n) => !n.read).length : 0;
          if (!cancelled) setUnreadNotifications(unread);
        } catch {
          if (!cancelled) setUnreadNotifications(0);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryAPI.getAvailableProducts();
      setProducts(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      setError(message || t('marketplace.errors.loadFailed'));
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    try {
      const notifData = await notificationsAPI.getAll();
      setUnreadNotifications(
        Array.isArray(notifData) ? notifData.filter((n) => !n.read).length : 0,
      );
    } catch {
      setUnreadNotifications(0);
    }
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView 
        {...bioVeraScrollProps}
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: TAB_SCROLL_PADDING_BOTTOM }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={p.topInset}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={{ padding: theme.spacing.md }}>
          {/* Header - Premium card */}
          <Card 
            variant="elevated" 
            padding="lg"
            style={{
              marginBottom: theme.spacing.lg,
              backgroundColor: `${theme.colors.primary}05`,
              borderWidth: 0.5,
              borderColor: `${theme.colors.primary}15`,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: theme.borderRadius.md,
                backgroundColor: `${theme.colors.primary}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: theme.spacing.md,
                borderWidth: 0.5,
                borderColor: `${theme.colors.primary}25`,
              }}>
                <Sprout size={24} color={theme.colors.primary} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '400',
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.xs,
                  letterSpacing: 0.5,
                }}>
                  {t('buyer.shop.title')}
                </Text>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '400',
                  color: theme.colors.text.secondary,
                  letterSpacing: 0.2,
                }}>
                  {t('buyer.shop.subtitle')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginLeft: 8 }}>
                <TouchableOpacity
                  onPress={() => router.push('/(buyer)/notifications')}
                  style={headerIconBtn}
                  accessibilityRole="button"
                  accessibilityLabel={t('notificationsCenter.title')}
                >
                  <Bell size={20} color={theme.colors.text.primary} strokeWidth={1.6} />
                  {unreadNotifications > 0 ? (
                    <View style={headerBadge}>
                      <Text style={headerBadgeText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
                {getTotalItems() > 0 ? (
                  <TouchableOpacity
                    onPress={() => router.push('/(buyer)/cart')}
                    style={[headerIconBtn, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}
                    accessibilityRole="button"
                    accessibilityLabel={t('buyer.cart.title', { defaultValue: 'Cart' })}
                  >
                    <ShoppingCart size={20} color={theme.colors.text.inverse} strokeWidth={1.6} />
                    <View style={headerBadge}>
                      <Text style={headerBadgeText}>{getTotalItems()}</Text>
                    </View>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </Card>

          {/* Category Filters */}
          <View style={{
            marginBottom: theme.spacing.lg,
            borderTopWidth: 0.5,
            borderBottomWidth: 0.5,
            borderColor: 'rgba(0, 0, 0, 0.1)',
            paddingVertical: theme.spacing.md,
          }}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: theme.spacing.sm, gap: theme.spacing.md }}
            >
              {(
                [
                  { id: 'fruits' as const, translationKey: 'marketplace.categories.fruits', icon: Apple, color: '#10B981' },
                  { id: 'vegetables' as const, translationKey: 'marketplace.categories.vegetables', icon: Carrot, color: '#10B981' },
                  { id: 'grains' as const, translationKey: 'marketplace.categories.grains', icon: Wheat, color: '#10B981' },
                ] as const
              ).map((category) => {
                const Icon = category.icon;
                return (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => router.push(`/products?category=${category.id}`)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.sm,
                      borderRadius: theme.borderRadius.md,
                      borderWidth: 0.5,
                      borderColor: 'rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'white',
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon size={20} color={category.color} strokeWidth={1.5} />
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '400',
                      color: category.color,
                      marginLeft: theme.spacing.sm,
                      letterSpacing: 0.3,
                    }}>
                      {t(category.translationKey)}
                    </Text>
                    <ChevronRight size={14} color={category.color} strokeWidth={1.5} style={{ marginLeft: theme.spacing.xs }} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

        {/* Products Grid */}
        {loading ? (
          <LoadingSpinner message={t('buyer.shop.loading')} />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadProducts} />
        ) : products.length === 0 ? (
          <EmptyState message={t('buyer.shop.noProducts')} icon={Package} />
        ) : (
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            justifyContent: 'space-between',
            gap: theme.spacing.md,
          }}>
            {products.map((product) => (
              <View key={product.id} style={{ width: '48%' }}>
                <ProductCard 
                  product={product} 
                  showActions={true} 
                  onPress={() => router.push(`/product/${product.id}`)} 
                />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
    </View>
  );
}

const headerIconBtn = {
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  backgroundColor: theme.colors.surface,
  borderWidth: 0.5,
  borderColor: theme.colors.border,
};
const headerBadge = {
  position: 'absolute' as const,
  top: -3,
  right: -3,
  minWidth: 18,
  height: 18,
  borderRadius: 9,
  backgroundColor: theme.colors.error,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  paddingHorizontal: 3,
};
const headerBadgeText = { fontSize: 11, fontWeight: '700' as const, color: '#fff' };
