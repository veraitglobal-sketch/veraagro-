'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const params = useParams();
  const [partnerCode, setPartnerCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const isProducer = params?.type === 'producer';
  const isBuyer = params?.type === 'buyer';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(partnerCode, password);
      // Redirect to home page after login (Navigation will show Dashboard link)
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image 
                src="/logo1.png" 
                alt="Bio Vera" 
                width={56} 
                height={20} 
                className="h-4 w-auto bg-transparent"
                priority
                style={{ background: 'transparent' }}
              />
            </Link>
            <nav className="flex gap-8 items-center">
              <Link href="/" className="text-sm text-gray-600 hover:text-[#2D5A27] transition-colors">
                Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Login Section */}
      <section className="pt-32 pb-16 px-6 lg:px-8 bg-gradient-to-b from-[#2D5A27]/10 to-white">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white border border-gray-200 rounded-lg shadow-subtle p-8"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-light text-gray-900 mb-2">Sign In</h1>
              <p className="text-sm text-gray-600">
                Sign in to your Bio Vera account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="partnerCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Partner Code *
                </label>
                <input
                  id="partnerCode"
                  type="text"
                  value={partnerCode}
                  onChange={(e) => setPartnerCode(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                  placeholder="Enter your partner code"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                  placeholder="Enter your password"
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
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center space-y-3">
                <Link
                  href="/"
                  className="block text-sm text-gray-600 hover:text-[#2D5A27] transition-colors"
                >
                  ← Back to Home
                </Link>
                
                <p className="text-sm text-gray-600">
                  Don't have an account? <Link href="/register/buyer" className="text-[#2D5A27] hover:text-[#23471f] font-medium">Register</Link>
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12 items-start">
            <div className="flex flex-col">
              <Link href="/" className="mb-4 flex items-center" style={{ minHeight: '1.25rem', marginTop: '-0.25rem' }}>
                <Image 
                  src="/logo1.png" 
                  alt="Bio Vera" 
                  width={56} 
                  height={20} 
                  className="h-4 w-auto"
                  style={{ display: 'block', background: 'transparent', objectFit: 'contain' }}
                />
              </Link>
              <p className="text-sm text-gray-600 leading-relaxed">
                A vertically integrated agricultural network for Bio-Ready certification 
                and EU market compliance.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/login/buyer" className="hover:text-[#2D5A27] transition-colors">For Buyers</Link></li>
                <li><Link href="/login/producer" className="hover:text-[#2D5A27] transition-colors">For Producers</Link></li>
                <li><Link href="/logistics-partner" className="hover:text-[#2D5A27] transition-colors">For Logistics</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/#vision" className="hover:text-[#2D5A27] transition-colors">Vision</Link></li>
                <li><Link href="/#roadmap" className="hover:text-[#2D5A27] transition-colors">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#" className="hover:text-[#2D5A27] transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-[#2D5A27] transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2026 Bio Vera. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
