'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Building2, Hash, Tag, Award, Warehouse, QrCode, Users, AlertTriangle, Box, Clock, Printer, CheckCircle, Download } from 'lucide-react';
import { suppliersAPI, submitApplicationForm } from '@/lib/api';

export default function SuppliersPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    pib: '',
    contactPerson: '',
    email: '',
    phone: '',
    productType: '',
    certifications: [] as string[],
    website: '',
    description: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCertificationChange = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitApplicationForm('Supplier', {
        companyName: formData.companyName,
        pib: formData.pib,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        productType: formData.productType,
        certifications: formData.certifications,
        website: formData.website,
        description: formData.description,
      });
      setSubmitted(true);
      setFormData({
        companyName: '',
        pib: '',
        contactPerson: '',
        email: '',
        phone: '',
        productType: '',
        certifications: [],
        website: '',
        description: '',
      });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit. Please try again or contact info@biovera.app');
    } finally {
      setSubmitting(false);
    }
  };

  const certificationOptions = [
    'GlobalG.A.P.',
    'IFS',
    'BRC',
    'ISO 22000',
    'HACCP',
    'Organic EU',
    'Fair Trade',
  ];

  const productTypes = [
    'Seeds',
    'Fertilizers',
    'Packaging Materials',
    'Equipment',
    'Other',
  ];

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

      {/* Hero Section */}
      <section className="pt-24 pb-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-6 leading-tight">
            Become a Strategic Supplier
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed font-light">
            Join our network of trusted suppliers and expand your reach to markets worldwide 
            through the Bio Vera platform. Source seeds, fertilizers, and packaging materials 
            both domestically and internationally.
          </p>
          <button
            onClick={async () => {
              try {
                await suppliersAPI.downloadProspect();
              } catch (error) {
                console.error('Error downloading prospect:', error);
                alert('Failed to download prospect. Please try again.');
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Prospect PDF
          </button>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">How It Works</h2>
            <p className="text-base text-gray-600 font-light">
              Understanding the Bio Vera supply chain
            </p>
          </div>

          <div className="bg-[#2D5A27]/10/30 border border-[#2D5A27]/20/50 rounded-lg p-8 mb-12">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-xl font-light text-gray-900 mb-6 text-center">Supply Chain Process</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#2D5A27] text-white rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-2">Sourcing from Manufacturing Partners</h4>
                    <p className="text-sm text-gray-600 leading-relaxed font-light">
                      Suppliers procure goods from our approved manufacturing partners within the country. 
                      These partners produce seeds, fertilizers, and packaging materials according to Bio Vera specifications.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#2D5A27] text-white rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-2">Agreed Pricing Structure</h4>
                    <p className="text-sm text-gray-600 leading-relaxed font-light">
                      All products are sold at pre-agreed prices. This ensures price stability for growers 
                      and predictable revenue for suppliers. No price fluctuations or negotiations per transaction.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#2D5A27] text-white rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-2">Distribution to Growers</h4>
                    <p className="text-sm text-gray-600 leading-relaxed font-light">
                      Suppliers distribute products to Bio Vera certified growers in their region. 
                      Every transaction is tracked through QR codes, ensuring complete traceability from 
                      manufacturing partner to field.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#2D5A27] text-white rounded-full flex items-center justify-center text-sm font-medium">
                    4
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-2">Digital Tracking & Compliance</h4>
                    <p className="text-sm text-gray-600 leading-relaxed font-light">
                      All inventory movements are recorded in the Vera Admin Dashboard. Suppliers maintain 
                      real-time visibility of stock levels, and the system automatically alerts when inventory 
                      falls below 20% threshold.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-light text-gray-900 mb-3">For Distributors</h4>
              <p className="text-sm text-gray-600 leading-relaxed font-light mb-4">
                As a distributor, you purchase from our manufacturing partners and sell to growers at 
                the agreed price. You maintain local inventory and provide regional support to farmers.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 font-light">
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>Purchase from approved manufacturing partners</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>Maintain secure storage facilities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>Distribute to growers at fixed prices</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>Track all transactions via QR codes</span>
                </li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-light text-gray-900 mb-3">For Packaging Manufacturers</h4>
              <p className="text-sm text-gray-600 leading-relaxed font-light mb-4">
                As a packaging manufacturer, you produce materials according to Bio Vera specifications 
                and deliver directly to distributors on a just-in-time basis.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 font-light">
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>Produce to exact Vera specifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>Print serial numbers/barcodes on each series</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>Deliver flat-packed within 48 hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>Maintain food contact certification</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">Program Requirements</h2>
            <p className="text-base text-gray-600 font-light">
              What we expect from our suppliers
            </p>
          </div>

          {/* For Distributors */}
          <div className="mb-12">
            <h3 className="text-xl font-light text-gray-900 mb-6 flex items-center gap-2">
              <Warehouse className="w-6 h-6 text-[#2D5A27]" />
              For Distributors (Agricultural Pharmacies & Wholesalers)
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: <Warehouse className="w-6 h-6 text-[#2D5A27]" />,
                  title: 'Vera Resources Storage',
                  description: 'Obligation to provide dry and secure storage space for Vera seeds, fertilizers, and packaging materials.',
                },
                {
                  icon: <QrCode className="w-6 h-6 text-[#2D5A27]" />,
                  title: 'QR Code Issuance',
                  description: 'Distributor cannot issue goods without scanning the QR code from the farmer\'s app. This is the only way to track consumption per hectare.',
                },
                {
                  icon: <Users className="w-6 h-6 text-[#2D5A27]" />,
                  title: 'Local Support',
                  description: 'Distributor is the first point of contact for farmers in their region. They perform physical verification of received goods.',
                },
                {
                  icon: <AlertTriangle className="w-6 h-6 text-[#2D5A27]" />,
                  title: 'Inventory Reporting',
                  description: 'System must automatically notify headquarters in Hamburg when inventory falls below 20%.',
                },
              ].map((item, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-base font-medium text-gray-900 mb-2">{item.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed font-light">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* For Packaging Manufacturers */}
          <div className="mb-12">
            <h3 className="text-xl font-light text-gray-900 mb-6 flex items-center gap-2">
              <Box className="w-6 h-6 text-[#2D5A27]" />
              For Packaging Manufacturers (Cardboard/Producers)
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: <CheckCircle className="w-6 h-6 text-[#2D5A27]" />,
                  title: 'Production to Vera Specification',
                  description: 'Every box must be made from agreed cardboard weight (e.g., five-layer) with food contact certification.',
                },
                {
                  icon: <Clock className="w-6 h-6 text-[#2D5A27]" />,
                  title: 'Just-in-Time Delivery',
                  description: 'Obligation to deliver flat-packed packaging directly to our distributors within 48 hours of order.',
                },
                {
                  icon: <Printer className="w-6 h-6 text-[#2D5A27]" />,
                  title: 'Barcode Printing',
                  description: 'Every packaging series must have a printed serial number or barcode that we generate, so we know which farmer used which series of boxes.',
                },
              ].map((item, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-base font-medium text-gray-900 mb-2">{item.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed font-light">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Common Obligation */}
          <div className="bg-[#2D5A27]/10/30 border border-[#2D5A27]/20/50 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-[#2D5A27]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-700 leading-relaxed font-light">
                  <span className="font-medium text-gray-900">Common Obligation:</span> All partners must use the <strong>Vera Admin Dashboard</strong> to record every entry and exit of goods. No 'paperwork' – everything must be in the digital system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vera Logistics Advantage Section */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">Vera Logistics Advantage</h2>
            <p className="text-base text-gray-600 font-light">
              Smart return logistics system
            </p>
          </div>

          <div className="bg-[#2D5A27]/10/30 border border-[#2D5A27]/20/50 rounded-lg p-8 mb-8">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-xl font-light text-gray-900 mb-6 text-center">No Empty Return Trips</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#2D5A27] text-white rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-2">Pickup & Delivery</h4>
                    <p className="text-sm text-gray-600 leading-relaxed font-light">
                      Driver picks up products from growers and delivers them to the buyer's address.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#2D5A27] text-white rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-2">Return Pickup</h4>
                    <p className="text-sm text-gray-600 leading-relaxed font-light">
                      On the return trip, the driver picks up our Vera seeds and fertilizers from our manufacturing partners.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#2D5A27] text-white rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-2">Distribution to Suppliers</h4>
                    <p className="text-sm text-gray-600 leading-relaxed font-light">
                      The driver delivers Vera seeds and fertilizers directly to our suppliers on the return route, eliminating empty kilometers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-light text-gray-900 mb-3">For Suppliers</h4>
              <p className="text-sm text-gray-600 leading-relaxed font-light mb-4">
                Receive regular deliveries of Vera seeds and fertilizers directly from our manufacturing partners, 
                delivered by our logistics network on return trips.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 font-light">
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>No need to arrange separate transport for incoming goods</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>Reduced logistics costs through integrated system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>Regular, predictable delivery schedule</span>
                </li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-light text-gray-900 mb-3">System Benefits</h4>
              <p className="text-sm text-gray-600 leading-relaxed font-light mb-4">
                Our smart logistics system ensures maximum efficiency by eliminating empty return trips 
                and optimizing every kilometer of transport.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 font-light">
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>Zero empty kilometers on return trips</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>Reduced fuel costs and environmental impact</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>Faster delivery times through optimized routes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-[#2D5A27]/10/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">What You Get</h2>
            <p className="text-base text-gray-600 font-light">
              Benefits of joining the Bio Vera network
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Guaranteed Purchase',
                description: 'All our growers must purchase from our approved suppliers. Guaranteed demand and stable revenue streams.',
              },
              {
                title: 'International Sourcing via Vera Logistics',
                description: 'Vera Logistics delivers seedlings and fertilizers from international suppliers directly to you. No need to arrange international shipping - we handle the entire import and delivery process.',
              },
              {
                title: 'National Coverage Preferred',
                description: 'Main suppliers with good national coverage are highly preferred. Expand your market reach across the region.',
              },
              {
                title: 'Exclusive Market Access',
                description: 'Direct access to global markets through our vertically integrated network. Your products reach end customers without intermediaries.',
              },
              {
                title: 'Integrated Return Logistics',
                description: 'Receive regular deliveries of Vera seeds and fertilizers on return trips from our logistics network. No empty kilometers, reduced costs.',
              },
              {
                title: 'Price Stability',
                description: 'Pre-agreed pricing structure ensures predictable revenue. No price fluctuations or negotiations per transaction.',
              },
            ].map((item, index) => (
              <div key={index} className="border-b border-[#2D5A27]/20/50 pb-8">
                <h3 className="text-lg font-light text-[#2D5A27]/80 mb-3">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-light">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">Supplier Application</h2>
            <p className="text-base text-gray-600 font-light">
              Apply to become a Bio Vera supplier
            </p>
          </div>

          {submitted ? (
            <div className="bg-[#2D5A27]/10/50 border border-[#2D5A27]/20/50 p-8 text-center">
              <div className="w-16 h-16 bg-[#2D5A27] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Application Submitted!</h3>
              <p className="text-gray-600 font-light">
                Thank you for your interest. We'll review your application and contact you within 3-5 business days.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-8">
              <div className="space-y-6">
                {/* Company Name */}
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder="Enter company name"
                  />
                </div>

                {/* VAT ID */}
                <div>
                  <label htmlFor="pib" className="block text-sm font-medium text-gray-700 mb-2">
                    <Hash className="w-4 h-4 inline mr-1" />
                    VAT ID / Tax Identification Number *
                  </label>
                  <input
                    type="text"
                    id="pib"
                    name="pib"
                    value={formData.pib}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder="Enter VAT ID"
                  />
                </div>

                {/* Contact Person */}
                <div>
                  <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    id="contactPerson"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder="Full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder="+1234567890"
                  />
                </div>

                {/* Product Type */}
                <div>
                  <label htmlFor="productType" className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Product Type *
                  </label>
                  <select
                    id="productType"
                    name="productType"
                    value={formData.productType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                  >
                    <option value="">Select product type</option>
                    {productTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Certifications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Award className="w-4 h-4 inline mr-1" />
                    Certifications *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {certificationOptions.map((cert) => (
                      <label
                        key={cert}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                          formData.certifications.includes(cert)
                            ? 'bg-[#2D5A27]/10 border-[#2D5A27]'
                            : 'bg-white border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.certifications.includes(cert)}
                          onChange={() => handleCertificationChange(cert)}
                          className="mr-2"
                          style={{ accentColor: '#2D5A27' }}
                        />
                        <span className="text-sm text-gray-700">
                          {cert}
                        </span>
                      </label>
                    ))}
                  </div>
                  {formData.certifications.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">Select at least one certification</p>
                  )}
                </div>

                {/* Website */}
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                    Website (optional)
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder="https://www.example.com"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Business Description (optional)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder="Brief description of your company and products..."
                  />
                </div>

                {submitError && (
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{submitError}</p>
                )}
                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
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
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                Vertically integrated agrotech platform for Bio-Ready certification 
                and EU market compliance.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">For Growers</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/growers" className="text-sm text-gray-600 hover:text-[#2D5A27] transition-colors font-light">
                    Become a Grower
                  </Link>
                </li>
                <li>
                  <Link href="/login/producer" className="text-sm text-gray-600 hover:text-[#2D5A27] transition-colors font-light">
                    Login
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">For Suppliers</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/suppliers" className="text-sm text-gray-600 hover:text-[#2D5A27] transition-colors font-light">
                    Become a Supplier
                  </Link>
                </li>
                <li>
                  <Link href="/logistics-partner" className="text-sm text-gray-600 hover:text-[#2D5A27] transition-colors font-light">
                    Logistics Partnership
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Contact</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/contact" className="text-sm text-gray-600 font-light hover:text-[#2D5A27] transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li className="text-sm text-gray-600 font-light">
                  Email: info@biovera.app
                </li>
                <li className="text-sm text-gray-600 font-light">
                  Phone: +381 11 123 4567
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-600 font-light">
              © 2026 Bio Vera. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
