'use client';

/**
 * Public track page for retail buyers — batch traceability.
 * HACCP status: verified | pending. Compliance photos, temperature, PDF (placeholders as implemented).
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Shield, CheckCircle, Clock, XCircle, Thermometer, Download, Image as ImageIcon } from 'lucide-react';
import { WEB_API_BASE } from '@/lib/api-base';

const API_URL = WEB_API_BASE;

interface TrackData {
  batchId: string;
  productName: string;
  quantity: number;
  unit: string;
  harvestDate: string;
  farmerName: string;
  haccpStatus: 'VERIFIED' | 'PENDING' | 'FAIL' | 'NOT_FOUND';
  loadTemperature?: number;
  loadTemperatureOk?: boolean;
  compliancePhotos: Array<{ photoType: string; photoUrl: string; isVerified: boolean }>;
  temperatureHistory?: Array<{ temperature: number; timestamp: string }>;
}

export default function TrackPage() {
  const params = useParams();
  const batchId = params?.batchId as string;
  const [data, setData] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/haccp/track/${encodeURIComponent(batchId)}`);
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [batchId]);

  const formatDate = (iso: string) => {
    if (!iso) return '–';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D5A27] mx-auto" />
          <p className="mt-4 text-gray-600">Loading batch…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center text-red-600">{error || 'Batch not found'}</div>
      </div>
    );
  }

  if (data.haccpStatus === 'NOT_FOUND') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Batch not found</p>
          <p className="text-sm text-gray-500 mt-1">Batch ID: {batchId}</p>
        </div>
      </div>
    );
  }

  const StatusBadge = () => {
    if (data!.haccpStatus === 'VERIFIED')
      return (
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-5 h-5" />
          HACCP Status: Verified
        </span>
      );
    if (data!.haccpStatus === 'FAIL')
      return (
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-800">
          <XCircle className="w-5 h-5" />
          HACCP Status: Incomplete
        </span>
      );
    return (
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-amber-100 text-amber-800">
        <Clock className="w-5 h-5" />
        HACCP Status: Pending
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-[#2D5A27] text-white px-6 py-4">
            <h1 className="text-lg font-semibold">Bio Vera – Shipment Tracking</h1>
            <p className="text-sm text-white/80 mt-1">Batch {data.batchId}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* HACCP Status */}
            <div>
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                HACCP Control
              </h2>
              <StatusBadge />
            </div>

            {/* Product */}
            <div>
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Product
              </h2>
              <p className="text-lg font-medium text-gray-900">{data.productName}</p>
              <p className="text-sm text-gray-600 mt-1">
                {data.quantity} {data.unit} • Harvested: {formatDate(data.harvestDate)}
              </p>
              <p className="text-sm text-gray-600">Producer: {data.farmerName}</p>
            </div>

            {/* Load temperature */}
            {data.loadTemperature != null && (
              <div>
                <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Load temperature
                </h2>
                <div className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-gray-500" />
                  <span
                    className={
                      data.loadTemperatureOk === false ? 'text-red-600 font-medium' : 'text-gray-900'
                    }
                  >
                    {data.loadTemperature}°C
                    {data.loadTemperatureOk === false && ' (Out of range)'}
                  </span>
                </div>
              </div>
            )}

            {/* Compliance photos */}
            {data.compliancePhotos.length > 0 && (
              <div>
                <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Compliance photos
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {data.compliancePhotos.map((p, i) => (
                    <a
                      key={i}
                      href={p.photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square rounded-lg bg-gray-100 overflow-hidden hover:opacity-90"
                    >
                      <img
                        src={p.photoUrl}
                        alt={p.photoType}
                        className="w-full h-full object-cover"
                      />
                      <div className="p-1.5 bg-white/90 text-xs text-gray-600 truncate">
                        {p.photoType} {p.isVerified ? '✓' : ''}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* PDF download placeholder */}
            <div>
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Download HACCP certificate (PDF) – Coming soon
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
