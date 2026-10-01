'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Footer from '@/components/Footer';
import { authAPI } from '@/lib/api';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      setSent(true);
    } catch (err: unknown) {
      const raw =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
          : undefined;
      setError(typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.join(' ') : t('forgotPassword.errFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-b from-[#2D5A27]/10 to-white px-6 pb-16 pt-12 lg:px-8">
        <div className="mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm"
          >
            {sent ? (
              <div className="space-y-4 text-center">
                <h1 className="text-xl font-light text-[#2D5A27]">{t('forgotPassword.sentTitle')}</h1>
                <p className="text-sm text-gray-700">{t('forgotPassword.sentBody')}</p>
                <Link
                  href="/login/buyer"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#2D5A27] px-6 py-3 text-sm font-medium text-white hover:bg-[#23471f]"
                >
                  {t('forgotPassword.backToLogin')}
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <h1 className="mb-2 text-2xl font-light text-gray-900">{t('forgotPassword.title')}</h1>
                  <p className="text-sm text-gray-600">{t('forgotPassword.subtitle')}</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                      {t('forgotPassword.emailLabel')}
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                      placeholder={t('forgotPassword.emailPh')}
                    />
                  </div>
                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="min-h-[48px] w-full rounded-lg bg-[#2D5A27] py-3 text-sm font-medium text-white hover:bg-[#23471f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? t('forgotPassword.submitting') : t('forgotPassword.submit')}
                  </button>
                </form>
                <p className="mt-6 text-center text-sm text-gray-600">
                  <Link href="/login/buyer" className="font-medium text-[#2D5A27] hover:text-[#23471f]">
                    {t('forgotPassword.backToLogin')}
                  </Link>
                </p>
              </>
            )}
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
