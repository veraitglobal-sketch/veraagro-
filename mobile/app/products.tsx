import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Apple, 
  Carrot, 
  Wheat,
  Cherry,
  Circle,
  PepperHot,
  Bean,
  LeafyGreen,
  Sprout,
} from 'lucide-react-native';
import { inventoryAPI, Product } from '../lib/api';
import { theme } from '../lib/theme';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

type CategoryFilter = 'fruits' | 'vegetables' | 'grains' | 'all';

/**
 * Products Page with Category Filters
 * Single page that filters products by category
 */
export default function ProductsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Initialize filter from route params or default to 'all'
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');

  useEffect(() => {
    // Set initial filter from route params
    if (params.category && ['fruits', 'vegetables', 'grains', 'all'].includes(params.category)) {
      setActiveFilter(params.category as CategoryFilter);
    }
    loadProducts();
  }, [params.category]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryAPI.getAvailableProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  // Category mapping
  const categories: Array<{
    id: CategoryFilter;
    name: string;
    icon: typeof Apple;
    color: string;
  }> = [
    { id: 'fruits', name: t('marketplace.categories.fruits'), icon: Apple, color: theme.colors.error },
    { id: 'vegetables', name: t('marketplace.categories.vegetables'), icon: Carrot, color: theme.colors.warning },
    { id: 'grains', name: t('marketplace.categories.grains'), icon: Wheat, color: theme.colors.accent },
  ];

  // BioVera product catalog by category with unique icons
  // Using only icons that are available in lucide-react-native
  const productCatalog = {
    fruits: [
      { name: 'Apples', description: 'Traditional organic apple varieties', season: 'Autumn', icon: Apple },
      { name: 'Pears', description: 'Organic pears from certified farms', season: 'Autumn', icon: Circle },
      { name: 'Raspberries', description: 'Organic raspberries from Balkan farms', season: 'Summer', icon: Cherry },
      { name: 'Strawberries', description: 'Fresh organic strawberries', season: 'Spring/Summer', icon: Cherry },
      { name: 'Blueberries', description: 'Premium organic blueberries', season: 'Summer', icon: Cherry },
      { name: 'Blackberries', description: 'Wild organic blackberries', season: 'Summer', icon: Cherry },
      { name: 'Plums', description: 'Traditional Balkan plum varieties', season: 'Late Summer', icon: Circle },
      { name: 'Cherries', description: 'Sweet organic cherries', season: 'Early Summer', icon: Cherry },
    ],
    vegetables: [
      { name: 'Peppers', description: 'Organic bell peppers and hot peppers', season: 'Summer/Autumn', icon: PepperHot },
      { name: 'Tomatoes', description: 'Heirloom organic tomatoes', season: 'Summer/Autumn', icon: Circle },
      { name: 'Cucumbers', description: 'Fresh organic cucumbers', season: 'Summer', icon: Sprout },
      { name: 'Zucchini', description: 'Organic zucchini and squash', season: 'Summer', icon: Sprout },
      { name: 'Eggplant', description: 'Traditional organic eggplant', season: 'Summer/Autumn', icon: Circle },
      { name: 'Cabbage', description: 'Organic white and red cabbage', season: 'Autumn/Winter', icon: LeafyGreen },
      { name: 'Carrots', description: 'Organic carrots from certified farms', season: 'Year-round', icon: Carrot },
      { name: 'Onions', description: 'Organic onions and shallots', season: 'Year-round', icon: Circle },
      { name: 'Garlic', description: 'Premium organic garlic', season: 'Year-round', icon: Circle },
      { name: 'Potatoes', description: 'Organic potatoes, various varieties', season: 'Year-round', icon: Circle },
      { name: 'Beans', description: 'Organic green beans and dry beans', season: 'Summer/Autumn', icon: Bean },
      { name: 'Peas', description: 'Fresh organic peas', season: 'Spring/Summer', icon: Sprout },
    ],
    grains: [
      { name: 'Wheat', description: 'Organic wheat for flour production', season: 'Harvest: Summer', icon: Wheat },
      { name: 'Corn', description: 'Organic corn, various varieties', season: 'Harvest: Autumn', icon: Circle },
      { name: 'Barley', description: 'Organic barley for brewing and food', season: 'Harvest: Summer', icon: Wheat },
      { name: 'Oats', description: 'Organic oats for healthy breakfast', season: 'Harvest: Summer', icon: Wheat },
      { name: 'Rye', description: 'Organic rye for traditional bread', season: 'Harvest: Summer', icon: Wheat },
      { name: 'Buckwheat', description: 'Organic buckwheat, gluten-free', season: 'Harvest: Late Summer', icon: Wheat },
      { name: 'Millet', description: 'Organic millet, nutrient-rich grain', season: 'Harvest: Autumn', icon: Wheat },
    ],
  };

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (activeFilter === 'all') {
      return products;
    }

    // Simple keyword-based filtering
    // In production, this should use actual category data from backend
    const categoryKeywords: Record<CategoryFilter, string[]> = {
      fruits: ['raspberry', 'strawberry', 'blueberry', 'blackberry', 'apple', 'pear', 'plum', 'cherry', 'fruit'],
      vegetables: ['pepper', 'tomato', 'cucumber', 'zucchini', 'eggplant', 'cabbage', 'carrot', 'onion', 'garlic', 'potato', 'bean', 'pea', 'vegetable'],
      grains: ['wheat', 'corn', 'barley', 'oats', 'rye', 'buckwheat', 'millet', 'grain'],
      all: [],
    };

    const keywords = categoryKeywords[activeFilter] || [];
    
    return products.filter((product) => {
      const productName = product.productName.toLowerCase();
      const cropType = product.parcel?.cropType?.toLowerCase() || '';
      return keywords.some(keyword => 
        productName.includes(keyword) || cropType.includes(keyword)
      );
    });
  }, [products, activeFilter]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: 60,
        paddingBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
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
          <Text style={{
            fontSize: 18,
            fontWeight: '300',
            color: theme.colors.text.primary,
            letterSpacing: 1,
          }}>
            Products
          </Text>
        </View>
      </View>

      {/* Category Filters */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
        gap: theme.spacing.sm,
      }}>
        {/* All Filter */}
        <TouchableOpacity
          onPress={() => setActiveFilter('all')}
          style={{
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.xs,
            borderBottomWidth: activeFilter === 'all' ? 1 : 0,
            borderBottomColor: theme.colors.primary,
          }}
        >
          <Text style={{
            fontSize: 12,
            fontWeight: activeFilter === 'all' ? '400' : '300',
            color: activeFilter === 'all' ? theme.colors.primary : theme.colors.text.secondary,
            letterSpacing: 0.5,
          }}>
            All
          </Text>
        </TouchableOpacity>

        {/* Category Filters */}
        {categories.map((category) => {
          const isActive = activeFilter === category.id;
          
          return (
            <TouchableOpacity
              key={category.id}
              onPress={() => setActiveFilter(category.id)}
              style={{
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
                borderBottomWidth: isActive ? 1 : 0,
                borderBottomColor: category.color,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <category.icon 
                size={14} 
                color={isActive ? category.color : theme.colors.text.secondary} 
                strokeWidth={1} 
              />
              <Text style={{
                fontSize: 12,
                fontWeight: isActive ? '400' : '300',
                color: isActive ? category.color : theme.colors.text.secondary,
                letterSpacing: 0.5,
              }}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Products List */}
      {loading ? (
        <LoadingSpinner message="Loading products..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadProducts} />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.text.secondary}
              colors={[theme.colors.primary]}
            />
          }
        >
          <View style={{ padding: theme.spacing.md }}>
            {/* Available Products Section */}
            {filteredProducts.length > 0 && (
              <>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '400',
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.md,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}>
                  Available Now
                </Text>
                <View style={{ 
                  flexDirection: 'row', 
                  flexWrap: 'wrap', 
                  justifyContent: 'space-between',
                  gap: theme.spacing.md,
                  marginBottom: theme.spacing.xl,
                }}>
                  {filteredProducts.map((product) => (
                    <View key={product.id} style={{ width: '48%' }}>
                      <ProductCard 
                        product={product} 
                        showActions={true}
                        onPress={() => router.push(`/product/${product.id}`)}
                      />
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Product Catalog Section */}
            {activeFilter !== 'all' && (
              <>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '400',
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.md,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}>
                  {categories.find(c => c.id === activeFilter)?.name} - Full Catalog
                </Text>
                <View style={{ gap: theme.spacing.sm }}>
                  {productCatalog[activeFilter]?.map((item, index) => {
                    const isAvailable = filteredProducts.some(p => 
                      p.productName.toLowerCase().includes(item.name.toLowerCase())
                    );
                    const IconComponent = item.icon || Circle; // Fallback to Circle if icon is undefined
                    const categoryColor = categories.find(c => c.id === activeFilter)?.color || theme.colors.primary;
                    
                    return (
                      <View
                        key={index}
                        style={{
                          backgroundColor: theme.colors.surface,
                          borderRadius: theme.borderRadius.md,
                          padding: theme.spacing.md,
                          borderWidth: 0.5,
                          borderColor: isAvailable ? theme.colors.primary : 'rgba(0, 0, 0, 0.05)',
                          opacity: isAvailable ? 1 : 0.7,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md }}>
                          {/* Product Icon */}
                          <View style={{
                            width: 40,
                            height: 40,
                            borderRadius: theme.borderRadius.sm,
                            backgroundColor: `${categoryColor}08`,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {IconComponent && typeof IconComponent === 'function' ? (
                              <IconComponent 
                                size={20} 
                                color={categoryColor} 
                                strokeWidth={1} 
                              />
                            ) : (
                              <Circle 
                                size={20} 
                                color={categoryColor} 
                                strokeWidth={1} 
                              />
                            )}
                          </View>

                          {/* Product Info */}
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: 4, flexWrap: 'wrap' }}>
                              <Text style={{
                                fontSize: 14,
                                fontWeight: '300',
                                color: theme.colors.text.primary,
                                letterSpacing: 0.3,
                              }}>
                                {item.name}
                              </Text>
                              {isAvailable && (
                                <View style={{
                                  backgroundColor: `${theme.colors.primary}15`,
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: theme.borderRadius.sm,
                                }}>
                                  <Text style={{
                                    fontSize: 9,
                                    fontWeight: '300',
                                    color: theme.colors.primary,
                                    letterSpacing: 0.5,
                                    textTransform: 'uppercase',
                                  }}>
                                    Available
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={{
                              fontSize: 11,
                              fontWeight: '300',
                              color: theme.colors.text.secondary,
                              letterSpacing: 0.2,
                              lineHeight: 16,
                              marginBottom: 4,
                            }}>
                              {item.description}
                            </Text>
                            {item.season && (
                              <View style={{
                                alignSelf: 'flex-start',
                                backgroundColor: `${categoryColor}10`,
                                paddingHorizontal: theme.spacing.sm,
                                paddingVertical: 4,
                                borderRadius: theme.borderRadius.sm,
                                marginTop: 4,
                              }}>
                                <Text style={{
                                  fontSize: 10,
                                  fontWeight: '300',
                                  color: categoryColor,
                                  letterSpacing: 0.5,
                                  textTransform: 'uppercase',
                                }}>
                                  {item.season}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* Empty State */}
            {filteredProducts.length === 0 && activeFilter === 'all' && (
              <View style={{
                padding: theme.spacing.xl,
                alignItems: 'center',
              }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: theme.colors.text.secondary,
                  textAlign: 'center',
                }}>
                  No products found
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
