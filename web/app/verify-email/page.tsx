'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authAPI } from '@/lib/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token. Please use the link from your email.');
      return;
    }

    authAPI
      .verifyEmail(token)
      .then((data) => {
        setStatus('success');
        setMessage(data.message || 'Email verified. Your account is now active.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(
          err?.response?.data?.message || err?.message || 'Invalid or expired verification link.'
        );
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-[#2D5A27] animate-spin mx-auto mb-6" />
            <h1 className="text-xl font-light text-gray-900 mb-2">Verifying your email...</h1>
            <p className="text-gray-500">Please wait.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-[#2D5A27] mx-auto mb-6" />
            <h1 className="text-xl font-light text-gray-900 mb-2">Email verified</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href="/growers"
                className="block w-full py-3 px-4 bg-[#2D5A27] text-white rounded-lg font-medium hover:bg-[#24491f] transition-colors"
              >
                Continue to Growers
              </Link>
              <p className="text-sm text-gray-500">
                Open the Bio Vera app to add your fields and continue.
              </p>
            </div>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-xl font-light text-gray-900 mb-2">Verification failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link
              href="/growers"
              className="inline-block py-2 px-4 text-[#2D5A27] hover:underline"
            >
              Back to Growers
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <Loader2 className="w-16 h-16 text-[#2D5A27] animate-spin mx-auto mb-6" />
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
