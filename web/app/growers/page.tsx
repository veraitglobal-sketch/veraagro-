'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { growersAPI, submitApplicationForm } from '@/lib/api';

export default function GrowersPage() {
  const [formData, setFormData] = useState({
    farmName: '',
    contactPerson: '',
    phone: '',
    gpsLocation: '',
    cropTypes: [] as string[],
    totalHectares: '',
    globalGap: false,
    irrigationSystem: false,
    digitalIntegration: false,
    fieldPhotos: null as File | null,
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (resourceTitle: string) => {
    try {
      setDownloading(resourceTitle);
      
      // Map resource titles to API methods
      const downloadMap: { [key: string]: () => Promise<void> } = {
        'Grower Prospect': growersAPI.downloadProspect,
        'Packaging Guidelines': growersAPI.downloadPackagingGuidelines,
        'Farmer Field Management Guide': growersAPI.downloadFieldManagementGuide,
        'Bio Vera Protocol': growersAPI.downloadProtocol,
        'Certification Requirements': growersAPI.downloadCertificationRequirements,
        'Mobile App Guide': growersAPI.downloadMobileAppGuide,
        'Payment Process Guide': growersAPI.downloadPaymentProcessGuide,
        'Quality Standards': growersAPI.downloadQualityStandards,
      };

      const downloadMethod = downloadMap[resourceTitle];
      if (downloadMethod) {
        await downloadMethod();
      } else {
        throw new Error(`Download method not found for: ${resourceTitle}`);
      }
    } catch (error) {
      console.error('Error downloading resource:', error);
      alert('Failed to download resource. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCropChange = (crop: string) => {
    setFormData(prev => ({
      ...prev,
      cropTypes: prev.cropTypes.includes(crop)
        ? prev.cropTypes.filter(c => c !== crop)
        : [...prev.cropTypes, crop]
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, fieldPhotos: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitApplicationForm('Grower', {
        farmName: formData.farmName,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        gpsLocation: formData.gpsLocation,
        cropTypes: formData.cropTypes,
        totalHectares: formData.totalHectares,
        globalGap: formData.globalGap,
        irrigationSystem: formData.irrigationSystem,
        digitalIntegration: formData.digitalIntegration,
        fieldPhotos: formData.fieldPhotos,
      });
      setSubmitted(true);
      setFormData({
        farmName: '',
        contactPerson: '',
        phone: '',
        gpsLocation: '',
        cropTypes: [],
        totalHectares: '',
        globalGap: false,
        irrigationSystem: false,
        digitalIntegration: false,
        fieldPhotos: null,
      });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit. Please try again or contact info@biovera.app');
    } finally {
      setSubmitting(false);
    }
  };

  const cropOptions = ['Raspberry', 'Blackberry', 'Apple', 'Pepper', 'Blueberry'];

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
            For Growers
            </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed font-light">
              Join the most advanced In-Time logistics network. Secure your placement and eliminate 
              market volatility by following the Bio Vera Protocol. Open to producers worldwide.
            </p>
          <button
            onClick={async () => {
              try {
                await growersAPI.downloadProspect();
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

      {/* Who can apply — compact */}
      <section className="py-12 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-light text-gray-900 mb-1">Who can apply</h2>
          <p className="text-sm text-gray-500 font-light mb-6">
            Producers from these countries can join. Same protocol, same certification.
          </p>
          <p className="text-sm text-gray-600 font-light leading-relaxed">
            {[
              'Austria', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
              'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece',
              'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg',
              'Malta', 'Montenegro', 'Netherlands', 'North Macedonia', 'Poland', 'Portugal', 'Romania',
              'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden',
            ].map((c, i) => (
              <span key={c}>
                {c}{i < 30 ? ', ' : ''}
              </span>
            ))}
          </p>
        </div>
      </section>

      {/* 1. Value Proposition — what we offer (motivation first) */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-[#2D5A27]/10/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">The Value Proposition</h2>
            <p className="text-base text-gray-600 font-light">
              What we offer
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Fixed Pricing',
                description: 'Seasonal price stability. No middleman, no daily price fluctuations. Secure your revenue with predictable pricing throughout the season.',
              },
              {
                title: 'Logistics Priority',
                description: 'Our Frigo-Fleet picks up your goods at the exact scheduled minute. Zero wait time. Your harvest gets priority treatment from field to market.',
              },
              {
                title: 'Automated Payments',
                description: 'Funds are reserved upon field verification and released within 48 hours of Hub arrival. No payment delays, no cash flow worries.',
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

      {/* 2. The Bio Vera Protocol — what we require */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">The Bio Vera Protocol</h2>
            <p className="text-base text-gray-600 font-light">
              Strict requirements for network participation
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Digital Scheduling',
                description: 'All harvests must be announced 24h in advance via the app. Real-time start/stop harvest reporting is mandatory.',
              },
              {
                title: 'Quality Verification',
                description: 'Our Field Coordinators have the final authority to approve or reject batches on-site based on Bio Vera\'s visual and chemical standards.',
              },
              {
                title: 'Smart Packaging',
                description: 'Use only Bio Vera reusable crates with integrated QR codes. No manual repacking allowed.',
              },
              {
                title: 'Full Transparency',
                description: 'Soil and spray logs must be uploaded digitally before the season starts.',
              },
            ].map((item, index) => (
              <div key={index} className="border-b border-[#2D5A27]/20/50 pb-8">
                <h3 className="text-lg font-light text-gray-900 mb-3">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-light">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Group Certification Section */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">Group Certification</h2>
            <p className="text-base text-gray-600 font-light mb-6">
              Group Certification Option 2
            </p>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed font-light">
              Vera Agrar holds the certification for all our partners. We cover the costs and certification process, 
              while you gain direct access to the German market.
            </p>
          </div>

          {/* Technical Standards Table */}
          <div className="mb-12">
            <h3 className="text-xl font-light text-gray-900 mb-6 text-center">Technical Standards</h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#2D5A27]/10/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 border-b border-gray-200">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 border-b border-gray-200">
                      Standard
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      Certification
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      GlobalG.A.P. IFA v6 (Group)
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      Analysis
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      MRL limit at 70% of EU permitted levels
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      Logistics
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Direct packaging at farm in Vera packaging
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-[#2D5A27]/10/30 border border-[#2D5A27]/20/50 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-[#2D5A27]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-700 leading-relaxed font-light">
                  <span className="font-medium text-gray-900">Guaranteed Payment:</span> Payment is secured by contracts with German retail chains (60-90 days).
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <Link
              href="#application"
              className="inline-block px-8 py-4 bg-[#2D5A27] text-white text-base font-medium hover:bg-[#23471f] transition-colors rounded-lg shadow-sm hover:shadow-md"
            >
              Apply for Vera Group Certification 2026
            </Link>
          </div>
        </div>
      </section>

      {/* Resources & Downloads Section */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">Resources & Downloads</h2>
            <p className="text-base text-gray-600 font-light">
              Essential documents and guides for growers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Grower Prospect',
                description: 'Complete information about becoming a Bio Vera grower, including benefits, requirements, and the application process.',
                type: 'PDF',
                size: '~2 MB',
                downloadKey: 'Grower Prospect',
                available: true,
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
              },
              {
                title: 'Packaging Guidelines',
                description: 'Complete packaging standards and instructions for Bio Vera products. Includes specifications for boxes, product arrangement (5 rows × 3 products for round items), QR codes, and branding requirements.',
                type: 'PDF',
                size: '~1.5 MB',
                downloadKey: 'Packaging Guidelines',
                available: true,
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                ),
              },
              {
                title: 'Farmer Field Management Guide',
                description: 'Complete guide on managing estates, parcels, and field entries using the Bio Vera system.',
                type: 'PDF',
                size: '2.4 MB',
                downloadKey: 'Farmer Field Management Guide',
                available: true,
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
              },
              {
                title: 'Bio Vera Protocol',
                description: 'Detailed requirements and standards for network participation and certification.',
                type: 'PDF',
                size: '1.8 MB',
                downloadKey: 'Bio Vera Protocol',
                available: true,
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
              },
              {
                title: 'Certification Requirements',
                description: 'GlobalG.A.P. IFA v6 group certification requirements and compliance checklist.',
                type: 'PDF',
                size: '1.2 MB',
                downloadKey: 'Certification Requirements',
                available: true,
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ),
              },
              {
                title: 'Mobile App Guide',
                description: 'Step-by-step guide for using the Bio Vera mobile application for field management.',
                type: 'PDF',
                size: '3.1 MB',
                downloadKey: 'Mobile App Guide',
                available: true,
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                title: 'Payment Process Guide',
                description: 'Understanding escrow payments, release schedules, and payment splits.',
                type: 'PDF',
                size: '1.5 MB',
                downloadKey: 'Payment Process Guide',
                available: true,
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
              },
              {
                title: 'Quality Standards',
                description: 'Visual and chemical quality standards for Bio Vera certified products.',
                type: 'PDF',
                size: '2.7 MB',
                downloadKey: 'Quality Standards',
                available: true,
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                ),
              },
            ].map((resource, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-6 hover:border-[#2D5A27]/40 transition-colors bg-white"
              >
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0 text-[#2D5A27]">
                    {resource.icon}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-base font-light text-gray-900 mb-2">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed font-light mb-4">
                      {resource.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="px-2 py-1 bg-gray-100 rounded">{resource.type}</span>
                        <span>{resource.size}</span>
                      </div>
                      {resource.available ? (
                        <button
                          className="text-sm text-[#2D5A27] hover:text-[#23471f] font-medium transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleDownload(resource.downloadKey || resource.title)}
                          disabled={downloading === resource.title}
                        >
                          {downloading === resource.title ? (
                            <>
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Downloading...
                            </>
                          ) : (
                            <>
                              Download
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400 font-medium">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="application" className="py-20 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">Producer Application</h2>
            <p className="text-base text-gray-600 font-light">
              Apply to join the Bio Vera Network
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
                <div>
                  <label htmlFor="farmName" className="block text-sm font-medium text-gray-700 mb-2">
                    Farm Name *
                  </label>
                  <input
                    type="text"
                    id="farmName"
                    name="farmName"
                    value={formData.farmName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder="Enter your farm name"
                  />
                </div>

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

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone (WhatsApp enabled) *
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

                <div>
                  <label htmlFor="gpsLocation" className="block text-sm font-medium text-gray-700 mb-2">
                    Exact GPS Location *
                  </label>
                  <input
                    type="text"
                    id="gpsLocation"
                    name="gpsLocation"
                    value={formData.gpsLocation}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder="Latitude, Longitude (e.g., 44.7866, 20.4489)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Crop Types *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {cropOptions.map((crop) => (
                      <label
                        key={crop}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                          formData.cropTypes.includes(crop)
                            ? 'bg-[#2D5A27]/10 border-[#2D5A27]'
                            : 'bg-white border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.cropTypes.includes(crop)}
                          onChange={() => handleCropChange(crop)}
                          className="mr-2"
                          style={{ accentColor: '#2D5A27' }}
                        />
                        <span className="text-sm text-gray-700">
                          {crop}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="totalHectares" className="block text-sm font-medium text-gray-700 mb-2">
                    Total Hectares *
                  </label>
                  <input
                    type="number"
                    id="totalHectares"
                    name="totalHectares"
                    value={formData.totalHectares}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder="e.g., 5.5"
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certifications & Requirements
                  </label>
                  {[
                    { name: 'globalGap', label: 'Global G.A.P. Certified' },
                    { name: 'irrigationSystem', label: 'Irrigation System Installed' },
                    { name: 'digitalIntegration', label: 'Ready for Digital Integration' },
                  ].map((item) => (
                    <div key={item.name} className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={item.name}
                          name={item.name}
                          type="checkbox"
                          checked={formData[item.name as keyof typeof formData] as boolean}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-[#2D5A27] focus:ring-[#2D5A27] border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={item.name} className="font-medium text-gray-700">
                          {item.label}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label htmlFor="fieldPhotos" className="block text-sm font-medium text-gray-700 mb-2">
                    Recent Field Photos
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-[#2D5A27] transition-colors">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="fieldPhotos" className="relative cursor-pointer rounded-md font-medium text-[#2D5A27] hover:text-[#23471f]">
                          <span>Upload photos</span>
                          <input
                            id="fieldPhotos"
                            name="fieldPhotos"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG up to 10MB each</p>
                      {formData.fieldPhotos && (
                        <p className="text-sm text-[#2D5A27] mt-2">{formData.fieldPhotos.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                {submitError && (
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{submitError}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

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
                <li><Link href="/login/buyer" className="hover:text-[#2D5A27] transition-colors">For Buyers</Link></li>
                <li><Link href="/login/producer" className="hover:text-[#2D5A27] transition-colors">For Producers</Link></li>
                <li><Link href="/logistics-partner" className="hover:text-[#2D5A27] transition-colors">For Logistics</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/#vision" className="hover:text-[#2D5A27] transition-colors">Vision</Link></li>
                <li><Link href="/#roadmap" className="hover:text-[#2D5A27] transition-colors">Roadmap</Link></li>
                <li><Link href="/contact" className="hover:text-[#2D5A27] transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#" className="hover:text-[#2D5A27] transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-[#2D5A27] transition-colors">Privacy</Link></li>
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
