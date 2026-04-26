import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useCart } from '../../hooks/useCart';
import { theme } from '../../lib/theme';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { ordersAPI } from '../../lib/api';
import { ArrowLeft } from 'lucide-react-native';

/**
 * Checkout Screen
 * Elegant form with floating labels and dark green submit button
 */
export default function CheckoutScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const { items, getTotalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Germany');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    // Validation
    if (!street || !city || !postalCode) {
      Alert.alert(t('error'), t('buyer.checkout.fillRequired'));
      return;
    }

    if (items.length === 0) {
      Alert.alert(t('error'), t('buyer.checkout.cartEmpty'));
      return;
    }

    try {
      setLoading(true);

      // Create order for each product (or combine into one order)
      // For simplicity, we'll create one order with all items
      const firstItem = items[0];
      const hasReservation = items.some((i) => i.lineKind === 'reservation');
      const deliveryNotes = [
        hasReservation
          ? 'Cart includes reserved lines — treat delivery timing as subject to harvest confirmation.'
          : null,
        notes.trim() || null,
      ]
        .filter(Boolean)
        .join('\n\n');
      const orderData = {
        estateId: firstItem.product.estate.id,
        productName: firstItem.product.productName,
        quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        unit: firstItem.product.unit,
        unitPrice: firstItem.product.price || 0,
        deliveryAddress: {
          street,
          city,
          postalCode,
          country,
        },
        deliveryNotes: deliveryNotes || undefined,
      };

      const order = await ordersAPI.create(orderData);
      
      if (!order || !order.id) {
        throw new Error('Order was created but no ID was returned');
      }
      
      // Clear cart
      clearCart();
      
      // Navigate to order tracking
      router.replace(`/(buyer)/order/${order.id}`);
    } catch (error: any) {
      console.error('Error creating order:', error);
      const errorMessage = error.response?.data?.message || error.message || t('buyer.checkout.orderCreateFailed');
      Alert.alert(t('error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: p.headerTop,
        paddingBottom: theme.spacing.md,
        paddingLeft: p.screenPaddingLeft,
        paddingRight: p.screenPaddingRight,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: theme.spacing.md }}
          >
            <ArrowLeft size={20} color={theme.colors.text.primary} strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={{
            fontSize: 18,
            fontWeight: '300',
            color: theme.colors.text.primary,
            letterSpacing: 1,
          }}>
            {t('buyer.checkout.payment')}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View
          style={{
            paddingTop: theme.spacing.lg,
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
            paddingBottom: Math.max(p.bottomInset, theme.spacing.lg),
          }}
        >
          {/* Delivery Address Section */}
          <Text style={{
            fontSize: 11,
            fontWeight: '500',
            letterSpacing: 2,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.lg,
            textTransform: 'uppercase',
          }}>
            {t('buyer.profile.deliveryAddress', 'Delivery address')}
          </Text>

          {/* Street */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{
              fontSize: 10,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Street and number
            </Text>
            <TextInput
              value={street}
              onChangeText={setStreet}
              placeholder=""
              style={{
                fontSize: 14,
                fontWeight: '300',
                color: theme.colors.text.primary,
                paddingVertical: theme.spacing.md,
                paddingHorizontal: theme.spacing.md,
                borderBottomWidth: 0.5,
                borderBottomColor: 'rgba(0, 0, 0, 0.1)',
                letterSpacing: 0.3,
              }}
            />
          </View>

          {/* City */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{
              fontSize: 10,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              City
            </Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder=""
              style={{
                fontSize: 14,
                fontWeight: '300',
                color: theme.colors.text.primary,
                paddingVertical: theme.spacing.md,
                paddingHorizontal: theme.spacing.md,
                borderBottomWidth: 0.5,
                borderBottomColor: 'rgba(0, 0, 0, 0.1)',
                letterSpacing: 0.3,
              }}
            />
          </View>

          {/* Postal Code */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{
              fontSize: 10,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Postal code
            </Text>
            <TextInput
              value={postalCode}
              onChangeText={setPostalCode}
              placeholder=""
              keyboardType="numeric"
              style={{
                fontSize: 14,
                fontWeight: '300',
                color: theme.colors.text.primary,
                paddingVertical: theme.spacing.md,
                paddingHorizontal: theme.spacing.md,
                borderBottomWidth: 0.5,
                borderBottomColor: 'rgba(0, 0, 0, 0.1)',
                letterSpacing: 0.3,
              }}
            />
          </View>

          {/* Country */}
          <View style={{ marginBottom: theme.spacing.xl }}>
            <Text style={{
              fontSize: 10,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Country
            </Text>
            <TextInput
              value={country}
              onChangeText={setCountry}
              placeholder=""
              style={{
                fontSize: 14,
                fontWeight: '300',
                color: theme.colors.text.primary,
                paddingVertical: theme.spacing.md,
                paddingHorizontal: theme.spacing.md,
                borderBottomWidth: 0.5,
                borderBottomColor: 'rgba(0, 0, 0, 0.1)',
                letterSpacing: 0.3,
              }}
            />
          </View>

          {/* Notes */}
          <View style={{ marginBottom: theme.spacing.xl }}>
            <Text style={{
              fontSize: 10,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Notes (optional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder=""
              multiline
              numberOfLines={3}
              style={{
                fontSize: 14,
                fontWeight: '300',
                color: theme.colors.text.primary,
                paddingVertical: theme.spacing.md,
                paddingHorizontal: theme.spacing.md,
                borderBottomWidth: 0.5,
                borderBottomColor: 'rgba(0, 0, 0, 0.1)',
                letterSpacing: 0.3,
                minHeight: 60,
              }}
            />
          </View>

          {/* Order Summary */}
          <View style={{
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            marginBottom: theme.spacing.xl,
          }}>
            <Text style={{
              fontSize: 11,
              fontWeight: '500',
              letterSpacing: 2,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.md,
              textTransform: 'uppercase',
            }}>
              Order summary
            </Text>
            {items.map((item) => (
              <View key={item.product.id} style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: theme.spacing.xs,
              }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                }}>
                  {item.product.productName} × {item.quantity}
                </Text>
                <Text style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                }}>
                  {((item.product.price || 0) * item.quantity).toLocaleString('en-US', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  })}
                </Text>
              </View>
            ))}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: theme.spacing.md,
              paddingTop: theme.spacing.md,
              borderTopWidth: 0.5,
              borderTopColor: 'rgba(0, 0, 0, 0.1)',
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '300',
                color: theme.colors.text.primary,
              }}>
                Total
              </Text>
              <Text style={{
                fontSize: 16,
                fontWeight: '300',
                color: theme.colors.text.primary,
              }}>
                {getTotalPrice().toLocaleString('en-US', { style: 'currency', currency: 'EUR' })}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={{
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
      }}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: theme.colors.primary,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.borderRadius.md,
            alignItems: 'center',
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Text style={{
            fontSize: 14,
            fontWeight: '300',
            color: theme.colors.text.inverse,
            letterSpacing: 1,
          }}>
            {loading ? t('buyer.checkout.creating') : t('buyer.checkout.confirm')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
