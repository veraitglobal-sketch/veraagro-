'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PassportView, { PassportData } from '@/components/PassportView';
import { getPublicApiBase } from '@/lib/public-api';

export default function FarmerProfilePage() {
  const params = useParams();
  const qrCode = params.qrCode as string;
  const [data, setData] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const base = getPublicApiBase();
        const response = await fetch(`${base}/farmer-profile/qr/${encodeURIComponent(qrCode)}`);
        if (!response.ok) throw new Error('Profile not found');
        const profileData = await response.json();
        setData(profileData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    void fetchProfile();
  }, [qrCode]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gradient-to-b from-[#f7faf7] to-white px-4">
        <div className="text-center">
          <div
            className="inline-block w-8 h-8 border-2 border-[#2D5A27] border-t-transparent rounded-full animate-spin"
            aria-hidden
          />
          <p className="mt-5 text-sm font-light text-gray-600">Loading producer profile…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-b from-[#f7faf7] to-white">
        <div className="text-center max-w-md rounded-2xl border border-gray-200 bg-white/90 shadow-sm p-8">
          <h1 className="text-xl font-light text-gray-900 mb-2">Profile not found</h1>
          <p className="text-sm text-gray-500 font-light leading-relaxed">{error || 'Farmer profile not found.'}</p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm font-medium text-[#2D5A27] hover:text-[#23471f] underline-offset-4 hover:underline"
          >
            Back to Bio Vera
          </Link>
        </div>
      </div>
    );
  }

  return <PassportView data={data} />;
}
