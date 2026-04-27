'use client';

import { useState, useMemo, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import { logisticsPartnerAPI, submitApplicationForm } from '@/lib/api';

type TitleBody = { title: string; body: string };
type ResourceRow = { id: string; title: string; description: string; type: string; size: string };

const DOWNLOAD_BY_ID: Record<string, () => Promise<void>> = {
  prospect: logisticsPartnerAPI.downloadProspect,
  transportOps: logisticsPartnerAPI.downloadTransportOperationsGuide,
  coldChain: logisticsPartnerAPI.downloadColdChainProtocol,
  mobileApp: logisticsPartnerAPI.downloadMobileAppGuide,
  payment: logisticsPartnerAPI.downloadPaymentProcessGuide,
  gps: logisticsPartnerAPI.downloadGPSTrackingStandards,
};

const RESOURCE_ICONS: ReactNode[] = [
  <svg key="0" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>,
  <svg key="1" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>,
  <svg key="2" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>,
  <svg key="3" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>,
  <svg key="4" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>,
  <svg key="5" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>,
];

function isTitleBodyList(x: unknown): x is TitleBody[] {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    typeof x[0] === 'object' &&
    x[0] !== null &&
    'title' in x[0] &&
    'body' in x[0]
  );
}

function isResourceItems(x: unknown): x is ResourceRow[] {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    typeof x[0] === 'object' &&
    x[0] !== null &&
    'id' in x[0] &&
    'title' in x[0]
  );
}

