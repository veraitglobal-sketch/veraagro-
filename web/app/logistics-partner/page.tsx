'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { logisticsPartnerAPI, submitApplicationForm } from '@/lib/api';

export default function LogisticsPartnerPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    vehicleCount: '',
    regions: '',
    licenseFile: null as File | null,
    acceptDigitalControl: false,
  });
  const [fuelSavings, setFuelSavings] = useState(15); // Default 15% savings
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, licenseFile: e.target.files![0] }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, acceptDigitalControl: e.target.checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitApplicationForm('Logistics Partner', {
        companyName: formData.companyName,
        vehicleCount: formData.vehicleCount,
        regions: formData.regions,
        licenseFile: formData.licenseFile,
        acceptDigitalControl: formData.acceptDigitalControl,
      });
      setSubmitted(true);
      setFormData({
        companyName: '',
        vehicleCount: '',
        regions: '',
        licenseFile: null,
        acceptDigitalControl: false,
      });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit. Please try again or contact info@biovera.app');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateSavings = (percentage: number) => {
    const baseCost = 10000; // Base monthly fuel cost
    const savings = (baseCost * percentage) / 100;
    return {
      percentage,
      monthlySavings: savings,
      yearlySavings: savings * 12,
    };
  };

  const savings = calculateSavings(fuelSavings);

  const handleDownload = async (resourceTitle: string) => {
    try {
      setDownloading(resourceTitle);
      
      // Map resource titles to API methods
      const downloadMap: { [key: string]: () => Promise<void> } = {
        'Logistics Partner Prospect': logisticsPartnerAPI.downloadProspect,
        'Transport Operations Guide': logisticsPartnerAPI.downloadTransportOperationsGuide,
        'Cold Chain Protocol': logisticsPartnerAPI.downloadColdChainProtocol,
        'Mobile App Guide': logisticsPartnerAPI.downloadMobileAppGuide,
        'Payment Process Guide': logisticsPartnerAPI.downloadPaymentProcessGuide,
        'GPS Tracking Standards': logisticsPartnerAPI.downloadGPSTrackingStandards,
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
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-6 leading-tight">
              For Logistics
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed font-light">
              Join Bio Vera's trusted network of transport partners. Open to independent drivers, 
              small vans, medium trucks, and large transport companies. Deliver organic products 
              with complete traceability and earn stable, long-term contracts.
            </p>
            <button
              onClick={async () => {
                try {
                  await logisticsPartnerAPI.downloadProspect();
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
            <p className="text-xs text-gray-500 mt-4 font-light">
              The prospect PDF includes our branded truck design and complete program details
            </p>
          </div>
        </div>
      </section>

      {/* Who can apply — same countries as growers */}
      <section className="py-12 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-light text-gray-900 mb-1">Who can apply</h2>
          <p className="text-sm text-gray-500 font-light mb-4">
            Logistics partners can apply from the same countries where we have growers. Anyone who meets the conditions below can become a Vera logistics partner.
          </p>
          <p className="text-sm text-gray-600 font-light leading-relaxed mb-6">
            {[
              'Austria', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
              'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece',
              'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg',
              'Malta', 'Montenegro', 'Netherlands', 'North Macedonia', 'Poland', 'Portugal', 'Romania',
              'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden',
            ].map((c, i, arr) => (
              <span key={c}>
                {c}{i < arr.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
          <p className="text-sm text-gray-600 font-light">
            We work with <strong>small companies</strong>, <strong>large transport companies</strong>, and <strong>independent drivers</strong>. The only requirement is that you can meet our cold chain and tracking standards below.
          </p>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">Conditions to become a Vera logistics partner</h2>
            <p className="text-base text-gray-600 font-light">
              You must meet the following. We accept small fleets, large companies, and independent drivers.
            </p>
          </div>

          <p className="text-sm text-gray-600 font-light text-center mb-10 max-w-2xl mx-auto">
            You need <strong>cooling/refrigeration systems</strong> (cold chain), digital tracking, and reliable delivery. We accept <strong>small companies</strong>, <strong>large companies</strong>, and <strong>independent drivers</strong>.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Bio Vera: From Orchard to Shelf',
                description: 'Complete end-to-end responsibility from farm pickup to retail shelf delivery. You guarantee full cold chain integrity, GPS tracking, and digital handover at every stage. No partial deliveries — you are responsible for the entire journey from field to final destination.',
              },
              {
                title: 'Cooling systems (cold chain)',
                description: 'Mandatory refrigeration unit capable of maintaining temperatures between 0°C and +12°C for organic product transport. Required for all partners. We accept small vans, medium trucks, and large transport vehicles — company size does not matter.',
              },
              {
                title: 'Digital Tracking',
                description: 'Mandatory installation of Bio Vera sensors for real-time temperature monitoring and GPS tracking. Same requirement for independent drivers, small companies, and large logistics partners.',
              },
              {
                title: 'Reliability',
                description: 'High Trust Score and strict adherence to \'In-Time\' delivery deadlines. Consistent performance is essential for long-term partnerships.',
              },
            ].map((item, index) => (
              <div key={index} className="border-b border-[#2D5A27]/30 pb-8">
                <h3 className="text-lg font-light text-gray-900 mb-3">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-light">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-[#2D5A27]/10">
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
                title: 'Route Optimization',
                description: 'Our software reduces empty kilometers through intelligent route planning, maximizing your fleet efficiency and profitability.',
              },
              {
                title: 'Fast Payment',
                description: 'Immediate payment upon completed delivery. No waiting periods or delayed settlements. Your cash flow stays healthy.',
              },
              {
                title: 'Long-Term Contracts',
                description: 'Stable volume commitments with predictable revenue streams. Build sustainable growth with reliable partnerships.',
              },
            ].map((item, index) => (
              <div key={index} className="border-b border-[#2D5A27]/30 pb-8">
                <h3 className="text-lg font-light text-[#2D5A27]/80 mb-3">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-light">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fuel Savings Calculator */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">Route Optimization Impact</h2>
            <p className="text-base text-gray-600 font-light">
              See how our optimization software reduces your fuel costs
            </p>
          </div>

          <div className="bg-white border border-gray-200 p-8">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuel Savings Percentage: {fuelSavings}%
              </label>
              <input
                type="range"
                min="5"
                max="30"
                value={fuelSavings}
                onChange={(e) => setFuelSavings(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#2D5A27]"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5%</span>
                <span>30%</span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="text-center p-6 bg-[#2D5A27]/10 rounded-lg">
                <div className="text-2xl font-light text-[#2D5A27] mb-2">{fuelSavings}%</div>
                <div className="text-sm text-gray-600">Fuel Reduction</div>
              </div>
              <div className="text-center p-6 bg-[#2D5A27]/10 rounded-lg">
                <div className="text-2xl font-light text-[#2D5A27] mb-2">
                  €{savings.monthlySavings.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-sm text-gray-600">Monthly Savings</div>
              </div>
              <div className="text-center p-6 bg-[#2D5A27]/10 rounded-lg">
                <div className="text-2xl font-light text-[#2D5A27] mb-2">
                  €{savings.yearlySavings.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-sm text-gray-600">Yearly Savings</div>
              </div>
            </div>

            {/* Simple Bar Chart Visualization */}
            <div className="mt-8">
              <div className="flex items-end justify-center gap-2 h-32">
                <div className="flex flex-col items-center">
                  <div 
                    className="w-8 bg-gray-300 rounded-t"
                    style={{ height: '60%' }}
                  ></div>
                  <div className="text-xs text-gray-500 mt-2">Before</div>
                </div>
                <div className="flex flex-col items-center">
                  <div 
                    className="w-8 bg-[#2D5A27] rounded-t"
                    style={{ height: `${100 - fuelSavings}%` }}
                  ></div>
                  <div className="text-xs text-gray-500 mt-2">After</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resources & Downloads Section */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">Resources & Downloads</h2>
            <p className="text-base text-gray-600 font-light">
              Essential documents and guides for logistics partners
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Logistics Partner Prospect',
                description: 'Complete information about becoming a Bio Vera logistics partner, including benefits, requirements, and the application process.',
                type: 'PDF',
                size: '~2 MB',
                downloadKey: 'Logistics Partner Prospect',
                available: true,
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
              },
              {
                title: 'Transport Operations Guide',
                description: 'Complete guide on managing deliveries, digital handovers, and route optimization using the Bio Vera system.',
                type: 'PDF',
                size: '2.4 MB',
                downloadKey: 'Transport Operations Guide',
                available: true,
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                ),
              },
              {
                title: 'Cold Chain Protocol',
                description: 'Detailed requirements and standards for temperature-controlled transport and compliance.',
                type: 'PDF',
                size: '1.8 MB',
                downloadKey: 'Cold Chain Protocol',
                available: true,
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
              },
              {
                title: 'Mobile App Guide',
                description: 'Step-by-step guide for using the Bio Vera mobile application for logistics operations.',
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
                description: 'Understanding automated payments, delivery confirmations, and payment schedules.',
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
                title: 'GPS Tracking Standards',
                description: 'Requirements for GPS tracking equipment, data logging, and real-time monitoring.',
                type: 'PDF',
                size: '2.7 MB',
                downloadKey: 'GPS Tracking Standards',
                available: true,
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">Partner Application</h2>
            <p className="text-base text-gray-600 font-light">
              Apply to become a Bio Vera logistics partner
            </p>
          </div>

          {submitted ? (
            <div className="bg-[#2D5A27]/10 border border-[#2D5A27]/30 p-8 text-center">
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
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
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
                    placeholder="Enter your company name"
                  />
                </div>

                <div>
                  <label htmlFor="vehicleCount" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Refrigerated Vehicles *
                  </label>
                  <input
                    type="number"
                    id="vehicleCount"
                    name="vehicleCount"
                    value={formData.vehicleCount}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder="e.g., 5 vans, 2 trucks"
                  />
                  <p className="text-xs text-gray-500 mt-1">Specify number of vans and trucks separately</p>
                </div>

                <div>
                  <label htmlFor="regions" className="block text-sm font-medium text-gray-700 mb-2">
                    Regions Covered *
                  </label>
                  <textarea
                    id="regions"
                    name="regions"
                    value={formData.regions}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder="List the regions, cities, or routes you cover (e.g., Belgrade, Novi Sad, Niš)"
                  />
                </div>

                <div>
                  <label htmlFor="licenseFile" className="block text-sm font-medium text-gray-700 mb-2">
                    Transport License (PDF) *
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-[#2D5A27] transition-colors">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="licenseFile" className="relative cursor-pointer rounded-md font-medium text-[#2D5A27] hover:text-[#23471f]">
                          <span>Upload a file</span>
                          <input
                            id="licenseFile"
                            name="licenseFile"
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="sr-only"
                            required
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF up to 10MB</p>
                      {formData.licenseFile && (
                        <p className="text-sm text-[#2D5A27] mt-2">{formData.licenseFile.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="acceptDigitalControl"
                      name="acceptDigitalControl"
                      type="checkbox"
                      checked={formData.acceptDigitalControl}
                      onChange={handleCheckboxChange}
                      required
                      className="h-4 w-4 text-[#2D5A27] focus:ring-[#2D5A27] border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="acceptDigitalControl" className="font-medium text-gray-700">
                      I accept digital temperature control and GPS tracking *
                    </label>
                    <p className="text-gray-500">
                      By checking this box, you agree to install and maintain Bio Vera sensors 
                      for temperature monitoring and GPS tracking on all vehicles used for Bio Vera deliveries.
                    </p>
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
              <Link href="/" className="mb-4 flex items-center" style={{ minHeight: '1.25rem', marginTop: '-0.25rem' }}>
                <Image 
                  src="/logo1.png" 
                  alt="Bio Vera" 
                  width={56} 
                  height={20} 
                  className="h-4 w-auto"
                  style={{ display: 'block', background: 'transparent', objectFit: 'contain' }}
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
