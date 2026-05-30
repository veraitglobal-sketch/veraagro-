import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useCart } from '../../../hooks/useCart';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { bioVeraScrollProps, TAB_SCROLL_PADDING_BOTTOM } from '../../../lib/scroll-view-props';
import { ordersAPI } from '../../../lib/api';
import { useAppLocaleTag, a11yIconButton } from '../../../lib/date-locale';
import { FormKeyboardWrap } from '../../../components/FormKeyboardWrap';
import { FormHelperText } from '../../../components/FormHelperText';
import { farmerFormUi } from '../../../lib/farmer-form-ui';
import { ArrowLeft } from 'lucide-react-native';

const fieldInputStyle = {
  fontSize: 16,
  fontWeight: '400' as const,
  color: theme.colors.text.primary,
  minHeight: 48,
  paddingVertical: 12,
  paddingHorizontal: theme.spacing.md,
  borderBottomWidth: 0.5,
  borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  letterSpacing: 0.3,
};

/**
 * Checkout Screen
 * Elegant form with floating labels and dark green submit button
 */
export default function CheckoutScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const priceLocale = useAppLocaleTag();
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

      const deliveryAddress = { street: street.trim(), city: city.trim(), postalCode: postalCode.trim(), country: country.trim() };
      const hasReservation = items.some((i) => i.lineKind === 'reservation');
      const deliveryNotes =
        [
          hasReservation ? t('buyer.checkout.reservationDeliveryNote') : null,
          notes.trim() || null,
        ]
          .filter(Boolean)
          .join('\n\n') || undefined;

      const createdIds: string[] = [];
      for (const line of items) {
        const p = line.product;
        const order = await ordersAPI.create({
          ...(p.estate?.id ? { estateId: p.estate.id } : {}),
          productName: p.productName,
          quantity: line.quantity,
          unit: typeof p.unit === 'string' && p.unit.trim() ? p.unit : 'kg',
          unitPrice: p.price ?? 0,
          deliveryAddress,
          deliveryNotes,
        });
        if (!order?.id) {
          throw new Error(t('buyer.checkout.orderMissingId'));
        }
        createdIds.push(order.id);
      }

      clearCart();

      if (createdIds.length === 1) {
        router.replace(`/(buyer)/order/${createdIds[0]}`);
      } else {
        Alert.alert(t('buyer.orders.title'), t('buyer.checkout.ordersCreated', { count: createdIds.length }), [
          { text: t('alerts.ok'), onPress: () => router.replace('/(buyer)/orders') },
        ]);
      }
    } catch (error: unknown) {
      console.error('Error creating order:', error);
      let message = t('buyer.checkout.orderCreateFailed');
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const raw = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
        if (typeof raw === 'string' && raw.trim()) message = raw;
      } else if (error instanceof Error && error.message.trim()) {
        message = error.message;
      }
      Alert.alert(t('error'), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormKeyboardWrap style={{ backgroundColor: theme.colors.background }}>
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
            {...a11yIconButton(t('common.back'))}
          >
            <ArrowLeft size={20} color={theme.colors.text.primary} strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={{
            fontSize: 18,
            fontWeight: '400',
            color: theme.colors.text.primary,
            letterSpacing: 1,
          }}>
            {t('buyer.checkout.payment')}
          </Text>
        </View>
      </View>

      <ScrollView
        {...bioVeraScrollProps}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: TAB_SCROLL_PADDING_BOTTOM }}
      >
        <View
          style={{
            paddingTop: theme.spacing.lg,
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
          }}
        >
          {/* Delivery Address Section */}
          <Text style={{
            fontSize: 14,
            fontWeight: '500',
            letterSpacing: 2,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.lg,
            textTransform: 'uppercase',
          }}>
            {t('buyer.profile.deliveryAddress')}
          </Text>

          {/* Street */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: theme.colors.text.secondary,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              {t('buyer.checkout.street')}
            </Text>
            <TextInput
              value={street}
              onChangeText={setStreet}
              placeholder=""
              style={fieldInputStyle}
            />
            <FormHelperText>{t('form.helper.checkoutStreet')}</FormHelperText>
          </View>

          {/* City */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: theme.colors.text.secondary,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              {t('buyer.checkout.city')}
            </Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder=""
              style={fieldInputStyle}
            />
            <FormHelperText>{t('form.helper.checkoutCity')}</FormHelperText>
          </View>

          {/* Postal Code */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: theme.colors.text.secondary,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              {t('buyer.checkout.postalCode')}
            </Text>
            <TextInput
              value={postalCode}
              onChangeText={setPostalCode}
              placeholder=""
              keyboardType="numeric"
              style={fieldInputStyle}
            />
            <FormHelperText>{t('form.helper.checkoutPostalCode')}</FormHelperText>
          </View>

          {/* Country */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: theme.colors.text.secondary,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              {t('buyer.checkout.country')}
            </Text>
            <TextInput
              value={country}
              onChangeText={setCountry}
              placeholder=""
              style={fieldInputStyle}
            />
            <FormHelperText>{t('form.helper.checkoutCountry')}</FormHelperText>
          </View>

          {/* Notes */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: theme.colors.text.secondary,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              {t('buyer.checkout.fieldNotes')}
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder=""
              multiline
              numberOfLines={3}
              style={{
                ...fieldInputStyle,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
            />
            <FormHelperText>{t('form.helper.checkoutNotes')}</FormHelperText>
          </View>

          {/* Order Summary */}
          <View style={{
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            marginBottom: theme.spacing.xl,
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              letterSpacing: 2,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.md,
              textTransform: 'uppercase',
            }}>
              {t('buyer.checkout.summary')}
            </Text>
            {items.map((item) => (
              <View key={`${item.product.id}-${item.lineKind}`} style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: theme.spacing.xs,
              }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: '400',
                  color: theme.colors.text.primary,
                }}>
                  {item.product.productName} × {item.quantity}
                </Text>
                <Text style={{
                  fontSize: 13,
                  fontWeight: '400',
                  color: theme.colors.text.primary,
                }}>
                  {((item.product.price || 0) * item.quantity).toLocaleString(priceLocale, {
                    style: 'currency',
                    currency: 'EUR',
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
                fontWeight: '400',
                color: theme.colors.text.primary,
              }}>
                {t('buyer.checkout.total')}
              </Text>
              <Text style={{
                fontSize: 16,
                fontWeight: '400',
                color: theme.colors.text.primary,
              }}>
                {getTotalPrice().toLocaleString(priceLocale, { style: 'currency', currency: 'EUR' })}
              </Text>
            </View>
          </View>

          {items.length > 1 ? (
            <Text
              style={{
                fontSize: 14,
                fontWeight: '400',
                color: theme.colors.text.secondary,
                lineHeight: 18,
                marginBottom: theme.spacing.md,
              }}
            >
              {t('buyer.checkout.multiOrderHint')}
            </Text>
          ) : null}
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
            ...farmerFormUi.touchTarget,
            borderRadius: theme.borderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text.inverse,
            letterSpacing: 0.5,
          }}>
            {loading ? t('buyer.checkout.creating') : t('buyer.checkout.confirm')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
    </FormKeyboardWrap>
  );
}
