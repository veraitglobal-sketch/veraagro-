'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Footer from '@/components/Footer';
import { authAPI } from '@/lib/api';

function VerifyBuyerEmailInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') ?? '';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{4}$/.test(code.trim())) {
      setError(t('buyerRegisterVerify.errCodeFormat'));
      return;
    }
    setLoading(true);
    try {
      await authAPI.verifyEmailCode(email.trim(), code.trim());
      setSuccess(true);
    } catch (err: unknown) {
      const raw =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
          : undefined;
      setError(typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.join(' ') : t('buyerRegisterVerify.errFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) return;
    setResending(true);
    setError('');
    try {
      await authAPI.resendVerificationCode(email.trim());
    } catch {
      /* generic success message either way */
    } finally {
      setResending(false);
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
                <h1 className="text-xl font-light text-[#2D5A27]">{t('buyerRegisterVerify.successTitle')}</h1>
                <p className="text-sm text-gray-700">{t('buyerRegisterVerify.successBody')}</p>
                <Link
                  href="/login/buyer"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#2D5A27] px-6 py-3 text-sm font-medium text-white hover:bg-[#23471f]"
                >
                  {t('buyerRegisterVerify.goLogin')}
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <h1 className="mb-2 text-2xl font-light text-gray-900">{t('buyerRegisterVerify.title')}</h1>
                  <p className="text-sm text-gray-600">{t('buyerRegisterVerify.subtitle')}</p>
                </div>
                <form onSubmit={handleVerify} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                      {t('buyerRegister.email')}
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                    />
                  </div>
                  <div>
                    <label htmlFor="code" className="mb-2 block text-sm font-medium text-gray-700">
                      {t('buyerRegisterVerify.codeLabel')}
                    </label>
                    <input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={4}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl tracking-[0.4em] focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                      placeholder="0000"
                    />
                  </div>
                  {error ? <p className="text-sm text-red-600">{error}</p> : null}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[48px] rounded-lg bg-[#2D5A27] py-3 text-sm font-medium text-white hover:bg-[#23471f] disabled:opacity-50"
                  >
                    {loading ? t('buyerRegisterVerify.verifying') : t('buyerRegisterVerify.submit')}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || !email.trim()}
                  className="mt-4 w-full text-sm text-[#2D5A27] hover:underline disabled:opacity-50"
                >
                  {resending ? t('buyerRegisterVerify.resending') : t('buyerRegisterVerify.resend')}
                </button>
              </>
            )}
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default function VerifyBuyerEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <VerifyBuyerEmailInner />
    </Suspense>
  );
}
