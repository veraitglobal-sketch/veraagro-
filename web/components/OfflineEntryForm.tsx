// React component for offline field entry form
// Uses useOfflineEntry hook

'use client';

import { useState } from 'react';
import { useOfflineEntry, EntryType } from '@/hooks/useOfflineEntry';
import { getGPSLocation, getDeviceFingerprint } from '@/lib/image-compression';

interface OfflineEntryFormProps {
  farmId: string;
  onSuccess?: () => void;
}

export default function OfflineEntryForm({ farmId, onSuccess }: OfflineEntryFormProps) {
  const {
    addEntry,
    scanCode,
    latestScannedCode,
    hasValidScan,
    isOnline,
    pendingSync,
    error: hookError,
    syncNow,
  } = useOfflineEntry({ farmId, autoSync: true });

  const [entryType, setEntryType] = useState<EntryType>('SETVA');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [scanInput, setScanInput] = useState('');
  const [scanType, setScanType] = useState<'SEED' | 'PACKAGING' | 'FERTILIZER'>('SEED');
  const [fertilizerBarcode, setFertilizerBarcode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleScan = async () => {
    if (!scanInput.trim()) {
      alert('Unesite bar-kod');
      return;
    }

    try {
      if (scanType === 'FERTILIZER') {
        // For fertilizer, store separately for compliance check
        setFertilizerBarcode(scanInput.trim());
        setScanInput('');
        alert('Bar-kod đubriva skeniran! Biće proveren na Bio-White-List.');
      } else {
        await scanCode(scanInput.trim(), scanType);
        setScanInput('');
        alert('Bar-kod uspešno skeniran!');
      }
    } catch (err: any) {
      alert(`Greška: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);

    try {
      // SECURITY: Get GPS location from device
      const gpsLocation = await getGPSLocation();
      const deviceId = getDeviceFingerprint();

      const result = await addEntry(
        entryType,
        {
          date,
          notes: notes || undefined,
          location: gpsLocation ? { lat: gpsLocation.lat, lng: gpsLocation.lng } : undefined,
          deviceId,
          deviceTimestamp: new Date().toISOString(),
        },
        fertilizerBarcode ? {
          fertilizerBarcode: fertilizerBarcode,
        } : undefined
      );

      if (result.success) {
        setSuccess(true);
        setNotes('');
        if (onSuccess) {
          onSuccess();
        }
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert(result.error || 'Greška pri čuvanju');
      }
    } catch (err: any) {
      alert(`Greška: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Unos Podataka sa Njive</h2>
        <div className="flex items-center gap-4 text-sm">
          <span className={`px-3 py-1 rounded-full ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </span>
          {pendingSync > 0 && (
            <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
              {pendingSync} na čekanju
            </span>
          )}
        </div>
      </div>

      {/* Scan Code Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-700 mb-3">1. Skeniranje Bar-koda</h3>
        <div className="flex gap-2 mb-3">
          <select
            value={scanType}
            onChange={(e) => setScanType(e.target.value as 'SEED' | 'PACKAGING' | 'FERTILIZER')}
            className="px-3 py-2 border rounded-md"
          >
            <option value="SEED">Seme</option>
            <option value="PACKAGING">Ambalaža</option>
            <option value="FERTILIZER">Đubrivo</option>
          </select>
          <input
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            placeholder="Unesite ili skenirajte bar-kod"
            className="flex-1 px-3 py-2 border rounded-md"
            onKeyPress={(e) => e.key === 'Enter' && handleScan()}
          />
          <button
            onClick={handleScan}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Skeniraj
          </button>
        </div>
        {latestScannedCode && (
          <div className="text-sm text-gray-600">
            ✅ Poslednji skenirani: <strong>{latestScannedCode.code}</strong> ({latestScannedCode.type === 'SEED' ? 'Seme' : 'Ambalaža'})
          </div>
        )}
        {fertilizerBarcode && (
          <div className="text-sm text-green-600 mt-2">
            ✅ Đubrivo skenirano: <strong>{fertilizerBarcode}</strong> (biće provereno na Bio-White-List)
          </div>
        )}
        {!hasValidScan && (
          <div className="text-sm text-yellow-600 mt-2">
            ⚠️ Morate skenirati bar-kod pre unosa podataka
          </div>
        )}
      </div>

      {/* Entry Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tip Unosa</label>
          <select
            value={entryType}
            onChange={(e) => setEntryType(e.target.value as EntryType)}
            className="w-full px-3 py-2 border rounded-md"
            required
          >
            <option value="SETVA">Setva</option>
            <option value="PRSKANJE">Prskanje</option>
            <option value="BERBA">Berba</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Napomene (opciono)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Dodatne napomene..."
          />
        </div>

        {hookError && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{hookError}</div>
        )}

        {success && (
          <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">
            ✅ Podaci uspešno sačuvani {isOnline ? 'i sinhronizovani' : '(biće sinhronizovani kada se konekcija vrati)'}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!hasValidScan || submitting}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? 'Čuvanje...' : 'Sačuvaj'}
          </button>
          {pendingSync > 0 && isOnline && (
            <button
              type="button"
              onClick={syncNow}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Sinhronizuj ({pendingSync})
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
