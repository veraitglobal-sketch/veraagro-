import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Product } from '../lib/api';
import { theme } from '../lib/theme';
import { useAppLocaleTag } from '../lib/date-locale';
import Card from './ui/Card';
import Button from './ui/Button';
import { CheckCircle, MapPin, Star, Calendar, Package } from 'lucide-react-native';
import { productEmoji } from '../lib/product-emoji';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  showActions?: boolean;
}

export default function ProductCard({ product, onPress, showActions = true }: ProductCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const priceLocale = useAppLocaleTag();
  const isCatalog = product.catalogProduct === true;
  const availableKg = product.availableKg ?? product.quantity;
  const sourceLabel = isCatalog
    ? t('buyer.shop.marketplacePacks')
    : t('buyer.shop.farmStock');
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/product/${product.id}`);
    }
  };

  const getProductIcon = () => productEmoji(product);

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
          <Text style={{ fontSize: 12, color: theme.colors.primary, marginBottom: theme.spacing.xs }}>
            {sourceLabel}
          </Text>
          {availableKg != null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs, gap: 4 }}>
              <Package size={12} color={theme.colors.text.secondary} strokeWidth={2} />
              <Text style={{ ...theme.typography.caption, color: theme.colors.text.secondary }}>
                {t('buyer.shop.availableKg', {
                  kg: Number(availableKg).toLocaleString(priceLocale, { maximumFractionDigits: 1 }),
                })}
              </Text>
            </View>
          )}
          {product.availableUntil ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm, gap: 4 }}>
              <Calendar size={12} color={theme.colors.text.secondary} strokeWidth={2} />
              <Text style={{ ...theme.typography.caption, color: theme.colors.text.secondary }}>
                {t('buyer.shop.availableUntil', {
                  date: new Date(product.availableUntil).toLocaleDateString(priceLocale),
                })}
              </Text>
            </View>
          ) : null}

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
                fontSize: 14,
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
                  fontSize: 14,
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
                  fontSize: 14,
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
                {product.price.toLocaleString(priceLocale, {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              <Text style={{
                fontSize: 14,
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
