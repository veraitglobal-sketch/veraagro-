import { View, Text, FlatList, TouchableOpacity, ScrollView, RefreshControl, Modal } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { QrCode, Package, X, Truck } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { inventoryAPI, Product, batchesAPI, BatchAvailability } from '../../lib/api';
import { theme } from '../../lib/theme';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import ProductPassport from '../../components/ProductPassport';
import ReservationModal from '../../components/ReservationModal';

type FilterStatus = 'all' | 'available_now' | 'incoming' | 'reservations';

interface EnhancedProduct extends Omit<Product, 'harvestDate'> {
  expectedDeliveryDate?: string;
  farmerTrustScore?: number;
  farmerName?: string;
  harvestDate?: string;
  availableQuantity?: number;
  totalQuantity?: number;
  status?: 'available_now' | 'incoming' | 'reservations';
}

interface FieldStory {
  id: string;
  farmerName: string;
  location: string;
  activity: string;
  thumbnail?: string;
}


/**
 * Buyer Dashboard with Central QR Focus
 * Stories, Catalog, QR Scanner, Order Pulse
 */
export default function BuyerDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedBatchId, setScannedBatchId] = useState<string | null>(null);
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [batchAvailabilities, setBatchAvailabilities] = useState<Record<string, BatchAvailability>>({});
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<EnhancedProduct | null>(null);

  // Mock field stories - in production, fetch from backend
  const fieldStories: FieldStory[] = [
  { id: '1', farmerName: 'Marko', location: 'Central region', activity: 'Harvest' },
  { id: '2', farmerName: 'Petar', location: 'North plain', activity: 'Quality Check' },
  { id: '3', farmerName: 'Jovan', location: 'National', activity: 'Loading' },
  { id: '4', farmerName: 'Milan', location: 'Eastern region', activity: 'Harvest' },
  ];

  // Mock active delivery
  const activeDelivery = {
    orderNumber: '#2104',
    location: 'Hungary',
    status: 'In Transit',
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryAPI.getAvailableProducts();
      
      // Enhance products with calculated fields
      const enhanced = data.map((product): EnhancedProduct => {
        const harvestDate = product.harvestDate ? new Date(product.harvestDate) : null;
        const now = new Date();
        const daysUntilHarvest = harvestDate 
          ? Math.ceil((harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        
        const expectedDelivery = harvestDate 
          ? new Date(harvestDate.getTime() + 3 * 24 * 60 * 60 * 1000)
          : null;
        
        let status: 'available_now' | 'incoming' | 'reservations' = 'available_now';
        if (daysUntilHarvest !== null) {
          if (daysUntilHarvest <= 0) {
            status = 'available_now';
          } else if (daysUntilHarvest <= 7) {
            status = 'incoming';
          } else if (daysUntilHarvest <= 14) {
            status = 'reservations';
          }
        }

        return {
          ...product,
          expectedDeliveryDate: expectedDelivery?.toISOString(),
          farmerTrustScore: product.estate?.owner ? 75 : 50,
          farmerName: product.estate?.owner 
            ? `${product.estate.owner.firstName} ${product.estate.owner.lastName}`
            : product.estate?.name || 'Unknown',
          harvestDate: product.harvestDate,
          availableQuantity: product.quantity,
          totalQuantity: product.quantity,
          status,
        };
      });

      setProducts(enhanced);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    await loadBatchAvailabilities();
    setRefreshing(false);
  };

  const loadBatchAvailabilities = async () => {
    const availabilities: Record<string, BatchAvailability> = {};
    
    for (const product of products) {
      if (product.batchId) {
        try {
          const availability = await batchesAPI.getAvailability(product.batchId);
          availabilities[product.batchId] = availability;
        } catch (error) {
          console.warn(`Failed to load availability for batch ${product.batchId}:`, error);
        }
      }
    }
    
    setBatchAvailabilities(availabilities);
  };

  const handleQRPress = async () => {
    if (!cameraPermission) {
      await requestCameraPermission();
      return;
    }
    if (!cameraPermission.granted) {
      await requestCameraPermission();
      return;
    }
    setShowQRScanner(true);
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    // Close scanner
    setShowQRScanner(false);
    
    // Extract batchId from QR code (could be just the batchId or full URL)
    // For now, assume data is the batchId directly
    const batchId = data.trim();
    
    // Set batchId and show passport modal
    setScannedBatchId(batchId);
    setShowPassportModal(true);
  };

  // Filter products by status
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (activeFilter !== 'all') {
      filtered = products.filter(p => p.status === activeFilter);
    }

    return filtered.sort((a, b) => {
      const dateA = a.expectedDeliveryDate ? new Date(a.expectedDeliveryDate).getTime() : Infinity;
      const dateB = b.expectedDeliveryDate ? new Date(b.expectedDeliveryDate).getTime() : Infinity;
      
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      
      const scoreA = a.farmerTrustScore || 0;
      const scoreB = b.farmerTrustScore || 0;
      return scoreB - scoreA;
    });
  }, [products, activeFilter]);

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

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: 60,
        paddingBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '300',
          color: theme.colors.text.primary,
          letterSpacing: 1,
        }}>
          Marketplace
        </Text>
      </View>

      {/* Stories Section */}
      <View style={{
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
      }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.md, gap: theme.spacing.md }}
        >
          {fieldStories.map((story) => (
            <TouchableOpacity
              key={story.id}
              activeOpacity={0.7}
              style={{ alignItems: 'center', width: 80 }}
            >
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                backgroundColor: theme.colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: theme.spacing.xs,
              }}>
                <Package size={24} color={theme.colors.text.secondary} strokeWidth={1} />
              </View>
              <Text style={{
                fontSize: 10,
                fontWeight: '300',
                color: theme.colors.text.secondary,
                textAlign: 'center',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}>
                {story.farmerName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Horizontal Filters */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
        gap: theme.spacing.md,
      }}>
        {(['all', 'available_now', 'incoming', 'reservations'] as FilterStatus[]).map((filter) => {
          const labels: Record<FilterStatus, string> = {
            all: 'All',
            available_now: 'Available Now',
            incoming: 'Incoming',
            reservations: 'Reservations',
          };
          
          const isActive = activeFilter === filter;
          
          return (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={{
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
                borderBottomWidth: isActive ? 1 : 0,
                borderBottomColor: theme.colors.primary,
              }}
            >
              <Text style={{
                fontSize: 11,
                fontWeight: isActive ? '400' : '300',
                color: isActive ? theme.colors.primary : theme.colors.text.secondary,
                letterSpacing: 0.5,
              }}>
                {labels[filter]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Products Grid */}
      {loading ? (
        <LoadingSpinner message="Loading products..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadProducts} />
      ) : (
        <FlatList
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ 
            padding: theme.spacing.md,
            paddingBottom: 120, // Space for QR button and order pulse
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
              onPress={() => handleProductPress(item)}
              availability={item.batchId ? batchAvailabilities[item.batchId] : null}
              onReserve={() => {
                setSelectedProduct(item);
                setShowReservationModal(true);
              }}
            />
          )}
          ListEmptyComponent={
            <View style={{
              padding: theme.spacing.xl,
              alignItems: 'center',
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '300',
                color: theme.colors.text.secondary,
              }}>
                No products found
              </Text>
            </View>
          }
        />
      )}

      {/* Central QR Button - Floating */}
      <TouchableOpacity
        onPress={handleQRPress}
        activeOpacity={0.8}
        style={{
          position: 'absolute',
          bottom: 60,
          alignSelf: 'center',
          width: 64,
          height: 64,
          borderRadius: 32,
          borderWidth: 0.5,
          borderColor: 'rgba(45, 90, 39, 0.3)', // emerald-900/30
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          alignItems: 'center',
          justifyContent: 'center',
          ...theme.shadows.lg,
        }}
      >
        <QrCode size={28} color={theme.colors.primary} strokeWidth={1} />
      </TouchableOpacity>

      {/* Order Pulse - Bottom Status Bar */}
      {activeDelivery && (
        <View style={{
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
        }}>
          <Truck size={14} color={theme.colors.text.secondary} strokeWidth={1} />
          <Text style={{
            fontSize: 10,
            fontWeight: '300',
            color: theme.colors.text.secondary,
            letterSpacing: 0.3,
          }}>
            Delivery {activeDelivery.orderNumber} is currently in {activeDelivery.location}
          </Text>
        </View>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && cameraPermission?.granted && (
        <Modal
          visible={showQRScanner}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowQRScanner(false)}
        >
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'ean13', 'ean8', 'code128'],
              }}
            >
              <View style={{
                flex: 1,
                backgroundColor: 'transparent',
                justifyContent: 'space-between',
              }}>
                {/* Top Bar */}
                <View style={{
                  paddingTop: 60,
                  paddingHorizontal: theme.spacing.lg,
                  paddingBottom: theme.spacing.md,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '300',
                    color: theme.colors.text.inverse,
                    letterSpacing: 0.5,
                  }}>
                    Scan Bio Vera Code
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowQRScanner(false)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={20} color={theme.colors.text.inverse} strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>

                {/* Scanning Frame */}
                <View style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <View style={{
                    width: 250,
                    height: 250,
                    borderWidth: 0.5,
                    borderColor: theme.colors.primary,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: 'transparent',
                  }} />
                </View>

                {/* Bottom Info */}
                <View style={{
                  padding: theme.spacing.lg,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  alignItems: 'center',
                }}>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '300',
                    color: theme.colors.text.inverse,
                    textAlign: 'center',
                    letterSpacing: 0.3,
                  }}>
                    Position QR code within the frame
                  </Text>
                </View>
              </View>
            </CameraView>
          </View>
        </Modal>
      )}

      {/* Product Passport Modal */}
      <ProductPassport
        visible={showPassportModal}
        batchId={scannedBatchId}
        onClose={() => {
          setShowPassportModal(false);
          setScannedBatchId(null);
        }}
      />

      {/* Reservation Modal */}
      <ReservationModal
        visible={showReservationModal}
        product={selectedProduct}
        availability={selectedProduct?.batchId ? batchAvailabilities[selectedProduct.batchId] : null}
        onClose={() => {
          setShowReservationModal(false);
          setSelectedProduct(null);
        }}
        onSuccess={() => {
          // Reload availabilities after successful reservation
          loadBatchAvailabilities();
        }}
      />
    </View>
  );
}

