import { View, Text, Modal, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { X, Plus, Minus } from 'lucide-react-native';
import { theme } from '../lib/theme';
import { ordersAPI, type Order } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useAppLocaleTag } from '../lib/date-locale';

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
  onSuccess: (order: Order) => void;
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
  const { t } = useTranslation();
  const { user } = useAuth();
  const priceLocale = useAppLocaleTag();
  const [quantityText, setQuantityText] = useState('1');
  const quantity = Number(quantityText.replace(',', '.'));
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);
  const addressEdited = useRef(false);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Germany');

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    addressEdited.current = false;
    setQuantityText('1');
    setStreet('');
    setCity('');
    setPostalCode('');
    setCountry('Germany');
    (async () => {
      if (!user?.id) return;
      try {
        const raw = await AsyncStorage.getItem(`${LAST_DELIVERY_KEY}:${user.id}`);
        if (raw && !cancelled && !addressEdited.current) {
          const a = JSON.parse(raw) as { street?: string; city?: string; postalCode?: string; country?: string };
          if (typeof a.street === 'string') setStreet(a.street);
          if (typeof a.city === 'string') setCity(a.city);
          if (typeof a.postalCode === 'string') setPostalCode(a.postalCode);
          if (typeof a.country === 'string') setCountry(a.country);
        }
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [visible, product?.id, user?.id]);

  const available = availability?.availableQuantity ?? product?.availableQuantity ?? 0;
  const maxQuantity = Number.isFinite(available) ? Math.max(0, available) : 0;
  const unit = availability?.unit || product?.unit || 'units';
  const canReserve = !loading && !!user && !!product?.estate?.id && !!product.price && Number.isFinite(product.price) && product.price > 0 &&
    Number.isFinite(quantity) && quantity > 0 && quantity <= maxQuantity &&
    !!street.trim() && !!city.trim() && !!postalCode.trim();
  const close = () => { if (!submitting.current) onClose(); };

  const handleReserve = async () => {
    if (submitting.current) return;
    if (!product || !user) {
      Alert.alert(t('error'), t('reservationModal.missingInfo'));
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > maxQuantity) {
      Alert.alert(t('error'), t('reservationModal.quantityRange', { max: maxQuantity }));
      return;
    }

    if (!product.estate?.id) {
      Alert.alert(t('error'), t('reservationModal.estateMissing'));
      return;
    }

    if (!product.price || !Number.isFinite(product.price) || product.price <= 0) {
      Alert.alert(t('error'), t('reservationModal.priceMissing'));
      return;
    }

    if (!street.trim() || !city.trim() || !postalCode.trim()) {
      Alert.alert(t('error'), t('buyer.checkout.fillRequired'));
      return;
    }

    submitting.current = true;
    setLoading(true);
    try {
      const attemptStorageKey = `reservation-checkout-v1:${user.id}:${product.id}`;
      const clientRequestId = await AsyncStorage.getItem(attemptStorageKey) || randomUUID();
      await AsyncStorage.setItem(attemptStorageKey, clientRequestId);
      const order = await ordersAPI.create({
        clientRequestId,
        productId: product.id,
        estateId: product.estate.id,
        productName: product.productName,
        quantity,
        unit: unit,
        unitPrice: product.price,
        deliveryAddress: {
          street: street.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          country: country.trim() || 'Germany',
        },
        deliveryNotes: product.batchId
          ? t('reservationModal.deliveryNotesBatch', { batchId: product.batchId })
          : t('reservationModal.deliveryNotesNoBatch'),
      });

      if (!order.id) throw new Error(t('buyer.checkout.orderMissingId'));
      // The order already exists; a local cleanup failure must not report a failed purchase.
      // Keeping this key is safe: the next attempt recovers the same order.
      await AsyncStorage.removeItem(attemptStorageKey).catch(() => undefined);
      await AsyncStorage.setItem(
        `${LAST_DELIVERY_KEY}:${user.id}`,
        JSON.stringify({ street: street.trim(), city: city.trim(), postalCode: postalCode.trim(), country: country.trim() || 'Germany' }),
      ).catch(() => undefined);

      Alert.alert(
        t('alerts.success'),
        order.checkoutReplay ? t('reservationModal.recovered') : t('reservationModal.success', {
          number: order.orderNumber, quantity: String(order.quantity), unit: order.unit, name: order.productName,
        }),
      );
      onClose();
      onSuccess(order);
      setQuantityText('1');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      Alert.alert(t('error'), message || t('reservationModal.createFailed'));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  if (!visible || !product) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={close}
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
              fontWeight: '400',
              color: theme.colors.text.primary,
              letterSpacing: 0.5,
            }}>
              {t('reservationModal.title')}
            </Text>
            <TouchableOpacity
              onPress={close}
              disabled={loading}
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
              fontWeight: '400',
              color: theme.colors.text.primary,
              letterSpacing: 0.3,
              marginBottom: theme.spacing.xs,
            }}>
              {product.productName}
            </Text>
            {!!product.price && (
              <Text style={{
                fontSize: 14,
                fontWeight: '400',
                color: theme.colors.text.secondary,
                letterSpacing: 0.3,
              }}>
                {product.price.toLocaleString(priceLocale, { style: 'currency', currency: 'EUR' })}{' '}
                {t('buyer.productDetail.perUnitShort', { unit })}
              </Text>
            )}
          </View>

          {/* Quantity Selector */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '400',
              color: theme.colors.text.secondary,
              letterSpacing: 0.5,
              marginBottom: theme.spacing.sm,
              textTransform: 'uppercase',
            }}>
              {t('reservationModal.quantitySection')}
            </Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.md,
            }}>
              <TouchableOpacity
                onPress={() => setQuantityText(String(Math.max(Math.min(1, maxQuantity), (Number.isFinite(quantity) ? quantity : 1) - 1)))}
                disabled={loading || quantity <= 1}
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
                value={quantityText}
                editable={!loading && maxQuantity > 0}
                onChangeText={(text) => {
                  if (/^\d*[.,]?\d*$/.test(text)) setQuantityText(text);
                }}
                keyboardType="numeric"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: 18,
                  fontWeight: '400',
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
                onPress={() => setQuantityText(String(Math.min(maxQuantity, (Number.isFinite(quantity) ? quantity : 0) + 1)))}
                disabled={loading || quantity >= maxQuantity}
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
              fontSize: 13,
              fontWeight: '400',
              color: theme.colors.text.secondary,
              letterSpacing: 0.2,
              marginTop: theme.spacing.xs,
              textAlign: 'center',
            }}>
              {t('reservationModal.maxAvailable', { max: maxQuantity, unit })}
            </Text>
          </View>

          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '400',
              color: theme.colors.text.secondary,
              letterSpacing: 0.5,
              marginBottom: theme.spacing.sm,
              textTransform: 'uppercase',
            }}>
              {t('reservationModal.deliveryAddressHeading')}
            </Text>
            <TextInput
              value={street}
              editable={!loading}
              onChangeText={(value) => { addressEdited.current = true; setStreet(value); }}
              placeholder={t('buyer.checkout.fieldStreet')}
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
              editable={!loading}
              onChangeText={(value) => { addressEdited.current = true; setCity(value); }}
              placeholder={t('buyer.checkout.fieldCity')}
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
              value={postalCode}
              editable={!loading}
              onChangeText={(value) => { addressEdited.current = true; setPostalCode(value); }}
              placeholder={t('buyer.checkout.postalCode')}
              accessibilityLabel={t('buyer.checkout.postalCode')}
              placeholderTextColor={theme.colors.text.tertiary}
              style={{
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.sm,
                color: theme.colors.text.primary,
                backgroundColor: theme.colors.surface,
              }}
            />
            <TextInput
              value={country}
              editable={!loading}
              onChangeText={(value) => { addressEdited.current = true; setCountry(value); }}
              placeholder={t('buyer.checkout.fieldCountry')}
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
          {!!product.price && (
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
                fontWeight: '400',
                color: theme.colors.text.secondary,
                letterSpacing: 0.5,
                marginBottom: theme.spacing.xs,
              }}>
                {t('buyer.checkout.total')}
              </Text>
              <Text style={{
                fontSize: 20,
                fontWeight: '400',
                color: theme.colors.primary,
                letterSpacing: 0.5,
              }}>
                {(product.price * quantity).toLocaleString(priceLocale, {
                  style: 'currency',
                  currency: 'EUR',
                })}
              </Text>
            </View>
          )}

          {/* Reserve Button */}
          <TouchableOpacity
            onPress={handleReserve}
            disabled={!canReserve}
            style={{
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.lg,
              backgroundColor: theme.colors.primary,
              borderRadius: theme.borderRadius.md,
              alignItems: 'center',
              opacity: canReserve ? 1 : 0.5,
            }}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: '400',
              color: theme.colors.text.inverse,
              letterSpacing: 0.5,
            }}>
              {loading ? t('reservationModal.processing') : t('reservationModal.confirmReservation')}
            </Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
