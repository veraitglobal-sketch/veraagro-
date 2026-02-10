'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, RefreshCw, AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    if (typeof window !== 'undefined') {
      console.error('Application error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <Image
            src="/logo1.png"
            alt="Bio Vera"
            width={56}
            height={20}
            className="h-4 w-auto mx-auto mb-8"
            priority
          />
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
          <h1 className="text-3xl font-light text-gray-900 mb-4">Something went wrong</h1>
          <p className="text-lg text-gray-600 font-light mb-8 leading-relaxed">
            We're sorry, but something unexpected happened. Our team has been notified and is working on a fix.
          </p>
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-left">
              <p className="text-sm font-mono text-red-800">{error.message}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go to Homepage
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            If the problem persists, please <Link href="/contact" className="text-[#2D5A27] hover:text-[#23471f]">contact our support team</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
