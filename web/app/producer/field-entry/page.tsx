// Field Entry Page - Offline-first entry form
'use client';

import { useState } from 'react';
import OfflineEntryForm from '@/components/OfflineEntryForm';
import { useOfflineEntry } from '@/hooks/useOfflineEntry';
import { useAuth } from '@/lib/auth';

export default function FieldEntryPage() {
  const { user } = useAuth();
  const [selectedFarmId, setSelectedFarmId] = useState<string>('farm-1'); // TODO: Get from user's farms

  const { entries, pendingSync, isOnline, syncNow, refresh } = useOfflineEntry({
    farmId: selectedFarmId,
    autoSync: true,
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Unos Podataka sa Njive</h1>
          <p className="text-gray-600">
            Unesite podatke o prskanju, setvi ili berbi. Podaci se čuvaju lokalno i automatski se sinhronizuju kada je dostupna internet konekcija.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Entry Form */}
          <div className="lg:col-span-2">
            <OfflineEntryForm
              farmId={selectedFarmId}
              onSuccess={() => {
                refresh();
              }}
            />
          </div>

          {/* Status Sidebar */}
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold text-gray-700 mb-3">Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Konekcija:</span>
                  <span className={`px-2 py-1 rounded text-xs ${isOnline ? 'bg-[#2D5A27]/20 text-[#23471f]' : 'bg-red-100 text-red-800'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                {pendingSync > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Na čekanju:</span>
                    <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                      {pendingSync} unosa
                    </span>
                  </div>
                )}
                {pendingSync > 0 && isOnline && (
                  <button
                    onClick={syncNow}
                    className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Sinhronizuj Sada
                  </button>
                )}
              </div>
            </div>

            {/* Recent Entries */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold text-gray-700 mb-3">Poslednji Unosi</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {entries.length === 0 ? (
                  <p className="text-sm text-gray-500">Nema unosa</p>
                ) : (
                  entries.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">
                          {entry.type === 'SETVA' ? '🌱 Setva' : entry.type === 'PRSKANJE' ? '💧 Prskanje' : '🌾 Berba'}
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
      </div>
    </div>
  );
}
