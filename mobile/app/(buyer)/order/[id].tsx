import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, CheckCircle, Circle } from 'lucide-react-native';
import { ordersAPI, Order } from '../../../lib/api';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import {
  getOrderTimelineSteps,
  isTimelineStepCompleted,
  isTimelineStepCurrent,
  tBuyerOrderStatus,
} from '../../../lib/buyer-order-status';
import { getExpoPublicPaymentConfig, hasExpoPaymentConfig } from '../../../lib/biovera-payment-public';
import { useAppLocaleTag } from '../../../lib/date-locale';

function PaymentDetailsTextBlock() {
  const { t } = useTranslation();
  const c = getExpoPublicPaymentConfig();
  return (
    <View>
      {c.beneficiary ? (
        <Text style={{ fontSize: 14, fontWeight: '400', marginBottom: 4, color: theme.colors.text.primary }}>
          <Text style={{ color: theme.colors.text.secondary }}>{t('buyer.orders.bankFieldLabels.beneficiary')} </Text>
          {c.beneficiary}
        </Text>
      ) : null}
      {c.bankName ? (
        <Text style={{ fontSize: 14, fontWeight: '400', marginBottom: 4, color: theme.colors.text.primary }}>
          <Text style={{ color: theme.colors.text.secondary }}>{t('buyer.orders.bankFieldLabels.bank')} </Text>
          {c.bankName}
        </Text>
      ) : null}
      {c.iban ? (
        <Text selectable style={{ fontSize: 14, fontWeight: '400', marginBottom: 4, color: theme.colors.text.primary }}>
          <Text style={{ color: theme.colors.text.secondary }}>{t('buyer.orders.bankFieldLabels.iban')} </Text>
          {c.iban}
        </Text>
      ) : null}
      {c.swift ? (
        <Text style={{ fontSize: 14, fontWeight: '400', color: theme.colors.text.primary, marginBottom: 4 }}>
          <Text style={{ color: theme.colors.text.secondary }}>{t('buyer.orders.bankFieldLabels.swift')} </Text>
          {c.swift}
        </Text>
      ) : null}
      {c.extraLines.map((line: string) => (
        <Text key={line} style={{ fontSize: 14, fontWeight: '400', color: theme.colors.text.secondary, marginTop: 2 }}>
          {line}
        </Text>
      ))}
    </View>
  );
}

/**
 * Order Tracking Screen
 * Vertical timeline design with thin line and outline circles
 */
