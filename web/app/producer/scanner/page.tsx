'use client';

import { useAuth } from '@/lib/auth';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { smartLockAPI } from '@/lib/api';
import Link from 'next/link';

export default function ScannerPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [serialNumber, setSerialNumber] = useState('');
  const [parcelId, setParcelId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D5A27]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login/producer');
    return null;
  }

  const handleScan = async () => {
    if (!serialNumber) {
      setError('Unesite serial number');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const data = await smartLockAPI.scanSeed({
        inputSerialNumber: serialNumber,
        gpsLatitude: position.coords.latitude,
        gpsLongitude: position.coords.longitude,
        parcelId: parcelId || undefined,
      });

      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Greška pri skeniranju');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="text-2xl font-bold text-[#2D5A27]">
              🌱 Bio Vera
            </Link>
            <nav className="flex gap-4">
              <Link href="/producer/dashboard" className="px-4 py-2 text-gray-700 hover:text-[#2D5A27]">
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">QR Scanner</h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serial Number (QR Code)
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                placeholder="Skeniraj ili unesi QR kod"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parcel ID (opciono)
              </label>
              <input
                type="text"
                value={parcelId}
                onChange={(e) => setParcelId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                placeholder="ID parcele"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {result && (
              <div className="bg-[#2D5A27]/10 border border-[#2D5A27]/30 text-[#2D5A27] px-4 py-3 rounded-lg">
                <p className="font-semibold mb-2">Uspešno skenirano!</p>
                <pre className="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}

            <button
              onClick={handleScan}
              disabled={loading}
              className="w-full bg-[#2D5A27] text-white py-3 rounded-lg font-semibold hover:bg-[#23471f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Skeniranje...' : 'Skeniraj QR Kod'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
