import { useEffect, useRef } from 'react';
import { useNetwork } from '../contexts/NetworkContext';
import { syncService } from '../lib/sync-service';

/**
 * When connectivity returns after being offline, flush the grower offline queue once
 * (respects AsyncStorage `settings_auto_sync === 'false'` inside syncService.startAutoSync).
 */
let lastReconnectSyncAt = 0;

export function GrowerReconnectAutoSync() {
  const { isOnline, isChecking } = useNetwork();
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (isChecking) return undefined;

    if (!isOnline) {
      wasOfflineRef.current = true;
      return undefined;
    }

    if (!wasOfflineRef.current) return undefined;

    wasOfflineRef.current = false;
    const id = setTimeout(() => {
      const now = Date.now();
      if (now - lastReconnectSyncAt < 45_000) return;
      lastReconnectSyncAt = now;
      void syncService.startAutoSync();
    }, 600);

    return () => clearTimeout(id);
  }, [isOnline, isChecking]);

  return null;
}
