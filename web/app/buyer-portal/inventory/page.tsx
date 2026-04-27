'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { inventoryAPI, digitalPassportsAPI } from '@/lib/api';
import { Package, MapPin, Search, Camera, FileText, Leaf, Mountain, QrCode, Eye, X } from 'lucide-react';
import Image from 'next/image';
import { useBuyerPortalNavItems } from '@/lib/buyer-portal-nav';

export default function InventoryPage() {
  const { t } = useTranslation();
  const buyerPortalNavItems = useBuyerPortalNavItems();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [passportData, setPassportData] = useState<any | null>(null);
  const [loadingPassport, setLoadingPassport] = useState(false);

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
      console.error('Error loading products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadPassport = async (batchId: string) => {
    try {
      setLoadingPassport(true);
      const data = await digitalPassportsAPI.getByBatch(batchId);
      setPassportData(data);
    } catch (err: any) {
      console.error('Error loading passport:', err);
      setPassportData(null);
    } finally {
      setLoadingPassport(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.productName?.toLowerCase().includes(search.toLowerCase()) ||
    product.estateName?.toLowerCase().includes(search.toLowerCase()) ||
    product.estate?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleViewProduct = (product: any) => {
    setSelectedProduct(product);
    if (product.batchId) {
      loadPassport(product.batchId);
    }
  };

  return (
    <AuthGuard requiredRoles={['BUYER']}>
      <SidebarLayout title={t('buyerPortalPages.inventory')} navItems={buyerPortalNavItems}>
        <div className="space-y-8">
          {/* Header */}
          <div className="border-b border-green-200/50 pb-6">
            <div>
              <h1 className="text-2xl font-light text-gray-900">Available Products</h1>
              <p className="text-sm text-gray-600 mt-2 font-light">
                Browse products from Vera Partners - All products include Digital Passport & Origin Information
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="border-b border-green-200/50 pb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1} />
              <input
                type="text"
                placeholder="Search products by name or origin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 text-sm font-light focus:outline-none focus:border-green-600/50"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading products...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border-b border-green-200/50 pb-6 hover:border-green-300/50 transition-colors"
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gradient-to-br from-green-50 to-green-100">
                    {product.compliancePhotos && product.compliancePhotos.length > 0 ? (
                      <Image
                        src={product.compliancePhotos[0].photoUrl}
                        alt={product.productName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="w-16 h-16 text-green-300" />
                      </div>
                    )}
                    {/* Origin Badge */}
                    {product.estate && (
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 text-xs font-light text-gray-700 border border-gray-200/50">
                        <MapPin className="w-3 h-3 inline mr-1" strokeWidth={1} />
                        {product.estate.name || 'Vera Partner'}
                      </div>
                    )}
                    {/* Digital Passport Badge */}
                    {product.batchId && (
                      <div className="absolute top-2 right-2 bg-green-600/80 text-white px-2 py-1 text-xs font-light flex items-center gap-1 border border-green-700/50">
                        <QrCode className="w-3 h-3" strokeWidth={1} />
                        Digital Passport
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-light text-gray-900">{product.productName}</h3>
                        <p className="text-sm text-gray-500 mt-1 font-light">
                          From: {product.estate?.name || product.estateName || 'Vera Partner'}
                        </p>
                      </div>
                    </div>

                    {/* Origin Information */}
                    {product.parcel && (
                      <div className="mb-4 p-3 border border-gray-200/50">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 font-light">
                          <Mountain className="w-4 h-4" strokeWidth={1} />
                          <span>Origin</span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600 font-light">
                          {product.parcel.cropType && (
                            <p>Crop: <span>{product.parcel.cropType}</span></p>
                          )}
                          {product.parcel.plantingDate && (
                            <p>Planted: {new Date(product.parcel.plantingDate).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 font-light">Quantity:</span>
                        <span className="font-light text-gray-900">
                          {product.quantity} {product.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 font-light">Price:</span>
                        <span className="font-light text-green-600/80">
                          €{product.unitPrice?.toFixed(2) || '0.00'} / {product.unit}
                        </span>
                      </div>
                      {product.harvestDate && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 font-light">Harvested:</span>
                          <span className="text-gray-700 font-light">
                            {new Date(product.harvestDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewProduct(product)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-light hover:border-green-200/50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" strokeWidth={1} />
                        View Details
                      </button>
                      <button className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-light hover:bg-green-700 transition-colors">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-12 border-b border-green-200/50">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" strokeWidth={1} />
              <p className="text-gray-500 font-light">
                {search ? 'No products found matching your search' : 'No products available'}
              </p>
            </div>
          )}

          {/* Product Detail Modal with Digital Passport */}
          {selectedProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-gray-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6 border-b border-gray-200/50 pb-4">
                      <div>
                        <h2 className="text-2xl font-light text-gray-900 mb-2">
                          {selectedProduct.productName}
                        </h2>
                        <p className="text-gray-600 font-light">
                          From: {selectedProduct.estate?.name || selectedProduct.estateName || 'Vera Partner'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedProduct(null);
                          setPassportData(null);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-6 h-6" strokeWidth={1} />
                      </button>
                    </div>

                    {/* Product Images */}
                    {selectedProduct.compliancePhotos && selectedProduct.compliancePhotos.length > 0 && (
                      <div className="mb-6 border-b border-gray-200/50 pb-6">
                        <h3 className="text-lg font-light text-gray-900 mb-3 flex items-center gap-2">
                          <Camera className="w-5 h-5" strokeWidth={1} />
                          Product Photos
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          {selectedProduct.compliancePhotos.map((photo: any, index: number) => (
                            <div key={index} className="relative h-32 rounded-lg overflow-hidden">
                              <Image
                                src={photo.photoUrl}
                                alt={`Product photo ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Origin & Growing Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Mountain className="w-5 h-5" />
                          Origin Information
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-600">Farm:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {selectedProduct.estate?.name || 'Vera Partner Farm'}
                            </span>
                          </div>
                          {selectedProduct.parcel && (
                            <>
                              {selectedProduct.parcel.cropType && (
                                <div>
                                  <span className="text-gray-600">Crop Type:</span>
                                  <span className="ml-2 font-medium text-gray-900">
                                    {selectedProduct.parcel.cropType}
                                  </span>
                                </div>
                              )}
                              {selectedProduct.parcel.plantingDate && (
                                <div>
                                  <span className="text-gray-600">Planted:</span>
                                  <span className="ml-2 font-medium text-gray-900">
                                    {new Date(selectedProduct.parcel.plantingDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                          {selectedProduct.harvestDate && (
                            <div>
                              <span className="text-gray-600">Harvested:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {new Date(selectedProduct.harvestDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="border-b border-green-200/50 pb-4">
                        <h3 className="text-lg font-light text-gray-900 mb-3 flex items-center gap-2">
                          <Leaf className="w-5 h-5" strokeWidth={1} />
                          Growing Method
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-600 font-light">Certification:</span>
                            <span className="ml-2 font-light text-green-600/80">Bio Vera Certified</span>
                          </div>
                          <div>
                            <span className="text-gray-600 font-light">Method:</span>
                            <span className="ml-2 font-light text-gray-900">Organic & Sustainable</span>
                          </div>
                          {selectedProduct.estate?.certificationStartDate && (
                            <div>
                              <span className="text-gray-600 font-light">Certified Since:</span>
                              <span className="ml-2 font-light text-gray-900">
                                {new Date(selectedProduct.estate.certificationStartDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Digital Passport / Energy Passport */}
                    <div className="mb-6 border-b border-gray-200/50 pb-6">
                      <h3 className="text-lg font-light text-gray-900 mb-3 flex items-center gap-2">
                        <QrCode className="w-5 h-5" strokeWidth={1} />
                        Digital Passport (Energetski Pasos)
                      </h3>
                      {loadingPassport ? (
                        <div className="border border-gray-200/50 p-8 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                          <p className="mt-2 text-sm text-gray-600 font-light">Loading passport data...</p>
                        </div>
                      ) : passportData ? (
                        <div className="bg-green-50/20 border border-green-200/50 p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 font-light">Passport Hash:</span>
                              <span className="text-xs font-mono text-gray-700 font-light">
                                {passportData.passportHash?.slice(0, 16)}...
                              </span>
                            </div>
                            {passportData.timeline && passportData.timeline.length > 0 && (
                              <div>
                                <p className="text-sm font-light text-gray-900 mb-2">Journey Timeline:</p>
                                <div className="space-y-2">
                                  {passportData.timeline.map((stage: any, index: number) => (
                                    <div key={index} className="flex items-center gap-3 text-sm">
                                      <div className="w-2 h-2 bg-green-600/60 rounded-full"></div>
                                      <div className="flex-1">
                                        <p className="font-light text-gray-900">{stage.stage}</p>
                                        <p className="text-xs text-gray-500 font-light">
                                          {stage.location} • {new Date(stage.date).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {selectedProduct.batchId && (
                              <div className="mt-4 pt-4 border-t border-green-200/50">
                                <p className="text-xs text-gray-600 mb-2 font-light">Scan QR Code to view full passport:</p>
                                <div className="bg-white p-3 border border-green-200/50 inline-block">
                                  <QrCode className="w-16 h-16 text-green-600/60" strokeWidth={1} />
                                </div>
                                <p className="text-xs text-gray-500 mt-2 font-light">Batch ID: {selectedProduct.batchId}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="border border-gray-200/50 p-4 text-center">
                          <p className="text-sm text-gray-600 font-light">Digital passport not available for this product</p>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="grid grid-cols-2 gap-4 mb-6 border-b border-gray-200/50 pb-6">
                      <div className="border-b border-green-200/50 pb-4">
                        <p className="text-sm text-gray-600 mb-1 font-light">Quantity Available</p>
                        <p className="text-xl font-light text-gray-900">
                          {selectedProduct.quantity} {selectedProduct.unit}
                        </p>
                      </div>
                      <div className="border-b border-green-200/50 pb-4">
                        <p className="text-sm text-gray-600 mb-1 font-light">Price per {selectedProduct.unit}</p>
                        <p className="text-xl font-light text-green-600/80">
                          €{selectedProduct.unitPrice?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button className="flex-1 px-4 py-3 bg-green-600 text-white text-sm font-light hover:bg-green-700 transition-colors">
                        Add to Cart
                      </button>
                      <button className="px-4 py-3 border border-gray-300 text-gray-700 text-sm font-light hover:border-green-200/50 transition-colors">
                        Request Quote
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
