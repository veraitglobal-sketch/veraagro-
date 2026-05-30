import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { bioVeraScrollProps } from '../../../lib/scroll-view-props';
import EmptyState from '../../../components/EmptyState';
import { useAppLocaleTag } from '../../../lib/date-locale';
import type { BatchAvailability } from '../../../lib/api';
import type { EnhancedProduct } from './types';

type Props = {
  products: EnhancedProduct[];
  batchAvailabilities: Record<string, BatchAvailability>;
  refreshing: boolean;
  onRefresh: () => void;
  screenPaddingLeft: number;
  screenPaddingRight: number;
  onProductPress: (product: EnhancedProduct) => void;
  onReserve: (product: EnhancedProduct) => void;
};

export function ProductGrid({
  products,
  batchAvailabilities,
  refreshing,
  onRefresh,
  screenPaddingLeft,
  screenPaddingRight,
  onProductPress,
  onReserve,
}: Props) {
  const { t } = useTranslation();

  return (
    <FlatList
      data={products}
      numColumns={2}
      keyExtractor={(item) => item.id}
      style={bioVeraScrollProps.style}
      bounces={bioVeraScrollProps.bounces}
      overScrollMode={bioVeraScrollProps.overScrollMode}
      showsVerticalScrollIndicator={bioVeraScrollProps.showsVerticalScrollIndicator}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: theme.spacing.md,
        paddingLeft: screenPaddingLeft,
        paddingRight: screenPaddingRight,
        paddingBottom: 120,
      }}
      columnWrapperStyle={{ gap: theme.spacing.md }}
      ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.text.secondary}
          colors={[theme.colors.primary]}
        />
      }
      renderItem={({ item }) => (
        <ProductCard
          product={item}
          onPress={() => onProductPress(item)}
          availability={item.batchId ? batchAvailabilities[item.batchId] : null}
          onReserve={() => onReserve(item)}
        />
      )}
      ListEmptyComponent={<EmptyState message={t('buyer.dashboard.noProducts')} icon={Package} />}
    />
  );
}

function ProductCard({
  product,
  onPress,
  availability,
  onReserve,
}: {
  product: EnhancedProduct;
  onPress: () => void;
  availability: BatchAvailability | null;
  onReserve: () => void;
}) {
  const { t } = useTranslation();
  const priceLocale = useAppLocaleTag();
  const isSoldOut = availability?.isSoldOut || false;
  const reservedPercentage = availability?.reservedPercentage || 0;
  const availableQuantity = availability?.availableQuantity || product.availableQuantity || 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderWidth: 0.5,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        marginHorizontal: theme.spacing.xs,
      }}
    >
      <View style={{ width: '100%', height: 140, backgroundColor: '#f5f5f5' }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f0f0f0',
          }}
        >
          <Package size={32} color={theme.colors.text.tertiary} strokeWidth={1} />
        </View>
      </View>

      <View style={{ padding: theme.spacing.sm }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '400',
            color: theme.colors.text.primary,
            letterSpacing: 0.3,
            marginBottom: 4,
          }}
        >
          {product.productName}
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '400',
            color: theme.colors.text.secondary,
            textTransform: 'uppercase',
            opacity: 0.5,
            letterSpacing: 0.5,
            marginBottom: theme.spacing.xs,
          }}
        >
          {product.farmerName}
        </Text>

        {availability ? (
          <View style={{ marginBottom: theme.spacing.xs }}>
            <View
              style={{
                height: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${reservedPercentage}%`,
                  backgroundColor: theme.colors.primary,
                }}
              />
            </View>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '400',
                color: theme.colors.text.secondary,
                letterSpacing: 0.2,
                marginTop: 2,
              }}
            >
              {t('buyer.dashboard.unitsAvailable', {
                qty: availableQuantity,
                unit: product.unit || t('buyer.dashboard.unitsDefault'),
              })}
            </Text>
          </View>
        ) : null}

        {isSoldOut ? (
          <View
            style={{
              paddingVertical: 2,
              paddingHorizontal: 6,
              backgroundColor: theme.colors.surface,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.1)',
              borderRadius: 4,
              marginBottom: theme.spacing.xs,
              alignSelf: 'flex-start',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '400',
                color: theme.colors.text.secondary,
                letterSpacing: 0.3,
                textTransform: 'uppercase',
              }}
            >
              {t('buyer.dashboard.soldOut')}
            </Text>
          </View>
        ) : null}

        {product.price ? (
          <Text
            style={{
              fontSize: 14,
              fontWeight: '400',
              color: theme.colors.primary,
              letterSpacing: 0.3,
              marginTop: theme.spacing.xs,
            }}
          >
            {product.price.toLocaleString(priceLocale, { style: 'currency', currency: 'EUR' })}
          </Text>
        ) : null}

        {!isSoldOut && availability ? (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onReserve();
            }}
            style={{
              marginTop: theme.spacing.xs,
              paddingVertical: 6,
              paddingHorizontal: 8,
              borderWidth: 0.5,
              borderColor: theme.colors.primary,
              borderRadius: 4,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.primary, letterSpacing: 0.3 }}>
              {t('buyer.dashboard.reserve')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
