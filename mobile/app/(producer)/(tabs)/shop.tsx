import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ShoppingBag, Package, Seedling } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.178.27:3000';

interface SeedProduct {
  id: string;
  name: string;
  description?: string;
  standardPrice: number;
  partnerPrice?: number;
  unit: string;
  available: boolean;
  category?: string;
}

/**
 * Shop / Nabavka Screen
 * Farmers can purchase seeds and inputs
 */
export default function ShopScreen() {
  const params = useLocalSearchParams<{ seedId?: string; cropName?: string }>() || {};
  const [products, setProducts] = useState<SeedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products if seedId is provided
  const filteredProducts = (() => {
    let filtered = selectedCategory === 'all' 
      ? products 
      : products.filter(p => p.category === selectedCategory);
    
    // If seedId is provided, filter by that specific seed
    if (params.seedId) {
      filtered = filtered.filter(p => p.id === params.seedId);
    }
    
    return filtered;
  })();

  const loadProducts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      
      const response = await axios.get(`${API_URL}/seeds/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data || []);
    } catch (error: any) {
      console.error('Error loading products:', error);
      // Mock data for development
      setProducts([
        {
          id: '1',
          name: 'Bio Malina - Premium',
          description: 'Certified organic raspberry seeds',
          standardPrice: 25.00,
          partnerPrice: 20.00,
          unit: 'kg',
          available: true,
          category: 'seeds',
        },
        {
          id: '2',
          name: 'Organic Fertilizer',
          description: 'Organic fertilizer for vegetables',
          standardPrice: 15.00,
          partnerPrice: 12.00,
          unit: 'kg',
          available: true,
          category: 'fertilizer',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All', icon: Package },
    { id: 'seeds', name: 'Seeds', icon: Seedling },
    { id: 'fertilizer', name: 'Fertilizer', icon: ShoppingBag },
  ];


  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: theme.spacing.md }}>
        {/* Header */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '300',
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.xs,
            letterSpacing: 0.5,
          }}>
            Procurement
          </Text>
          {params.cropName && (
            <Text style={{
              fontSize: 11,
              fontWeight: '300',
              color: theme.colors.primary,
              letterSpacing: 0.3,
            }}>
              Recommended for: {params.cropName}
            </Text>
          )}
        </View>

        {/* Categories */}
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
          {categories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => setSelectedCategory(category.id)}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  paddingVertical: theme.spacing.sm,
                  paddingHorizontal: theme.spacing.md,
                  borderRadius: theme.borderRadius.md,
                  borderWidth: 0.5,
                  backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                  borderColor: isSelected ? theme.colors.primary : 'rgba(0, 0, 0, 0.05)',
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: theme.spacing.xs,
                }}
              >
                {IconComponent && (
                  <IconComponent 
                    size={16} 
                    color={isSelected ? theme.colors.background : theme.colors.text.primary} 
                    strokeWidth={1} 
                  />
                )}
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: isSelected ? theme.colors.background : theme.colors.text.primary,
                  letterSpacing: 0.3,
                }}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Products */}
        {loading ? (
          <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.xl,
            alignItems: 'center',
            borderWidth: 0.5,
            borderColor: 'rgba(0, 0, 0, 0.05)',
          }}>
            <Text style={{
              fontSize: 11,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              letterSpacing: 0.3,
            }}>
              No available products
            </Text>
          </View>
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            {filteredProducts.map((product) => (
              <View
                key={product.id}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.md,
                  borderWidth: 0.5,
                  borderColor: 'rgba(0, 0, 0, 0.05)',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.xs }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '300',
                      color: theme.colors.text.primary,
                      marginBottom: theme.spacing.xs,
                      letterSpacing: 0.3,
                    }}>
                      {product.name}
                    </Text>
                    {product.description && (
                      <Text style={{
                        fontSize: 9,
                        fontWeight: '300',
                        color: theme.colors.text.secondary,
                        letterSpacing: 0.2,
                      }}>
                        {product.description}
                      </Text>
                    )}
                  </View>
                  {product.available && (
                    <View style={{
                      paddingHorizontal: theme.spacing.xs,
                      paddingVertical: 2,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: `${theme.colors.success}15`,
                    }}>
                      <Text style={{
                        fontSize: 9,
                        fontWeight: '300',
                        color: theme.colors.success,
                        letterSpacing: 0.3,
                      }}>
                        Available
                      </Text>
                    </View>
                  )}
                </View>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: theme.spacing.sm,
                  paddingTop: theme.spacing.sm,
                  borderTopWidth: 0.5,
                  borderTopColor: 'rgba(0, 0, 0, 0.05)',
                }}>
                  <View>
                    {product.partnerPrice ? (
                      <>
                        <Text style={{
                          fontSize: 9,
                          fontWeight: '300',
                          color: theme.colors.text.secondary,
                          textDecorationLine: 'line-through',
                          letterSpacing: 0.2,
                        }}>
                          {product.standardPrice.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} / {product.unit}
                        </Text>
                        <Text style={{
                          fontSize: 12,
                          fontWeight: '300',
                          color: theme.colors.primary,
                          letterSpacing: 0.3,
                        }}>
                          {product.partnerPrice.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} / {product.unit}
                        </Text>
                        <Text style={{
                          fontSize: 9,
                          fontWeight: '300',
                          color: theme.colors.success,
                          marginTop: 2,
                          letterSpacing: 0.2,
                        }}>
                          Partner price
                        </Text>
                      </>
                    ) : (
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '300',
                        color: theme.colors.text.primary,
                        letterSpacing: 0.3,
                      }}>
                        {product.standardPrice.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} / {product.unit}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={{
                      paddingVertical: theme.spacing.xs,
                      paddingHorizontal: theme.spacing.sm,
                      borderRadius: theme.borderRadius.sm,
                      borderWidth: 0.5,
                      borderColor: theme.colors.primary,
                      backgroundColor: `${theme.colors.primary}10`,
                    }}
                  >
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '300',
                      color: theme.colors.primary,
                      letterSpacing: 0.3,
                    }}>
                      Order
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
