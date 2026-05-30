import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, MapPin, Plus, Minus, ShoppingCart } from 'lucide-react-native';
import { inventoryAPI, Product } from '../../lib/api';
import { theme } from '../../lib/theme';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { useAppLocaleTag } from '../../lib/date-locale';
import { useCart } from '../../hooks/useCart';

/**
 * Product Detail Screen
 * Elegant design with large image, origin story, and minimalist UI
 */
export default function ProductDetailScreen() {
  const { t } = useTranslation();
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const router = useRouter();
  const { addToCart } = useCart();
  const p = useBioVeraScreenPadding();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const isReservationMode = mode === 'reserve';
  const localeTag = useAppLocaleTag();

  const loadProduct = useCallback(async (opts?: { background?: boolean }) => {
    if (!id) {
      setProduct(null);
      setLoading(false);
      return;
    }
    const background = opts?.background === true;
    if (!background) setLoading(true);
    try {
      const products = await inventoryAPI.getAvailableProducts();
      const found = products.find((pRow) => pRow.id === id);
      setProduct(found || null);
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      if (!background) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadProduct({ background: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadProduct]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity, {
        lineKind: isReservationMode ? 'reservation' : 'purchase',
      });
      router.back();
    }
  };

  const getProductIcon = () => {
    if (!product) return '🌾';
    if (product.parcel?.cropType === 'Raspberry' || product.productName.includes('Malina'))
      return '🫐';
    if (product.parcel?.cropType === 'Pepper' || product.productName.includes('Paprika'))
      return '🌶️';
    return '🌾';
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          padding: theme.spacing.lg,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text
          style={{
            marginTop: theme.spacing.md,
            fontSize: 14,
            fontWeight: '400',
            color: theme.colors.text.secondary,
            textAlign: 'center',
          }}
        >
          {t('buyer.shop.loading')}
        </Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          padding: theme.spacing.lg,
        }}
      >
        <Text style={{ fontSize: 16, color: theme.colors.text.secondary, textAlign: 'center' }}>
          {t('buyer.productDetail.notFound')}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: theme.spacing.md, padding: theme.spacing.md }}
        >
          <Text style={{ fontSize: 14, color: theme.colors.primary }}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const farmerName = product.estate?.name || t('buyer.productDetail.farmerFallback');

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          paddingTop: p.headerTop,
          paddingLeft: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          paddingBottom: theme.spacing.md,
          backgroundColor: 'transparent',
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={20} color={theme.colors.text.inverse} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressViewOffset={p.topInset + 10}
          />
        }
      >
        {/* Large Product Image */}
        <View
          style={{
            width: '100%',
            height: 400,
            backgroundColor: theme.colors.primary + '15',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 120 }}>{getProductIcon()}</Text>
        </View>

        {/* Content */}
        <View style={{ padding: theme.spacing.lg }}>
          {/* Product Title */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: '400',
              letterSpacing: 4,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.xl,
              textTransform: 'uppercase',
            }}
          >
            {product.productName}
          </Text>

          {/* Price */}
          <View style={{ marginBottom: theme.spacing.xl }}>
            <Text
              style={{
                fontSize: 32,
                fontWeight: '400',
                color: theme.colors.text.primary,
                letterSpacing: 1,
              }}
            >
              {product.price
                ? product.price.toLocaleString(localeTag, { style: 'currency', currency: 'EUR' })
                : t('buyer.cart.priceOnRequest')}
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '400',
                color: theme.colors.text.secondary,
                marginTop: 4,
                letterSpacing: 0.5,
              }}
            >
              {t('buyer.productDetail.perUnitShort', { unit: product.unit })}
            </Text>
          </View>

          {/* Origin Story */}
          <View
            style={{
              marginBottom: theme.spacing.xl,
              paddingBottom: theme.spacing.lg,
              borderBottomWidth: 0.5,
              borderBottomColor: 'rgba(0, 0, 0, 0.1)',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                letterSpacing: 2,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.md,
                textTransform: 'uppercase',
              }}
            >
              {t('buyer.productDetail.originHeading')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
              <MapPin size={14} color={theme.colors.text.secondary} strokeWidth={1} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '400',
                  color: theme.colors.text.primary,
                  marginLeft: 6,
                  letterSpacing: 0.3,
                }}
              >
                {farmerName}
              </Text>
            </View>
            {product.estate?.location && (
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '400',
                  color: theme.colors.text.secondary,
                  marginLeft: 20,
                  letterSpacing: 0.3,
                }}
              >
                {product.estate.location}
              </Text>
            )}
          </View>

          {/* Product Details */}
          <View style={{ marginBottom: theme.spacing.xl }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                letterSpacing: 2,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.md,
                textTransform: 'uppercase',
              }}
            >
              {t('buyer.productDetail.detailsHeading')}
            </Text>
            <View style={{ gap: theme.spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.secondary }}>
                  {t('producer.orders.quantity')}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.primary }}>
                  {product.quantity} {product.unit}
                </Text>
              </View>
              {product.harvestDate && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.secondary }}>
                    {t('producer.batches.harvestLabel')}
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.primary }}>
                    {new Date(product.harvestDate).toLocaleDateString(localeTag)}
                  </Text>
                </View>
              )}
              {product.daysInConversion != null && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.secondary }}>
                    {t('buyer.productDetail.daysInConversion')}
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.primary }}>
                    {product.daysInConversion}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Quantity Selector */}
          <View
            style={{
              marginBottom: theme.spacing.xl,
              paddingBottom: theme.spacing.lg,
              borderBottomWidth: 0.5,
              borderBottomColor: 'rgba(0, 0, 0, 0.1)',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                letterSpacing: 2,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.md,
                textTransform: 'uppercase',
              }}
            >
              {t('producer.orders.quantity')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg }}>
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ padding: theme.spacing.sm }}
                accessibilityRole="button"
                accessibilityLabel={t('buyer.cart.decreaseQty')}
              >
                <Minus size={20} color={theme.colors.text.primary} strokeWidth={1.5} />
              </TouchableOpacity>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '400',
                  color: theme.colors.text.primary,
                  minWidth: 40,
                  textAlign: 'center',
                  letterSpacing: 1,
                }}
              >
                {quantity}
              </Text>
              <TouchableOpacity
                onPress={() => setQuantity(quantity + 1)}
                style={{ padding: theme.spacing.sm }}
                accessibilityRole="button"
                accessibilityLabel={t('buyer.cart.increaseQty')}
              >
                <Plus size={20} color={theme.colors.text.primary} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View
        style={{
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.background,
          borderTopWidth: 0.5,
          borderTopColor: 'rgba(0, 0, 0, 0.1)',
        }}
      >
        <TouchableOpacity
          onPress={handleAddToCart}
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
          <ShoppingCart size={18} color={theme.colors.text.inverse} strokeWidth={1.5} />
          <Text
            style={{
              fontSize: 14,
              fontWeight: '400',
              color: theme.colors.text.inverse,
              letterSpacing: 1,
            }}
          >
            {isReservationMode ? t('buyer.productDetail.reserveCta') : t('buyer.shop.addToCart')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
