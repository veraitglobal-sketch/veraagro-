'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Download, FileText, Image as ImageIcon, Mail, Calendar, User } from 'lucide-react';

interface PressRelease {
  id: string;
  date: string;
  title: string;
  summary: string;
  link?: string;
}

const pressReleases: PressRelease[] = [
  {
    id: '1',
    date: 'January 15, 2026',
    title: 'Bio Vera Launches Vertically Integrated Agricultural Network',
    summary: 'Bio Vera announces the launch of its agricultural network connecting producers worldwide with markets, with full traceability and compliance built into the operating model.',
    link: '#',
  },
  {
    id: '2',
    date: 'February 1, 2026',
    title: 'Protocol 360: New Quality Assurance System Sets Industry Standard',
    summary: 'Bio Vera introduces Protocol 360, a three-tier quality control system ensuring product safety, quality, and standardization from field to shelf.',
    link: '#',
  },
];

const assets = [
  {
    category: 'Logos',
    items: [
      { name: 'Bio Vera Logo (PNG)', description: 'High-resolution logo in PNG format', format: 'PNG' },
      { name: 'Bio Vera Logo (SVG)', description: 'Vector logo in SVG format', format: 'SVG' },
      { name: 'Bio Vera Logo (Dark)', description: 'Dark variant of the logo', format: 'PNG' },
      { name: 'Bio Vera Logo (Light)', description: 'Light variant of the logo', format: 'PNG' },
    ],
  },
  {
    category: 'Brand Colors',
    items: [
      { name: 'Primary Green', description: '#2D5A27 - Main brand color', format: 'HEX' },
      { name: 'Secondary Colors', description: 'Complete color palette', format: 'PDF' },
    ],
  },
  {
    category: 'Images',
    items: [
      { name: 'Product Photography', description: 'High-quality product images', format: 'ZIP' },
      { name: 'Team Photos', description: 'Official team photographs', format: 'ZIP' },
      { name: 'App & portal screenshots', description: 'Bio Vera app and web portal screenshots', format: 'ZIP' },
    ],
  },
  {
    category: 'Documents',
    items: [
      { name: 'Company Fact Sheet', description: 'One-page company overview', format: 'PDF' },
      { name: 'Product Overview', description: 'Detailed product information', format: 'PDF' },
      { name: 'Brand Guidelines', description: 'Complete brand guidelines document', format: 'PDF' },
    ],
  },
];

