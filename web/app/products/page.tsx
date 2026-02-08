'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Apple, Carrot, Wheat, ChevronRight, MapPin } from 'lucide-react';
import { inventoryAPI } from '@/lib/api';
import { formatFarmerIdentity } from '@/lib/farmer-utils';

type CategoryFilter = 'fruits' | 'vegetables' | 'grains' | 'all';

function ProductsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>(
    (categoryParam as CategoryFilter) || 'all'
  );

  useEffect(() => {
    loadProducts();
  }, []);

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

  // Simple category mapping based on product name
  const getProductCategory = (productName: string): CategoryFilter => {
    const name = productName.toLowerCase();
    if (name.includes('apple') || name.includes('berry') || name.includes('fruit') || 
        name.includes('plum') || name.includes('cherry') || name.includes('pear')) {
      return 'fruits';
    }
    if (name.includes('pepper') || name.includes('tomato') || name.includes('cucumber') ||
        name.includes('vegetable') || name.includes('carrot') || name.includes('onion')) {
      return 'vegetables';
    }
    if (name.includes('wheat') || name.includes('grain') || name.includes('corn') ||
        name.includes('barley') || name.includes('oat')) {
      return 'grains';
    }
    return 'all';
  };

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'all') return products;
    return products.filter(product => 
      getProductCategory(product.productName || product.name || '') === activeFilter
    );
  }, [products, activeFilter]);

  const categories = [
    { id: 'fruits' as CategoryFilter, name: 'Fruits', icon: Apple, color: 'text-green-600', hoverColor: 'hover:text-green-700', borderColor: 'border-green-600' },
    { id: 'vegetables' as CategoryFilter, name: 'Vegetables', icon: Carrot, color: 'text-green-600', hoverColor: 'hover:text-green-700', borderColor: 'border-green-600' },
    { id: 'grains' as CategoryFilter, name: 'Grains', icon: Wheat, color: 'text-green-600', hoverColor: 'hover:text-green-700', borderColor: 'border-green-600' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-3xl font-light text-gray-900 mb-4">Available Products</h1>
          <p className="text-lg text-gray-600">
            Browse our organic products by category
          </p>
        </motion.div>

        {/* Category Filters */}
        <div className="mb-12 border-t border-b border-gray-200 py-4">
          <div className="flex gap-4 overflow-x-auto">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeFilter === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveFilter(category.id)}
                  className={`flex items-center gap-2 px-6 py-3 border rounded-lg transition-all ${
                    isActive
                      ? `${category.borderColor} border-2 bg-white`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon 
                    className={`w-5 h-5 ${isActive ? category.color : 'text-gray-400'} transition-colors`} 
                    strokeWidth={1.5} 
                  />
                  <span className={`text-sm font-light ${isActive ? category.color : 'text-gray-500'} transition-colors`}>
                    {category.name}
                  </span>
                  {isActive && (
                    <ChevronRight className={`w-4 h-4 ${category.color}`} strokeWidth={1.5} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
            <p className="mt-4 text-sm text-gray-500">Loading products...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-800 font-medium mb-2">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Showing {filteredProducts.length} {activeFilter !== 'all' ? categoryParam : ''} product{filteredProducts.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product: any, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-gray-200 p-6 hover:border-green-600 transition-all shadow-subtle shadow-subtle-hover"
                >
                  <div className="h-48 bg-gray-100 mb-4 flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-transparent group-hover:from-green-100/40 transition-colors"></div>
                    <div className="w-16 h-16 bg-gray-200 relative z-10"></div>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">{product.productName || product.name || 'Organic Product'}</h3>
                  
                  {/* VERA PRODUCER Brand & Farmer Identity */}
                  {product.estate?.owner && (
                    <div className="mb-3 pb-3 border-b border-gray-100">
                      <p className="text-[10px] font-light tracking-[0.15em] text-gray-400 uppercase mb-1.5">
                        VERA PRODUCER
                      </p>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-gray-400" strokeWidth={1} />
                        <span className="text-xs font-light text-gray-700">
                          {formatFarmerIdentity(
                            product.estate.owner.firstName,
                            undefined,
                            product.estate.location,
                            product.estate.location
                          )}
                        </span>
                      </div>
                      {product.estate.location && (
                        <p className="text-[10px] font-light tracking-[0.2em] text-gray-500 uppercase mt-1">
                          {product.estate.location}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-600 mb-4">{product.description || 'Organic product'}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-medium">{product.price || 'N/A'} RSD</span>
                    <span className="text-xs text-gray-500">{product.quantity || 0} kg</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-2">No products found in this category.</p>
            <Link href="/" className="text-green-600 hover:text-green-700 text-sm font-light">
              View all products →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
