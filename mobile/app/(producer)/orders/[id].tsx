import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Package, User, MapPin, Calendar, Euro, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { ordersAPI, Order } from '../../../lib/api';

/**
 * Order Details Screen (Producer View)
 * Shows order details: buyer info, product, delivery address, payment status, timeline
 */
export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await ordersAPI.getOne(id);
      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrder();
    setRefreshing(false);
  };

  if (loading && !order) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13 }}>
          Učitavanje...
        </Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13 }}>
          Porudžbina nije pronađena
        </Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return colors.warning;
      case 'CONFIRMED': return colors.accent;
      case 'PREPARING': return colors.primary;
      case 'IN_TRANSIT': return colors.primary;
      case 'DELIVERED': return colors.success || colors.primary;
      case 'CANCELLED': return colors.error;
      default: return colors.text.secondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Na čekanju';
      case 'CONFIRMED': return 'Potvrđeno';
      case 'PREPARING': return 'Priprema';
      case 'IN_TRANSIT': return 'U transportu';
      case 'DELIVERED': return 'Isporučeno';
      case 'CANCELLED': return 'Otkazano';
      default: return status;
    }
  };

  // Extract buyer info from order (if available)
  const buyerInfo = (order as any).buyer || (order as any).buyerInfo || null;
  const paymentStatus = (order as any).paymentStatus || 'PENDING';

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Header */}
      <View 
        className="px-4 pt-12 pb-4 border-b-[0.5px] flex-row items-center"
        style={{ 
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: theme.spacing.md }}
        >
          <ArrowLeft size={24} color={colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text 
          className="text-lg flex-1"
          style={{ 
            color: colors.text.primary,
            fontWeight: '300',
            letterSpacing: 0.3,
          }}
        >
          Detalji Porudžbine
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={{ padding: theme.spacing.md }}>
          {/* Order Info */}
          <View style={{
            backgroundColor: colors.background,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              <Package size={18} color={colors.text.primary} strokeWidth={1} />
              <Text style={{
                fontSize: 15,
                fontWeight: '300',
                color: colors.text.primary,
                marginLeft: theme.spacing.xs,
                letterSpacing: 0.3,
              }}>
                #{order.orderNumber || order.id.slice(0, 8)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '300',
                color: colors.text.secondary,
              }}>
                Status
              </Text>
              <View style={{
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: 4,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: `${getStatusColor(order.status)}15`,
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: getStatusColor(order.status),
                  letterSpacing: 0.3,
                }}>
                  {getStatusLabel(order.status)}
                </Text>
              </View>
            </View>
          </View>

          {/* Product Info */}
          <View style={{
            backgroundColor: colors.background,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: colors.border,
          }}>
            <Text style={{
              fontSize: 15,
              fontWeight: '300',
              color: colors.text.primary,
              marginBottom: theme.spacing.sm,
              letterSpacing: 0.3,
            }}>
              Proizvod
            </Text>
            <Text style={{
              fontSize: 13,
              fontWeight: '300',
              color: colors.text.secondary,
              marginBottom: theme.spacing.xs,
            }}>
              {order.productName}
            </Text>
            <Text style={{
              fontSize: 13,
              fontWeight: '300',
              color: colors.text.secondary,
            }}>
              Količina: {order.quantity} {order.unit}
            </Text>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between',
              marginTop: theme.spacing.sm,
              paddingTop: theme.spacing.sm,
              borderTopWidth: 0.5,
              borderTopColor: colors.border,
            }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '300',
                color: colors.text.secondary,
              }}>
                Cena po jedinici
              </Text>
              <Text style={{
                fontSize: 13,
                fontWeight: '300',
                color: colors.text.primary,
              }}>
                {order.unitPrice.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </Text>
            </View>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between',
              marginTop: theme.spacing.xs,
            }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '300',
                color: colors.text.primary,
              }}>
                Ukupno
              </Text>
              <Text style={{
                fontSize: 15,
                fontWeight: '300',
                color: colors.primary,
              }}>
                {order.totalAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </Text>
            </View>
          </View>

          {/* Buyer Info */}
          {buyerInfo && (
            <View style={{
              backgroundColor: colors.background,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.md,
              borderWidth: 0.5,
              borderColor: colors.border,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
                <User size={18} color={colors.text.primary} strokeWidth={1} />
                <Text style={{
                  fontSize: 15,
                  fontWeight: '300',
                  color: colors.text.primary,
                  marginLeft: theme.spacing.xs,
                  letterSpacing: 0.3,
                }}>
                  Kupac
                </Text>
              </View>
              <Text style={{
                fontSize: 13,
                fontWeight: '300',
                color: colors.text.secondary,
              }}>
                {buyerInfo.firstName} {buyerInfo.lastName || ''}
              </Text>
              {buyerInfo.companyName && (
                <Text style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: colors.text.secondary,
                  marginTop: theme.spacing.xs,
                }}>
                  {buyerInfo.companyName}
                </Text>
              )}
            </View>
          )}

          {/* Delivery Address */}
          {order.deliveryAddress && (
            <View style={{
              backgroundColor: colors.background,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.md,
              borderWidth: 0.5,
              borderColor: colors.border,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
                <MapPin size={18} color={colors.text.primary} strokeWidth={1} />
                <Text style={{
                  fontSize: 15,
                  fontWeight: '300',
                  color: colors.text.primary,
                  marginLeft: theme.spacing.xs,
                  letterSpacing: 0.3,
                }}>
                  Adresa isporuke
                </Text>
              </View>
              {typeof order.deliveryAddress === 'string' ? (
                <Text style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: colors.text.secondary,
                }}>
                  {order.deliveryAddress}
                </Text>
              ) : (
                <>
                  {order.deliveryAddress.street && (
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '300',
                      color: colors.text.secondary,
                    }}>
                      {order.deliveryAddress.street}
                    </Text>
                  )}
                  {order.deliveryAddress.city && (
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '300',
                      color: colors.text.secondary,
                      marginTop: theme.spacing.xs,
                    }}>
                      {order.deliveryAddress.city}
                      {order.deliveryAddress.postalCode && `, ${order.deliveryAddress.postalCode}`}
                    </Text>
                  )}
                  {order.deliveryAddress.country && (
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '300',
                      color: colors.text.secondary,
                      marginTop: theme.spacing.xs,
                    }}>
                      {order.deliveryAddress.country}
                    </Text>
                  )}
                </>
              )}
            </View>
          )}

          {/* Payment Status */}
          <View style={{
            backgroundColor: colors.background,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              <Euro size={18} color={colors.text.primary} strokeWidth={1} />
              <Text style={{
                fontSize: 15,
                fontWeight: '300',
                color: colors.text.primary,
                marginLeft: theme.spacing.xs,
                letterSpacing: 0.3,
              }}>
                Status plaćanja
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '300',
                color: colors.text.secondary,
              }}>
                {paymentStatus === 'PAID' ? 'Plaćeno' : paymentStatus === 'PENDING' ? 'Na čekanju' : paymentStatus}
              </Text>
              {paymentStatus === 'PAID' ? (
                <CheckCircle size={16} color={colors.primary} strokeWidth={1} />
              ) : (
                <Clock size={16} color={colors.warning} strokeWidth={1} />
              )}
            </View>
          </View>

          {/* Delivery Notes */}
          {order.deliveryNotes && (
            <View style={{
              backgroundColor: colors.background,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.md,
              borderWidth: 0.5,
              borderColor: colors.border,
            }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '300',
                color: colors.text.primary,
                marginBottom: theme.spacing.sm,
                letterSpacing: 0.3,
              }}>
                Napomene
              </Text>
              <Text style={{
                fontSize: 13,
                fontWeight: '300',
                color: colors.text.secondary,
              }}>
                {order.deliveryNotes}
              </Text>
            </View>
          )}

          {/* Timeline */}
          <View style={{
            backgroundColor: colors.background,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: colors.border,
          }}>
            <Text style={{
              fontSize: 15,
              fontWeight: '300',
              color: colors.text.primary,
              marginBottom: theme.spacing.md,
              letterSpacing: 0.3,
            }}>
              Timeline
            </Text>
            <View style={{ gap: theme.spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{
                  width: 2,
                  height: 40,
                  backgroundColor: colors.primary,
                  marginRight: theme.spacing.sm,
                }} />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '300',
                    color: colors.text.primary,
                  }}>
                    Kreirano
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Calendar size={11} color={colors.text.secondary} strokeWidth={1} />
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '300',
                      color: colors.text.secondary,
                      marginLeft: 4,
                    }}>
                      {new Date(order.createdAt).toLocaleDateString('sr-RS', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              </View>
              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={{
                    width: 2,
                    height: 40,
                    backgroundColor: getStatusColor(order.status),
                    marginRight: theme.spacing.sm,
                  }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '300',
                      color: colors.text.primary,
                    }}>
                      {getStatusLabel(order.status)}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <Clock size={11} color={colors.text.secondary} strokeWidth={1} />
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '300',
                        color: colors.text.secondary,
                        marginLeft: 4,
                      }}>
                        {new Date(order.updatedAt).toLocaleDateString('sr-RS', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
