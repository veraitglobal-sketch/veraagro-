import { View, Text, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
// import { LinearGradient } from 'expo-linear-gradient'; // Not needed for now
import { Search, MapPin, Users, ShoppingBag, ArrowRight, Apple, Carrot, Wheat, Map } from 'lucide-react-native';
import { inventoryAPI, Product } from '../lib/api';
import { theme } from '../lib/theme';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

/**
 * Landing Page - Premium Design
 * Modern, professional marketplace interface
 */
export default function LandingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { 
      id: 'fruits', 
      name: t('marketplace.categories.fruits'), 
      icon: Apple, 
      color: theme.colors.error,
    },
    { 
      id: 'vegetables', 
      name: t('marketplace.categories.vegetables'), 
      icon: Carrot, 
      color: theme.colors.warning,
    },
    { 
      id: 'grains', 
      name: t('marketplace.categories.grains'), 
      icon: Wheat, 
      color: theme.colors.accent,
    },
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryAPI.getAvailableProducts();
      setProducts(data);
      // Only set error if we expected data but got none (not if backend is unavailable)
      if (data.length === 0) {
        // Don't show error - just show empty state
        setError(null);
      }
    } catch (err: any) {
      // Only show error if it's not a network error (backend unavailable)
      if (err.message && !err.message.includes('Network') && !err.code) {
        setError(err.message || t('marketplace.errors.loadFailed'));
      } else {
        setError(null); // Backend unavailable - show empty state instead
      }
      console.warn('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.estate?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView 
      className="flex-1" 
      style={{ backgroundColor: theme.colors.background }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section - Enhanced */}
      <View style={{ 
        backgroundColor: theme.colors.primary,
        borderBottomLeftRadius: theme.borderRadius.xl,
        borderBottomRightRadius: theme.borderRadius.xl,
        overflow: 'hidden',
      }}>
        <View style={{ paddingTop: 60, paddingBottom: 40, paddingHorizontal: theme.spacing.lg }}>
          <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: theme.borderRadius.lg,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.spacing.md,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}>
              <Text style={{ fontSize: 36 }}>🌱</Text>
            </View>
            <Text style={{
              fontSize: 28,
              fontWeight: '300',
              color: theme.colors.text.inverse,
              marginBottom: theme.spacing.xs,
              letterSpacing: 2,
            }}>
              BIO VERA
            </Text>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              paddingHorizontal: theme.spacing.md,
              paddingVertical: 6,
              borderRadius: theme.borderRadius.full,
              marginBottom: theme.spacing.sm,
            }}>
              <Text style={{
                color: theme.colors.text.inverse,
                fontSize: 10,
                fontWeight: '400',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}>
                {t('marketplace.header.bioReady')}
              </Text>
            </View>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: 12,
              fontWeight: '300',
              letterSpacing: 0.5,
              textAlign: 'center',
              maxWidth: 280,
            }}>
              {t('marketplace.header.certifiedFood')}
            </Text>
          </View>
        </View>
      </View>

      {/* Search Bar - Enhanced Floating */}
      <View style={{ 
        paddingHorizontal: theme.spacing.lg, 
        marginTop: -24,
        marginBottom: theme.spacing.xl,
      }}>
        <View style={{
          backgroundColor: theme.colors.background,
          borderRadius: theme.borderRadius.lg,
          borderWidth: 0.5,
          borderColor: 'rgba(0, 0, 0, 0.08)',
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          ...theme.shadows.md,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Search size={16} color={theme.colors.text.tertiary} strokeWidth={1.5} />
            <TextInput
              style={{
                flex: 1,
                marginLeft: theme.spacing.sm,
                fontSize: 13,
                color: theme.colors.text.primary,
                letterSpacing: 0.2,
                fontWeight: '300',
                paddingVertical: 4,
              }}
              placeholder={t('marketplace.searchPlaceholder')}
              placeholderTextColor={theme.colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearchQuery('')}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: theme.colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: theme.colors.text.secondary, fontSize: 10 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Categories - Enhanced */}
      <View style={{ paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
        <Text style={{
          fontSize: 12,
          fontWeight: '400',
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.md,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}>
          {t('marketplace.categories.title')}
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              activeOpacity={0.6}
              style={{ flex: 1 }}
              onPress={() => router.push({
                pathname: '/products',
                params: { category: category.id },
              })}
            >
              <Card 
                variant="elevated" 
                padding="lg" 
                style={{ 
                  borderRadius: theme.borderRadius.md,
                  borderWidth: 0.5,
                  borderColor: `${category.color}15`,
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <View style={{
                    width: 56,
                    height: 56,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: `${category.color}10`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: theme.spacing.sm,
                    borderWidth: 0.5,
                    borderColor: `${category.color}20`,
                  }}>
                    {category.icon && (
                      <category.icon 
                        size={26} 
                        color={category.color} 
                        strokeWidth={1.5} 
                      />
                    )}
                  </View>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '300',
                    color: theme.colors.text.primary,
                    letterSpacing: 0.5,
                    textAlign: 'center',
                  }}>
                    {category.name}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Products Section - Enhanced */}
      <View style={{ paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: theme.spacing.md,
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '400',
            color: theme.colors.text.secondary,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}>
            {t('marketplace.premium.title')}
          </Text>
          {filteredProducts.length > 0 && (
            <Text style={{
              fontSize: 10,
              color: theme.colors.text.tertiary,
              letterSpacing: 0.5,
              fontWeight: '300',
            }}>
              {t('marketplace.products.count', { count: filteredProducts.length })}
            </Text>
          )}
        </View>

        {loading ? (
          <LoadingSpinner message={t('marketplace.loading')} />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadProducts} />
        ) : filteredProducts.length === 0 ? (
          <Card variant="outlined" padding="xl">
            <View style={{ alignItems: 'center' }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: theme.colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: theme.spacing.md,
              }}>
                <Text style={{ fontSize: 40 }}>📦</Text>
              </View>
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.sm,
                textAlign: 'center',
                letterSpacing: 1,
              }}>
                {searchQuery ? t('marketplace.emptyState.noResults') : t('marketplace.emptyState.noProducts')}
              </Text>
              <Text style={{
                fontSize: 10,
                color: theme.colors.text.secondary,
                textAlign: 'center',
                marginBottom: theme.spacing.lg,
                opacity: 0.6,
                letterSpacing: 0.2,
              }}>
                {searchQuery 
                  ? t('marketplace.emptyState.tryDifferentSearch')
                  : t('marketplace.emptyState.comingSoon')}
              </Text>
              {searchQuery && (
                <Button
                  title={t('marketplace.emptyState.clearSearch')}
                  onPress={() => setSearchQuery('')}
                  variant="outline"
                  size="md"
                />
              )}
            </View>
          </Card>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: theme.spacing.md }}
          >
            {filteredProducts.map((product) => (
              <View key={product.id} style={{ width: 320, marginRight: theme.spacing.md }}>
                <ProductCard product={product} />
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Become Producer CTA - Enhanced */}
      <View style={{ paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
        <Card 
          variant="elevated" 
          padding="xl"
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.lg,
            ...theme.shadows.lg,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.spacing.md,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}>
              <Text style={{ fontSize: 32 }}>🌾</Text>
            </View>
            <Text style={{
              fontSize: 13,
              fontWeight: '400',
              color: theme.colors.text.inverse,
              marginBottom: theme.spacing.xs,
              textAlign: 'center',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}>
              {t('marketplace.becomeProducer.title')}
            </Text>
            <Text style={{
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.85)',
              textAlign: 'center',
              marginBottom: theme.spacing.lg,
              lineHeight: 18,
              fontWeight: '300',
              letterSpacing: 0.3,
              maxWidth: 280,
            }}>
              {t('marketplace.becomeProducer.description')}
            </Text>
            <Button
              title={t('marketplace.becomeProducer.button')}
              onPress={() => router.push('/login')}
              variant="secondary"
              size="lg"
              fullWidth
              className="mb-4"
              icon={<Users size={18} color={theme.colors.text.primary} strokeWidth={2} />}
            />
            <TouchableOpacity onPress={() => router.push('/partner-application')}>
              <Text style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: 12,
                fontWeight: '400',
                letterSpacing: 0.5,
              }}>
                {t('marketplace.becomeProducer.link')} <ArrowRight size={12} color="rgba(255, 255, 255, 0.9)" strokeWidth={2} />
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>

      {/* Suppliers Map Link - Enhanced */}
      <View style={{ paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
        <TouchableOpacity
          onPress={() => router.push('/map')}
          activeOpacity={0.6}
        >
          <Card 
            variant="outlined" 
            padding="md"
            style={{
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.08)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 52,
                height: 52,
                borderRadius: theme.borderRadius.md,
                backgroundColor: `${theme.colors.primary}08`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: theme.spacing.md,
                borderWidth: 0.5,
                borderColor: `${theme.colors.primary}15`,
              }}>
                <MapPin size={22} color={theme.colors.primary} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: '400',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                  marginBottom: 2,
                }}>
                  {t('map.title')}
                </Text>
                <Text style={{
                  fontSize: 10,
                  fontWeight: '300',
                  color: theme.colors.text.secondary,
                  letterSpacing: 0.2,
                }}>
                  {t('map.subtitle')}
                </Text>
              </View>
              <ArrowRight size={16} color={theme.colors.text.tertiary} strokeWidth={1.5} />
            </View>
          </Card>
        </TouchableOpacity>
      </View>

      {/* Login Options */}
      <View style={{ paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing['2xl'] }}>
        <Text style={{
          fontSize: 12,
          fontWeight: '300',
          color: theme.colors.text.secondary,
          textAlign: 'center',
          marginBottom: theme.spacing.md,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}>
          {t('marketplace.loginOptions.title') || 'Access Your Account'}
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button
              title={t('marketplace.loginOptions.login') || 'Sign In'}
              onPress={() => router.push('/login')}
              variant="primary"
              size="md"
              fullWidth
              icon={<Users size={18} color={theme.colors.text.inverse} strokeWidth={1.5} />}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title={t('marketplace.loginOptions.guest') || 'Browse'}
              onPress={() => router.push('/(buyer)/shop')}
              variant="outline"
              size="md"
              fullWidth
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
