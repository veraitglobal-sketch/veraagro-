import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../hooks/useCart';
import { theme } from '../../lib/theme';
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react-native';

/**
 * Shopping Cart Screen
 * Minimalist design with thin lines and simple quantity controls
 */
export default function CartScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();

  const handleCheckout = () => {
    if (items.length > 0) {
      router.push('/(buyer)/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl }}>
          <ShoppingBag size={48} color={theme.colors.text.secondary} strokeWidth={1} />
          <Text style={{
            fontSize: 16,
            fontWeight: '300',
            color: theme.colors.text.secondary,
            marginTop: theme.spacing.lg,
            letterSpacing: 0.5,
          }}>
            {t('buyer.checkout.cartEmpty')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: theme.spacing.lg }}>
          {items.map((item) => (
            <View key={`${item.product.id}-${item.lineKind}`}>
              <View style={{
                flexDirection: 'row',
                paddingVertical: theme.spacing.lg,
                borderBottomWidth: 0.5,
                borderBottomColor: 'rgba(0, 0, 0, 0.1)',
              }}>
                {/* Product Info */}
                <View style={{ flex: 1, marginRight: theme.spacing.md }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '300',
                    color: theme.colors.text.primary,
                    marginBottom: theme.spacing.xs,
                    letterSpacing: 0.3,
                  }}>
                    {item.product.productName}
                    {item.lineKind === 'reservation' && (
                      <Text style={{ fontSize: 12, color: theme.colors.primary }}> · reservation</Text>
                    )}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    letterSpacing: 0.2,
                  }}>
                    {item.product.price 
                      ? item.product.price.toLocaleString('en-US', { style: 'currency', currency: 'EUR' })
                      : 'Price on request'} per {item.product.unit}
                  </Text>
                </View>

                {/* Quantity Controls */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.product.id, item.quantity - 1, item.lineKind)}
                    style={{ padding: theme.spacing.xs }}
                  >
                    <Minus size={18} color={theme.colors.text.primary} strokeWidth={1.5} />
                  </TouchableOpacity>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '300',
                    color: theme.colors.text.primary,
                    minWidth: 30,
                    textAlign: 'center',
                    letterSpacing: 0.5,
                  }}>
                    {item.quantity}
                  </Text>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.product.id, item.quantity + 1, item.lineKind)}
                    style={{ padding: theme.spacing.xs }}
                  >
                    <Plus size={18} color={theme.colors.text.primary} strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>

                {/* Remove Button */}
                <TouchableOpacity
                  onPress={() => removeFromCart(item.product.id, item.lineKind)}
                  style={{ marginLeft: theme.spacing.md, padding: theme.spacing.xs }}
                >
                  <Trash2 size={18} color={theme.colors.error} strokeWidth={1} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={{
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.md,
        }}>
          <Text style={{
            fontSize: 13,
            fontWeight: '300',
            color: theme.colors.text.secondary,
            letterSpacing: 0.5,
          }}>
            Ukupno
          </Text>
          <Text style={{
            fontSize: 20,
            fontWeight: '300',
            color: theme.colors.text.primary,
            letterSpacing: 0.5,
          }}>
            {getTotalPrice().toLocaleString('en-US', { style: 'currency', currency: 'EUR' })}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleCheckout}
          style={{
            backgroundColor: theme.colors.primary,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.borderRadius.md,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: theme.spacing.sm,
          }}
        >
          <Text style={{
            fontSize: 14,
            fontWeight: '300',
            color: theme.colors.text.inverse,
            letterSpacing: 1,
          }}>
            Proceed to payment
          </Text>
          <ArrowRight size={18} color={theme.colors.text.inverse} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
