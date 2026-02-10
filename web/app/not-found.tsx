import Link from 'next/link';
import Image from 'next/image';
import { Home, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: '404 - Page Not Found | Bio Vera',
  description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
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
          <h1 className="text-9xl font-light text-gray-200 mb-4">404</h1>
          <h2 className="text-3xl font-light text-gray-900 mb-4">Page Not Found</h2>
          <p className="text-lg text-gray-600 font-light mb-8 leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go to Homepage
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need help? <Link href="/contact" className="text-green-600 hover:text-green-700">Contact us</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
