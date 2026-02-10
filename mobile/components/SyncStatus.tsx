import { View, Text, TouchableOpacity } from 'react-native';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { syncService, SyncStatus as SyncStatusType } from '../lib/sync-service';
import { colors } from '../lib/colors';

interface SyncStatusProps {
  className?: string;
}

export default function SyncStatus({ className = '' }: SyncStatusProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>({
    lastSyncTime: null,
    pendingCount: 0,
    syncing: false,
    lastError: null,
  });

  useEffect(() => {
    loadSyncStatus();
    const interval = setInterval(loadSyncStatus, 5000); // Check every 5 seconds
    
    // Auto-sync if enabled (entries + products + costs)
    const autoSyncInterval = setInterval(async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const autoSyncEnabled = await AsyncStorage.getItem('settings_auto_sync');
        if (autoSyncEnabled !== 'false') {
          await syncService.syncAll();
        }
      } catch (error) {
        // Ignore
      }
    }, 30000); // Try to sync every 30 seconds
    
    return () => {
      clearInterval(interval);
      clearInterval(autoSyncInterval);
    };
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const handleSync = async () => {
    try {
      setSyncStatus(prev => ({ ...prev, syncing: true }));
      await syncService.syncAll();
      await loadSyncStatus();
      
    } catch (error) {
      console.error('Error syncing:', error);
    }
  };

  return (
    <TouchableOpacity
      onPress={syncStatus.pendingCount > 0 ? handleSync : undefined}
      disabled={syncStatus.syncing || syncStatus.pendingCount === 0}
      className={`flex-row items-center px-3 py-2 rounded-lg border-[0.5px] ${className}`}
      style={{
        backgroundColor: syncStatus.pendingCount > 0 ? '#FEF3C7' : '#D1FAE5',
        borderColor: syncStatus.pendingCount > 0 ? '#F59E0B' : colors.success,
        opacity: syncStatus.syncing ? 0.7 : 1,
      }}
    >
      {syncStatus.syncing ? (
        <>
          <RefreshCw size={16} color="#F59E0B" strokeWidth={1} />
          <Text className="text-[13px] ml-2" style={{ color: '#92400E' }}>
            Šaljem podatke…
          </Text>
        </>
      ) : syncStatus.pendingCount > 0 ? (
        <>
          <CloudOff size={16} color="#F59E0B" strokeWidth={1} />
          <Text className="text-[13px] ml-2" style={{ color: '#92400E' }}>
            Sačuvano u telefonu: {syncStatus.pendingCount} {syncStatus.pendingCount === 1 ? 'stavka' : 'stavki'}
          </Text>
        </>
      ) : (
        <>
          <Cloud size={16} color={colors.success} strokeWidth={1} />
          <Text className="text-[13px] ml-2" style={{ color: colors.success }}>
            Sve poslato
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
