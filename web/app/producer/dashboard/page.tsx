'use client';

import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { estatesAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProducerDashboard() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const [estates, setEstates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login/producer');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadEstates();
    }
  }, [isAuthenticated]);

  const loadEstates = async () => {
    try {
      const data = await estatesAPI.getAll();
      setEstates(data);
    } catch (error) {
      console.error('Error loading estates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="text-2xl font-bold text-green-600">
              🌱 Bio Vera
            </Link>
            <nav className="flex gap-4">
              <Link href="/producer/scanner" className="px-4 py-2 text-gray-700 hover:text-green-600">
                Scanner
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Welcome, {user?.firstName || 'Producer'}! 🚜
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-2">🌾</div>
            <h3 className="font-semibold text-lg mb-1">Total fields</h3>
            <p className="text-3xl font-bold text-green-600">{estates.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-2">📦</div>
            <h3 className="font-semibold text-lg mb-1">Active parcels</h3>
            <p className="text-3xl font-bold text-green-600">
              {estates.reduce((sum, e) => sum + (e.parcels?.length || 0), 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-2">✅</div>
            <h3 className="font-semibold text-lg mb-1">Certified</h3>
            <p className="text-3xl font-bold text-green-600">
              {estates.filter((e: any) => e.certificationStatus === 'CERTIFIED').length}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <Link
            href="/producer/estates/new"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
          >
            + Add new field
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : estates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {estates.map((estate: any) => (
              <div key={estate.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-xl mb-2">{estate.name}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {estate.parcels?.length || 0} parcel(s)
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    estate.certificationStatus === 'CERTIFIED' ? 'bg-green-100 text-green-800' :
                    estate.certificationStatus === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {estate.certificationStatus || 'NOT_STARTED'}
                  </span>
                </div>
                <Link
                  href={`/producer/estates/${estate.id}`}
                  className="text-green-600 hover:text-green-700 font-semibold text-sm"
                >
                  Details →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">You have no fields yet.</p>
            <Link
              href="/producer/estates/new"
              className="text-green-600 hover:text-green-700 font-semibold"
            >
              Add your first field →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
