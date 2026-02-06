'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Package, 
  CheckCircle2, 
  AlertTriangle,
  Truck,
  Leaf,
  Award,
  Shield,
  X
} from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: string;
  productName: string;
  variety?: string;
  imageUrl?: string;
  certifications?: {
    globalGAP?: boolean;
    bio?: boolean;
    ifs?: boolean;
  };
  currentPrice: number;
  oldPrice?: number;
  isSurgePricing?: boolean;
  availableQuantity: number; // in kg
  totalQuantity?: number; // in kg
  leadTime: string;
  unit?: string;
  availabilityStatus?: 'IN_STOCK' | 'LIMITED' | 'SOLD_OUT';
}

interface PriceMatrixTableProps {
  products: Product[];
  onOrder: (productId: string, quantity: number, lockPrice: boolean) => void;
}

export default function PriceMatrixTable({ products, onOrder, onPriceChange, onProductClick }: PriceMatrixTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [lockPrice, setLockPrice] = useState<boolean>(true);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);

  const handleOrderClick = (productId: string) => {
    setSelectedProduct(productId);
    setOrderQuantity(1);
    setLockPrice(true);
  };

  const handleSubmitOrder = () => {
    if (selectedProduct && orderQuantity > 0) {
      onOrder(selectedProduct, orderQuantity, lockPrice);
      setSelectedProduct(null);
    }
  };

  const getAvailabilityPercentage = (product: Product): number => {
    if (!product.totalQuantity || product.totalQuantity === 0) return 0;
    return Math.min(100, (product.availableQuantity / product.totalQuantity) * 100);
  };

  const getAvailabilityColor = (product: Product): string => {
    const percentage = getAvailabilityPercentage(product);
    if (percentage === 0) return 'bg-gray-300';
    if (percentage < 20) return 'bg-red-500';
    if (percentage < 50) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getAvailabilityStatusText = (product: Product): string => {
    if (product.availabilityStatus === 'SOLD_OUT' || product.availableQuantity === 0) {
      return 'Sold Out';
    }
    if (product.availabilityStatus === 'LIMITED' || getAvailabilityPercentage(product) < 20) {
      return 'Limited';
    }
    return 'In Stock';
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {/* Sticky Header - Simple Design */}
        <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-5 gap-4 px-6 py-2.5">
            <div className="col-span-2">
              <span className="text-xs font-normal text-gray-600">Product</span>
            </div>
            <div className="col-span-1">
              <span className="text-xs font-normal text-gray-600">Price (€)</span>
            </div>
            <div className="col-span-1">
              <span className="text-xs font-normal text-gray-600">Stock</span>
            </div>
            <div className="col-span-1 text-center">
              <span className="text-xs font-normal text-gray-600">Action</span>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {products.length > 0 ? (
            products.map((product, index) => {
              const isEven = index % 2 === 0;
              const availabilityPercentage = getAvailabilityPercentage(product);
              const availabilityColor = getAvailabilityColor(product);
              const statusText = getAvailabilityStatusText(product);

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.1 }}
                  className={`grid grid-cols-5 gap-4 px-6 py-2.5 items-center border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    isEven ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  {/* Product Name - Clickable */}
                  <div className="col-span-2">
                    <button
                      onClick={() => onProductClick && onProductClick(product)}
                      className="text-left hover:text-green-600 transition-colors"
                    >
                      <p className="font-normal text-sm text-gray-900">{product.productName}</p>
                      {product.variety && product.variety !== 'Standard' && (
                        <p className="text-xs font-light text-gray-500 mt-0.5">{product.variety}</p>
                      )}
                    </button>
                  </div>

                  {/* Price - Editable */}
                  <div className="col-span-1">
                    {editingPrice === product.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newPrice}
                          onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-xs font-normal"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (onPriceChange && newPrice > 0) {
                                onPriceChange(product.id, newPrice);
                                setEditingPrice(null);
                              }
                            }
                            if (e.key === 'Escape') {
                              setEditingPrice(null);
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (onPriceChange && newPrice > 0) {
                              onPriceChange(product.id, newPrice);
                              setEditingPrice(null);
                            }
                          }}
                          className="text-green-600 hover:text-green-700 text-xs font-normal"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setEditingPrice(null)}
                          className="text-gray-400 hover:text-gray-600 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        {product.isSurgePricing && product.oldPrice ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-normal text-red-600">
                              €{product.currentPrice.toFixed(2)}
                            </span>
                            <span className="text-xs font-light text-gray-400 line-through">
                              €{product.oldPrice.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-normal text-gray-900">
                            €{product.currentPrice.toFixed(2)}
                          </span>
                        )}
                        {onPriceChange && (
                          <button
                            onClick={() => {
                              setEditingPrice(product.id);
                              setNewPrice(product.currentPrice);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-gray-600 ml-1 transition-opacity"
                            title="Edit price"
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stock */}
                  <div className="col-span-1">
                    <span className="text-xs font-normal text-gray-600">
                      {product.availableQuantity > 0 
                        ? `${(product.availableQuantity / 1000).toFixed(1)}t`
                        : '0t'
                      }
                    </span>
                  </div>

                  {/* Action */}
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => handleOrderClick(product.id)}
                      className="px-2.5 py-1 bg-green-600 text-white text-xs font-normal rounded hover:bg-green-700 transition-colors"
                    >
                      Order
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="px-8 py-16 text-center bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-200 mb-4">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-700 font-bold text-lg mb-2">No products available</p>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Products will appear here once inventory is added or market prices are configured in the admin panel.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-green-600" />
                  Lock Price & Order
                </h2>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {(() => {
                const product = products.find(p => p.id === selectedProduct);
                if (!product) return null;

                return (
                  <div className="space-y-4">
                    {/* Product Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.productName}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{product.productName}</p>
                          {product.variety && (
                            <p className="text-sm text-gray-500">Variety: {product.variety}</p>
                          )}
                          <p className="text-lg font-bold text-green-600 mt-1">
                            €{product.currentPrice.toFixed(2)} / {product.unit || 'kg'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity ({product.unit || 'kg'})
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={product.availableQuantity}
                        step="0.1"
                        value={orderQuantity}
                        onChange={(e) => setOrderQuantity(parseFloat(e.target.value) || 1)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Available: {product.availableQuantity.toFixed(0)} {product.unit || 'kg'}
                      </p>
                    </div>

                    {/* Total Price */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                        <span className="text-xl font-bold text-green-600">
                          €{(orderQuantity * product.currentPrice).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Lock Price Option */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="lockPrice"
                        checked={lockPrice}
                        onChange={(e) => setLockPrice(e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor="lockPrice" className="text-sm text-gray-700">
                        Lock this price for this order
                      </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSubmitOrder}
                        className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Confirm Order
                      </button>
                      <button
                        onClick={() => setSelectedProduct(null)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
