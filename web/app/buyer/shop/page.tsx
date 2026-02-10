'use client';

import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { inventoryAPI, ordersAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Apple, Carrot, Wheat, ChevronRight } from 'lucide-react';
import { formatFarmerIdentity, getFirstName } from '@/lib/farmer-utils';

export default function ShopPage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login/buyer');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
    }
  }, [isAuthenticated]);

  const loadProducts = async () => {
    try {
      const data = await inventoryAPI.getAvailableProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: any) => {
    setCart([...cart, { ...product, quantity: 1 }]);
  };

  const createOrder = async () => {
    if (cart.length === 0) return;

    try {
      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      };
      await ordersAPI.create(orderData);
      setCart([]);
      alert('Porudžbina je kreirana!');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Greška pri kreiranju porudžbine');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D5A27]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="text-2xl font-bold text-[#2D5A27]">
              🌱 Bio Vera
            </Link>
            <nav className="flex gap-4 items-center">
              <Link href="/buyer/orders" className="px-4 py-2 text-gray-700 hover:text-[#2D5A27]">
                My Orders
              </Link>
              <span className="text-gray-700">Korpa ({cart.length})</span>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Welcome, {user?.firstName || 'Customer'}! 🛒
        </h1>

        {/* Category Filters */}
        <div className="mb-8 border-t border-b border-gray-200 py-4">
          <div className="flex gap-4 overflow-x-auto">
            {[
              { id: 'fruits', name: 'Fruits', icon: Apple, color: 'text-[#2D5A27]' },
              { id: 'vegetables', name: 'Vegetables', icon: Carrot, color: 'text-[#2D5A27]' },
              { id: 'grains', name: 'Grains', icon: Wheat, color: 'text-[#2D5A27]' },
            ].map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.id}
                  href={`/buyer-portal/trade-panel?category=${category.id}`}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:border-[#2D5A27] transition-all group"
                >
                  <Icon className={`w-5 h-5 ${category.color} group-hover:scale-110 transition-transform`} strokeWidth={1.5} />
                  <span className={`text-sm font-light ${category.color} group-hover:text-[#2D5A27] transition-colors`}>
                    {category.name}
                  </span>
                  <ChevronRight className={`w-4 h-4 ${category.color} opacity-0 group-hover:opacity-100 transition-opacity`} strokeWidth={1.5} />
                </Link>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D5A27]"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
              {products.map((product: any) => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-[#2D5A27]/10 flex items-center justify-center">
                    <span className="text-6xl">🌾</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{product.productName || product.name || 'Bio Proizvod'}</h3>
                    
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
                        <p className="text-[10px] font-light tracking-[0.2em] text-gray-500 uppercase mt-1">
                          {product.estate.location || 'Unknown Region'}
                        </p>
                      </div>
                    )}
                    
                    <p className="text-gray-600 text-sm mb-2">{product.description || 'Organski proizvod'}</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[#2D5A27] font-bold">{product.price || 'N/A'} RSD</span>
                      <span className="text-sm text-gray-500">{product.quantity || 0} kg</span>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full bg-[#2D5A27] text-white py-2 rounded-lg hover:bg-[#23471f] transition-colors"
                    >
                      Dodaj u korpu
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="fixed bottom-0 right-0 m-4 bg-white rounded-lg shadow-xl p-6 max-w-sm">
                <h3 className="font-semibold text-lg mb-4">Korpa ({cart.length})</h3>
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span>{item.price} RSD</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={createOrder}
                  className="w-full bg-[#2D5A27] text-white py-3 rounded-lg hover:bg-[#23471f] font-semibold"
                >
                  Poruči ({cart.reduce((sum, item) => sum + (item.price || 0), 0)} RSD)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
