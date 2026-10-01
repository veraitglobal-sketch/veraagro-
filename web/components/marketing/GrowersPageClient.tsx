'use client';

import BookCallButton from '@/components/BookCallButton';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import Footer from '@/components/Footer';
import MarketingHero from '@/components/marketing/MarketingHero';
import { marketingSectionTitle, marketingSectionTitleMb4 } from '@/lib/marketing-classes';
import { growersAPI, submitApplicationForm } from '@/lib/api';

type ValueOrProtocolItem = { title: string; body: string };
type TableRow = { category: string; standard: string };
type ResourceRow = { id: string; title: string; description: string; type: string; size: string };
type CropOption = { id: string; label: string };

const DOWNLOAD_BY_ID: Record<string, () => Promise<void>> = {
  prospect: growersAPI.downloadProspect,
  packaging: growersAPI.downloadPackagingGuidelines,
  fieldManagement: growersAPI.downloadFieldManagementGuide,
  protocol: growersAPI.downloadProtocol,
  certification: growersAPI.downloadCertificationRequirements,
  mobileApp: growersAPI.downloadMobileAppGuide,
  payment: growersAPI.downloadPaymentProcessGuide,
  quality: growersAPI.downloadQualityStandards,
};

const RESOURCE_ICONS: React.ReactNode[] = [
  <svg key="i0" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>,
  <svg key="i1" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>,
  <svg key="i2" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>,
  <svg key="i3" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>,
  <svg key="i4" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>,
  <svg key="i5" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>,
  <svg key="i6" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>,
  <svg key="i7" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>,
];

function isValueOrProtocolList(x: unknown): x is ValueOrProtocolItem[] {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    typeof x[0] === 'object' &&
    x[0] !== null &&
    'title' in x[0] &&
    'body' in x[0]
  );
}

function isTableRows(x: unknown): x is TableRow[] {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    typeof x[0] === 'object' &&
    x[0] !== null &&
    'category' in x[0] &&
    'standard' in x[0]
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

function isCropOptions(x: unknown): x is CropOption[] {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    typeof x[0] === 'object' &&
    x[0] !== null &&
    'id' in x[0] &&
    'label' in x[0]
  );
}