export default function OrderTrackingScreen() {
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();
  const priceLocale = useAppLocaleTag();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrder = useCallback(async (opts?: { background?: boolean }) => {
    if (!id || typeof id !== 'string') {
      setOrder(null);
      setLoading(false);
      return;
    }
    const background = opts?.background === true;
    if (!background) {
      setLoading(true);
      setOrder(null);
    }
    try {
      const data = await ordersAPI.getOne(id);
      setOrder(data);
    } catch (error: unknown) {
      console.error('Error loading order:', error);
    } finally {
      if (!background) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadOrder({ background: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadOrder]);
  if (loading) {
    return (
      <View style={{ flex: 1, paddingTop: p.topInset, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={{ flex: 1, paddingTop: p.topInset, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg }}>
        <Text style={{ 
          fontSize: 14, 
          fontWeight: '400',
          color: theme.colors.text.secondary, 
          textAlign: 'center',
          letterSpacing: 0.3,
          marginBottom: theme.spacing.md,
        }}>
          {t('buyer.orders.notFound')}
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(buyer)/orders')}
          style={{ 
            marginTop: theme.spacing.md, 
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.md,
          }}
        >
          <Text style={{ 
            fontSize: 13, 
            fontWeight: '400',
            color: theme.colors.text.inverse,
            letterSpacing: 0.5,
          }}>
            {t('buyer.profile.viewOrders')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const timelineInvalid =
    order.status === 'CANCELLED' || order.status === 'REFUNDED';
  const steps = getOrderTimelineSteps(t);

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
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '400',
              color: theme.colors.text.primary,
              letterSpacing: 1,
            }}>
              {t('buyer.orders.tracking')}
            </Text>
            <Text style={{
              fontSize: 14,
              fontWeight: '400',
              color: theme.colors.text.secondary,
              marginTop: 2,
              letterSpacing: 0.5,
            }}>
              {order.orderNumber}
            </Text>
            <View style={{ marginTop: theme.spacing.sm, alignSelf: 'flex-start' }}>
              <View style={{
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: 4,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: `${theme.colors.primary}12`,
                borderWidth: 0.5,
                borderColor: `${theme.colors.primary}40`,
              }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                }}>
                  {tBuyerOrderStatus(t, order.status)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressViewOffset={10}
          />
        }
      >
        <View
          style={{
            paddingTop: theme.spacing.lg,
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
            paddingBottom: Math.max(p.bottomInset, theme.spacing.lg),
          }}
        >
          {/* Order Info */}
          <View style={{
            marginBottom: theme.spacing.xl,
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '400',
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.xs,
              letterSpacing: 0.3,
            }}>
              {order.productName}
            </Text>
            <Text style={{
              fontSize: 13,
              fontWeight: '400',
              color: theme.colors.text.secondary,
              letterSpacing: 0.2,
            }}>
              {order.quantity} {order.unit}
              {order.unitPrice != null
                ? ` × ${Number(order.unitPrice).toLocaleString(priceLocale, { style: 'currency', currency: 'EUR' })}`
                : ''}
            </Text>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: theme.spacing.md,
              paddingTop: theme.spacing.md,
              borderTopWidth: 0.5,
              borderTopColor: 'rgba(0, 0, 0, 0.1)',
            }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '400',
                color: theme.colors.text.secondary,
              }}>
                {t('buyer.cart.total')}
              </Text>
              <Text style={{
                fontSize: 16,
                fontWeight: '400',
                color: theme.colors.text.primary,
              }}>
                {order.totalAmount.toLocaleString(priceLocale, { style: 'currency', currency: 'EUR' })}
              </Text>
            </View>
          </View>

          {/* Bank transfer: after Vera approved (APPROVED) */}
          {order.status === 'APPROVED' && (
            <View
              style={{
                marginBottom: theme.spacing.xl,
                padding: theme.spacing.lg,
                backgroundColor: `${theme.colors.primary}0F`,
                borderRadius: theme.borderRadius.md,
                borderWidth: 0.5,
                borderColor: `${theme.colors.primary}35`,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.sm,
                }}
              >
                {t('buyer.orders.paymentTitle')}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '400',
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.md,
                }}
              >
                {t('buyer.orders.paymentRefHint')}
              </Text>
              <View style={{ marginBottom: theme.spacing.sm }}>
                <Text style={{ fontSize: 14, color: theme.colors.text.secondary, fontWeight: '400' }}>
                  {t('buyer.orders.reference')}
                </Text>
                <Text
                  selectable
                  style={{ fontSize: 13, fontWeight: '500', color: theme.colors.text.primary }}
                >
                  {order.orderNumber}
                </Text>
              </View>
              {hasExpoPaymentConfig() ? (
                <PaymentDetailsTextBlock />
              ) : (
                <Text style={{ fontSize: 14, fontWeight: '400', color: theme.colors.text.secondary }}>
                  {t('buyer.orders.paymentNotConfigured')}{' '}
                  <Text
                    onPress={() => Linking.openURL('mailto:info@biovera.app')}
                    style={{ textDecorationLine: 'underline', color: theme.colors.primary }}
                  >
                    info@biovera.app
                  </Text>
                </Text>
              )}
            </View>
          )}

          {/* Timeline */}
          <View style={{
            marginBottom: theme.spacing.xl,
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              letterSpacing: 2,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.lg,
              textTransform: 'uppercase',
            }}>
              {t('common.status')}
            </Text>

            {timelineInvalid && (
              <View style={{ marginBottom: theme.spacing.lg, padding: theme.spacing.md, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: theme.borderRadius.md }}>
                <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.secondary }}>
                  {t('buyer.orders.cancelledOrder')}
                </Text>
              </View>
            )}

            {/* Vertical Timeline */}
            <View style={{ paddingLeft: theme.spacing.md }}>
              {!timelineInvalid && steps.map((step, index) => {
                const isCompleted = isTimelineStepCompleted(order.status, index);
                const isCurrent = isTimelineStepCurrent(order.status, index);
                const isLast = index === steps.length - 1;

                return (
                  <View key={step.key} style={{ flexDirection: 'row' }}>
                    {/* Timeline Line & Circle */}
                    <View style={{ alignItems: 'center', marginRight: theme.spacing.md }}>
                      {/* Circle */}
                      <View style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 0.5,
                        borderColor: isCompleted ? theme.colors.primary : 'rgba(0, 0, 0, 0.2)',
                        backgroundColor: isCompleted ? theme.colors.primary : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {isCompleted && (
                          <CheckCircle size={16} color={theme.colors.text.inverse} strokeWidth={1.5} fill={theme.colors.primary} />
                        )}
                        {!isCompleted && isCurrent && (
                          <Circle size={12} color={theme.colors.primary} strokeWidth={1} />
                        )}
                      </View>
                      
                      {/* Vertical Line */}
                      {!isLast && (
                        <View style={{
                          width: 0.5,
                          height: 60,
                          backgroundColor: isCompleted ? theme.colors.primary : 'rgba(0, 0, 0, 0.1)',
                          marginTop: theme.spacing.xs,
                        }} />
                      )}
                    </View>

                    {/* Step Label */}
                    <View style={{ flex: 1, paddingBottom: isLast ? 0 : theme.spacing.lg }}>
                      <Text style={{
                        fontSize: 14,
                        fontWeight: isCurrent ? '400' : '300',
                        color: isCompleted ? theme.colors.text.primary : theme.colors.text.secondary,
                        letterSpacing: 0.3,
                      }}>
                        {step.label}
                      </Text>
                        {isCurrent && !isCompleted && (
                        <Text style={{
                          fontSize: 14,
                          fontWeight: '400',
                          color: theme.colors.text.secondary,
                          marginTop: 2,
                          letterSpacing: 0.2,
                        }}>
                          {t('buyer.orders.currentStep')}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Delivery Address */}
          {order.deliveryAddress && (
            <View style={{
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                letterSpacing: 2,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.md,
                textTransform: 'uppercase',
              }}>
                {t('buyer.checkout.deliveryAddress')}
              </Text>
              <Text style={{
                fontSize: 13,
                fontWeight: '400',
                color: theme.colors.text.primary,
                lineHeight: 20,
                letterSpacing: 0.3,
              }}>
                {order.deliveryAddress.street}{'\n'}
                {order.deliveryAddress.postalCode} {order.deliveryAddress.city}{'\n'}
                {order.deliveryAddress.country}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
