import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { syncService, SyncStatus as SyncStatusType } from '../lib/sync-service';
import { colors } from '../lib/colors';
import { tString } from '../lib/i18n-strings';

interface SyncStatusProps {
  className?: string;
}

export default function SyncStatus({ className = '' }: SyncStatusProps) {
  const { t } = useTranslation();
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>({
    lastSyncTime: null,
    pendingCount: 0,
    legacyFieldLogCount: 0,
    breakdown: { fieldLog: 0, products: 0, costs: 0, certificatePhotos: 0, harvestPlans: 0 },
    syncing: false,
    lastError: null,
    firstQueueError: null,
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
          await loadSyncStatus();
        }
      } catch (error) {
        // Ignore
      }
    }, 90_000); // Avoid API rate limits (429) from tight sync loops
    
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
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      await loadSyncStatus();
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
            {t('producer.sync.syncing')}
          </Text>
        </>
      ) : syncStatus.pendingCount > 0 ? (
        <>
          <CloudOff size={16} color="#F59E0B" strokeWidth={1} />
          <Text className="text-[13px] ml-2" style={{ color: '#92400E' }}>
            {tString(t, 'producer.sync.savedOnDevice', { count: syncStatus.pendingCount })}
          </Text>
        </>
      ) : (
        <>
          <Cloud size={16} color={colors.success} strokeWidth={1} />
          <Text className="text-[13px] ml-2" style={{ color: colors.success }}>
            {t('producer.sync.allSent')}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
