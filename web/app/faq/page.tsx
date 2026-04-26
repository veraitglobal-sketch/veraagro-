'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'growers' | 'buyers' | 'logistics' | 'technical';
}

const faqs: FAQItem[] = [
  {
    category: 'general',
    question: 'What is Bio Vera?',
    answer: 'Bio Vera is a vertically integrated agrotech platform that connects agricultural producers worldwide directly with markets. We provide complete traceability, quality assurance, and automated compliance management from seed to shelf—around the world.',
  },
  {
    category: 'general',
    question: 'How does Bio Vera ensure product quality?',
    answer: 'We use our Protocol 360 system, which includes three levels of quality control: field-level soil analysis (Eco-Safe Audit), biometric scanning at packaging centers, and cold chain monitoring during transport. Every product is verified before reaching the market.',
  },
  {
    category: 'general',
    question: 'What certifications does Bio Vera support?',
    answer: 'We facilitate GlobalG.A.P. IFA v6 group certification and ensure all products meet international and EU market standards. Our platform automates certification management and compliance tracking globally.',
  },
  {
    category: 'growers',
    question: 'How do I become a Bio Vera producer?',
    answer: 'You can apply through our Growers page. The application process includes providing information about your farm, certifications, and production capacity. Our team will review your application and guide you through onboarding.',
  },
  {
    category: 'growers',
    question: 'What are the requirements to become a producer?',
    answer: 'Producers need to have valid agricultural operations, comply with EU standards, and be willing to implement our quality control protocols. GlobalG.A.P. certification is preferred but we can help you obtain it.',
  },
  {
    category: 'growers',
    question: 'How are payments processed?',
    answer: 'Payments are processed automatically upon successful delivery verification. We use an escrow system to ensure secure transactions. Farmers receive payment within 3-5 business days after delivery confirmation.',
  },
  {
    category: 'buyers',
    question: 'How do I place an order?',
    answer: 'Create a buyer account, browse available products, and place orders through our platform. You can track your orders in real-time and receive digital certificates for each delivery.',
  },
  {
    category: 'buyers',
    question: 'What is the minimum order quantity?',
    answer: 'Minimum order quantities vary by product and producer. You can see specific requirements when browsing products. We support both retail and wholesale orders.',
  },
  {
    category: 'buyers',
    question: 'How can I verify product authenticity?',
    answer: 'Every product has a QR code that links to its digital passport. Scan the code to see complete traceability information, including origin, farmer details, quality certifications, and transport history.',
  },
  {
    category: 'logistics',
    question: 'How do I become a logistics partner?',
    answer: 'Apply through our Logistics Partner page. We welcome independent drivers, small vans, and larger transport companies. Requirements include valid licenses, GPS tracking capability, and commitment to cold chain compliance.',
  },
  {
    category: 'logistics',
    question: 'What is the Bio Vera: From Orchard to Shelf program?',
    answer: 'This program requires logistics partners to take end-to-end responsibility for transport, from farm pickup to final delivery. You ensure complete cold chain integrity, GPS tracking, and digital handover at every stage.',
  },
  {
    category: 'logistics',
    question: 'How are logistics partners compensated?',
    answer: 'Partners receive automated payments upon successful delivery verification. Payment amounts are based on distance, cargo type, and delivery requirements. All payments are processed digitally with no paperwork delays.',
  },
  {
    category: 'technical',
    question: 'Is there a mobile app?',
    answer: 'Yes, we have mobile applications for growers and logistics partners. The apps support offline functionality, GPS tracking, barcode scanning, and real-time synchronization when online.',
  },
  {
    category: 'technical',
    question: 'How does the traceability system work?',
    answer: 'Our system uses immutable digital records, GPS timestamps, device fingerprinting, and QR codes to create an unbreakable chain of custody. Every step from field to shelf is recorded and verifiable.',
  },
  {
    category: 'technical',
    question: 'What security measures are in place?',
    answer: 'We use end-to-end encryption, role-based access controls, multi-factor authentication, and regular security audits. All data is stored securely and complies with GDPR regulations.',
  },
];

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'general', label: 'General' },
    { id: 'growers', label: 'For Growers' },
    { id: 'buyers', label: 'For Buyers' },
    { id: 'logistics', label: 'For Logistics' },
    { id: 'technical', label: 'Technical' },
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-gray-600 font-light leading-relaxed">
              Find answers to common questions about Bio Vera
            </p>
          </motion.div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27] outline-none font-light"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-[#2D5A27] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredFAQs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-base font-medium text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                      openIndex === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {openIndex === index && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-sm text-gray-600 font-light leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 font-light">
                No questions found. Try a different search term or category.
              </p>
            </div>
          )}

          {/* Still Have Questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-16 bg-gray-50 border border-gray-200 rounded-lg p-8 text-center"
          >
            <h2 className="text-xl font-light text-gray-900 mb-4">Still have questions?</h2>
            <p className="text-gray-600 font-light leading-relaxed mb-6">
              Can't find the answer you're looking for? Please get in touch with our support team.
            </p>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg"
            >
              Contact Support
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
