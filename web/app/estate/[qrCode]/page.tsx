'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PassportView, { PassportData } from '@/components/PassportView';
import { WEB_API_BASE } from '@/lib/api-base';

export default function EstatePassportPage() {
  const params = useParams();
  const qrCode = params.qrCode as string;
  const [data, setData] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPassport();
  }, [qrCode]);

  const fetchPassport = async () => {
    try {
      const response = await fetch(`${WEB_API_BASE}/estate-profile/qr/${qrCode}`);
      if (!response.ok) throw new Error('Estate passport not found');
      const passportData = await response.json();
      setData(passportData);
    } catch (err: any) {
      setError(err.message || 'Failed to load estate passport');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-6 h-6 border-[1.5px] border-[#1A3021] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-[#1A3021] text-sm font-light">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-light text-[#1A3021] mb-2">Estate passport not found</h1>
          <p className="text-sm text-[#1A3021]/60 font-light">{error || 'Estate passport not found.'}</p>
        </div>
      </div>
    );
  }

  return <PassportView data={data} />;
}
