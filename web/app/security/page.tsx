'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, CheckCircle, Server, Key, FileCheck, AlertTriangle } from 'lucide-react';

export default function SecurityPage() {
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
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-[#2D5A27]/10 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-[#2D5A27]" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">
              Security & Compliance
            </h1>
            <p className="text-lg text-gray-600 font-light leading-relaxed">
              Your data and transactions are protected by industry-leading security measures
            </p>
          </motion.div>

          {/* Security Measures */}
          <section className="mb-16">
            <h2 className="text-2xl font-light text-gray-900 mb-8">Security Measures</h2>
            <div className="space-y-6">
              {[
                {
                  icon: Lock,
                  title: 'End-to-End Encryption',
                  description: 'All data in transit is encrypted using TLS/SSL protocols. Data at rest is protected with AES-256 encryption, ensuring your information remains secure at all times.',
                },
                {
                  icon: Key,
                  title: 'Access Controls',
                  description: 'Role-based access controls ensure that users can only access data and features relevant to their role. Multi-factor authentication (MFA) is available for enhanced security.',
                },
                {
                  icon: Server,
                  title: 'Secure Infrastructure',
                  description: 'Our platform is hosted on secure, compliant cloud infrastructure with regular security updates, intrusion detection systems, and automated backups.',
                },
                {
                  icon: Eye,
                  title: 'Audit Logging',
                  description: 'All system activities are logged and monitored. We maintain comprehensive audit trails for compliance and security incident investigation.',
                },
                {
                  icon: FileCheck,
                  title: 'Regular Security Audits',
                  description: 'We conduct regular security assessments, penetration testing, and vulnerability scans. Our security team continuously monitors for threats and responds immediately to any issues.',
                },
                {
                  icon: AlertTriangle,
                  title: 'Incident Response',
                  description: 'We have established procedures for detecting, responding to, and reporting security incidents. In case of a data breach, affected users are notified within 72 hours as required by GDPR.',
                },
              ].map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-6 hover:border-[#2D5A27] transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-[#2D5A27]/10 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-[#2D5A27]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-sm text-gray-600 font-light leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Compliance Section */}
          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-[#2D5A27]/10 border border-[#2D5A27]/30 rounded-lg p-8"
            >
              <h2 className="text-2xl font-light text-gray-900 mb-6">Compliance & Certifications</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#2D5A27] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-1">GDPR Compliance</h3>
                    <p className="text-sm text-gray-600 font-light leading-relaxed">
                      We are fully compliant with the General Data Protection Regulation (GDPR). Your personal data 
                      is processed lawfully, transparently, and securely. You have full control over your data 
                      and can exercise your rights at any time.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#2D5A27] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-1">EU Market Standards</h3>
                    <p className="text-sm text-gray-600 font-light leading-relaxed">
                      All products on our platform meet EU certification standards. We facilitate GlobalG.A.P. 
                      IFA v6 group certification and ensure complete compliance with food safety regulations.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#2D5A27] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-1">ISO Standards</h3>
                    <p className="text-sm text-gray-600 font-light leading-relaxed">
                      Our processes follow ISO 27001 information security management standards. We maintain 
                      rigorous quality control and continuous improvement practices.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Data Protection */}
          <section className="mb-16">
            <h2 className="text-2xl font-light text-gray-900 mb-6">Data Protection</h2>
            <div className="space-y-4">
              <div className="border-l-2 border-[#2D5A27] pl-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">What We Protect</h3>
                <p className="text-sm text-gray-600 font-light leading-relaxed mb-4">
                  We protect all personal data, transaction information, financial data, location data, and 
                  any other sensitive information you entrust to us.
                </p>
              </div>
              <div className="border-l-2 border-[#2D5A27] pl-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">How We Protect It</h3>
                <p className="text-sm text-gray-600 font-light leading-relaxed mb-4">
                  Through encryption, access controls, secure infrastructure, regular audits, and comprehensive 
                  monitoring. We never sell your data and only share it as described in our Privacy Policy.
                </p>
              </div>
              <div className="border-l-2 border-[#2D5A27] pl-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your Rights</h3>
                <p className="text-sm text-gray-600 font-light leading-relaxed">
                  You have the right to access, correct, delete, or port your data. You can also object to processing 
                  or request restriction. Learn more in our{' '}
                  <Link href="/privacy" className="text-[#2D5A27] hover:underline">
                    Privacy Policy
                  </Link>.
                </p>
              </div>
            </div>
          </section>

          {/* Reporting Security Issues */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gray-50 border border-gray-200 rounded-lg p-8"
          >
            <h2 className="text-xl font-light text-gray-900 mb-4">Report a Security Issue</h2>
            <p className="text-sm text-gray-600 font-light leading-relaxed mb-6">
              If you discover a security vulnerability or have concerns about our security practices, 
              please contact us immediately. We take all security reports seriously and will investigate 
              promptly.
            </p>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg"
            >
              Contact Security Team
            </Link>
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
