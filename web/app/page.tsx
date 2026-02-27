'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
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
  HelpCircle,
  ShoppingBag,
} from 'lucide-react';
import { partners } from '@/lib/partners';
import dynamic from 'next/dynamic';

const VeraAIChatbotInline = dynamic(() => import('@/components/VeraAIChatbotInline'), { ssr: false });
import Footer from '@/components/Footer';

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [showPreOrderInfo, setShowPreOrderInfo] = useState(false);
  const preOrderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPreOrderInfo) return;
    const close = (e: MouseEvent) => {
      if (preOrderRef.current && !preOrderRef.current.contains(e.target as Node)) setShowPreOrderInfo(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showPreOrderInfo]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - fiksna min-visina da ne treperi pri učitavanju */}
      <section className="min-h-[50vh] sm:min-h-[55vh] pt-20 sm:pt-28 md:pt-40 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-4 md:mb-6 leading-tight">
              Vertically Integrated
              <br />
              <span className="font-normal">Agrotech Platform</span>
          </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed">
              From seed to market—anywhere in the world. Immutable digital proof. Bio-Ready certification 
              with complete traceability and automated compliance. Open to producers worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg"
              >
                <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                Browse Products
              </Link>
              <Link
                href="/growers"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#2D5A27] text-[#2D5A27] text-sm font-medium hover:bg-[#2D5A27]/5 transition-colors rounded-lg"
              >
                Become a Producer
              </Link>
            </div>
            {/* Pre-order 2026 — klik vodi na login, posle login direktno na pre-order */}
            <div ref={preOrderRef} className="relative mt-10 flex items-center justify-center gap-2">
              <Link
                href="/login?returnTo=/pre-order-2026"
                className="text-sm font-light text-gray-500 hover:text-[#2D5A27] transition-colors"
              >
                Pre-order for 2026 is open
              </Link>
              <button
                type="button"
                onClick={() => setShowPreOrderInfo((v) => !v)}
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-[#2D5A27]/30 bg-transparent text-[#2D5A27] transition hover:border-[#2D5A27]/50 hover:bg-[#2D5A27]/5 focus:outline-none focus:ring-1 focus:ring-[#2D5A27]/20"
                aria-label="Pre-order info"
              >
                <HelpCircle className="h-3 w-3" strokeWidth={2} />
              </button>
              {showPreOrderInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-1/2 top-full z-10 mt-2 w-72 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-sm font-light text-gray-600 shadow-sm"
                >
                  <p className="leading-relaxed">
                    Vera products are sent fresh for delivery. Besides quality control, we strive to meet customer expectations at every step.
                  </p>
                  <p className="mt-2 pt-2 border-t border-gray-100 text-gray-500 text-xs leading-relaxed">
                    Pre-order is for planning 2026 quantities only; it is not a binding order.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats - Minimal */}
      <section className="pt-16 pb-12 border-t border-gray-200 bg-gray-50/50">
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
                <div className="h-0.5 w-8 mx-auto mb-2 rounded-full bg-[#2D5A27]/40" aria-hidden />
                <div className="text-sm text-gray-500 uppercase tracking-wide">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="pt-16 pb-20 border-t border-gray-200 bg-white">
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
                    className="w-[170px] h-[84px] rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center hover:border-gray-300 hover:bg-gray-100 transition-all p-2"
                  >
                    {partner.url ? (
                      <a
                        href={partner.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-full h-full"
                      >
                        <Image
                          src={partner.logo}
                          alt={partner.alt || `${partner.name} Logo`}
                          width={100}
                          height={50}
                          className="max-w-[100px] max-h-[50px] w-auto h-auto object-contain opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all"
                        />
                      </a>
                    ) : (
                      <Image
                        src={partner.logo}
                        alt={partner.alt || `${partner.name} Logo`}
                        width={100}
                        height={50}
                        className="max-w-[100px] max-h-[50px] w-auto h-auto object-contain opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all"
                      />
                    )}
                  </motion.div>
                ))
              ) : (
                // Fallback: Show placeholder if no partners configured
                Array.from({ length: 5 }).map((_, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="w-[170px] h-[84px] rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center hover:border-gray-300 hover:bg-gray-100 transition-all p-2"
                  >
                    <Image
                      src="/logo1.png"
                      alt="Bio Vera Partner"
                      width={100}
                      height={50}
                      className="max-w-[100px] max-h-[50px] w-auto h-auto object-contain opacity-60 grayscale"
                    />
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-24 px-6 lg:px-8 border-t border-gray-200 bg-[#2D5A27]/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">Our Vision</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto font-light">
              Transforming agriculture through technology, ensuring transparency, 
              security, and market access for producers everywhere.
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
                <div key={index} className="border-b border-[#2D5A27]/15 pb-8">
                  <div className="mb-4">
                    <IconComponent className="w-6 h-6 text-[#2D5A27]/60" strokeWidth={1} />
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
                <div key={index} className="border-b border-[#2D5A27]/15 pb-8">
                  <div className="mb-4">
                    <IconComponent className="w-6 h-6 text-[#2D5A27]/60" strokeWidth={1} />
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
      <section className="py-24 px-6 lg:px-8 border-t border-gray-200 bg-[#2D5A27]/5">
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
                items: ['AI Analytics', 'Advanced Dashboard', 'Integrations', 'EU Certificates', 'Public blockchain verification (Polygon)']
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
                items: ['Global Markets', 'IoT Sensors', 'AI Predictions']
              },
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="border-l-2 border-gray-200 pl-8 pb-8 last:pb-0 hover:border-vera transition-colors"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      plan.status === 'completed' ? 'bg-[#2D5A27]' :
                      plan.status === 'in-progress' ? 'bg-[#2D5A27]/80' :
                      'bg-gray-300'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{plan.phase}</span>
                      <span className={`text-xs px-2 py-1 border ${
                        plan.status === 'completed' ? 'border-[#2D5A27] text-[#2D5A27]' :
                        plan.status === 'in-progress' ? 'border-[#2D5A27]/70 text-[#2D5A27]' :
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
                  className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-lg transition-all group hover:border-[#2D5A27] hover:text-[#2D5A27]"
                >
                  <Icon className="w-5 h-5 text-gray-600 group-hover:text-[#2D5A27] group-hover:scale-110 transition-transform" strokeWidth={1.5} />
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
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg"
              >
                Become a Producer
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#2D5A27] text-[#2D5A27] text-sm font-medium hover:bg-[#2D5A27]/5 transition-colors rounded-lg"
              >
                Start Shopping
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Help / Chat — linija kod chata u posebnoj sekciji */}
      <section className="border-t border-gray-200 bg-gray-50/50 py-6 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-light text-gray-600">Questions? We’re here to help.</p>
          <VeraAIChatbotInline />
        </div>
      </section>

      <Footer />
    </div>
  );
}