export default function LogisticsPartnerPage() {
  const { t, i18n } = useTranslation();
  const loc = useLocalizedHref();
  const numLocale = i18n.language?.startsWith('sr') ? 'sr-RS' : 'en-US';

  const requirementItems = useMemo(() => {
    const raw = t('logisticsPartnerPage.requirementItems', { returnObjects: true });
    return isTitleBodyList(raw) ? raw : [];
  }, [t]);

  const benefitItems = useMemo(() => {
    const raw = t('logisticsPartnerPage.benefitItems', { returnObjects: true });
    return isTitleBodyList(raw) ? raw : [];
  }, [t]);

  const resourceItems = useMemo(() => {
    const raw = t('logisticsPartnerPage.resourceItems', { returnObjects: true });
    return isResourceItems(raw) ? raw : [];
  }, [t]);

  const [formData, setFormData] = useState({
    companyName: '',
    vehicleCount: '',
    regions: '',
    licenseFile: null as File | null,
    acceptDigitalControl: false,
  });
  const [fuelSavings, setFuelSavings] = useState(15);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, licenseFile: e.target.files![0] }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, acceptDigitalControl: e.target.checked }));
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
      setSubmitError(err instanceof Error ? err.message : t('logisticsPartnerPage.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const calculateSavings = (percentage: number) => {
    const baseCost = 10000;
    const savings = (baseCost * percentage) / 100;
    return {
      percentage,
      monthlySavings: savings,
      yearlySavings: savings * 12,
    };
  };

  const savings = calculateSavings(fuelSavings);

  const handleDownload = async (resourceId: string) => {
    try {
      setDownloadingId(resourceId);
      const downloadMethod = DOWNLOAD_BY_ID[resourceId];
      if (downloadMethod) {
        await downloadMethod();
      } else {
        throw new Error(`Download method not found for: ${resourceId}`);
      }
    } catch (error) {
      console.error('Error downloading resource:', error);
      alert(t('logisticsPartnerPage.downloadFailed'));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={loc('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image
                src="/logo1.png"
                alt={t('footer.logoAlt')}
                width={56}
                height={20}
                className="h-4 w-auto"
                priority
              />
            </Link>
            <nav className="flex gap-8 items-center">
              <Link href={loc('/')} className="text-sm text-gray-600 hover:text-[#2D5A27] transition-colors">
                {t('nav.home')}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <section className="pt-24 pb-24 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-6 leading-tight">{t('logisticsPartnerPage.title')}</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed font-light">{t('logisticsPartnerPage.heroLead')}</p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await logisticsPartnerAPI.downloadProspect();
                } catch (error) {
                  console.error('Error downloading prospect:', error);
                  alert(t('logisticsPartnerPage.downloadProspectError'));
                }
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors"
            >
              <Download className="w-4 h-4" />
              {t('logisticsPartnerPage.downloadProspectCta')}
            </button>
            <p className="text-xs text-gray-500 mt-4 font-light">{t('logisticsPartnerPage.prospectNote')}</p>
          </div>
        </div>
      </section>

      <section className="py-12 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-light text-gray-900 mb-1">{t('logisticsPartnerPage.whoCanApplyTitle')}</h2>
          <p className="text-sm text-gray-500 font-light mb-4">{t('logisticsPartnerPage.whoCanApplyLead')}</p>
          <p className="text-sm text-gray-600 font-light leading-relaxed mb-6">{t('logisticsPartnerPage.countriesLine')}</p>
          <p className="text-sm text-gray-600 font-light">
            <Trans
              i18nKey="logisticsPartnerPage.whoCanApplyLine2"
              components={{
                s1: <strong className="font-semibold text-gray-800" />,
                s2: <strong className="font-semibold text-gray-800" />,
                s3: <strong className="font-semibold text-gray-800" />,
              }}
            />
          </p>
        </div>
      </section>

      <section className="py-20 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">{t('logisticsPartnerPage.conditionsTitle')}</h2>
            <p className="text-base text-gray-600 font-light">{t('logisticsPartnerPage.conditionsLead')}</p>
          </div>

          <p className="text-sm text-gray-600 font-light text-center mb-10 max-w-2xl mx-auto">
            <Trans
              i18nKey="logisticsPartnerPage.needLine"
              components={{
                s1: <strong className="font-semibold text-gray-800" />,
                s2: <strong className="font-semibold text-gray-800" />,
                s3: <strong className="font-semibold text-gray-800" />,
                s4: <strong className="font-semibold text-gray-800" />,
              }}
            />
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {requirementItems.map((item, index) => (
              <div key={index} className="border-b border-[#2D5A27]/30 pb-8">
                <h3 className="text-lg font-light text-gray-900 mb-3">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-light">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-[#2D5A27]/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">{t('logisticsPartnerPage.whatYouGetTitle')}</h2>
            <p className="text-base text-gray-600 font-light">{t('logisticsPartnerPage.whatYouGetLead')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefitItems.map((item, index) => (
              <div key={index} className="border-b border-[#2D5A27]/30 pb-8">
                <h3 className="text-lg font-light text-[#2D5A27]/80 mb-3">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-light">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">{t('logisticsPartnerPage.fuelTitle')}</h2>
            <p className="text-base text-gray-600 font-light">{t('logisticsPartnerPage.fuelLead')}</p>
          </div>

          <div className="bg-white border border-gray-200 p-8">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('logisticsPartnerPage.fuelSavingsLabel')}: {fuelSavings}%
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
                <span>{t('logisticsPartnerPage.fuelMin')}</span>
                <span>{t('logisticsPartnerPage.fuelMax')}</span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="text-center p-6 bg-[#2D5A27]/10 rounded-lg">
                <div className="text-2xl font-light text-[#2D5A27] mb-2">{fuelSavings}%</div>
                <div className="text-sm text-gray-600">{t('logisticsPartnerPage.fuelReduction')}</div>
              </div>
              <div className="text-center p-6 bg-[#2D5A27]/10 rounded-lg">
                <div className="text-2xl font-light text-[#2D5A27] mb-2">
                  €{savings.monthlySavings.toLocaleString(numLocale, { maximumFractionDigits: 0 })}
                </div>
                <div className="text-sm text-gray-600">{t('logisticsPartnerPage.monthlySavings')}</div>
              </div>
              <div className="text-center p-6 bg-[#2D5A27]/10 rounded-lg">
                <div className="text-2xl font-light text-[#2D5A27] mb-2">
                  €{savings.yearlySavings.toLocaleString(numLocale, { maximumFractionDigits: 0 })}
                </div>
                <div className="text-sm text-gray-600">{t('logisticsPartnerPage.yearlySavings')}</div>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-end justify-center gap-2 h-32">
                <div className="flex flex-col items-center">
                  <div className="w-8 bg-gray-300 rounded-t" style={{ height: '60%' }} />
                  <div className="text-xs text-gray-500 mt-2">{t('logisticsPartnerPage.before')}</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 bg-[#2D5A27] rounded-t" style={{ height: `${100 - fuelSavings}%` }} />
                  <div className="text-xs text-gray-500 mt-2">{t('logisticsPartnerPage.after')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">{t('logisticsPartnerPage.resourcesTitle')}</h2>
            <p className="text-base text-gray-600 font-light">{t('logisticsPartnerPage.resourcesLead')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resourceItems.map((resource, index) => (
              <div
                key={resource.id}
                className="border border-gray-200 rounded-lg p-6 hover:border-[#2D5A27]/40 transition-colors bg-white"
              >
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0 text-[#2D5A27]">{RESOURCE_ICONS[index] ?? RESOURCE_ICONS[0]}</div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-base font-light text-gray-900 mb-2">{resource.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed font-light mb-4">{resource.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="px-2 py-1 bg-gray-100 rounded">{resource.type}</span>
                        <span>{resource.size}</span>
                      </div>
                      {DOWNLOAD_BY_ID[resource.id] ? (
                        <button
                          type="button"
                          className="text-sm text-[#2D5A27] hover:text-[#23471f] font-medium transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleDownload(resource.id)}
                          disabled={downloadingId === resource.id}
                        >
                          {downloadingId === resource.id ? (
                            <>
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                              {t('logisticsPartnerPage.downloading')}
                            </>
                          ) : (
                            <>
                              {t('logisticsPartnerPage.download')}
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400 font-medium">{t('logisticsPartnerPage.comingSoon')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">{t('logisticsPartnerPage.applicationTitle')}</h2>
            <p className="text-base text-gray-600 font-light">{t('logisticsPartnerPage.applicationLead')}</p>
          </div>

          {submitted ? (
            <div className="bg-[#2D5A27]/10 border border-[#2D5A27]/30 p-8 text-center">
              <div className="w-16 h-16 bg-[#2D5A27] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">{t('logisticsPartnerPage.successTitle')}</h3>
              <p className="text-gray-600 font-light">{t('logisticsPartnerPage.successBody')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-8">
              <div className="space-y-6">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('logisticsPartnerPage.companyNameLabel')}
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder={t('logisticsPartnerPage.companyNamePlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="vehicleCount" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('logisticsPartnerPage.vehicleCountLabel')}
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
                    placeholder={t('logisticsPartnerPage.vehicleCountPlaceholder')}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('logisticsPartnerPage.vehicleCountHint')}</p>
                </div>

                <div>
                  <label htmlFor="regions" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('logisticsPartnerPage.regionsLabel')}
                  </label>
                  <textarea
                    id="regions"
                    name="regions"
                    value={formData.regions}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder={t('logisticsPartnerPage.regionsPlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="licenseFile" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('logisticsPartnerPage.licenseLabel')}
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-[#2D5A27] transition-colors">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="licenseFile" className="relative cursor-pointer rounded-md font-medium text-[#2D5A27] hover:text-[#23471f]">
                          <span>{t('logisticsPartnerPage.uploadFile')}</span>
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
                        <p className="pl-1">{t('logisticsPartnerPage.orDrag')}</p>
                      </div>
                      <p className="text-xs text-gray-500">{t('logisticsPartnerPage.pdfLimit')}</p>
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
                      {t('logisticsPartnerPage.acceptTrackingLabel')}
                    </label>
                    <p className="text-gray-500">{t('logisticsPartnerPage.acceptTrackingDesc')}</p>
                  </div>
                </div>

                {submitError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{submitError}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? t('logisticsPartnerPage.submitting') : t('logisticsPartnerPage.submitApplication')}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <footer className="border-t border-gray-200 py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12 items-start">
            <div className="flex flex-col">
              <Link href={loc('/')} className="mb-4 flex items-center" style={{ minHeight: '1.25rem', marginTop: '-0.25rem' }}>
                <Image
                  src="/logo1.png"
                  alt={t('footer.logoAlt')}
                  width={56}
                  height={20}
                  className="h-4 w-auto"
                  style={{ display: 'block', background: 'transparent', objectFit: 'contain' }}
                />
              </Link>
              <p className="text-sm text-gray-600 leading-relaxed">{t('footer.tagline')}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">{t('footer.columnProduct')}</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href={loc('/for-buyers')} className="hover:text-[#2D5A27] transition-colors">
                    {t('nav.forBuyers')}
                  </Link>
                </li>
                <li>
                  <Link href={loc('/growers')} className="hover:text-[#2D5A27] transition-colors">
                    {t('nav.forGrowers')}
                  </Link>
                </li>
                <li>
                  <Link href={loc('/suppliers')} className="hover:text-[#2D5A27] transition-colors">
                    {t('nav.forSuppliers')}
                  </Link>
                </li>
                <li>
                  <Link href="/logistics-partner" className="hover:text-[#2D5A27] transition-colors">
                    {t('nav.forLogistics')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">{t('footer.columnCompany')}</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href={loc('/#vision')} className="hover:text-[#2D5A27] transition-colors">
                    {t('footer.vision')}
                  </Link>
                </li>
                <li>
                  <Link href={loc('/#roadmap')} className="hover:text-[#2D5A27] transition-colors">
                    {t('footer.roadmap')}
                  </Link>
                </li>
                <li>
                  <Link href={loc('/contact')} className="hover:text-[#2D5A27] transition-colors">
                    {t('nav.contact')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">{t('footer.columnLegal')}</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href={loc('/legal')} className="hover:text-[#2D5A27] transition-colors">
                    {t('footer.legalHub')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
            <p>{t('footer.copyright', { year: 2026 })}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
