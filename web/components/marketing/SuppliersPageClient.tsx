'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Building2, Hash, Tag, Award, Warehouse, QrCode, Users, AlertTriangle, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { suppliersAPI, partnerApplicationsAPI, submitApplicationForm, getFormspreeEndpoint } from '@/lib/api';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import Footer from '@/components/Footer';
import MarketingHero from '@/components/marketing/MarketingHero';
import { marketingSectionTitle, marketingSectionTitleMb4 } from '@/lib/marketing-classes';

const CERTIFICATION_CODES = ['GlobalG.A.P.', 'IFS', 'BRC', 'ISO 22000', 'HACCP', 'Organic EU', 'Fair Trade'] as const;

const PRODUCT_VALUES = ['Seeds', 'Fertilizers', 'Packaging Materials', 'Equipment', 'Other'] as const;
const PRODUCT_I18N: Record<(typeof PRODUCT_VALUES)[number], string> = {
  Seeds: 'seeds',
  Fertilizers: 'fertilizers',
  'Packaging Materials': 'packaging',
  Equipment: 'equipment',
  Other: 'other',
};

type BenefitCard = { title: string; description: string };
type StepCard = { title: string; body: string };
type ReqCard = { title: string; description: string };

export default function SuppliersPageClient() {
  const { t } = useTranslation();
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

  const benefitCards = useMemo(
    () => t('suppliersPage.benefits.cards', { returnObjects: true }) as BenefitCard[],
    [t],
  );
  const howSteps = useMemo(() => t('suppliersPage.howItWorks.steps', { returnObjects: true }) as StepCard[], [t]);
  const reqCards = useMemo(() => t('suppliersPage.requirements.cards', { returnObjects: true }) as ReqCard[], [t]);
  const logisticsSteps = useMemo(() => t('suppliersPage.logistics.steps', { returnObjects: true }) as StepCard[], [t]);

  const whoApplyBullets = useMemo(
    () => t('suppliersPage.whoApply.bullets', { returnObjects: true }) as string[],
    [t],
  );
  const yourRoleBullets = useMemo(
    () => t('suppliersPage.yourRole.bullets', { returnObjects: true }) as string[],
    [t],
  );
  const benefitsSubtitle = t('suppliersPage.benefits.subtitle');
  const howItWorksTitle = t('suppliersPage.howItWorks.title');
  const howItWorksSubtitle = t('suppliersPage.howItWorks.subtitle');
  const requirementsSubtitle = t('suppliersPage.requirements.subtitle');
  const requirementsCommonLabel = t('suppliersPage.requirements.commonLabel');
  const requirementsCommonBody = t('suppliersPage.requirements.commonBody');
  const logisticsTitle = t('suppliersPage.logistics.title');
  const forSuppliersPanelTitle = t('suppliersPage.howItWorks.forSuppliersPanelTitle');
  const showHowItWorks =
    Boolean(howItWorksTitle || howItWorksSubtitle || howSteps.length > 0 || forSuppliersPanelTitle);
  const forSuppliersPanelBullets = useMemo(
    () => t('suppliersPage.howItWorks.forSuppliersPanelBullets', { returnObjects: true }) as string[],
    [t],
  );

  const requirementIcons = useMemo(
    () => [<Warehouse key="w" className="w-6 h-6 text-[#2D5A27]" />, <QrCode key="q" className="w-6 h-6 text-[#2D5A27]" />, <Users key="u" className="w-6 h-6 text-[#2D5A27]" />, <AlertTriangle key="a" className="w-6 h-6 text-[#2D5A27]" />],
    [],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCertificationChange = (cert: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter((c) => c !== cert)
        : [...prev.certifications, cert],
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
            note: t('suppliersPage.formspeeNote'),
          });
        } catch {
          /* Email copy optional */
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
      setSubmitError(err instanceof Error ? err.message : t('suppliersPage.form.submitErrorFallback'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={loc('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image src="/logo1.png" alt={t('footer.logoAlt')} width={56} height={20} className="h-4 w-auto" priority />
            </Link>
            <nav className="flex gap-8 items-center">
              <Link href={loc('/')} className="text-sm text-gray-600 hover:text-[#2D5A27] transition-colors">
                {t('nav.home')}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <MarketingHero
        eyebrow={t('suppliersPage.hero.eyebrow', { defaultValue: '' }) || undefined}
        title={t('suppliersPage.hero.title')}
        lead={t('suppliersPage.hero.subtitle')}
        sectionClassName="pb-20"
      >
          <button
            type="button"
            onClick={async () => {
              try {
                await suppliersAPI.downloadProspect();
              } catch (error) {
                console.error('Error downloading prospect:', error);
                alert(t('suppliersPage.hero.downloadFail'));
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors"
          >
            <Download className="w-4 h-4" />
            {t('suppliersPage.hero.downloadPdf')}
          </button>
      </MarketingHero>

      <section className="py-16 px-6 lg:px-8 border-t border-gray-200 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h2 className={marketingSectionTitleMb4}>{t('suppliersPage.whoApply.title')}</h2>
              <p className="text-base text-gray-600 font-light leading-relaxed mb-4">{t('suppliersPage.whoApply.intro')}</p>
              {whoApplyBullets.length > 0 ? (
              <ul className="space-y-2 text-sm text-gray-600 font-light">
                {whoApplyBullets.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <span className="text-[#2D5A27] mt-1">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              ) : null}
            </div>
            <div>
              <h2 className={marketingSectionTitleMb4}>{t('suppliersPage.yourRole.title')}</h2>
              <p className="text-base text-gray-600 font-light leading-relaxed mb-4">{t('suppliersPage.yourRole.intro')}</p>
              {yourRoleBullets.length > 0 ? (
              <ul className="space-y-2 text-sm text-gray-600 font-light">
                {yourRoleBullets.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <span className="text-[#2D5A27] mt-1">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-[#2D5A27]/10/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className={marketingSectionTitle}>{t('suppliersPage.benefits.title')}</h2>
            {benefitsSubtitle ? (
              <p className="text-base text-gray-600 font-light">{benefitsSubtitle}</p>
            ) : null}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefitCards.map((item, index) => (
              <div key={index} className="border-b border-[#2D5A27]/20/50 pb-8">
                <h3 className="text-lg font-light text-[#2D5A27]/80 mb-3">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-light">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showHowItWorks ? (
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto">
          {howItWorksTitle ? (
            <h2 className={`${marketingSectionTitleMb4} text-center`}>{howItWorksTitle}</h2>
          ) : null}
          {howItWorksSubtitle ? (
            <p className="text-base text-gray-600 font-light leading-relaxed text-center max-w-3xl mx-auto">
              {howItWorksSubtitle}
            </p>
          ) : null}

          {howSteps.length > 0 ? (
          <>
          <div className="bg-[#2D5A27]/10/30 border border-[#2D5A27]/20/50 rounded-lg p-8 mt-10 mb-12">
            <div className="max-w-4xl mx-auto">
              {t('suppliersPage.howItWorks.supplyChainTitle') ? (
                <h3 className="text-xl font-light text-gray-900 mb-6 text-center">{t('suppliersPage.howItWorks.supplyChainTitle')}</h3>
              ) : null}

              <div className="space-y-6">
                {howSteps.map((step, i) => (
                  <div key={step.title} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#2D5A27] text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-base font-medium text-gray-900 mb-2">{step.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed font-light">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {forSuppliersPanelTitle ? (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-light text-gray-900 mb-3">{forSuppliersPanelTitle}</h4>
              <p className="text-sm text-gray-600 leading-relaxed font-light mb-4">{t('suppliersPage.howItWorks.forSuppliersPanelIntro')}</p>
              {forSuppliersPanelBullets.length > 0 ? (
              <ul className="space-y-2 text-sm text-gray-600 font-light">
                {forSuppliersPanelBullets.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <span className="text-[#2D5A27] mt-1">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              ) : null}
            </div>
          </div>
          ) : null}
          </>
          ) : null}
        </div>
      </section>
      ) : null}

      <section className="py-20 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className={`${marketingSectionTitleMb4} text-center`}>{t('suppliersPage.requirements.title')}</h2>
          {requirementsSubtitle ? (
            <p className="text-base text-gray-600 font-light leading-relaxed text-center max-w-3xl mx-auto">
              {requirementsSubtitle}
            </p>
          ) : null}

          {reqCards.length > 0 ? (
          <>
          {t('suppliersPage.requirements.supplierHeading') ? (
          <div className="mb-12 mt-10">
            <h3 className="text-xl font-light text-gray-900 mb-6 flex items-center gap-2">
              <Warehouse className="w-6 h-6 text-[#2D5A27]" />
              {t('suppliersPage.requirements.supplierHeading')}
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {reqCards.map((item, index) => (
                <div key={item.title} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">{requirementIcons[index] ?? requirementIcons[0]}</div>
                    <div>
                      <h4 className="text-base font-medium text-gray-900 mb-2">{item.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed font-light">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          ) : null}

          {requirementsCommonBody ? (
          <div className="bg-[#2D5A27]/10/30 border border-[#2D5A27]/20/50 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-[#2D5A27]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-700 leading-relaxed font-light">
                  {requirementsCommonLabel ? (
                    <span className="font-medium text-gray-900">{requirementsCommonLabel} </span>
                  ) : null}
                  {requirementsCommonBody}
                </p>
              </div>
            </div>
          </div>
          ) : null}
          </>
          ) : null}
        </div>
      </section>

      {logisticsTitle ? (
      <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className={marketingSectionTitle}>{t('suppliersPage.logistics.title')}</h2>
            <p className="text-base text-gray-600 font-light">{t('suppliersPage.logistics.subtitle')}</p>
          </div>

          {logisticsSteps.length > 0 ? (
          <div className="bg-[#2D5A27]/10/30 border border-[#2D5A27]/20/50 rounded-lg p-8 mb-8">
            <div className="max-w-4xl mx-auto">
              {t('suppliersPage.logistics.noEmptyTitle') ? (
                <h3 className="text-xl font-light text-gray-900 mb-6 text-center">{t('suppliersPage.logistics.noEmptyTitle')}</h3>
              ) : null}

              <div className="space-y-6">
                {logisticsSteps.map((step, i) => (
                  <div key={step.title} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#2D5A27] text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-base font-medium text-gray-900 mb-2">{step.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed font-light">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          ) : null}
        </div>
      </section>
      ) : null}

      <section className="py-20 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className={marketingSectionTitle}>{t('suppliersPage.application.title')}</h2>
            <p className="text-base text-gray-600 font-light max-w-xl mx-auto">{t('suppliersPage.application.intro')}</p>
            <p className="text-sm text-gray-500 mt-2 space-x-3">
              <Link href={loc('/suppliers/status')} className="text-[#2D5A27] underline">
                {t('suppliersPage.application.linkCheckStatus')}
              </Link>
              <span className="text-gray-300">·</span>
              <Link href={loc('/login')} className="text-[#2D5A27] underline">
                {t('suppliersPage.application.linkPartnerLogin')}
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
              <h3 className="text-xl font-medium text-gray-900 mb-2">{t('suppliersPage.application.receivedTitle')}</h3>
              {referenceCode && (
                <p className="text-gray-800 font-mono text-lg mb-2">
                  {t('suppliersPage.application.referencePrefix')} <span className="font-semibold">{referenceCode}</span>
                </p>
              )}
              <p className="text-gray-600 font-light mb-4">{t('suppliersPage.application.receivedBody')}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {referenceCode && (
                  <Link
                    href={`${loc('/suppliers/status')}?ref=${encodeURIComponent(referenceCode)}`}
                    className="inline-flex items-center justify-center px-4 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f]"
                  >
                    {t('suppliersPage.application.ctaCheckStatus')}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setReferenceCode(null);
                  }}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {t('suppliersPage.application.ctaAnother')}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-8">
              <div className="space-y-6">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    {t('suppliersPage.form.companyNameLabel')}
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder={t('suppliersPage.form.companyNamePlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="pib" className="block text-sm font-medium text-gray-700 mb-2">
                    <Hash className="w-4 h-4 inline mr-1" />
                    {t('suppliersPage.form.vatLabel')}
                  </label>
                  <input
                    type="text"
                    id="pib"
                    name="pib"
                    value={formData.pib}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder={t('suppliersPage.form.vatPlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('suppliersPage.form.contactPersonLabel')}
                  </label>
                  <input
                    type="text"
                    id="contactPerson"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder={t('suppliersPage.form.contactPlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('suppliersPage.form.emailLabel')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder={t('suppliersPage.form.emailPlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('suppliersPage.form.phoneLabel')}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder={t('suppliersPage.form.phonePlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="productType" className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    {t('suppliersPage.form.productTypeLabel')}
                  </label>
                  <select
                    id="productType"
                    name="productType"
                    value={formData.productType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                  >
                    <option value="">{t('suppliersPage.form.productTypePlaceholder')}</option>
                    {PRODUCT_VALUES.map((value) => (
                      <option key={value} value={value}>
                        {t(`suppliersPage.form.productTypes.${PRODUCT_I18N[value]}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Award className="w-4 h-4 inline mr-1" />
                    {t('suppliersPage.form.certificationsLabel')}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {CERTIFICATION_CODES.map((cert) => (
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
                        <span className="text-sm text-gray-700">{cert}</span>
                      </label>
                    ))}
                  </div>
                  {formData.certifications.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">{t('suppliersPage.form.certificationsHint')}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('suppliersPage.form.websiteLabel')}
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder={t('suppliersPage.form.websitePlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('suppliersPage.form.descriptionLabel')}
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                    placeholder={t('suppliersPage.form.descriptionPlaceholder')}
                  />
                </div>

                {submitError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{submitError}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? t('suppliersPage.form.submitting') : t('suppliersPage.form.submit')}
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
