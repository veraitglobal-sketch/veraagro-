'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth';
import { getPathAfterWebLogin } from '@/lib/post-login-redirect';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Footer from '@/components/Footer';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

function LoginFormInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const loc = useLocalizedHref();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '';
  const [partnerCode, setPartnerCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const u = await login(partnerCode, password);
      router.push(getPathAfterWebLogin(u, returnTo));
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(msg || t('loginPage.errorFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="pt-24 sm:pt-28 pb-16 px-6 lg:px-8 bg-gradient-to-b from-[#2D5A27]/10 to-white">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white border border-gray-200 rounded-lg shadow-subtle p-8"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-light text-gray-900 mb-2">{t('loginPage.title')}</h1>
              <p className="text-sm text-gray-600">{t('loginPage.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="partnerCode" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('loginPage.partnerCodeLabel')}
                </label>
                <input
                  id="partnerCode"
                  type="text"
                  value={partnerCode}
                  onChange={(e) => setPartnerCode(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                  placeholder={t('loginPage.partnerCodePlaceholder')}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('loginPage.passwordLabel')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                  placeholder={t('loginPage.passwordPlaceholder')}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2D5A27] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#23471f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? t('loginPage.signingIn') : t('loginPage.signIn')}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center space-y-3">
                <Link
                  href={loc('/')}
                  className="block text-sm text-gray-600 hover:text-[#2D5A27] transition-colors"
                >
                  {t('loginPage.backToHome')}
                </Link>

                <p className="text-sm text-gray-600">
                  {t('loginPage.noAccount')}{' '}
                  <Link href="/register/buyer" className="text-[#2D5A27] hover:text-[#23471f] font-medium">
                    {t('loginPage.register')}
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function LoginPageContent() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-pulse text-gray-500">{t('common.loading')}</div>
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
