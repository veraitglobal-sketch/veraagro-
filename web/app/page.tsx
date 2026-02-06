'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { inventoryAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  QrCode, 
  PackageSearch, 
  Wallet, 
  Handshake, 
  Shield, 
  FileCheck,
  Eye,
  Lock,
  Globe,
  MapPin,
  Apple,
  Carrot,
  Wheat,
  ChevronRight
} from 'lucide-react';
import { formatFarmerIdentity } from '@/lib/farmer-utils';

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setError(null);
      const data = await inventoryAPI.getAvailableProducts();
      setProducts(data);
    } catch (error: any) {
      console.error('Error loading products:', error);
      // Network error - backend might not be running
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
        setError('Backend server is not running. Please start it with: cd backend && npm run start:dev');
      } else {
        setError('Failed to load products. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Minimal */}
      <section className="pt-24 pb-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-6 leading-tight">
              Vertically Integrated
              <br />
              <span className="font-normal">Agrotech Platform</span>
          </h1>
            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              From seed to EU market. Immutable digital proof. Bio-Ready certification 
              with complete traceability and automated compliance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login/buyer"
                className="px-6 py-3 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Browse Products
              </Link>
              <Link
                href="/login/producer"
                className="px-6 py-3 border border-green-600 text-green-600 text-sm font-medium hover:bg-green-50 transition-colors"
              >
                Become a Producer
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats - Minimal */}
      <section className="py-16 border-t border-gray-200 bg-green-50/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '100%', label: 'Traceability' },
              { number: 'EU', label: 'Certified' },
              { number: '24/7', label: 'Monitoring' },
              { number: '0', label: 'Fraud Cases' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-light text-gray-900 mb-2">{stat.number}</div>
                <div className="text-sm text-gray-500 uppercase tracking-wide">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-20 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-sm text-gray-500 mb-12">Trusted every day by leading agricultural organizations</p>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-4 flex items-center justify-center hover:border-gray-300 hover:bg-gray-100 transition-all"
          >
            <Image
                    src="/logo1.png" 
                    alt="Bio Vera Partner" 
                    width={120} 
                    height={40} 
                    className="h-8 w-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-green-50/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">Our Vision</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto font-light">
              Transforming agriculture through technology, ensuring transparency, 
              security, and EU market access for all producers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Transparency',
                description: 'Complete visibility of the entire process from seed to customer. Every step is documented and immutable.',
                icon: Eye,
              },
              {
                title: 'Security',
                description: 'Cryptographically protected data, anti-fraud protection, and immutable digital evidence.',
                icon: Lock,
              },
              {
                title: 'EU Access',
                description: 'Automated generation of EU certificates and digital passports for direct market access.',
                icon: Globe,
              },
            ].map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div key={index} className="border-b border-green-200/50 pb-8">
                  <div className="mb-4">
                    <IconComponent className="w-6 h-6 text-green-600/60" strokeWidth={1} />
                  </div>
                  <h3 className="text-lg font-light text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-light">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">Core Features</h2>
            <p className="text-base text-gray-600 font-light">
              Technology that changes how we produce and distribute food
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Smart-Lock System',
                description: 'QR code scanning is the primary key. Immutable proof of production with GPS validation.',
                icon: QrCode,
              },
              {
                title: 'Batch Tracking',
                description: 'Every crate tracked with Batch_ID. One-click traceability from seed to customer.',
                icon: PackageSearch,
              },
              {
                title: 'Escrow Payment',
                description: 'Secure payment locked in escrow. Automatic split: 70% farmer, 20% driver, 10% platform.',
                icon: Wallet,
              },
              {
                title: 'Digital Handshake',
                description: 'Customer scans QR code to confirm delivery. Automatic payment release.',
                icon: Handshake,
              },
              {
                title: 'Anti-Fraud Protection',
                description: 'GPS timestamp, device ID tracking, camera-only capture. Impossible to falsify.',
                icon: Shield,
              },
              {
                title: 'EU Digital Passport',
                description: 'Automated generation of EU certificates. Direct market access without intermediaries.',
                icon: FileCheck,
              },
            ].map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="border-b border-green-200/50 pb-8">
                  <div className="mb-4">
                    <IconComponent className="w-6 h-6 text-green-600/60" strokeWidth={1} />
                  </div>
                  <h3 className="text-lg font-light text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-light">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-24 px-6 lg:px-8 border-t border-gray-200 bg-green-50/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-light text-gray-900 mb-4">Roadmap</h2>
            <p className="text-lg text-gray-600">
              Where we are now and where we're heading
            </p>
          </motion.div>

          <div className="space-y-8">
            {[
              {
                phase: 'Q1 2024',
                title: 'Platform Launch',
                status: 'completed',
                items: ['Backend API', 'Mobile App', 'Web Platform', 'Core Features']
              },
              {
                phase: 'Q2 2024',
                title: 'Feature Expansion',
                status: 'in-progress',
                items: ['AI Analytics', 'Advanced Dashboard', 'Integrations', 'EU Certificates']
              },
              {
                phase: 'Q3-Q4 2024',
                title: 'Scaling',
                status: 'planned',
                items: ['Multi-region Support', 'API Marketplace', 'Partner Integrations', 'Enterprise Features']
              },
              {
                phase: '2025',
                title: 'Global Expansion',
                status: 'planned',
                items: ['EU Market', 'Blockchain Integration', 'IoT Sensors', 'AI Predictions']
              },
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="border-l-2 border-gray-200 pl-8 pb-8 last:pb-0 hover:border-green-600 transition-colors"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      plan.status === 'completed' ? 'bg-green-600' :
                      plan.status === 'in-progress' ? 'bg-green-400' :
                      'bg-gray-300'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{plan.phase}</span>
                      <span className={`text-xs px-2 py-1 border ${
                        plan.status === 'completed' ? 'border-green-600 text-green-600' :
                        plan.status === 'in-progress' ? 'border-green-400 text-green-600' :
                        'border-gray-300 text-gray-400'
                      }`}>
                        {plan.status === 'completed' ? 'Completed' : plan.status === 'in-progress' ? 'In Progress' : 'Planned'}
                      </span>
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-4">{plan.title}</h3>
                    <ul className="grid md:grid-cols-2 gap-2">
                      {plan.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-24 px-6 lg:px-8 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-light text-gray-900 mb-4">Available Products</h2>
            <p className="text-lg text-gray-600">
              Organic products with complete traceability
            </p>
          </motion.div>

          {/* Category Filters */}
          <div className="mb-12 border-t border-b border-gray-200 py-4">
            <div className="flex gap-4 justify-center overflow-x-auto">
              {[
                { id: 'fruits', name: 'Fruits', icon: Apple, color: 'text-green-600', hoverColor: 'hover:text-green-700' },
                { id: 'vegetables', name: 'Vegetables', icon: Carrot, color: 'text-green-600', hoverColor: 'hover:text-green-700' },
                { id: 'grains', name: 'Grains', icon: Wheat, color: 'text-green-600', hoverColor: 'hover:text-green-700' },
              ].map((category) => {
                const Icon = category.icon;
                return (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.id}`}
                    className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-lg hover:border-green-600 transition-all group"
                  >
                    <Icon className={`w-5 h-5 ${category.color} ${category.hoverColor} group-hover:scale-110 transition-transform`} strokeWidth={1.5} />
                    <span className={`text-sm font-light ${category.color} ${category.hoverColor} transition-colors`}>
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
              <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
              <p className="mt-4 text-sm text-gray-500">Loading products...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-red-800 font-medium mb-2">Connection Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product: any, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border border-gray-200 p-6 hover:border-green-600 transition-all shadow-subtle shadow-subtle-hover"
                >
                  <div className="h-48 bg-gray-100 mb-4 flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-transparent group-hover:from-green-100/40 transition-colors"></div>
                    <div className="w-16 h-16 bg-gray-200 relative z-10"></div>
                    {/* Placeholder for product image */}
                    {/* <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> */}
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
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No products available at the moment.</p>
              <p className="text-sm text-gray-500 mt-2">Please check back soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-light text-gray-900 mb-6">Ready to Transform Agriculture?</h2>
            <p className="text-lg text-gray-600 mb-8">
              Join the revolution in agrotech. Simple, secure, transparent.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login/producer"
                className="px-6 py-3 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Become a Producer
              </Link>
              <Link
                href="/login/buyer"
                className="px-6 py-3 border border-green-600 text-green-600 text-sm font-medium hover:bg-green-50 transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <Link href="/" className="inline-block mb-4">
                <Image 
                  src="/logo1.png" 
                  alt="Bio Vera" 
                  width={180} 
                  height={60} 
                  className="h-12 w-auto"
                />
              </Link>
              <p className="text-sm text-gray-600 leading-relaxed">
                Vertically integrated agrotech platform for Bio-Ready certification 
                and EU market compliance.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/login/buyer" className="hover:text-green-600 transition-colors">For Buyers</Link></li>
                <li><Link href="/login/producer" className="hover:text-green-600 transition-colors">For Producers</Link></li>
                <li><Link href="#features" className="hover:text-green-600 transition-colors">Features</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#vision" className="hover:text-green-600 transition-colors">Vision</Link></li>
                <li><Link href="#roadmap" className="hover:text-green-600 transition-colors">Roadmap</Link></li>
                <li><Link href="#contact" className="hover:text-green-600 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#" className="hover:text-green-600 transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-green-600 transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-green-600 transition-colors">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2024 Bio Vera. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
