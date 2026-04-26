// Field Entry Page - Offline-first entry form
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import OfflineEntryForm from '@/components/OfflineEntryForm';
import { useOfflineEntry } from '@/hooks/useOfflineEntry';
import { estatesAPI } from '@/lib/api';

type EstateRow = { id: string; name: string };

function FieldEntryWorkspace({
  selectedFarmId,
  onEstateChange,
  estates,
}: {
  selectedFarmId: string;
  onEstateChange: (id: string) => void;
  estates: EstateRow[];
}) {
  const { entries, pendingSync, isOnline, syncNow, refresh } = useOfflineEntry({
    farmId: selectedFarmId,
    autoSync: true,
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Estate (field)</label>
          <select
            value={selectedFarmId}
            onChange={(e) => onEstateChange(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {estates.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Entries and sync are scoped to the selected estate.
          </p>
        </div>
        <OfflineEntryForm
          farmId={selectedFarmId}
          onSuccess={() => {
            refresh();
          }}
        />
      </div>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="font-semibold text-gray-700 mb-3">Status</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Connection:</span>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  isOnline ? 'bg-[#2D5A27]/20 text-[#23471f]' : 'bg-red-100 text-red-800'
                }`}
              >
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            {pendingSync > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending:</span>
                <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                  {pendingSync} {pendingSync === 1 ? 'entry' : 'entries'}
                </span>
              </div>
            )}
            {pendingSync > 0 && isOnline && (
              <button
                onClick={syncNow}
                className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Sync now
              </button>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="font-semibold text-gray-700 mb-3">Recent entries</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {entries.length === 0 ? (
              <p className="text-sm text-gray-500">No entries yet</p>
            ) : (
              entries.slice(0, 10).map((entry) => (
                <div key={entry.id} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">
                      {entry.type === 'SETVA'
                        ? '🌱 Sowing'
                        : entry.type === 'PRSKANJE'
                          ? '💧 Spraying'
                          : '🌾 Harvest'}
                    </span>
                    <span className={`text-xs ${entry.synced ? 'text-[#2D5A27]' : 'text-yellow-600'}`}>
                      {entry.synced ? '✓' : '⏳'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date(entry.data.date).toLocaleDateString('en-US')}
                  </div>
                  {entry.data.notes && (
                    <div className="text-xs text-gray-500 mt-1 truncate">{entry.data.notes}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FieldEntryPage() {
  const [estates, setEstates] = useState<EstateRow[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError(null);
      try {
        const list = await estatesAPI.getAll();
        if (cancelled) return;
        const rows: EstateRow[] = Array.isArray(list)
          ? list.map((e: { id: string; name: string }) => ({ id: e.id, name: e.name || 'Estate' }))
          : [];
        setEstates(rows);
        if (rows.length > 0) {
          setSelectedFarmId((prev) => (prev && rows.some((r) => r.id === prev) ? prev : rows[0].id));
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Failed to load estates');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Field data entry</h1>
          <p className="text-gray-600">
            Enter spraying, planting, or harvest data. Entries are stored locally and sync automatically when
            you are back online.
          </p>
        </div>

        {loading && (
          <div className="text-center py-16 text-gray-500">Loading estates…</div>
        )}

        {!loading && loadError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{loadError}</div>
        )}

        {!loading && !loadError && estates.length === 0 && (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm max-w-xl">
            <p className="font-medium mb-2">No estate found</p>
            <p className="mb-3">
              Create an estate (field) first so entries can be linked to the correct location.
            </p>
            <Link href="/grower/fields" className="text-[#2D5A27] font-medium underline">
              Open fields and parcels
            </Link>
          </div>
        )}

        {!loading && !loadError && estates.length > 0 && selectedFarmId && (
          <FieldEntryWorkspace
            selectedFarmId={selectedFarmId}
            onEstateChange={setSelectedFarmId}
            estates={estates}
          />
        )}
      </div>
    </div>
  );
}
