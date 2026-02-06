'use client';

import { useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';

import { Building2 } from 'lucide-react';

import { getBuyerPortalNavItems } from '@/lib/buyer-portal-nav';

export default function BuyerPortalPage() {
  const buyerPortalNavItems = getBuyerPortalNavItems();
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});
  const [availableProducts] = useState([
    { id: '1', name: 'Raspberry', unit: 'kg', price: 8.50, available: 450 },
    { id: '2', name: 'Blackberry', unit: 'kg', price: 9.20, available: 320 },
    { id: '3', name: 'Blueberry', unit: 'kg', price: 12.00, available: 280 },
    { id: '4', name: 'Apple', unit: 'kg', price: 2.50, available: 1200 },
    { id: '5', name: 'Pepper', unit: 'kg', price: 4.80, available: 650 },
  ]);

  const handleQuantityChange = (productId: string, quantity: number) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  const totalQuantity = Object.values(selectedProducts).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = availableProducts.reduce((sum, product) => {
    const qty = selectedProducts[product.id] || 0;
    return sum + (qty * product.price);
  }, 0);

  return (
    <SidebarLayout title="Buyer Order Portal" navItems={buyerPortalNavItems}>
      <div className="space-y-6">
        {/* Order Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Order</h2>
          <div className="space-y-4">
            {availableProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">
                    €{product.price.toFixed(2)}/{product.unit} • Available: {product.available} {product.unit}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max={product.available}
                    value={selectedProducts[product.id] || 0}
                    onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                  />
                  <span className="text-sm text-gray-500">{product.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          {totalQuantity > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">Total Quantity</p>
                <p className="font-semibold text-gray-900">{totalQuantity} kg</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Total Price</p>
                <p className="text-xl font-bold text-green-700">€{totalPrice.toFixed(2)}</p>
              </div>
              <button className="w-full mt-4 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                Submit Order
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Order #ORD-2024-001</p>
                <p className="text-sm text-gray-500">Raspberry • 120 kg • €1,020.00</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Delivered
              </span>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Order #ORD-2024-002</p>
                <p className="text-sm text-gray-500">Blueberry • 80 kg • €960.00</p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                In Transit
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
