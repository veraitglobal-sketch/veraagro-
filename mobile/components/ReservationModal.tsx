import { View, Text, Modal, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X, Plus, Minus } from 'lucide-react-native';
import { theme } from '../lib/theme';
import { ordersAPI } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const LAST_DELIVERY_KEY = 'buyer_last_delivery';

interface ReservationModalProps {
  visible: boolean;
  product: {
    id: string;
    batchId?: string;
    productName: string;
    price?: number;
    estate?: { id: string };
    availableQuantity?: number;
    unit?: string;
  } | null;
  availability: {
    availableQuantity: number;
    unit: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Reservation Modal
 * Allows buyer to select quantity and reserve crates from a batch
 */
export default function ReservationModal({
  visible,
  product,
  availability,
  onClose,
  onSuccess,
}: ReservationModalProps) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Germany');

  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(LAST_DELIVERY_KEY);
        if (raw) {
          const a = JSON.parse(raw) as { street?: string; city?: string; country?: string };
          if (a.street) setStreet(a.street);
          if (a.city) setCity(a.city);
          if (a.country) setCountry(a.country);
        }
      } catch {
        // ignore
      }
    })();
  }, [visible]);

  const maxQuantity = availability?.availableQuantity || product?.availableQuantity || 1;
  const unit = availability?.unit || product?.unit || 'units';

  const handleReserve = async () => {
    if (!product || !user) {
      Alert.alert('Error', 'Product or user information missing');
      return;
    }

    if (quantity <= 0 || quantity > maxQuantity) {
      Alert.alert('Error', `Please select a quantity between 1 and ${maxQuantity}`);
      return;
    }

    if (!product.estate?.id) {
      Alert.alert('Error', 'Estate information missing');
      return;
    }

    if (!product.price) {
      Alert.alert('Error', 'Product price missing');
      return;
    }

    if (!street.trim() || !city.trim()) {
      Alert.alert('Error', 'Please enter street and city for delivery.');
      return;
    }

    setLoading(true);
    try {
      await ordersAPI.create({
        estateId: product.estate.id,
        productName: product.productName,
        quantity,
        unit: unit,
        unitPrice: product.price,
        deliveryAddress: {
          street: street.trim(),
          city: city.trim(),
          country: country.trim() || 'Germany',
        },
        deliveryNotes: `Reservation for batch ${product.batchId || 'N/A'}`,
      });

      await AsyncStorage.setItem(
        LAST_DELIVERY_KEY,
        JSON.stringify({ street: street.trim(), city: city.trim(), country: country.trim() || 'Germany' }),
      );

      Alert.alert('Success', `Reserved ${quantity} ${unit} of ${product.productName}`);
      onSuccess();
      onClose();
      setQuantity(1);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  if (!visible || !product) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
      }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
        >
        <View style={{
          backgroundColor: theme.colors.background,
          borderTopLeftRadius: theme.borderRadius.xl,
          borderTopRightRadius: theme.borderRadius.xl,
          padding: theme.spacing.lg,
          borderWidth: 0.5,
          borderColor: 'rgba(0, 0, 0, 0.08)',
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: theme.spacing.lg,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '300',
              color: theme.colors.text.primary,
              letterSpacing: 0.5,
            }}>
              Reserve Crates
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.surface,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.08)',
              }}
            >
              <X size={18} color={theme.colors.text.secondary} strokeWidth={1} />
            </TouchableOpacity>
          </View>

          {/* Product Info */}
          <View style={{
            marginBottom: theme.spacing.lg,
            padding: theme.spacing.md,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            borderWidth: 0.5,
            borderColor: 'rgba(0, 0, 0, 0.08)',
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '300',
              color: theme.colors.text.primary,
              letterSpacing: 0.3,
              marginBottom: theme.spacing.xs,
            }}>
              {product.productName}
            </Text>
            {product.price && (
              <Text style={{
                fontSize: 12,
                fontWeight: '300',
                color: theme.colors.text.secondary,
                letterSpacing: 0.3,
              }}>
                {product.price.toLocaleString('en-US', { style: 'currency', currency: 'EUR' })} per {unit}
              </Text>
            )}
          </View>

          {/* Quantity Selector */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              letterSpacing: 0.5,
              marginBottom: theme.spacing.sm,
              textTransform: 'uppercase',
            }}>
              Quantity
            </Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.md,
            }}>
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  borderWidth: 0.5,
                  borderColor: quantity <= 1 ? 'rgba(0, 0, 0, 0.1)' : theme.colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.colors.surface,
                }}
              >
                <Minus size={18} color={quantity <= 1 ? theme.colors.text.tertiary : theme.colors.primary} strokeWidth={1} />
              </TouchableOpacity>

              <TextInput
                value={quantity.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text) || 1;
                  setQuantity(Math.max(1, Math.min(maxQuantity, num)));
                }}
                keyboardType="numeric"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: 18,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.5,
                  paddingVertical: theme.spacing.sm,
                  borderWidth: 0.5,
                  borderColor: 'rgba(0, 0, 0, 0.08)',
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: theme.colors.surface,
                }}
              />

              <TouchableOpacity
                onPress={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                disabled={quantity >= maxQuantity}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  borderWidth: 0.5,
                  borderColor: quantity >= maxQuantity ? 'rgba(0, 0, 0, 0.1)' : theme.colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.colors.surface,
                }}
              >
                <Plus size={18} color={quantity >= maxQuantity ? theme.colors.text.tertiary : theme.colors.primary} strokeWidth={1} />
              </TouchableOpacity>
            </View>
            <Text style={{
              fontSize: 10,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              letterSpacing: 0.2,
              marginTop: theme.spacing.xs,
              textAlign: 'center',
            }}>
              {maxQuantity} {unit} available
            </Text>
          </View>

          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              letterSpacing: 0.5,
              marginBottom: theme.spacing.sm,
              textTransform: 'uppercase',
            }}>
              Delivery address
            </Text>
            <TextInput
              value={street}
              onChangeText={setStreet}
              placeholder="Street"
              placeholderTextColor={theme.colors.text.tertiary}
              style={{
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.08)',
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.sm,
                color: theme.colors.text.primary,
                backgroundColor: theme.colors.surface,
              }}
            />
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="City"
              placeholderTextColor={theme.colors.text.tertiary}
              style={{
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.08)',
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.sm,
                color: theme.colors.text.primary,
                backgroundColor: theme.colors.surface,
              }}
            />
            <TextInput
              value={country}
              onChangeText={setCountry}
              placeholder="Country"
              placeholderTextColor={theme.colors.text.tertiary}
              style={{
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.08)',
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                color: theme.colors.text.primary,
                backgroundColor: theme.colors.surface,
              }}
            />
          </View>

          {/* Total */}
          {product.price && (
            <View style={{
              marginBottom: theme.spacing.lg,
              padding: theme.spacing.md,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.08)',
            }}>
              <Text style={{
                fontSize: 11,
                fontWeight: '300',
                color: theme.colors.text.secondary,
                letterSpacing: 0.5,
                marginBottom: theme.spacing.xs,
              }}>
                Total
              </Text>
              <Text style={{
                fontSize: 20,
                fontWeight: '300',
                color: theme.colors.primary,
                letterSpacing: 0.5,
              }}>
                {(product.price * quantity).toLocaleString('en-US', { style: 'currency', currency: 'EUR' })}
              </Text>
            </View>
          )}

          {/* Reserve Button */}
          <TouchableOpacity
            onPress={handleReserve}
            disabled={
              loading ||
              quantity <= 0 ||
              quantity > maxQuantity ||
              !street.trim() ||
              !city.trim()
            }
            style={{
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.lg,
              backgroundColor: theme.colors.primary,
              borderRadius: theme.borderRadius.md,
              alignItems: 'center',
              opacity:
                loading ||
                quantity <= 0 ||
                quantity > maxQuantity ||
                !street.trim() ||
                !city.trim()
                  ? 0.5
                  : 1,
            }}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: '300',
              color: theme.colors.text.inverse,
              letterSpacing: 0.5,
            }}>
              {loading ? 'Processing...' : 'Confirm Reservation'}
            </Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
