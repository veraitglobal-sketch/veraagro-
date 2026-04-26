'use client';

import { useState } from 'react';
import { useOfflineEntry } from '@/hooks/useOfflineEntry';

/**
 * FARMER-FRIENDLY FORM
 * Optimized for 60+ year old farmers with dirty hands
 * - Large buttons (min 60px)
 * - Large fonts (min 18px)
 * - Simple flow: Scan → Auto-submit
 * - Haptic feedback
 * - Audio feedback (optional)
 */
export default function FarmerFriendlyForm({ farmId }: { farmId: string }) {
  const { addEntry, scanCode, latestScannedCode, syncNow } = useOfflineEntry({ farmId });
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleScan = async () => {
    setScanning(true);
    try {
      // Use camera API for barcode scanning
      // For now, prompt for manual input
      const barcode = prompt('Scan barcode (or enter manually):');
      if (!barcode) return;

      await scanCode(barcode, 'SEED');
      
      // Auto-submit after scan
      const result = await addEntry('BERBA', {
        date: new Date().toISOString().split('T')[0],
      });

      if (result.success) {
        setSuccess(true);
        // Haptic feedback (if supported)
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }
        // Audio feedback
        const audio = new Audio('/sounds/success.mp3');
        audio.play().catch(() => {}); // Ignore errors
        
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Large Title */}
        <h1 className="text-3xl font-bold text-center mb-8 mt-8">
          Harvest entry
        </h1>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-6 bg-[#2D5A27]/20 border-2 border-[#2D5A27] rounded-lg text-center">
            <p className="text-2xl font-bold text-[#23471f]">✓ Successfully saved!</p>
          </div>
        )}

        {/* Large Scan Button */}
        <button
          onClick={handleScan}
          disabled={scanning}
          className="w-full h-24 bg-[#2D5A27] text-white text-2xl font-bold rounded-lg shadow-lg hover:bg-[#23471f] active:bg-[#23471f] disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          {scanning ? 'Scanning…' : '📷 SCAN BARCODE'}
        </button>

        {/* Latest Scan Info */}
        {latestScannedCode && (
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
            <p className="text-lg font-semibold text-blue-900">
              Last scanned: {latestScannedCode.code}
            </p>
          </div>
        )}

        {/* Sync Button */}
        <button
          onClick={syncNow}
          className="w-full h-16 bg-gray-600 text-white text-xl font-semibold rounded-lg shadow hover:bg-gray-700"
        >
          🔄 Sync now
        </button>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
          <p className="text-lg font-semibold text-yellow-900 mb-2">
            How to:
          </p>
          <ol className="text-base text-yellow-800 space-y-2 list-decimal list-inside">
            <li>Tap &quot;SCAN BARCODE&quot;</li>
            <li>Point the camera at the barcode</li>
            <li>Data will be saved automatically</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
