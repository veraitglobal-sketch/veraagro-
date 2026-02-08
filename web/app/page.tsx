'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';
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
  Apple,
  Carrot,
  Wheat,
} from 'lucide-react';
import { partners } from '@/lib/partners';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

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
              with complete traceability and automated compliance. Open to producers across Europe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="px-6 py-3 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Browse Products
              </Link>
              <Link
                href="/growers"
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
              {partners.length > 0 ? (
                partners.map((partner, index) => (
                  <motion.div
                    key={partner.name}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-4 flex items-center justify-center hover:border-gray-300 hover:bg-gray-100 transition-all"
                  >
                    {partner.url ? (
                      <a
                        href={partner.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center"
                      >
                        <Image
                          src={partner.logo}
                          alt={partner.alt || `${partner.name} Logo`}
                          width={160}
                          height={55}
                          className="h-12 w-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all"
                        />
                      </a>
                    ) : (
                      <Image
                        src={partner.logo}
                        alt={partner.alt || `${partner.name} Logo`}
                        width={160}
                        height={55}
                        className="h-12 w-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all"
                      />
                    )}
                  </motion.div>
                ))
              ) : (
                // Fallback: Show placeholder if no partners configured
                Array.from({ length: 8 }).map((_, index) => (
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
                      width={160}
                      height={55}
                      className="h-12 w-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all"
                    />
                  </motion.div>
                ))
              )}
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
                phase: 'Q1 2026',
                title: 'Platform Launch',
                status: 'completed',
                items: ['Backend API', 'Mobile App', 'Web Platform', 'Core Features']
              },
              {
                phase: 'Q2 2026',
                title: 'Feature Expansion',
                status: 'in-progress',
                items: ['AI Analytics', 'Advanced Dashboard', 'Integrations', 'EU Certificates']
              },
              {
                phase: 'Q3-Q4 2026',
                title: 'Scaling',
                status: 'planned',
                items: ['Multi-region Support', 'API Marketplace', 'Partner Integrations', 'Enterprise Features']
              },
              {
                phase: '2027',
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


      {/* Products Categories Section */}
      <section className="py-24 px-6 lg:px-8 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-light text-gray-900 mb-4">Browse Products</h2>
            <p className="text-lg text-gray-600">
              Organic products with complete traceability
            </p>
          </motion.div>

          {/* Category Filters */}
          <div className="flex gap-4 justify-center overflow-x-auto">
            {[
              { id: 'fruits', name: 'Fruits', icon: Apple },
              { id: 'vegetables', name: 'Vegetables', icon: Carrot },
              { id: 'grains', name: 'Grains', icon: Wheat },
            ].map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.id}
                  href="/login"
                  className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-lg transition-all group hover:border-green-600 hover:text-green-600"
                >
                  <Icon className="w-5 h-5 text-gray-600 group-hover:text-green-600 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                  <span className="text-sm font-medium transition-colors">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
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
                href="/growers"
                className="px-6 py-3 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Become a Producer
              </Link>
              <Link
                href="/login"
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
          <div className="grid md:grid-cols-5 gap-12 mb-12 items-start">
            <div className="flex flex-col">
              <Link href="/" className="inline-block mb-4 -mt-1">
                <Image 
                  src="/logo1.png" 
                  alt="Bio Vera" 
                  width={200} 
                  height={70} 
                  className="h-14 w-auto"
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
                <li><Link href="/growers" className="hover:text-green-600 transition-colors">For Growers</Link></li>
                <li><Link href="/suppliers" className="hover:text-green-600 transition-colors">For Suppliers</Link></li>
                <li><Link href="/logistics-partner" className="hover:text-green-600 transition-colors">For Logistics</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/about" className="hover:text-green-600 transition-colors">About</Link></li>
                <li><Link href="/careers" className="hover:text-green-600 transition-colors">Careers</Link></li>
                <li><Link href="/press" className="hover:text-green-600 transition-colors">Press Kit</Link></li>
                <li><Link href="/#vision" className="hover:text-green-600 transition-colors">Vision</Link></li>
                <li><Link href="/#roadmap" className="hover:text-green-600 transition-colors">Roadmap</Link></li>
                <li><Link href="/contact" className="hover:text-green-600 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/faq" className="hover:text-green-600 transition-colors">FAQ</Link></li>
                <li><Link href="/help-center" className="hover:text-green-600 transition-colors">Help Center</Link></li>
                <li><Link href="/security" className="hover:text-green-600 transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/legal" className="hover:text-green-600 transition-colors">Legal</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2026 Bio Vera. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
