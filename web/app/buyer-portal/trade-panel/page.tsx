'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { buyerTradePanelAPI, inventoryAPI, marketPricesAPI, digitalPassportsAPI } from '@/lib/api';
import PriceMatrixTable from '@/components/PriceMatrixTable';
import {
  X,
  Camera,
  FileText,
  Leaf,
  Award,
  Shield,
  MapPin,
  Calendar,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Lock,
  BarChart3,
  RefreshCw,
  Mountain,
  QrCode,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { getBuyerPortalNavItems } from '@/lib/buyer-portal-nav';

export default function TradePanelPage() {
  const buyerPortalNavItems = getBuyerPortalNavItems();
  const [supplyDemand, setSupplyDemand] = useState<any>(null);
  const [prices, setPrices] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [inventoryProducts, setInventoryProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [productDetails, setProductDetails] = useState<any | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [preOrderData, setPreOrderData] = useState({
    productName: '',
    quantity: 0,
    unit: 'kg',
    requestedDeliveryDate: '',
    lockPrice: false,
  });

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);
      
      // Load inventory products with images
      try {
        const inventoryData = await inventoryAPI.getAvailableProducts();
        setInventoryProducts(Array.isArray(inventoryData) ? inventoryData : []);
      } catch (err) {
        console.warn('Inventory API error:', err);
        setInventoryProducts([]);
      }

      // Load trade panel data (with error handling) - Optional, not critical
      try {
        const supplyDemandData = await buyerTradePanelAPI.getSupplyAndDemand();
        setSupplyDemand(supplyDemandData);
      } catch (err) {
        // This endpoint might not be available yet, that's OK
        console.warn('Supply & Demand API error (optional):', err);
        setSupplyDemand(null);
      }

      // ALWAYS load market prices - this is our source of truth for all products
      try {
        const marketPrices = await marketPricesAPI.getAllActive();
        console.log('🔍 Market prices API response:', marketPrices);
        console.log('📊 Market prices loaded:', marketPrices?.length || 0, 'items');
        if (marketPrices && marketPrices.length > 0) {
          console.log('✅ Setting prices state with', marketPrices.length, 'items');
          setPrices({ categories: [], allPrices: marketPrices });
        } else {
          console.warn('⚠️ No market prices found, trying fallback');
          // Try trade panel API as fallback
          try {
            const pricesData = await buyerTradePanelAPI.getRealTimePrices();
            setPrices(pricesData);
          } catch (err) {
            console.warn('Trade panel prices API error:', err);
            setPrices({ categories: [], allPrices: [] });
          }
        }
      } catch (e) {
        console.warn('Market prices API error:', e);
        // Fallback to trade panel API
        try {
          const pricesData = await buyerTradePanelAPI.getRealTimePrices();
          setPrices(pricesData);
        } catch (err) {
          console.warn('Trade panel prices API error:', err);
          setPrices({ categories: [], allPrices: [] });
        }
      }

      // Load forecast (optional)
      try {
        const forecastData = await buyerTradePanelAPI.getHarvestForecast(4);
        setForecast(forecastData);
      } catch (err) {
        // This endpoint might not be available yet, that's OK
        console.warn('Forecast API error (optional):', err);
        setForecast(null);
      }
    } catch (err: any) {
      console.error('Error loading trade panel data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePreOrder = async () => {
    try {
      const result = await buyerTradePanelAPI.createPreOrder(preOrderData);
      alert(result.message || 'Pre-order created successfully!');
      setPreOrderData({
        productName: '',
        quantity: 0,
        unit: 'kg',
        requestedDeliveryDate: '',
        lockPrice: false,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to create pre-order');
    }
  };

  // Categorize product
  const categorizeProduct = (productName: string): string => {
    const name = productName.toLowerCase();
    
    // Fruits
    const fruits = ['raspberry', 'blackberry', 'blueberry', 'strawberry', 'apple', 'jabuka', 'pear', 'plum', 'cherry', 'peach', 'apricot', 'grape', 'currant', 'malina', 'kupina', 'borovnica', 'jagoda', 'kruška', 'šljiva', 'trešnja', 'breskva', 'kajsija', 'grožđe', 'ribizla'];
    if (fruits.some(fruit => name.includes(fruit))) {
      return 'Fruits';
    }
    
    // Vegetables
    const vegetables = ['pepper', 'paprika', 'tomato', 'paradajz', 'cucumber', 'krastavac', 'zucchini', 'tikvica', 'onion', 'luk', 'garlic', 'beli luk', 'carrot', 'šargarepa', 'potato', 'krompir', 'cabbage', 'kupus', 'lettuce', 'salata', 'spinach', 'spanać', 'broccoli', 'cauliflower', 'bean', 'pasulj', 'pea', 'grašak', 'celery', 'celer', 'beet', 'cvekla'];
    if (vegetables.some(veg => name.includes(veg))) {
      return 'Vegetables';
    }
    
    // Grains
    const grains = ['wheat', 'pšenica', 'corn', 'kukuruz', 'barley', 'ječam', 'oats', 'zob', 'rye', 'raž', 'rice', 'pirinač', 'millet', 'proso', 'buckwheat', 'heljda', 'quinoa'];
    if (grains.some(grain => name.includes(grain))) {
      return 'Grains';
    }
    
    return 'Other';
  };

  // Format products for Price Matrix Table - Show ALL products, grouped by category
  const formatProductsForMatrix = () => {
    console.log('🔄 formatProductsForMatrix called');
    console.log('📦 inventoryProducts:', inventoryProducts.length);
    console.log('💰 prices state:', prices);
    
    const formattedProducts: any[] = [];
    const addedProductNames = new Set<string>();
    
    // First priority: Add products from inventory (farmer-added products with photos, estate info)
    console.log('🌾 Processing inventory products (from farmers):', inventoryProducts.length);

    // First, add products from inventory (with images and detailed info)
    inventoryProducts.forEach((product: any) => {
      console.log('🌾 Adding inventory product:', product.productName, 'Quantity:', product.quantity);
      addedProductNames.add(product.productName);
      const productPrice = prices?.categories?.flatMap((cat: any) => cat.products)?.find((p: any) => p.productName === product.productName) || 
                           prices?.allPrices?.find((p: any) => p.cropType === product.productName);
      
      const mainPhoto = product.compliancePhotos?.[0]?.photoUrl || 
                       product.batches?.[0]?.compliance_photos?.[0]?.photoUrl ||
                       product.photoUrl;

      // Determine if surge pricing is active
      const isSurgePricing = productPrice?.isLimitedPrice || false;
      const oldPrice = isSurgePricing && productPrice?.sellPrice ? productPrice.sellPrice / 1.05 : undefined;

      // Calculate lead time (default 48h to European warehouse)
      const leadTime = product.estimatedDeliveryDays 
        ? `${product.estimatedDeliveryDays * 24}h to European Warehouse`
        : '48h to European Warehouse';

      // Get certifications from estate
      const certifications = {
        globalGAP: product.estate?.certifications?.includes('GLOBALGAP') || 
                   product.estate?.certifications?.some((c: string) => c.toLowerCase().includes('globalgap')) || false,
        bio: product.estate?.certifications?.includes('BIO') || 
             product.estate?.certifications?.includes('ORGANIC') ||
             product.estate?.certifications?.some((c: string) => c.toLowerCase().includes('bio') || c.toLowerCase().includes('organic')) || false,
        ifs: product.estate?.certifications?.includes('IFS') ||
             product.estate?.certifications?.some((c: string) => c.toLowerCase().includes('ifs')) || false,
      };

      formattedProducts.push({
        id: product.id || product.batchId || crypto.randomUUID(),
        productName: product.productName,
        variety: product.variety || product.parcel?.seeds?.name || 'Standard',
        imageUrl: mainPhoto,
        certifications,
        currentPrice: productPrice?.sellPrice || product.unitPrice || 0,
        oldPrice,
        isSurgePricing,
        availableQuantity: product.quantity || 0,
        totalQuantity: product.totalQuantity || product.quantity || 0,
        leadTime,
        unit: product.unit || 'kg',
        availabilityStatus: product.availabilityStatus || (product.quantity > 0 ? 'IN_STOCK' : 'SOLD_OUT'),
        category: categorizeProduct(product.productName),
        estate: product.estate || product.estateName,
        estateId: product.estateId,
        batchId: product.batchId,
        parcelId: product.parcelId,
      });
    });

    // ALWAYS add products from market prices (even if we have inventory products)
    if (prices) {
      // First try categories (if they have products), then allPrices
      let allPrices: any[] = [];
      
      if (prices.categories && Array.isArray(prices.categories) && prices.categories.length > 0) {
        const categoryProducts = prices.categories.flatMap((cat: any) => cat.products || []);
        if (categoryProducts.length > 0) {
          allPrices = categoryProducts;
          console.log('💵 Using prices from categories:', allPrices.length, 'items');
        }
      }
      
      // If no products from categories, use allPrices
      if (allPrices.length === 0 && prices.allPrices && Array.isArray(prices.allPrices) && prices.allPrices.length > 0) {
        allPrices = prices.allPrices;
        console.log('💵 Using prices.allPrices:', allPrices.length, 'items');
      }
      
      console.log('💵 Processing market prices:', allPrices.length, 'items');
      if (allPrices.length > 0) {
        console.log('💵 Sample price item:', JSON.stringify(allPrices[0], null, 2));
      } else {
        console.warn('⚠️ No prices found in prices object');
        console.warn('   - prices.categories:', prices.categories);
        console.warn('   - prices.allPrices:', prices.allPrices);
      }
      
      allPrices.forEach((priceItem: any) => {
        // market_prices table uses 'cropType', not 'productName'
        const productName = priceItem.productName || priceItem.cropType;
        
        if (!productName) {
          console.warn('⚠️ Skipping price item without productName or cropType:', priceItem);
          return;
        }
        
        // Skip if already added from inventory
        if (addedProductNames.has(productName)) {
          console.log('⏭️ Skipping duplicate product:', productName);
          return;
        }

        const isSurgePricing = priceItem.isLimitedPrice || false;
        const oldPrice = isSurgePricing && priceItem.sellPrice ? priceItem.sellPrice / 1.05 : undefined;

        formattedProducts.push({
          id: priceItem.id || crypto.randomUUID(),
          productName,
          variety: priceItem.variety || 'Standard',
          imageUrl: null,
          certifications: {
            globalGAP: false,
            bio: false,
            ifs: false,
          },
          currentPrice: priceItem.sellPrice || 0,
          oldPrice,
          isSurgePricing,
          availableQuantity: priceItem.stock || 0,
          totalQuantity: priceItem.stock || 0,
          leadTime: '48h to European Warehouse',
          unit: priceItem.unit || 'kg',
          availabilityStatus: priceItem.availabilityStatus || 'IN_STOCK',
          category: categorizeProduct(productName),
          estate: priceItem.estateName || null,
          estateId: priceItem.estateId || null,
          batchId: priceItem.batchId || null,
        });
        
        addedProductNames.add(productName);
        console.log('✅ Added product from market prices:', productName, 'Price:', priceItem.sellPrice);
      });
    }

    // Remove duplicates by productName (keep first occurrence)
    const uniqueProducts = new Map<string, any>();
    formattedProducts.forEach((product) => {
      const key = product.productName.toLowerCase().trim();
      if (!uniqueProducts.has(key)) {
        uniqueProducts.set(key, product);
      } else {
        console.log('🔄 Removing duplicate product:', product.productName);
      }
    });
    
    const deduplicatedProducts = Array.from(uniqueProducts.values());

    // Filter by category if selected
    let filteredProducts = deduplicatedProducts;
    if (selectedCategory && selectedCategory !== 'All Products') {
      filteredProducts = deduplicatedProducts.filter(p => p.category === selectedCategory);
    }

    // Sort products alphabetically
    filteredProducts.sort((a, b) => a.productName.localeCompare(b.productName));
    
    console.log('✅ Final formatted products:', filteredProducts.length, 'items after filtering');
    if (filteredProducts.length > 0) {
      console.log('📝 Sample product:', filteredProducts[0]);
      
      // Group by category for summary
      const byCategory = filteredProducts.reduce((acc: any, p: any) => {
        const cat = p.category || 'Other';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});
      console.log('📊 Products by category:', byCategory);
    } else {
      console.error('❌ NO PRODUCTS FORMATTED!');
      console.error('   - inventoryProducts:', inventoryProducts.length);
      console.error('   - prices.allPrices:', prices?.allPrices?.length || 0);
      console.error('   - prices.categories:', prices?.categories?.length || 0);
    }
    
    return filteredProducts;

    // If still no products, add sample products for demonstration
    if (formattedProducts.length === 0) {
      const sampleProducts = [
        {
          id: 'sample-1',
          productName: 'Raspberries',
          variety: 'Heritage - Organic',
          imageUrl: null,
          certifications: { globalGAP: true, bio: true, ifs: false },
          currentPrice: 8.50,
          oldPrice: undefined,
          isSurgePricing: false,
          availableQuantity: 2500,
          totalQuantity: 3000,
          leadTime: '48h to European Warehouse',
          unit: 'kg',
          availabilityStatus: 'IN_STOCK' as const,
        },
        {
          id: 'sample-2',
          productName: 'Blackberries',
          variety: 'Thornfree',
          imageUrl: null,
          certifications: { globalGAP: true, bio: false, ifs: true },
          currentPrice: 7.20,
          oldPrice: 6.85,
          isSurgePricing: true,
          availableQuantity: 800,
          totalQuantity: 2000,
          leadTime: '48h to European Warehouse',
          unit: 'kg',
          availabilityStatus: 'LIMITED' as const,
        },
        {
          id: 'sample-3',
          productName: 'Blueberries',
          variety: 'Duke',
          imageUrl: null,
          certifications: { globalGAP: false, bio: true, ifs: false },
          currentPrice: 12.00,
          oldPrice: undefined,
          isSurgePricing: false,
          availableQuantity: 1500,
          totalQuantity: 2000,
          leadTime: '72h to European Warehouse',
          unit: 'kg',
          availabilityStatus: 'IN_STOCK' as const,
        },
      ];
      formattedProducts.push(...sampleProducts);
    }

    return formattedProducts;
  };

  // Handle order from Price Matrix Table
  const handleMatrixOrder = async (productId: string, quantity: number, lockPrice: boolean) => {
    try {
      const product = inventoryProducts.find((p: any) => (p.id || p.batchId) === productId);
      if (!product) {
        alert('Product not found');
        return;
      }

      const result = await buyerTradePanelAPI.createPreOrder({
        productName: product.productName,
        quantity,
        unit: product.unit || 'kg',
        requestedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
        lockPrice,
      });

      alert(result.message || 'Order created successfully!');
      loadData(); // Refresh data
    } catch (err: any) {
      alert(err.message || 'Failed to create order');
    }
  };

  // Handle product click - load all partners/products for this product
  const handleProductClick = async (product: any) => {
    try {
      setShowProductDetails(true);
      setProductDetails(product);
      
      // Load all products with this name from inventory (all Vera Partners)
      try {
        const allProducts = await inventoryAPI.getAvailableProducts();
        const productPartners = allProducts.filter((p: any) => 
          p.productName.toLowerCase() === product.productName.toLowerCase()
        );
        
        console.log(`📦 Found ${productPartners.length} Vera Partners with ${product.productName}`);
        
        // Group by estate/partner
        const partnersMap = new Map();
        productPartners.forEach((p: any) => {
          const estateId = p.estate?.id || 'unknown';
          if (!partnersMap.has(estateId)) {
            partnersMap.set(estateId, {
              estate: p.estate,
              products: [],
              totalQuantity: 0,
            });
          }
          const partner = partnersMap.get(estateId);
          partner.products.push(p);
          partner.totalQuantity += p.quantity || 0;
        });
        
        const partners = Array.from(partnersMap.values());
        setProductDetails((prev: any) => ({ 
          ...prev, 
          partners,
          partnerCount: partners.length,
          totalAvailableQuantity: productPartners.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0),
        }));
      } catch (err) {
        console.warn('Could not load partners:', err);
      }
      
      // Load additional details if available
      if (product.batchId) {
        try {
          const passport = await digitalPassportsAPI.getByBatch(product.batchId);
          setProductDetails((prev: any) => ({ ...prev, passport }));
        } catch (err) {
          console.warn('Could not load passport:', err);
        }
      }
    } catch (err: any) {
      console.error('Error loading product details:', err);
    }
  };

  // Handle price change
  const handlePriceChange = async (productId: string, newPrice: number) => {
    try {
      const product = formatProductsForMatrix().find((p: any) => p.id === productId);
      if (!product) {
        alert('Product not found');
        return;
      }

      // Update price via market prices API
      const currentPrice = await marketPricesAPI.getCurrent(product.productName);
      if (currentPrice && currentPrice.id) {
        await marketPricesAPI.update(currentPrice.id, {
          sellPrice: newPrice,
        });
        alert(`Price updated to €${newPrice.toFixed(2)}`);
        loadData(); // Refresh data
      } else {
        // Create new price entry
        await marketPricesAPI.create({
          cropType: product.productName,
          buyPrice: newPrice * 0.7, // Estimate buy price as 70% of sell price
          sellPrice: newPrice,
        });
        alert(`New price set: €${newPrice.toFixed(2)}`);
        loadData(); // Refresh data
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update price');
    }
  };

  // Prepare chart data - Static, no animations
  const supplyDemandChartData = supplyDemand?.data?.map((item: any) => ({
    product: item.productName,
    supply: item.supply,
    demand: item.demand,
    status: item.status,
  })) || [];

  // Get all products from categories
  const allProducts = prices?.categories?.flatMap((cat: any) => cat.products) || prices?.allPrices || [];
  const categories = prices?.categories || [];
  
  // Filter by selected category
  const filteredProducts = selectedCategory
    ? allProducts.filter((p: any) => p.category === selectedCategory)
    : allProducts;

  // Static price chart data - stable line
  const priceChartData = filteredProducts
    .filter((p: any) => p.sellPrice)
    .map((p: any) => ({
      product: p.productName,
      price: p.sellPrice,
      category: p.category,
    })) || [];

  // Get availability status badge
  const getAvailabilityBadge = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return { text: 'In Stock', color: 'bg-[#2D5A27]/15 text-[#23471f]', border: 'border-[#2D5A27]/20' };
      case 'LIMITED':
        return { text: 'Limited', color: 'bg-orange-100 text-orange-800', border: 'border-orange-200' };
      case 'SOLD_OUT':
        return { text: 'Sold Out', color: 'bg-gray-100 text-gray-800', border: 'border-gray-200' };
      default:
        return { text: 'Unknown', color: 'bg-gray-100 text-gray-800', border: 'border-gray-200' };
    }
  };

  if (loading) {
    return (
      <AuthGuard requiredRoles={['BUYER']}>
        <SidebarLayout title="Trade Panel" navItems={buyerPortalNavItems}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D5A27] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading trade data...</p>
            </div>
          </div>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRoles={['BUYER']}>
      <SidebarLayout title="Vera Trade" navItems={buyerPortalNavItems}>
        <div className="space-y-8">
          {/* Header */}
          <div className="border-b border-[#2D5A27]/20/50 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-light text-gray-900">Vera Trade</h1>
                <p className="text-sm text-gray-600 mt-2 font-light">
                  Real-time market intelligence & trading platform
                </p>
              </div>
              <button
                onClick={loadData}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-light hover:border-[#2D5A27]/50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Product Catalog */}
          <div className="border-b border-[#2D5A27]/20/50 pb-8">
            <div className="mb-6">
              <h2 className="text-xl font-light text-gray-900 mb-2">Product Catalog</h2>
              <p className="text-sm text-gray-600 font-light">
                Available products from Vera Partners
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 text-sm font-light transition-colors border ${
                  selectedCategory === null
                    ? 'border-[#2D5A27]/50 text-[#2D5A27]/80 bg-[#2D5A27]/10/20'
                    : 'border-gray-300 text-gray-700 hover:border-[#2D5A27]/20/50'
                }`}
              >
                All Products
              </button>
              <button
                onClick={() => setSelectedCategory('Fruits')}
                className={`px-4 py-2 text-sm font-light transition-colors border ${
                  selectedCategory === 'Fruits'
                    ? 'border-[#2D5A27]/50 text-[#2D5A27]/80 bg-[#2D5A27]/10/20'
                    : 'border-gray-300 text-gray-700 hover:border-[#2D5A27]/20/50'
                }`}
              >
                Fruits
              </button>
              <button
                onClick={() => setSelectedCategory('Vegetables')}
                className={`px-4 py-2 text-sm font-light transition-colors border ${
                  selectedCategory === 'Vegetables'
                    ? 'border-[#2D5A27]/50 text-[#2D5A27]/80 bg-[#2D5A27]/10/20'
                    : 'border-gray-300 text-gray-700 hover:border-[#2D5A27]/20/50'
                }`}
              >
                Vegetables
              </button>
              <button
                onClick={() => setSelectedCategory('Grains')}
                className={`px-4 py-2 text-sm font-light transition-colors border ${
                  selectedCategory === 'Grains'
                    ? 'border-[#2D5A27]/50 text-[#2D5A27]/80 bg-[#2D5A27]/10/20'
                    : 'border-gray-300 text-gray-700 hover:border-[#2D5A27]/20/50'
                }`}
              >
                Grains
              </button>
            </div>

            {(() => {
              const matrixProducts = formatProductsForMatrix();
              return (
                <PriceMatrixTable
                  products={matrixProducts}
                  onOrder={handleMatrixOrder}
                  onPriceChange={handlePriceChange}
                  onProductClick={handleProductClick}
                />
              );
            })()}
          </div>

          {/* Product Details Modal */}
          {showProductDetails && productDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-gray-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-light text-gray-900">{productDetails.productName}</h2>
                  <button
                    onClick={() => setShowProductDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <p className="text-gray-600 font-light">
                    From: {productDetails.estate?.name || productDetails.estate || 'Available from European Producers'}
                  </p>

                  {/* Origin & Growing Method */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Mountain className="w-5 h-5 text-[#2D5A27]" />
                        Origin Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Farm:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {productDetails.estate?.name || productDetails.estate || 'Vera Partner'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Harvested:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {productDetails.harvestDate
                              ? new Date(productDetails.harvestDate).toLocaleDateString()
                              : productDetails.estate?.harvestDate
                                ? new Date(productDetails.estate.harvestDate).toLocaleDateString()
                                : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Leaf className="w-5 h-5 text-[#2D5A27]" />
                        Growing Method
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Certification:</span>
                          <span className="ml-2 font-medium text-[#2D5A27]">Bio Vera Certified</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Method:</span>
                          <span className="ml-2 font-medium text-gray-900">Organic & Sustainable</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Digital Passport (Energetski Pasos) */}
                  <div className="border-b border-gray-200/50 pb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-[#2D5A27]" />
                      Digital Passport (Energetski Pasos)
                    </h3>
                    {productDetails.passport ? (
                      <div className="bg-[#2D5A27]/10/20 border border-[#2D5A27]/20/50 rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Passport Hash:</span>
                            <span className="text-xs font-mono text-gray-700">
                              {(productDetails.passport.hash || productDetails.passport.passportHash || 'N/A').slice(0, 20)}...
                            </span>
                          </div>
                          {productDetails.passport.timeline && productDetails.passport.timeline.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-900 mb-2">Journey Timeline</p>
                              <div className="space-y-2">
                                {productDetails.passport.timeline.map((stage: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-3 text-sm">
                                    <div className="w-2 h-2 bg-[#2D5A27]/60 rounded-full" />
                                    <span>{stage.stage}</span>
                                    {stage.date && <span className="text-gray-500">{new Date(stage.date).toLocaleDateString()}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {productDetails.batchId && (
                            <div className="mt-3 pt-3 border-t border-[#2D5A27]/20/50">
                              <p className="text-xs text-gray-600 mb-1">Scan QR or open full passport</p>
                              <p className="text-xs text-gray-500 mb-2">Batch: {productDetails.batchId}</p>
                              <Link
                                href={`/passport/${productDetails.batchId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2D5A27] hover:text-[#23471f]"
                              >
                                View full passport (product, photos, producer)
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-600 font-light">Digital passport not available for this product</p>
                      </div>
                    )}
                  </div>

                  {/* Quantity & Price + Actions */}
                  <div className="grid grid-cols-2 gap-4 border-b border-gray-200/50 pb-6">
                    <div>
                      <p className="text-sm text-gray-600 font-light mb-1">Quantity Available</p>
                      <p className="text-xl font-light text-gray-900">
                        {productDetails.availableQuantity?.toFixed(0) ?? productDetails.quantity ?? 0} {productDetails.unit || 'kg'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-light mb-1">Price per {productDetails.unit || 'kg'}</p>
                      <p className="text-xl font-light text-[#2D5A27]/80">
                        €{productDetails.currentPrice?.toFixed(2) ?? productDetails.unitPrice?.toFixed(2) ?? '0.00'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 px-4 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg">
                      Add to Cart
                    </button>
                    <button className="px-4 py-3 border border-gray-300 text-gray-700 text-sm font-medium hover:border-[#2D5A27]/20 transition-colors rounded-lg">
                      Request Quote
                    </button>
                  </div>

                  {/* Certifications */}
                  {(productDetails.certifications?.globalGAP || productDetails.certifications?.bio || productDetails.certifications?.ifs) && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Certifications</p>
                      <div className="flex gap-2">
                        {productDetails.certifications?.globalGAP && (
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium flex items-center gap-1">
                            <Award className="w-4 h-4" /> GlobalGAP
                          </span>
                        )}
                        {productDetails.certifications?.bio && (
                          <span className="px-3 py-1 bg-[#2D5A27]/10 text-[#2D5A27] rounded-lg text-xs font-medium flex items-center gap-1">
                            <Leaf className="w-4 h-4" /> Bio
                          </span>
                        )}
                        {productDetails.certifications?.ifs && (
                          <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium flex items-center gap-1">
                            <Shield className="w-4 h-4" /> IFS
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Photos */}
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Product Photos</p>
                    <div className="grid grid-cols-3 gap-3">
                      {productDetails.imageUrl ? (
                        <img
                          src={productDetails.imageUrl}
                          alt={productDetails.productName}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Camera className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vera Partners Section */}
                  {productDetails.partners && productDetails.partners.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-gray-500">
                          Vera Partners ({productDetails.partnerCount || productDetails.partners.length})
                        </p>
                        <span className="text-xs text-gray-500">
                          Total Available: {productDetails.totalAvailableQuantity?.toFixed(0) || 0} {productDetails.unit || 'kg'}
                        </span>
                      </div>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {productDetails.partners.map((partner: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-[#2D5A27]/40 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900">{partner.estate?.name || 'Unknown Estate'}</h4>
                                {partner.estate?.certificationStartDate && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Certified since {new Date(partner.estate.certificationStartDate).getFullYear()}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-[#2D5A27]">
                                  {partner.totalQuantity.toFixed(0)} {productDetails.unit || 'kg'}
                                </p>
                                <p className="text-xs text-gray-500">{partner.products.length} {partner.products.length === 1 ? 'batch' : 'batches'}</p>
                              </div>
                            </div>
                            
                            {/* Partner Products */}
                            <div className="mt-3 space-y-2">
                              {partner.products.map((p: any, pIndex: number) => (
                                <div key={pIndex} className="bg-gray-50 rounded p-2 flex items-center justify-between">
                                  <div className="flex-1">
                                    {p.variety && p.variety !== 'Standard' && (
                                      <p className="text-xs font-medium text-gray-700">Variety: {p.variety}</p>
                                    )}
                                    {p.parcel?.seed?.name && (
                                      <p className="text-xs text-gray-500">Seed: {p.parcel.seed.name}</p>
                                    )}
                                    {p.harvestDate && (
                                      <p className="text-xs text-gray-500">
                                        Harvested: {new Date(p.harvestDate).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right ml-4">
                                    <p className="text-sm font-semibold text-gray-900">{p.quantity?.toFixed(0) || 0} {p.unit || 'kg'}</p>
                                    {p.unitPrice && (
                                      <p className="text-xs text-gray-500">€{p.unitPrice.toFixed(2)}/kg</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Photos from this partner */}
                            {partner.products.some((p: any) => p.compliancePhotos?.length > 0) && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-gray-500 mb-2">Photos</p>
                                <div className="grid grid-cols-4 gap-2">
                                  {partner.products.flatMap((p: any) => p.compliancePhotos || []).slice(0, 4).map((photo: any, photoIndex: number) => (
                                    <img
                                      key={photoIndex}
                                      src={photo.photoUrl}
                                      alt={`${partner.estate?.name} product`}
                                      className="w-full h-20 object-cover rounded"
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}


          {/* Harvest Forecast */}
          <div className="border-b border-[#2D5A27]/20/50 pb-8">
            <div className="mb-6">
              <h2 className="text-xl font-light text-gray-900 mb-2">Harvest Forecast</h2>
              <p className="text-sm text-gray-600 font-light">Next 4 weeks</p>
            </div>

            {forecast?.forecast && forecast.forecast.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={forecast.forecast} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="week" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line
                      type="monotone"
                      dataKey="estimatedQuantity"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Estimated Quantity (kg)"
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {forecast.forecast.slice(0, 8).map((item: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg hover:border-[#2D5A27] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-gray-900">{item.productName}</p>
                        <span className="text-xs text-gray-500">
                          Week of {new Date(item.week).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-[#2D5A27]">
                        {item.estimatedQuantity.toFixed(0)} {item.unit}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.farmCount} farm{item.farmCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Calendar className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-600 mb-2">No Forecast Data Available</p>
                <p className="text-sm text-gray-500 text-center max-w-md">
                  Harvest forecast will appear here once farmers add parcel data with planting dates and expected harvest information.
                </p>
              </div>
            )}
          </div>

          {/* Pre-Order & Lock Price */}
          <div className="border-b border-[#2D5A27]/20/50 pb-8">
            <div className="mb-6">
              <h2 className="text-xl font-light text-gray-900 mb-2">Pre-Order & Lock Price</h2>
              <p className="text-sm text-gray-600 font-light">Secure your order and lock current price</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product
                </label>
                <select
                  value={preOrderData.productName}
                  onChange={(e) =>
                    setPreOrderData({ ...preOrderData, productName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27]"
                >
                  <option value="">Select product</option>
                  {categories.map((cat: any) => (
                    <optgroup key={cat.category} label={cat.category}>
                      {cat.products
                        .filter((p: any) => p.isAvailable)
                        .map((p: any) => (
                          <option key={p.productName} value={p.productName}>
                            {p.productName}
                            {p.sellPrice ? ` - €${p.sellPrice.toFixed(2)}/${preOrderData.unit}` : ' - Price TBD'}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={preOrderData.quantity}
                  onChange={(e) =>
                    setPreOrderData({ ...preOrderData, quantity: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27]"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requested Delivery Date
                </label>
                <input
                  type="date"
                  value={preOrderData.requestedDeliveryDate}
                  onChange={(e) =>
                    setPreOrderData({ ...preOrderData, requestedDeliveryDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lockPrice"
                  checked={preOrderData.lockPrice}
                  onChange={(e) =>
                    setPreOrderData({ ...preOrderData, lockPrice: e.target.checked })
                  }
                  className="w-4 h-4 text-[#2D5A27] border-gray-300 rounded focus:ring-[#2D5A27]"
                />
                <label htmlFor="lockPrice" className="text-sm font-medium text-gray-700">
                  Lock current price (better rate)
                </label>
              </div>
            </div>

            <button
              onClick={handlePreOrder}
              disabled={!preOrderData.productName || !preOrderData.quantity || !preOrderData.requestedDeliveryDate}
              className="mt-4 w-full px-4 py-3 bg-[#2D5A27] text-white rounded-lg hover:bg-[#23471f] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Pre-Order {preOrderData.lockPrice && '& Lock Price'}
            </button>
          </div>
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
