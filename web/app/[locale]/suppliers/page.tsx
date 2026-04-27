'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Building2, Hash, Tag, Award, Warehouse, QrCode, Users, AlertTriangle, Download } from 'lucide-react';
import { suppliersAPI, partnerApplicationsAPI, submitApplicationForm, getFormspreeEndpoint } from '@/lib/api';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

export default function SuppliersPage() {
  const loc = useLocalizedHref();
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
  const [referenceCode, setReferenceCode] = useState<string | null>(null);
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
      const res = await partnerApplicationsAPI.create({
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
      setReferenceCode(res.referenceCode);
      setSubmitted(true);
      if (getFormspreeEndpoint()) {
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
            referenceCode: res.referenceCode,
            note: 'Also stored in Bio Vera system — use this ref in admin Partner applications.',
          });
        } catch {
          // Email copy optional; application is already in database
        }
      }
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
            For Our Suppliers
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed font-light">
            Become a Bio Vera supplier: sell our products and our packaging to growers in your country. 
            You get guaranteed offtake from our producers, and you support them with on-site advice and training.
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

      {/* Who we're looking for + Your role */}
      <section className="py-16 px-6 lg:px-8 border-t border-gray-200 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-2xl font-light text-gray-900 mb-4">Who should apply</h2>
              <p className="text-base text-gray-600 font-light leading-relaxed mb-4">
                Our suppliers sell Bio Vera products and Bio Vera packaging in their country. 
                We prefer partners who already work in agriculture and have a strong presence across the country.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 font-light">
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>You sell our products (seeds, inputs) to growers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>You sell our packaging to producers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>Ideally you already work in agriculture</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>Wide presence in your country is an advantage</span>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-light text-gray-900 mb-4">Your role</h2>
              <p className="text-base text-gray-600 font-light leading-relaxed mb-4">
                As our supplier you advise and train users on the ground. You are the local point of contact for producers and support them with on-site guidance. You also procure packaging for our users – including boxes for packing produce – so they have what they need locally.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 font-light">
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>On-site advising and training of users</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>Procure packaging for our users (e.g. boxes for packing)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>First point of contact for farmers in your region</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>Physical verification of received goods</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits — guaranteed offtake first */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-[#2D5A27]/10/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">What you get</h2>
            <p className="text-base text-gray-600 font-light">
              Benefits of becoming a Bio Vera supplier
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Guaranteed offtake',
                description: 'Guaranteed offtake from our producers in your country. Our growers source from approved suppliers – you get stable demand and predictable revenue.',
              },
              {
                title: 'Our products & packaging',
                description: 'You sell Bio Vera products and Bio Vera packaging. One brand, one standard, full traceability via QR and the Vera system.',
              },
              {
                title: 'Price stability',
                description: 'Pre-agreed pricing structure. No price fluctuations or negotiations per transaction. Predictable margins.',
              },
              {
                title: 'Integrated logistics',
                description: 'Receive seeds and fertilizers on return trips from our logistics network. Fewer empty kilometers, lower costs.',
              },
              {
                title: 'National coverage preferred',
                description: 'We prefer suppliers with strong national presence. Expand your reach and represent Bio Vera across your country.',
              },
              {
                title: 'Exclusive market access',
                description: 'Direct access to our producer network and to the German market through our vertically integrated chain.',
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
                    <h4 className="text-base font-medium text-gray-900 mb-2">Sourcing from approved partners</h4>
                    <p className="text-sm text-gray-600 leading-relaxed font-light">
                      Suppliers procure goods from our approved partners within the country. 
                      They also source packaging (e.g. boxes for packing) for our users. Seeds, fertilizers, and packaging meet Bio Vera specifications.
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
                      supplier to field.
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
              <h4 className="text-lg font-light text-gray-900 mb-3">For Suppliers</h4>
              <p className="text-sm text-gray-600 leading-relaxed font-light mb-4">
                As a supplier, you purchase from our approved partners and sell to growers at 
                the agreed price. You maintain local inventory, procure packaging (e.g. boxes) for our users, and provide regional support to farmers.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 font-light">
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>Purchase from approved partners</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>Maintain secure storage facilities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D5A27] mt-1">•</span>
                  <span>Procure packaging (e.g. boxes for packing) for our users</span>
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

          {/* For Suppliers */}
          <div className="mb-12">
            <h3 className="text-xl font-light text-gray-900 mb-6 flex items-center gap-2">
              <Warehouse className="w-6 h-6 text-[#2D5A27]" />
              For Suppliers
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
                  description: 'Supplier cannot issue goods without scanning the QR code from the farmer\'s app. This is the only way to track consumption per hectare.',
                },
                {
                  icon: <Users className="w-6 h-6 text-[#2D5A27]" />,
                  title: 'Local Support',
                  description: 'Supplier is the first point of contact for farmers in their region. They perform physical verification of received goods and provide on-site advice and training.',
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
                      On the return trip, the driver picks up our Vera seeds and fertilizers from our partners.
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
                Receive regular deliveries of Vera seeds and fertilizers directly from our partners, 
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

      {/* Application Form Section */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">Supplier Application</h2>
            <p className="text-base text-gray-600 font-light max-w-xl mx-auto">
              Apply online (no self-service store login). You receive a <strong>reference code</strong> to track
              your application. Our team will contact you to schedule a meeting; when you are approved we create
              your partner store account.
            </p>
            <p className="text-sm text-gray-500 mt-2 space-x-3">
              <Link href="/suppliers/status" className="text-[#2D5A27] underline">
                Check status with your reference
              </Link>
              <span className="text-gray-300">·</span>
              <Link href={loc('/login')} className="text-[#2D5A27] underline">
                Partner store login
              </Link>
            </p>
          </div>

          {submitted ? (
            <div className="bg-[#2D5A27]/5 border border-[#2D5A27]/20 p-8 text-center">
              <div className="w-16 h-16 bg-[#2D5A27] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Application received</h3>
              {referenceCode && (
                <p className="text-gray-800 font-mono text-lg mb-2">
                  Your reference: <span className="font-semibold">{referenceCode}</span>
                </p>
              )}
              <p className="text-gray-600 font-light mb-4">
                We will contact you to schedule a conversation. Save your reference number — you can use it to check your application status anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {referenceCode && (
                  <Link
                    href={`/suppliers/status?ref=${encodeURIComponent(referenceCode)}`}
                    className="inline-flex items-center justify-center px-4 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f]"
                  >
                    Check application status
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setReferenceCode(null); }}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Submit another
                </button>
              </div>
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
                A vertically integrated agricultural network for Bio-Ready certification 
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
                  Phone: <a href="tel:+4915563740470" className="hover:text-[#2D5A27] transition-colors">+49 155 63740470</a>
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
