import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, MapPin, Plus, Minus, ShoppingCart } from 'lucide-react-native';
import { inventoryAPI, catalogAPI, Product, CatalogPackOption } from '../../lib/api';
import { theme } from '../../lib/theme';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { useAppLocaleTag } from '../../lib/date-locale';
import { useCart } from '../../hooks/useCart';
import ErrorMessage from '../../components/ErrorMessage';
import { productEmoji } from '../../lib/product-emoji';

/**
 * Product Detail Screen
 * Elegant design with large image, origin story, and minimalist UI
 */
export default function ProductDetailScreen() {
  const { t } = useTranslation();
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const router = useRouter();
  const { addToCart, items, loading: cartLoading } = useCart();
  const p = useBioVeraScreenPadding();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedPack, setSelectedPack] = useState<CatalogPackOption | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadGeneration = useRef(0);
  const adding = useRef(false);
  const isReservationMode = mode === 'reserve';
  const localeTag = useAppLocaleTag();
  const isCatalog = product?.catalogProduct === true;
  const packId = selectedPack?.id;
  const inCart = items
    .filter((item) => item.product.id === id && (item.packOptionId ?? '') === (packId ?? ''))
    .reduce((sum, item) => sum + item.quantity, 0);
  const maxQuantity = isCatalog && selectedPack
    ? Math.max(0, selectedPack.maxPacks - inCart)
    : Math.max(0, Number(product?.quantity) - inCart) || 0;
  const lineTotal = isCatalog && selectedPack
    ? selectedPack.pricePerPack * quantity
    : (product?.price ?? 0) * quantity;
  const canAdd = !cartLoading && !error && !!product && Number.isFinite(maxQuantity) &&
    quantity > 0 && quantity <= maxQuantity && (!isCatalog || !!selectedPack);

  const loadProduct = useCallback(async (opts?: { background?: boolean }) => {
    const generation = ++loadGeneration.current;
    if (!id) {
      setProduct(null);
      setLoading(false);
      return;
    }
    const background = opts?.background === true;
    if (!background) setLoading(true);
    setError(null);
    try {
      try {
        const catalog = await catalogAPI.getProduct(id);
        if (generation !== loadGeneration.current) return;
        const mapped: Product = {
          id: catalog.id,
          productName: catalog.productName,
          quantity: catalog.availableKg,
          unit: catalog.unit,
          catalogProduct: true,
          availableKg: catalog.availableKg,
          availableUntil: catalog.availableUntil,
          packOptions: catalog.packOptions,
          price: catalog.packOptions[0]?.pricePerKg,
          estate: catalog.estate ?? { id: 'unknown', name: 'Farm' },
        };
        setProduct(mapped);
        setSelectedPack(catalog.packOptions[0] ?? null);
        setQuantity(1);
        return;
      } catch {
        // Not a catalogue product — fall back to inventory list.
      }
      const products = await inventoryAPI.getAvailableProducts();
      if (generation !== loadGeneration.current) return;
      const found = products.find((pRow) => pRow.id === id);
      setProduct(found || null);
      setSelectedPack(null);
      setQuantity((current) => Math.min(current, Math.max(0, Number(found?.quantity) || 0)));
    } catch {
      if (generation === loadGeneration.current) setError(t('buyer.dashboard.loadFailed'));
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
  }, [id, t]);

  useFocusEffect(useCallback(() => {
    adding.current = false;
    setQuantity(1);
    setProduct(null);
    void loadProduct();
    return () => { loadGeneration.current++; };
  }, [loadProduct]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadProduct({ background: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadProduct]);

  const handleAddToCart = () => {
    if (product && canAdd && !adding.current) {
      adding.current = true;
      addToCart(product, quantity, {
        lineKind: isReservationMode ? 'reservation' : 'purchase',
        ...(isCatalog && selectedPack
          ? {
              packOptionId: selectedPack.id,
              packLabel: selectedPack.label,
              packSizeKg: selectedPack.packSizeKg,
              pricePerPack: selectedPack.pricePerPack,
            }
          : {}),
      });
      router.push('/(buyer)/cart');
    }
  };

  const getProductIcon = () => productEmoji(product);

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

  if (!product || error) {
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
        {error ? <ErrorMessage message={error} onRetry={() => void loadProduct()} /> : <Text style={{ fontSize: 16, color: theme.colors.text.secondary, textAlign: 'center' }}>
          {t('buyer.productDetail.notFound')}
        </Text>}
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

          {isCatalog && product.packOptions && product.packOptions.length > 0 ? (
            <View style={{ marginBottom: theme.spacing.xl }}>
              <Text style={{ fontSize: 14, fontWeight: '500', letterSpacing: 2, color: theme.colors.text.secondary, marginBottom: theme.spacing.md, textTransform: 'uppercase' }}>
                {t('buyer.marketplace.packaging')}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
                {product.packOptions.map((pack) => {
                  const active = selectedPack?.id === pack.id;
                  return (
                    <TouchableOpacity
                      key={pack.id}
                      onPress={() => { setSelectedPack(pack); setQuantity(1); }}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderRadius: theme.borderRadius.md,
                        borderWidth: 1,
                        borderColor: active ? theme.colors.primary : 'rgba(0,0,0,0.12)',
                        backgroundColor: active ? theme.colors.primary + '12' : theme.colors.background,
                      }}
                    >
                      <Text style={{ fontSize: 13, color: theme.colors.text.primary }}>{pack.label}</Text>
                      <Text style={{ fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 }}>
                        {pack.pricePerPack.toLocaleString(localeTag, { style: 'currency', currency: 'EUR' })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {product.availableUntil ? (
                <Text style={{ marginTop: theme.spacing.sm, fontSize: 12, color: theme.colors.text.secondary }}>
                  {t('buyer.marketplace.availableUntil', { date: new Date(product.availableUntil).toLocaleDateString(localeTag) })}
                </Text>
              ) : null}
              {selectedPack ? (
                <Text style={{ marginTop: theme.spacing.sm, fontSize: 13, color: theme.colors.text.primary }}>
                  {t('buyer.marketplace.lineTotal', {
                    count: quantity,
                    label: selectedPack.label,
                    kg: quantity * selectedPack.packSizeKg,
                    total: lineTotal.toLocaleString(localeTag, { style: 'currency', currency: 'EUR' }),
                  })}
                </Text>
              ) : null}
            </View>
          ) : null}

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
                onPress={() => setQuantity(Math.max(Math.min(1, maxQuantity), quantity - 1))}
                disabled={quantity <= Math.min(1, maxQuantity)}
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
                onPress={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                disabled={quantity >= maxQuantity || cartLoading}
                style={{ padding: theme.spacing.sm }}
                accessibilityRole="button"
                accessibilityLabel={t('buyer.cart.increaseQty')}
              >
                <Plus size={20} color={theme.colors.text.primary} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: theme.colors.text.secondary, marginTop: theme.spacing.sm }}>
              {isCatalog && selectedPack
                ? t('buyer.productDetail.remainingPacks', {
                    packs: maxQuantity,
                    kg: (maxQuantity * selectedPack.packSizeKg).toLocaleString(localeTag, {
                      maximumFractionDigits: 1,
                    }),
                  })
                : t('buyer.productDetail.remainingToAdd', { quantity: maxQuantity, unit: product.unit })}
            </Text>
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
          disabled={!canAdd}
          style={{
            backgroundColor: theme.colors.primary,
            opacity: canAdd ? 1 : 0.5,
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