export default function PressPage() {
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
              <Link href="/" className="text-sm text-gray-600 hover:text-[#2D5A27] transition-colors">
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
              Press Kit
            </h1>
            <p className="text-lg text-gray-600 font-light leading-relaxed">
              Resources for journalists, bloggers, and media professionals
            </p>
          </motion.div>

          {/* Contact Information */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-[#2D5A27]/10 border border-[#2D5A27]/30 rounded-lg p-8"
            >
              <h2 className="text-2xl font-light text-gray-900 mb-6">Media Contact</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Mail className="w-5 h-5 text-[#2D5A27] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Press Inquiries</h3>
                    <a 
                      href="mailto:press@biovera.app" 
                      className="text-sm text-gray-600 font-light hover:text-[#2D5A27] transition-colors"
                    >
                      press@biovera.app
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <User className="w-5 h-5 text-[#2D5A27] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Media Relations</h3>
                    <p className="text-sm text-gray-600 font-light">
                      For interview requests, media partnerships, and press inquiries, please contact our media team.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Press Releases */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h2 className="text-2xl font-light text-gray-900 mb-6">Press Releases</h2>
              <div className="space-y-4">
                {pressReleases.map((release, index) => (
                  <div
                    key={release.id}
                    className="border border-gray-200 rounded-lg p-6 hover:border-[#2D5A27] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500 font-light">{release.date}</span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{release.title}</h3>
                        <p className="text-sm text-gray-600 font-light leading-relaxed">
                          {release.summary}
                        </p>
                      </div>
                    </div>
                    {release.link && (
                      <Link
                        href={release.link}
                        className="inline-flex items-center gap-2 text-sm text-[#2D5A27] hover:text-[#23471f] transition-colors mt-4"
                      >
                        <FileText className="w-4 h-4" />
                        Read Full Release
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* Company Information */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl font-light text-gray-900 mb-6">Company Information</h2>
              <div className="space-y-4">
                <div className="border-l-2 border-[#2D5A27] pl-6">
                  <h3 className="text-base font-medium text-gray-900 mb-2">About Bio Vera</h3>
                  <p className="text-sm text-gray-600 font-light leading-relaxed">
                    Bio Vera is a vertically integrated agricultural network that connects producers 
                    with markets under clear standards. We provide traceability, quality assurance, and 
                    compliance as part of the same operating model, from field to buyer. Founded in 2026, Bio Vera is headquartered 
                    in Hamburg, Germany, and serves producers and buyers around the world.
                  </p>
                </div>
                <div className="border-l-2 border-[#2D5A27] pl-6">
                  <h3 className="text-base font-medium text-gray-900 mb-2">Key Facts</h3>
                  <ul className="space-y-2 text-sm text-gray-600 font-light">
                    <li>• Founded: 2026</li>
                    <li>• Headquarters: Hamburg, Germany</li>
                    <li>• Market: Worldwide</li>
                    <li>• Focus: Agricultural traceability and quality assurance</li>
                    <li>• Technology: Protocol 360 quality control system</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Media Assets */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="text-2xl font-light text-gray-900 mb-6">Media Assets</h2>
              <div className="space-y-8">
                {assets.map((category, categoryIndex) => (
                  <div key={categoryIndex}>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{category.category}</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {category.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="border border-gray-200 rounded-lg p-4 hover:border-[#2D5A27] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 mb-1">{item.name}</h4>
                              <p className="text-xs text-gray-600 font-light">{item.description}</p>
                            </div>
                            <span className="text-xs text-gray-500 font-light bg-gray-100 px-2 py-1 rounded">
                              {item.format}
                            </span>
                          </div>
                          <button className="mt-3 flex items-center gap-2 text-xs text-[#2D5A27] hover:text-[#23471f] transition-colors">
                            <Download className="w-3 h-3" />
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* Usage Guidelines */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-gray-50 border border-gray-200 rounded-lg p-8"
            >
              <h2 className="text-xl font-light text-gray-900 mb-4">Usage Guidelines</h2>
              <div className="space-y-3 text-sm text-gray-600 font-light">
                <p>
                  • All media assets are provided for editorial and press use only.
                </p>
                <p>
                  • Logos and brand assets must be used in accordance with our brand guidelines.
                </p>
                <p>
                  • Please do not modify, alter, or distort our logos or brand elements.
                </p>
                <p>
                  • When using our assets, please credit Bio Vera appropriately.
                </p>
                <p>
                  • For commercial use or licensing inquiries, please contact{' '}
                  <a href="mailto:press@biovera.app" className="text-[#2D5A27] hover:underline">
                    press@biovera.app
                  </a>.
                </p>
              </div>
            </motion.div>
          </section>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center"
          >
            <h2 className="text-xl font-light text-gray-900 mb-4">Need Additional Information?</h2>
            <p className="text-gray-600 font-light leading-relaxed mb-6">
              For interview requests, additional assets, or specific media inquiries, please contact our press team.
            </p>
            <Link
              href="/contact?subject=Press Inquiry"
              className="inline-block px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg"
            >
              Contact Press Team
            </Link>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12 items-start">
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
                A vertically integrated agricultural network for Bio-Ready certification 
                and EU market compliance.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/growers" className="hover:text-[#2D5A27] transition-colors">For Growers</Link></li>
                <li><Link href="/suppliers" className="hover:text-[#2D5A27] transition-colors">For Suppliers</Link></li>
                <li><Link href="/logistics-partner" className="hover:text-[#2D5A27] transition-colors">For Logistics</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/about" className="hover:text-[#2D5A27] transition-colors">About</Link></li>
                <li><Link href="/careers" className="hover:text-[#2D5A27] transition-colors">Careers</Link></li>
                <li><Link href="/press" className="hover:text-[#2D5A27] transition-colors">Press Kit</Link></li>
                <li><Link href="/#vision" className="hover:text-[#2D5A27] transition-colors">Vision</Link></li>
                <li><Link href="/#roadmap" className="hover:text-[#2D5A27] transition-colors">Roadmap</Link></li>
                <li><Link href="/contact" className="hover:text-[#2D5A27] transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/faq" className="hover:text-[#2D5A27] transition-colors">FAQ</Link></li>
                <li><Link href="/help-center" className="hover:text-[#2D5A27] transition-colors">Help Center</Link></li>
                <li><Link href="/security" className="hover:text-[#2D5A27] transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/legal" className="hover:text-[#2D5A27] transition-colors">Legal</Link></li>
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
