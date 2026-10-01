'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Footer from '@/components/Footer';
import { authAPI } from '@/lib/api';

function ResetPasswordInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!tokenParam.trim()) {
      setError(t('resetPassword.errMissingToken'));
      return;
    }
    if (password.length < 6) {
      setError(t('resetPassword.errPasswordShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('resetPassword.errPasswordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword(tokenParam.trim(), password);
      setSuccess(true);
    } catch (err: unknown) {
      const raw =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
          : undefined;
      setError(typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.join(' ') : t('resetPassword.errFailed'));
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
            {success ? (
              <div className="space-y-4 text-center">
                <h1 className="text-xl font-light text-[#2D5A27]">{t('resetPassword.successTitle')}</h1>
                <p className="text-sm text-gray-700">{t('resetPassword.successBody')}</p>
                <Link
                  href="/login/buyer"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#2D5A27] px-6 py-3 text-sm font-medium text-white hover:bg-[#23471f]"
                >
                  {t('resetPassword.goLogin')}
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <h1 className="mb-2 text-2xl font-light text-gray-900">{t('resetPassword.title')}</h1>
                  <p className="text-sm text-gray-600">{t('resetPassword.subtitle')}</p>
                </div>
                {!tokenParam && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {t('resetPassword.errMissingToken')}
                    <Link href="/forgot-password" className="ml-1 font-medium text-[#2D5A27] hover:underline">
                      {t('resetPassword.requestNew')}
                    </Link>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                      {t('resetPassword.passwordLabel')}
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
                      {t('resetPassword.confirmLabel')}
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                    />
                  </div>
                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading || !tokenParam}
                    className="min-h-[48px] w-full rounded-lg bg-[#2D5A27] py-3 text-sm font-medium text-white hover:bg-[#23471f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? t('resetPassword.submitting') : t('resetPassword.submit')}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <p className="text-sm text-gray-500">{t('common.loading')}</p>
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
