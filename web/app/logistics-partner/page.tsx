'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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
    // TODO: Implement API call to submit application
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        companyName: '',
        vehicleCount: '',
        regions: '',
        licenseFile: null,
        acceptDigitalControl: false,
      });
    }, 3000);
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
                width={180} 
                height={60} 
                className="h-12 w-auto"
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

      {/* Hero Section */}
      <section className="pt-24 pb-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-6 leading-tight">
            For Logistics
          </h1>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Join Bio Vera's trusted network of transport partners. Deliver organic products 
            with complete traceability and earn stable, long-term contracts.
          </p>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">Program Requirements</h2>
            <p className="text-base text-gray-600 font-light">
              What we expect from our logistics partners
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Frigo Equipment',
                description: 'Mandatory refrigeration unit capable of maintaining temperatures between 0°C and +12°C for organic product transport.',
              },
              {
                title: 'Digital Tracking',
                description: 'Mandatory installation of Bio Vera sensors for real-time temperature monitoring and GPS tracking throughout the delivery process.',
              },
              {
                title: 'Reliability',
                description: 'High Trust Score and strict adherence to \'In-Time\' delivery deadlines. Consistent performance is essential for long-term partnerships.',
              },
            ].map((item, index) => (
              <div key={index} className="border-b border-green-200/50 pb-8">
                <h3 className="text-lg font-light text-gray-900 mb-3">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-light">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-green-50/20">
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
              <div key={index} className="border-b border-green-200/50 pb-8">
                <h3 className="text-lg font-light text-green-600/80 mb-3">{item.title}</h3>
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
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5%</span>
                <span>30%</span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-2xl font-light text-green-600 mb-2">{fuelSavings}%</div>
                <div className="text-sm text-gray-600">Fuel Reduction</div>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-2xl font-light text-green-600 mb-2">
                  €{savings.monthlySavings.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-sm text-gray-600">Monthly Savings</div>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-2xl font-light text-green-600 mb-2">
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
                    className="w-8 bg-green-600 rounded-t"
                    style={{ height: `${100 - fuelSavings}%` }}
                  ></div>
                  <div className="text-xs text-gray-500 mt-2">After</div>
                </div>
              </div>
            </div>
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
            <div className="bg-green-50/50 border border-green-200/50 p-8 text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="List the regions, cities, or routes you cover (e.g., Belgrade, Novi Sad, Niš)"
                  />
                </div>

                <div>
                  <label htmlFor="licenseFile" className="block text-sm font-medium text-gray-700 mb-2">
                    Transport License (PDF) *
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-green-600 transition-colors">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="licenseFile" className="relative cursor-pointer rounded-md font-medium text-green-600 hover:text-green-500">
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
                        <p className="text-sm text-green-600 mt-2">{formData.licenseFile.name}</p>
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
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
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

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors rounded-lg"
                >
                  Submit Application
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <Link href="/" className="inline-block mb-4">
                <Image 
                  src="/logo1.png" 
                  alt="Bio Vera" 
                  width={180} 
                  height={60} 
                  className="h-12 w-auto"
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
                <li><Link href="/login/buyer" className="hover:text-green-600 transition-colors">For Buyers</Link></li>
                <li><Link href="/login/producer" className="hover:text-green-600 transition-colors">For Producers</Link></li>
                <li><Link href="/logistics-partner" className="hover:text-green-600 transition-colors">For Logistics</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/#vision" className="hover:text-green-600 transition-colors">Vision</Link></li>
                <li><Link href="/#roadmap" className="hover:text-green-600 transition-colors">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#" className="hover:text-green-600 transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-green-600 transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2024 Bio Vera. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
