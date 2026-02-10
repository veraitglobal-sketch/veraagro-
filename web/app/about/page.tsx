'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Target, Users, Award, Globe, Shield, Leaf } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image 
                src="/logo1.png" 
                alt="Bio Vera" 
                width={56} 
                height={20} 
                className="h-4 w-auto"
                priority
              />
            </Link>
            <nav className="flex gap-8 items-center">
              <Link href="/" className="text-sm text-gray-600 hover:text-green-600 transition-colors">
                Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">
              About Bio Vera
            </h1>
            <p className="text-lg text-gray-600 font-light leading-relaxed">
              Transforming agriculture through technology, transparency, and trust
            </p>
          </motion.div>

          {/* Mission Section */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-green-50/30 border border-green-200 rounded-lg p-8 mb-8"
            >
              <div className="flex items-start gap-4 mb-6">
                <Target className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-light text-gray-900 mb-4">Our Mission</h2>
                  <p className="text-gray-600 font-light leading-relaxed mb-4">
                    Bio Vera is on a mission to revolutionize the agricultural supply chain by connecting 
                    producers worldwide directly with markets, ensuring complete transparency, quality assurance, 
                    and fair compensation at every step.
                  </p>
                  <p className="text-gray-600 font-light leading-relaxed">
                    We believe that technology can bridge the gap between traditional farming and modern 
                    market demands, creating a sustainable ecosystem where farmers thrive, buyers trust, 
                    and consumers benefit from truly traceable, high-quality products.
                  </p>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Vision Section */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="flex items-start gap-4 mb-6">
                <Globe className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-light text-gray-900 mb-4">Our Vision</h2>
                  <p className="text-gray-600 font-light leading-relaxed mb-4">
                    To become the leading vertically integrated agrotech platform worldwide, setting new 
                    standards for traceability, quality assurance, and sustainable agriculture.
                  </p>
                  <p className="text-gray-600 font-light leading-relaxed">
                    We envision a future where every product on the shelf has a complete digital passport, 
                    where farmers receive fair compensation for their work, and where consumers can trust 
                    the origin and quality of what they purchase.
                  </p>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Values Section */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl font-light text-gray-900 mb-8">Our Values</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    icon: Shield,
                    title: 'Transparency',
                    description: 'Complete visibility into every step of the supply chain, from seed to shelf. No hidden processes, no obscured origins.',
                  },
                  {
                    icon: Award,
                    title: 'Quality First',
                    description: 'Rigorous quality standards that exceed industry expectations. Every product verified through our Protocol 360 system.',
                  },
                  {
                    icon: Users,
                    title: 'Fair Compensation',
                    description: 'Ensuring farmers receive fair prices for their products while maintaining competitive market rates.',
                  },
                  {
                    icon: Leaf,
                    title: 'Sustainability',
                    description: 'Promoting sustainable farming practices and reducing waste through efficient supply chain management.',
                  },
                ].map((value, index) => {
                  const IconComponent = value.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                      className="border border-gray-200 rounded-lg p-6 hover:border-green-600 transition-colors"
                    >
                      <IconComponent className="w-6 h-6 text-green-600 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{value.title}</h3>
                      <p className="text-sm text-gray-600 font-light leading-relaxed">
                        {value.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </section>

          {/* What We Do Section */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-2xl font-light text-gray-900 mb-6">What We Do</h2>
              <div className="space-y-4">
                <div className="border-l-2 border-green-600 pl-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Complete Traceability</h3>
                  <p className="text-gray-600 font-light leading-relaxed">
                    Every product gets a digital passport with immutable proof of origin, journey, and quality. 
                    QR codes on every box connect consumers directly to the farmer who grew their food.
                  </p>
                </div>
                <div className="border-l-2 border-green-600 pl-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Quality Assurance</h3>
                  <p className="text-gray-600 font-light leading-relaxed">
                    Our Protocol 360 system ensures three-tier quality control: field-level soil analysis, 
                    biometric scanning at packaging, and cold chain monitoring during transport.
                  </p>
                </div>
                <div className="border-l-2 border-green-600 pl-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Direct Market Access</h3>
                  <p className="text-gray-600 font-light leading-relaxed">
                    We eliminate intermediaries, connecting producers directly with buyers. This means better 
                    prices for farmers and guaranteed freshness for consumers.
                  </p>
                </div>
                <div className="border-l-2 border-green-600 pl-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">EU Compliance</h3>
                  <p className="text-gray-600 font-light leading-relaxed">
                    Automated certification management, GlobalG.A.P. IFA v6 group certification facilitation, 
                    and complete compliance tracking for seamless access to markets around the world.
                  </p>
                </div>
              </div>
            </motion.div>
          </section>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center"
          >
            <h2 className="text-2xl font-light text-gray-900 mb-4">Join Us on This Journey</h2>
            <p className="text-gray-600 font-light leading-relaxed mb-6">
              Whether you're a grower, supplier, logistics partner, or buyer, Bio Vera offers a platform 
              designed for your success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/growers"
                className="px-6 py-3 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors rounded-lg"
              >
                Become a Producer
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 border border-green-600 text-green-600 text-sm font-medium hover:bg-green-50 transition-colors rounded-lg"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12 items-start">
            <div className="flex flex-col">
              <Link href="/" className="inline-block mb-4 -mt-1">
                <Image 
                  src="/logo1.png" 
                  alt="Bio Vera" 
                  width={56} 
                  height={20} 
                  className="h-4 w-auto"
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
