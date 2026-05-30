import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { QrCode, Package, Truck, Bell } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorMessage from '../../../components/ErrorMessage';
import ProductPassport from '../../../components/ProductPassport';
import ReservationModal from '../../../components/ReservationModal';
import { useBuyerDashboardData } from './useBuyerDashboardData';
import { ProductGrid } from './ProductGrid';
import { QRScannerModal } from './QRScannerModal';
import type { EnhancedProduct, FilterStatus } from './types';

export default function BuyerDashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();
  const data = useBuyerDashboardData();

  const handleProductPress = (product: EnhancedProduct) => {
    if (product.status === 'incoming' || product.status === 'reservations') {
      router.push({
        pathname: '/product/[id]',
        params: { id: product.id, mode: 'reserve' },
      });
    } else {
      router.push(`/product/${product.id}`);
    }
  };

  const filterLabels: Record<FilterStatus, string> = {
    all: t('buyer.dashboard.filterAll'),
    available_now: t('buyer.dashboard.filterAvailableNow'),
    incoming: t('buyer.dashboard.filterIncoming'),
    reservations: t('buyer.dashboard.filterReservations'),
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          paddingTop: p.headerTop,
          paddingBottom: theme.spacing.md,
          paddingLeft: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          backgroundColor: theme.colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(0, 0, 0, 0.08)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: '400',
            color: theme.colors.text.primary,
            letterSpacing: 1,
            flex: 1,
          }}
        >
          {t('marketplace.title')}
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(buyer)/notifications')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('notificationsCenter.title')}
          style={{ padding: theme.spacing.xs }}
        >
          <View style={{ position: 'relative' }}>
            <Bell size={22} color={theme.colors.text.primary} strokeWidth={1.5} />
            {data.unreadNotifications > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -6,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: theme.colors.error,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 4,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.background }}>
                  {data.unreadNotifications > 9 ? '9+' : data.unreadNotifications}
                </Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      </View>

      <View
        style={{
          paddingVertical: theme.spacing.md,
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(0, 0, 0, 0.05)',
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
            gap: theme.spacing.md,
          }}
        >
          {data.fieldStories.map((story) => (
            <TouchableOpacity key={story.id} activeOpacity={0.7} style={{ alignItems: 'center', width: 88 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  borderWidth: 0.5,
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                  backgroundColor: theme.colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: theme.spacing.xs,
                }}
              >
                <Package size={24} color={theme.colors.text.secondary} strokeWidth={1} />
              </View>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '400',
                  color: theme.colors.text.secondary,
                  textAlign: 'center',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                {story.farmerName}
              </Text>
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 13,
                  fontWeight: '400',
                  color: theme.colors.text.tertiary,
                  textAlign: 'center',
                  letterSpacing: 0.2,
                  marginTop: 2,
                  lineHeight: 12,
                }}
              >
                {story.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View
        style={{
          flexDirection: 'row',
          paddingLeft: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          paddingVertical: theme.spacing.sm,
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(0, 0, 0, 0.05)',
          gap: theme.spacing.md,
        }}
      >
        {(['all', 'available_now', 'incoming', 'reservations'] as FilterStatus[]).map((filter) => {
          const isActive = data.activeFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              onPress={() => data.setActiveFilter(filter)}
              style={{
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
                borderBottomWidth: isActive ? 1 : 0,
                borderBottomColor: theme.colors.primary,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: isActive ? '400' : '300',
                  color: isActive ? theme.colors.primary : theme.colors.text.secondary,
                  letterSpacing: 0.5,
                }}
              >
                {filterLabels[filter]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {data.loading ? (
        <LoadingSpinner message={t('buyer.shop.loading')} />
      ) : data.error ? (
        <ErrorMessage message={data.error} onRetry={() => void data.loadProducts()} />
      ) : (
        <ProductGrid
          products={data.filteredProducts}
          batchAvailabilities={data.batchAvailabilities}
          refreshing={data.refreshing}
          onRefresh={() => void data.onRefresh()}
          screenPaddingLeft={p.screenPaddingLeft}
          screenPaddingRight={p.screenPaddingRight}
          onProductPress={handleProductPress}
          onReserve={(product) => {
            data.setSelectedProduct(product);
            data.setShowReservationModal(true);
          }}
        />
      )}

      <TouchableOpacity
        onPress={() => void data.handleQRPress()}
        activeOpacity={0.8}
        style={{
          position: 'absolute',
          bottom: 60,
          alignSelf: 'center',
          width: 64,
          height: 64,
          borderRadius: 32,
          borderWidth: 0.5,
          borderColor: 'rgba(45, 90, 39, 0.3)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          alignItems: 'center',
          justifyContent: 'center',
          ...theme.shadows.lg,
        }}
      >
        <QrCode size={28} color={theme.colors.primary} strokeWidth={1} />
      </TouchableOpacity>

      {data.activeDelivery ? (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            backgroundColor: theme.colors.surface,
            borderTopWidth: 0.5,
            borderTopColor: 'rgba(0, 0, 0, 0.08)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
          }}
        >
          <Truck size={14} color={theme.colors.text.secondary} strokeWidth={1} />
          <Text
            style={{
              fontSize: 13,
              fontWeight: '400',
              color: theme.colors.text.secondary,
              letterSpacing: 0.3,
            }}
          >
            {t('buyer.dashboard.deliveryPulse', {
              orderNumber: data.activeDelivery.orderNumber,
              location: data.activeDelivery.location,
            })}
          </Text>
        </View>
      ) : null}

      {data.cameraPermission?.granted ? (
        <QRScannerModal
          visible={data.showQRScanner}
          headerTop={p.headerTop}
          screenPaddingLeft={p.screenPaddingLeft}
          screenPaddingRight={p.screenPaddingRight}
          onClose={() => data.setShowQRScanner(false)}
          onBarcodeScanned={data.handleBarcodeScanned}
        />
      ) : null}

      <ProductPassport
        visible={data.showPassportModal}
        batchId={data.scannedBatchId}
        onClose={() => {
          data.setShowPassportModal(false);
          data.setScannedBatchId(null);
        }}
      />

      <ReservationModal
        visible={data.showReservationModal}
        product={data.selectedProduct}
        availability={
          data.selectedProduct?.batchId ? data.batchAvailabilities[data.selectedProduct.batchId] : null
        }
        onClose={() => {
          data.setShowReservationModal(false);
          data.setSelectedProduct(null);
        }}
        onSuccess={() => {
          void data.loadBatchAvailabilities(data.products);
        }}
      />
    </View>
  );
}
