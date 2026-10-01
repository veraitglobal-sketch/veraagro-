'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { contactAPI } from '@/lib/api';
import { axiosResponseStatus } from '@/lib/api-error';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import Footer from '@/components/Footer';
import { BOOK_CALL_ENABLED } from '@/lib/book-call';

export default function ContactPage() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const result = await contactAPI.submitInquiry({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        phone: formData.phone || undefined,
      });

      if (result && result.success) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '', phone: '' });
        setTimeout(() => setSubmitStatus('idle'), 5000);
      } else {
        setSubmitStatus('error');
        setErrorMessage((result && result.message) || t('contactPage.errorResult'));
        setTimeout(() => {
          setSubmitStatus('idle');
          setErrorMessage('');
        }, 10000);
      }
    } catch (error: unknown) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus('error');
      let msg = '';

      const status = axiosResponseStatus(error);
      if (status !== undefined) {
        const data = (error as { response?: { data?: { message?: string } } }).response?.data;
        if (status === 400) {
          msg = data?.message || t('contactPage.errCheckInput');
        } else if (status === 429) {
          msg = t('contactPage.errRateLimit');
        } else if (status >= 500) {
          msg = t('contactPage.errServer');
        } else {
          msg = data?.message || t('contactPage.errHttp');
        }
      } else if (
        (error &&
          typeof error === 'object' &&
          'code' in error &&
          (error as { code?: string }).code === 'ECONNABORTED') ||
        (error instanceof Error && error.message.toLowerCase().includes('timeout')) ||
        (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError'))
      ) {
        msg = t('contactPage.errTimeout');
      } else if (error instanceof Error && error.message === 'Failed to fetch') {
        msg = t('contactPage.errNetwork');
      } else if (error && typeof error === 'object' && 'request' in error && !('response' in error)) {
        msg = t('contactPage.errNetwork');
      } else {
        msg = t('contactPage.errUnknown');
      }
      setErrorMessage(msg || t('contactPage.errUnknown'));

      setTimeout(() => {
        setSubmitStatus('idle');
        setErrorMessage('');
      }, 10000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-24 pb-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">{t('contactPage.heroTitle')}</h1>
            <p className="text-lg text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
              {t('contactPage.heroSubtitle')}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h2 className="text-2xl font-light text-gray-900 mb-6">{t('contactPage.contactInfoTitle')}</h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#2D5A27]/10 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-[#2D5A27]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">{t('contactPage.labelEmail')}</h3>
                      <a href="mailto:info@biovera.app" className="text-sm text-gray-600 font-light hover:text-[#2D5A27] transition-colors">
                        info@biovera.app
                      </a>
                      <br />
                      <a href="mailto:support@biovera.app" className="text-sm text-gray-600 font-light hover:text-[#2D5A27] transition-colors">
                        support@biovera.app
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#2D5A27]/10 rounded-lg flex items-center justify-center">
                      <Phone className="w-6 h-6 text-[#2D5A27]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">{t('contactPage.labelPhone')}</h3>
                      <a href="tel:+4915563740470" className="text-sm text-gray-600 font-light hover:text-[#2D5A27] transition-colors">
                        +49 155 63740470
                      </a>
                      <p className="text-sm text-gray-500 font-light mt-1">{t('contactPage.phoneHours')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#2D5A27]/10 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-[#2D5A27]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">{t('contactPage.labelHeadquarters')}</h3>
                      <p className="text-sm text-gray-600 font-light">
                        {t('contactPage.addressLine1')}
                        <br />
                        {t('contactPage.addressLine2')}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {BOOK_CALL_ENABLED && (
                <Link
                  href={`${loc('/book-a-call')}?from=/contact`}
                  className="flex items-start gap-4 rounded-lg border border-[#2D5A27]/30 bg-[#2D5A27]/5 p-4 hover:bg-[#2D5A27]/10 transition-colors"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-[#2D5A27]/10 rounded-lg flex items-center justify-center">
                    <CalendarDays className="w-6 h-6 text-[#2D5A27]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{t('bookCall.contactPromptTitle')}</h3>
                    <p className="text-sm text-[#2D5A27] font-light">{t('bookCall.contactPromptCta')} →</p>
                  </div>
                </Link>
              )}

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="pt-6 border-t border-gray-200"
              >
                <h3 className="text-sm font-medium text-gray-900 mb-4">{t('contactPage.quickLinks')}</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href={loc('/help-center')} className="text-sm text-gray-600 font-light hover:text-[#2D5A27] transition-colors">
                      {t('nav.helpCenter')}
                    </Link>
                  </li>
                  <li>
                    <Link href={loc('/legal')} className="text-sm text-gray-600 font-light hover:text-[#2D5A27] transition-colors">
                      {t('languagePage.backToLegal')}
                    </Link>
                  </li>
                  <li>
                    <Link href={loc('/for-growers')} className="text-sm text-gray-600 font-light hover:text-[#2D5A27] transition-colors">
                      {t('nav.forGrowers')}
                    </Link>
                  </li>
                  <li>
                    <Link href={loc('/suppliers')} className="text-sm text-gray-600 font-light hover:text-[#2D5A27] transition-colors">
                      {t('nav.forSuppliers')}
                    </Link>
                  </li>
                </ul>
              </motion.div>
            </div>

            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-gray-50 border border-gray-200 rounded-lg p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <MessageSquare className="w-5 h-5 text-[#2D5A27]" />
                  <h2 className="text-2xl font-light text-gray-900">{t('contactPage.formTitle')}</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                        {t('contactPage.nameLabel')}
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27] outline-none transition-colors font-light"
                        placeholder={t('contactPage.namePlaceholder')}
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                        {t('contactPage.emailLabel')}
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27] outline-none transition-colors font-light"
                        placeholder={t('contactPage.emailPlaceholder')}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-900 mb-2">
                      {t('contactPage.subjectLabel')}
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27] outline-none transition-colors font-light bg-white"
                    >
                      <option value="">{t('contactPage.subjectSelectPlaceholder')}</option>
                      <option value="general">{t('contactPage.subjectGeneral')}</option>
                      <option value="grower">{t('contactPage.subjectGrower')}</option>
                      <option value="supplier">{t('contactPage.subjectSupplier')}</option>
                      <option value="logistics">{t('contactPage.subjectLogistics')}</option>
                      <option value="buyer">{t('contactPage.subjectBuyer')}</option>
                      <option value="technical">{t('contactPage.subjectTechnical')}</option>
                      <option value="other">{t('contactPage.subjectOther')}</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-900 mb-2">
                      {t('contactPage.messageLabel')}
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27] outline-none transition-colors font-light resize-none"
                      placeholder={t('contactPage.messagePlaceholder')}
                    />
                  </div>

                  {submitStatus === 'success' && (
                    <div className="p-4 bg-[#2D5A27]/10 border border-[#2D5A27]/30 rounded-lg">
                      <p className="text-sm text-[#23471f] font-light">{t('contactPage.successMessage')}</p>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 font-light">
                        {errorMessage || t('contactPage.errorFallback')}
                      </p>
                      {process.env.NODE_ENV === 'development' && (
                        <p className="text-xs text-red-600 mt-2 font-mono">{t('contactPage.devConsoleHint')}</p>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t('contactPage.sending')}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {t('contactPage.sendMessage')}
                      </>
                    )}
                  </button>
                  <p className="text-center text-sm text-gray-500 mt-4">
                    {t('contactPage.formHelpBefore')}{' '}
                    <a href="mailto:info@biovera.app" className="text-[#2D5A27] hover:underline">
                      info@biovera.app
                    </a>
                    {t('contactPage.formHelpAfter')}
                  </p>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