export default function GrowersPageClient() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();

  const valueItems = useMemo(() => {
    const raw = t('growersPage.valueItems', { returnObjects: true });
    return isValueOrProtocolList(raw) ? raw : [];
  }, [t]);

  const protocolItems = useMemo(() => {
    const raw = t('growersPage.protocolItems', { returnObjects: true });
    return isValueOrProtocolList(raw) ? raw : [];
  }, [t]);

  const certTableRows = useMemo(() => {
    const raw = t('growersPage.certTableRows', { returnObjects: true });
    return isTableRows(raw) ? raw : [];
  }, [t]);

  const resourceItems = useMemo(() => {
    const raw = t('growersPage.resourceItems', { returnObjects: true });
    return isResourceItems(raw) ? raw : [];
  }, [t]);

  const cropOptions = useMemo(() => {
    const raw = t('growersPage.crops', { returnObjects: true });
    return isCropOptions(raw) ? raw : [];
  }, [t]);

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
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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
      alert(t('growersPage.downloadFailed'));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCropChange = (cropId: string) => {
    setFormData((prev) => ({
      ...prev,
      cropTypes: prev.cropTypes.includes(cropId)
        ? prev.cropTypes.filter((c) => c !== cropId)
        : [...prev.cropTypes, cropId],
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, fieldPhotos: e.target.files![0] }));
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
      setSubmitError(err instanceof Error ? err.message : t('growersPage.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const certCheckboxes = useMemo(
    () =>
      [
        { name: 'globalGap' as const, label: t('growersPage.certGlobalGap') },
        { name: 'irrigationSystem' as const, label: t('growersPage.certIrrigation') },
        { name: 'digitalIntegration' as const, label: t('growersPage.certDigital') },
      ] as const,
    [t],
  );

  const countriesLine = t('growersPage.countriesLine');
  const valuePropositionLead = t('growersPage.valuePropositionLead');
  const protocolLead = t('growersPage.protocolLead');
  const groupCertSubtitle = t('growersPage.groupCertSubtitle');
  const paymentGuaranteedBold = t('growersPage.paymentGuaranteedBold');
  const paymentGuaranteedRest = t('growersPage.paymentGuaranteedRest');

  return (
    <div className="min-h-screen bg-white">
      <MarketingHero
        eyebrow={t('growersPage.heroEyebrow', { defaultValue: '' }) || undefined}
        title={t('growersPage.title')}
        subtitle={t('growersPage.heroSubtitle', { defaultValue: '' }) || undefined}
        lead={t('growersPage.heroLead')}
        sectionClassName="pb-20"
      >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={async () => {
              try {
                await growersAPI.downloadProspect();
              } catch (error) {
                console.error('Error downloading prospect:', error);
                alert(t('growersPage.downloadProspectError'));
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors"
          >
            <Download className="w-4 h-4" />
            {t('growersPage.downloadProspectCta')}
          </button>
            <BookCallButton role="producer" from="/for-growers" />
          </div>
      </MarketingHero>

      <section className="py-12 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={marketingSectionTitleMb4}>{t('growersPage.whoCanApplyTitle')}</h2>
          <p className="text-sm text-gray-600 font-light leading-relaxed max-w-2xl mx-auto">{t('growersPage.whoCanApplyLead')}</p>
          {countriesLine ? (
            <p className="text-sm text-gray-600 font-light leading-relaxed mt-6">{countriesLine}</p>
          ) : null}
        </div>
      </section>

      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-[#2D5A27]/10/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className={marketingSectionTitle}>{t('growersPage.valuePropositionTitle')}</h2>
            {valuePropositionLead ? (
              <p className="text-base text-gray-600 font-light">{valuePropositionLead}</p>
            ) : null}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {valueItems.map((item, index) => (
              <div key={index} className="border-b border-[#2D5A27]/20/50 pb-8">
                <h3 className="text-lg font-light text-[#2D5A27]/80 mb-3">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-light">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className={marketingSectionTitle}>{t('growersPage.protocolTitle')}</h2>
            {protocolLead ? <p className="text-base text-gray-600 font-light">{protocolLead}</p> : null}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {protocolItems.map((item, index) => (
              <div key={index} className="border-b border-[#2D5A27]/20/50 pb-8">
                <h3 className="text-lg font-light text-gray-900 mb-3">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-light">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className={marketingSectionTitle}>{t('growersPage.groupCertTitle')}</h2>
            {groupCertSubtitle ? (
              <p className="text-base text-gray-600 font-light mb-6">{groupCertSubtitle}</p>
            ) : null}
            <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed font-light">{t('growersPage.groupCertBody')}</p>
          </div>

          {certTableRows.length > 0 ? (
          <div className="mb-12">
            <h3 className="text-xl font-light text-gray-900 mb-6 text-center">{t('growersPage.technicalStandardsTitle')}</h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#2D5A27]/10/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 border-b border-gray-200">
                      {t('growersPage.tableColCategory')}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 border-b border-gray-200">
                      {t('growersPage.tableColStandard')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {certTableRows.map((row) => (
                    <tr key={row.category + row.standard} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">{row.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{row.standard}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          ) : null}

          {paymentGuaranteedBold || paymentGuaranteedRest ? (
          <div className="bg-[#2D5A27]/10/30 border border-[#2D5A27]/20/50 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-[#2D5A27]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-700 leading-relaxed font-light">
                  {paymentGuaranteedBold ? (
                    <>
                      <span className="font-medium text-gray-900">{paymentGuaranteedBold}</span>{' '}
                    </>
                  ) : null}
                  {paymentGuaranteedRest}
                </p>
              </div>
            </div>
          </div>
          ) : null}

          <div className="text-center">
            <Link
              href="#application"
              className="inline-block px-8 py-4 bg-[#2D5A27] text-white text-base font-medium hover:bg-[#23471f] transition-colors rounded-lg shadow-sm hover:shadow-md"
            >
              {t('growersPage.applyCertCta')}
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className={marketingSectionTitle}>{t('growersPage.resourcesTitle')}</h2>
            <p className="text-base text-gray-600 font-light">{t('growersPage.resourcesLead')}</p>
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
                              {t('growersPage.downloading')}
                            </>
                          ) : (
                            <>
                              {t('growersPage.download')}
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400 font-medium">{t('growersPage.comingSoon')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="application" className="py-20 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className={marketingSectionTitle}>{t('growersPage.applicationTitle')}</h2>
            <p className="text-base text-gray-600 font-light">{t('growersPage.applicationLead')}</p>
          </div>

          {submitted ? (
            <div className="bg-[#2D5A27]/10/50 border border-[#2D5A27]/20/50 p-8 text-center">
              <div className="w-16 h-16 bg-[#2D5A27] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">{t('growersPage.successTitle')}</h3>
              <p className="text-gray-600 font-light">{t('growersPage.successBody')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-8">
              <div className="space-y-6">
                <div>
                  <label htmlFor="farmName" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('growersPage.farmNameLabel')}
                  </label>
                  <input
                    type="text"
                    id="farmName"
                    name="farmName"
                    value={formData.farmName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder={t('growersPage.farmNamePlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('growersPage.contactPersonLabel')}
                  </label>
                  <input
                    type="text"
                    id="contactPerson"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder={t('growersPage.contactPersonPlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('growersPage.phoneLabel')}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder={t('growersPage.phonePlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="gpsLocation" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('growersPage.gpsLabel')}
                  </label>
                  <input
                    type="text"
                    id="gpsLocation"
                    name="gpsLocation"
                    value={formData.gpsLocation}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder={t('growersPage.gpsPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('growersPage.cropTypesLabel')}</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {cropOptions.map((crop) => (
                      <label
                        key={crop.id}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                          formData.cropTypes.includes(crop.id)
                            ? 'bg-[#2D5A27]/10 border-[#2D5A27]'
                            : 'bg-white border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.cropTypes.includes(crop.id)}
                          onChange={() => handleCropChange(crop.id)}
                          className="mr-2"
                          style={{ accentColor: '#2D5A27' }}
                        />
                        <span className="text-sm text-gray-700">{crop.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="totalHectares" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('growersPage.totalHectaresLabel')}
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
                    placeholder={t('growersPage.totalHectaresPlaceholder')}
                  />
                </div>

                <div className="space-y-4">
                  <span className="block text-sm font-medium text-gray-700 mb-2">{t('growersPage.certificationsSection')}</span>
                  {certCheckboxes.map((item) => (
                    <div key={item.name} className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={item.name}
                          name={item.name}
                          type="checkbox"
                          checked={formData[item.name] as boolean}
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
                    {t('growersPage.fieldPhotosLabel')}
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
                        <label htmlFor="fieldPhotos" className="relative cursor-pointer rounded-md font-medium text-[#2D5A27] hover:text-[#23471f]">
                          <span>{t('growersPage.uploadPhotos')}</span>
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
                        <p className="pl-1">{t('growersPage.uploadOrDrop')}</p>
                      </div>
                      <p className="text-xs text-gray-500">{t('growersPage.fileTypesHint')}</p>
                      {formData.fieldPhotos && (
                        <p className="text-sm text-[#2D5A27] mt-2">{formData.fieldPhotos.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                {submitError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{submitError}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? t('growersPage.submitting') : t('growersPage.submitApplication')}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
