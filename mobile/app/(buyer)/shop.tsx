import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ShoppingCart, Sprout, Package, Apple, Carrot, Wheat, ChevronRight } from 'lucide-react-native';
import { inventoryAPI, Product } from '../../lib/api';
import ProductCard from '../../components/ProductCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Card from '../../components/ui/Card';
import { useCart } from '../../hooks/useCart';
import { theme } from '../../lib/theme';

/**
 * Buyer Shop Screen
 * Marketplace catalog with products
 * Light, appetizing design
 */
export default function ShopScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { getTotalItems } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryAPI.getAvailableProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || t('marketplace.errors.loadFailed'));
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Cart Button */}
      {getTotalItems() > 0 && (
        <TouchableOpacity
          onPress={() => router.push('/(buyer)/cart')}
          style={{
            position: 'absolute',
            top: 60,
            right: theme.spacing.lg,
            zIndex: 10,
            backgroundColor: theme.colors.primary,
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.shadows.md,
          }}
        >
          <ShoppingCart size={22} color={theme.colors.text.inverse} strokeWidth={1.5} />
          {getTotalItems() > 0 && (
            <View style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: theme.colors.error,
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
            }}>
              <Text style={{
                fontSize: 11,
                fontWeight: '500',
                color: theme.colors.text.inverse,
              }}>
                {getTotalItems()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      <ScrollView 
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
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
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.xs,
                  letterSpacing: 0.5,
                }}>
                  Bio Vera Marketplace
                </Text>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: theme.colors.text.secondary,
                  letterSpacing: 0.2,
                }}>
                  {t('buyer.shop.subtitle') || 'Premium organic products'}
                </Text>
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
              {[
                { id: 'fruits', name: 'Fruits', icon: Apple, color: '#10B981' },
                { id: 'vegetables', name: 'Vegetables', icon: Carrot, color: '#10B981' },
                { id: 'grains', name: 'Grains', icon: Wheat, color: '#10B981' },
              ].map((category) => {
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
                      fontWeight: '300',
                      color: category.color,
                      marginLeft: theme.spacing.sm,
                      letterSpacing: 0.3,
                    }}>
                      {category.name}
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
          <Card 
            variant="outlined" 
            padding="xl"
            style={{
              alignItems: 'center',
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.05)',
            }}
          >
            <View style={{
              width: 64,
              height: 64,
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.surface,
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
              {t('buyer.shop.noProducts') || 'No products available'}
            </Text>
          </Card>
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