/**
 * Minimalist Product Card
 * Ultra-thin fonts, small sizes, thin borders
 */
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
      {/* Product Image */}
      <View style={{ 
        width: '100%', 
        height: 140, 
        backgroundColor: '#f5f5f5',
      }}>
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f0f0f0',
        }}>
          <Package size={32} color={theme.colors.text.tertiary} strokeWidth={1} />
        </View>
      </View>

      {/* Product Info */}
      <View style={{ padding: theme.spacing.sm }}>
        {/* Title */}
        <Text style={{
          fontSize: 12,
          fontWeight: '300',
          color: theme.colors.text.primary,
          letterSpacing: 0.3,
          marginBottom: 4,
        }}>
          {product.productName}
        </Text>

        {/* Farmer Badge */}
        <Text style={{
          fontSize: 9,
          fontWeight: '300',
          color: theme.colors.text.secondary,
          textTransform: 'uppercase',
          opacity: 0.5,
          letterSpacing: 0.5,
          marginBottom: theme.spacing.xs,
        }}>
          {product.farmerName}
        </Text>

        {/* Progress Bar - Reservation Status */}
        {availability && (
          <View style={{ marginBottom: theme.spacing.xs }}>
            <View style={{
              height: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              borderRadius: 1,
              overflow: 'hidden',
            }}>
              <View style={{
                height: '100%',
                width: `${reservedPercentage}%`,
                backgroundColor: theme.colors.primary,
              }} />
            </View>
            <Text style={{
              fontSize: 8,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              letterSpacing: 0.2,
              marginTop: 2,
            }}>
              {availableQuantity} {product.unit || 'units'} available
            </Text>
          </View>
        )}

        {/* Sold Out Badge */}
        {isSoldOut && (
          <View style={{
            paddingVertical: 2,
            paddingHorizontal: 6,
            backgroundColor: theme.colors.surface,
            borderWidth: 0.5,
            borderColor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: 4,
            marginBottom: theme.spacing.xs,
            alignSelf: 'flex-start',
          }}>
            <Text style={{
              fontSize: 8,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              letterSpacing: 0.3,
              textTransform: 'uppercase',
            }}>
              Sold Out - Next Harvest Coming Soon
            </Text>
          </View>
        )}

        {/* Price */}
        {product.price && (
          <Text style={{
            fontSize: 12,
            fontWeight: '300',
            color: theme.colors.primary,
            letterSpacing: 0.3,
            marginTop: theme.spacing.xs,
          }}>
            {product.price.toLocaleString('en-US', { style: 'currency', currency: 'EUR' })}
          </Text>
        )}

        {/* Reserve Button */}
        {!isSoldOut && availability && (
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
            <Text style={{
              fontSize: 10,
              fontWeight: '300',
              color: theme.colors.primary,
              letterSpacing: 0.3,
            }}>
              Reserve crates
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}
