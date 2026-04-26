'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { estatesAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const DEFAULT_POLYGON = [
  { lat: 44.7866, lng: 20.4489 },
  { lat: 44.7876, lng: 20.4499 },
  { lat: 44.7886, lng: 20.4509 },
  { lat: 44.7866, lng: 20.4489 },
];

/**
 * Simplified new estate for web (full map flow is on the mobile app)
 */
export default function ProducerNewEstatePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login/producer');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-10 w-10 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) {
      setErr('Please enter a name');
      return;
    }
    setSaving(true);
    try {
      const created = await estatesAPI.create({
        name: name.trim(),
        polygonCoordinates: DEFAULT_POLYGON,
      });
      if (created?.id) {
        router.push(`/producer/estates/${created.id}`);
      } else {
        router.push('/producer/estates');
      }
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-4">
          <Link href="/producer/estates" className="text-sm text-gray-600 hover:text-[#2D5A27]">
            ← All estates
          </Link>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-light text-gray-900 mb-1">Add estate</h1>
        <p className="text-sm text-gray-500 mb-6">
          We start with a default boundary. Refine the map and add parcels in{' '}
          <Link href="/grower/fields" className="text-[#2D5A27] underline">
            My fields
          </Link>{' '}
          or use the mobile app to draw the plot.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{err}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estate name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. Gornja polja"
              required
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#2D5A27] text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create estate'}
          </button>
        </form>
      </div>
    </div>
  );
}
