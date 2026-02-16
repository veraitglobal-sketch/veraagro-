import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Product } from '../lib/api';
import { theme } from '../lib/theme';
import Card from './ui/Card';
import Button from './ui/Button';
import { CheckCircle, MapPin, Star, Calendar } from 'lucide-react-native';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  showActions?: boolean;
}

export default function ProductCard({ product, onPress, showActions = true }: ProductCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/product/${product.id}`);
    }
  };

  const getProductIcon = () => {
    if (product.parcel?.cropType === 'Raspberry' || product.productName.includes('Malina')) return '🫐';
    if (product.parcel?.cropType === 'Pepper' || product.productName.includes('Paprika')) return '🌶️';
    return '🌾';
  };

  return (
    <Card variant="elevated" padding="none" style={{ overflow: 'hidden' }}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        {/* Product Image/Icon */}
        <View style={{
          height: 180,
          backgroundColor: theme.colors.primary + '15',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.borderLight,
        }}>
          <Text style={{ fontSize: 72 }}>{getProductIcon()}</Text>
        </View>

        <View style={{ padding: theme.spacing.md }}>
          {/* Product Name */}
          <Text 
            style={{
              ...theme.typography.h3,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.xs,
            }}
            numberOfLines={2}
          >
            {product.productName}
          </Text>

          {/* Location */}
          {product.estate?.location && (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginBottom: theme.spacing.sm,
            }}>
              <MapPin size={14} color={theme.colors.text.secondary} strokeWidth={2} />
              <Text style={{
                ...theme.typography.caption,
                color: theme.colors.text.secondary,
                marginLeft: 4,
              }}>
                {product.estate.location}
              </Text>
            </View>
          )}

          {/* Trust Badge */}
          {product.hasDigitalPassport && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.successLight,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: 6,
              borderRadius: theme.borderRadius.sm,
              alignSelf: 'flex-start',
              marginBottom: theme.spacing.sm,
            }}>
              <CheckCircle size={14} color={theme.colors.success} strokeWidth={2} />
              <Text style={{
                fontSize: 11,
                fontWeight: '600',
                color: theme.colors.success,
                marginLeft: 4,
                letterSpacing: 0.3,
              }}>
                {t('buyer.shop.veraTrust')}
              </Text>
            </View>
          )}

          {/* Rating and Days */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: theme.spacing.md,
          }}>
            {product.rating && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.warningLight,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: 4,
                borderRadius: theme.borderRadius.sm,
              }}>
                <Star size={12} color={theme.colors.warning} strokeWidth={2} fill={theme.colors.warning} />
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: theme.colors.warning,
                  marginLeft: 4,
                }}>
                  {product.rating}
                </Text>
              </View>
            )}
            {product.daysInConversion && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.infoLight,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: 4,
                borderRadius: theme.borderRadius.sm,
              }}>
                <Calendar size={12} color={theme.colors.info} strokeWidth={2} />
                <Text style={{
                  fontSize: 11,
                  fontWeight: '500',
                  color: theme.colors.info,
                  marginLeft: 4,
                }}>
                  {product.daysInConversion} {t('marketplace.daysInConversion')}
                </Text>
              </View>
            )}
          </View>

          {/* Price */}
          {product.price && (
            <View style={{
              backgroundColor: theme.colors.primary,
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              marginBottom: theme.spacing.md,
            }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: theme.colors.text.inverse,
                textAlign: 'center',
                letterSpacing: 0.5,
              }}>
                {product.price.toLocaleString('en-US', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.9)',
                textAlign: 'center',
                marginTop: 2,
                letterSpacing: 0.3,
              }}>
                / {product.unit}
              </Text>
            </View>
          )}

          {/* Actions */}
          {showActions && (
            <Button
              title={t('marketplace.viewHistory')}
              onPress={handlePress}
              variant="outline"
              size="sm"
              fullWidth
            />
          )}
        </View>
      </TouchableOpacity>
    </Card>
  );
}
