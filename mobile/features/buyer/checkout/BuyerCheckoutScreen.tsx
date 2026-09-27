import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { useRef, useState } from 'react';
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
import { submitCartOrders } from '../../../lib/checkout-orders';
import { useCartCatalogue } from '../../../hooks/useCartCatalogue';

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
  const { items, getTotalPrice, prepareCheckout, completeCheckout, loading: cartLoading } = useCart();
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);
  const catalogue = useCartCatalogue();
  
  // Form fields
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Germany');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (submitting.current || cartLoading || catalogue.blocked) return;
    // Validation
    if (![street, city, postalCode, country].every((value) => value.trim())) {
      Alert.alert(t('error'), t('buyer.checkout.fillRequired'));
      return;
    }

    if (items.length === 0) {
      Alert.alert(t('error'), t('buyer.checkout.cartEmpty'));
      return;
    }

    let createdCount = 0;
    let recovered = false;
    submitting.current = true;
    try {
      setLoading(true);

      const deliveryAddress = { street: street.trim(), city: city.trim(), postalCode: postalCode.trim(), country: country.trim() };
      const prepared = [];
      for (const line of items) prepared.push(await prepareCheckout(line, randomUUID));
      const result = await submitCartOrders(prepared, async (line) => {
        const p = line.product;
        const order = await ordersAPI.create({
          clientRequestId: line.checkoutKey!,
          productId: p.id,
          ...(p.estate?.id ? { estateId: p.estate.id } : {}),
          productName: p.productName,
          quantity: line.quantity,
          unit: typeof p.unit === 'string' && p.unit.trim() ? p.unit : 'kg',
          unitPrice: p.price ?? 0,
          deliveryAddress,
          deliveryNotes: [
            line.lineKind === 'reservation' ? t('buyer.checkout.reservationDeliveryNote') : null,
            notes.trim() || null,
          ].filter(Boolean).join('\n\n') || undefined,
        });
        recovered = recovered || !!order.checkoutReplay;
        return order;
      }, completeCheckout, t('buyer.checkout.orderMissingId'));
      const { createdIds } = result;
      createdCount = createdIds.length;
      if ('error' in result) throw result.error;

      if (createdIds.length === 1) {
        const openOrder = () => router.replace(`/(buyer)/order/${createdIds[0]}`);
        if (recovered) Alert.alert(t('buyer.orders.title'), t('checkoutRecovery.recovered'), [{ text: t('alerts.ok'), onPress: openOrder }]);
        else openOrder();
      } else {
        Alert.alert(t('buyer.orders.title'), [recovered ? t('checkoutRecovery.recovered') : '', t('buyer.checkout.ordersCreated', { count: createdIds.length })].filter(Boolean).join('\n\n'), [
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
      if (recovered) message = `${t('checkoutRecovery.recovered')}\n\n${message}`;
      Alert.alert(t('error'), createdCount > 0
        ? `${t('buyer.checkout.partialSuccess', { count: createdCount })}\n\n${message}`
        : message, createdCount > 0 ? [
          { text: t('buyer.cartReview.remainingCart'), onPress: () => router.replace('/(buyer)/cart') },
          { text: t('buyer.orders.title'), onPress: () => router.replace('/(buyer)/orders') },
        ] : [{ text: t('alerts.ok') }]);
    } finally {
      submitting.current = false;
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
            disabled={loading}
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
            {t('buyer.cartReview.checkoutTitle')}
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
          <Text style={{ color: theme.colors.text.secondary, marginBottom: theme.spacing.md }}>{t('buyer.cartReview.checkoutHint')}</Text>
          {catalogue.loading ? <Text>{t('buyer.cartReview.checking')}</Text> : null}
          {catalogue.pricesChanged ? <Text style={{ color: theme.colors.primary }}>{t('buyer.cartReview.pricesChanged')}</Text> : null}
          {catalogue.failed ? (
            <TouchableOpacity disabled={loading} onPress={() => void catalogue.reload()} style={{ paddingVertical: theme.spacing.md }}>
              <Text style={{ color: theme.colors.error }}>{t('buyer.cartReview.loadFailed')}</Text>
            </TouchableOpacity>
          ) : null}
          {!catalogue.loading && !catalogue.failed && catalogue.blocked ? (
            <TouchableOpacity onPress={() => router.replace('/(buyer)/cart')} style={{ paddingVertical: theme.spacing.md }}>
              <Text style={{ color: theme.colors.error }}>{t('buyer.cartReview.fixCart')}</Text>
            </TouchableOpacity>
          ) : null}
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
              editable={!loading}
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
              editable={!loading}
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
              editable={!loading}
              value={postalCode}
              onChangeText={setPostalCode}
              placeholder=""
              autoCapitalize="characters"
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
              editable={!loading}
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
              editable={!loading}
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
                  flex: 1,
                  marginRight: theme.spacing.md,
                  fontSize: 13,
                  fontWeight: '400',
                  color: theme.colors.text.primary,
                }}>
                  {item.product.productName} × {item.quantity} {item.product.unit}
                </Text>
                <Text style={{
                  fontSize: 13,
                  fontWeight: '400',
                  color: theme.colors.text.primary,
                }}>
                  {item.product.price && item.product.price > 0 ? (item.product.price * item.quantity).toLocaleString(priceLocale, {
                    style: 'currency',
                    currency: 'EUR',
                  }) : t('buyer.cart.priceOnRequest')}
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
                {items.some(item => !item.product.price || item.product.price <= 0) ? t('buyer.cartReview.totalIncomplete') : getTotalPrice().toLocaleString(priceLocale, { style: 'currency', currency: 'EUR' })}
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
          disabled={loading || cartLoading || catalogue.blocked || items.length === 0}
          style={{
            backgroundColor: theme.colors.primary,
            ...farmerFormUi.touchTarget,
            borderRadius: theme.borderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: loading || cartLoading || catalogue.blocked || items.length === 0 ? 0.6 : 1,
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
