'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { authAPI } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function AdminLoginPage() {
  const [partnerCode, setPartnerCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use authAPI.login directly to get response data
      const response = await authAPI.login(partnerCode, password);
      
      // Check if user has admin role
      const userRoles = response.user?.roles && Array.isArray(response.user.roles) 
        ? response.user.roles 
        : [];

      const isAdmin = userRoles.some((role: string) => ['SUPER_ADMIN', 'ADMIN'].includes(role));
      
      if (!isAdmin) {
        setError('This account does not have admin privileges.');
        // Clear token if not admin
        authAPI.logout();
        return;
      }

      // Update auth context
      await login(partnerCode, password);

      // Redirect to admin dashboard
      router.push('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl"
      >
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <Image
              src="/logo1.png"
              alt="Bio Vera"
              width={200}
              height={70}
              className="mx-auto h-14 w-auto"
            />
          </Link>
          <h2 className="mt-6 text-3xl font-light text-gray-900">Admin Login</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to access the admin panel</p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="partnerCode" className="block text-sm font-medium text-gray-700 mb-1">
                Partner Code or Email
              </label>
              <input
                id="partnerCode"
                name="partnerCode"
                type="text"
                required
                value={partnerCode}
                onChange={(e) => setPartnerCode(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Enter your partner code or email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/" className="text-sm text-green-600 hover:text-green-700">
              Back to Home
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
