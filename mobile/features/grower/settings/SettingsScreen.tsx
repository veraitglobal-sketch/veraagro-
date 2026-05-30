import { View, Text, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, RefreshCw, Shield, Info, Wifi } from 'lucide-react-native';
import Constants from 'expo-constants';
import { LanguageSettingsBlock } from '../../../components/LanguageSettingsBlock';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import {
  EnterpriseSettingsButton,
  EnterpriseSettingsGroup,
  EnterpriseSettingsLinkRow,
  EnterpriseSettingsToggleRow,
} from '../../../components/enterprise/EnterpriseSettingsGroup';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../../lib/api-url';
import { syncService } from '../../../lib/sync-service';
import { notificationsAPI } from '../../../lib/api';
import { ensureForegroundLocationPermission } from '../../../lib/grower-permissions';
import { requestNotificationPermissionIfNeeded } from '../../../lib/post-login-permissions';
import { registerPushTokenWithBackend, unregisterPushTokenFromBackend } from '../../../lib/push-service';
import { useAuth } from '../../../contexts/AuthContext';

const SETTINGS_KEYS = {
  NOTIFICATIONS: 'settings_notifications',
  DARK_MODE: 'settings_dark_mode',
  AUTO_SYNC: 'settings_auto_sync',
  GPS_ALWAYS: 'settings_gps_always',
};

/**
 * Settings Screen
 * App preferences and configuration
 */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [gpsAlways, setGpsAlways] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionChecking, setConnectionChecking] = useState(false);
  const [syncRetryBusy, setSyncRetryBusy] = useState(false);
  const [pushTestBusy, setPushTestBusy] = useState(false);
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const loadSettings = useCallback(async () => {
    try {
      const notif = await AsyncStorage.getItem(SETTINGS_KEYS.NOTIFICATIONS);
      const sync = await AsyncStorage.getItem(SETTINGS_KEYS.AUTO_SYNC);
      const gps = await AsyncStorage.getItem(SETTINGS_KEYS.GPS_ALWAYS);

      setNotifications(notif !== 'false');
      setAutoSync(sync !== 'false');
      setGpsAlways(gps === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  // Load settings on mount
  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadSettings();
    } finally {
      setRefreshing(false);
    }
  }, [loadSettings]);

  const saveSetting = useCallback(async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, value ? 'true' : 'false');
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  }, []);

  const handleNotificationsToggle = async (value: boolean) => {
    try {
      if (value) {
        const granted = await requestNotificationPermissionIfNeeded({ rationale: true });
        if (!granted) return;
        const roles = Array.isArray(user?.roles) ? user.roles : user?.role ? [user.role] : undefined;
        await registerPushTokenWithBackend(roles);
      } else {
        await unregisterPushTokenFromBackend();
      }
      setNotifications(value);
      void saveSetting(SETTINGS_KEYS.NOTIFICATIONS, value);
    } catch (e) {
      Alert.alert(t('error'), t('producer.settings.notificationsRegisterFailed'));
    }
  };

  const handleAutoSyncToggle = (value: boolean) => {
    setAutoSync(value);
    saveSetting(SETTINGS_KEYS.AUTO_SYNC, value);
  };

  const sendTestPush = useCallback(async () => {
    setPushTestBusy(true);
    try {
      const result = await notificationsAPI.sendTestPush();
      if (!result.pushEnabled) {
        Alert.alert(t('producer.settings.pushTestTitle'), t('producer.settings.pushTestServerOff'));
        return;
      }
      Alert.alert(
        t('producer.settings.pushTestTitle'),
        t('producer.settings.pushTestSent', { count: result.devices }),
      );
    } catch {
      Alert.alert(t('error'), t('producer.settings.pushTestFail'));
    } finally {
      setPushTestBusy(false);
    }
  }, [t]);

  const handleGpsToggle = async (value: boolean) => {
    if (value) {
      const granted = await ensureForegroundLocationPermission(t, { rationale: true });
      if (!granted) return;
    }
    setGpsAlways(value);
    void saveSetting(SETTINGS_KEYS.GPS_ALWAYS, value);
  };

  const testApiConnection = useCallback(async () => {
    setConnectionChecking(true);
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, '')}/health`, { method: 'GET' });
      if (res.ok) {
        Alert.alert(t('producer.settings.connectionTitle'), t('producer.settings.connectionOk', { status: res.status }));
      } else {
        Alert.alert(t('error'), t('producer.settings.connectionFail'));
      }
    } catch {
      Alert.alert(t('error'), t('producer.settings.connectionFail'));
    } finally {
      setConnectionChecking(false);
    }
  }, [t]);

  const clearLocalUploadQueue = useCallback(() => {
    Alert.alert(
      t('producer.sync.clearLocalQueueTitle'),
      t('producer.sync.clearLocalQueueBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('producer.sync.clearLocalQueue'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                const { totalRemoved } = await syncService.purgeAllLocalQueues();
                Alert.alert(
                  t('alerts.success'),
                  t('producer.sync.clearLocalQueueDone', { count: totalRemoved }),
                );
              } catch {
                Alert.alert(t('error'), t('producer.settings.connectionFail'));
              }
            })();
          },
        },
      ],
    );
  }, [t]);

  const retryOfflineSync = useCallback(async () => {
    setSyncRetryBusy(true);
    try {
      const before = await syncService.getSyncStatus();
      if (before.pendingCount === 0) {
        Alert.alert(t('producer.settings.connectionTitle'), t('producer.settings.retrySyncNone'));
        return;
      }
      const result = await syncService.syncAll();
      const after = await syncService.getSyncStatus();
      const success =
        result.entries.success +
        result.products.success +
        result.costs.success +
        result.certificatePhotos.success +
        result.harvestPlans.success;
      const failed =
        result.entries.failed +
        result.products.failed +
        result.costs.failed +
        result.certificatePhotos.failed +
        result.harvestPlans.failed;
      const b = before.breakdown ?? after.breakdown;
      const errorLine =
        after.firstQueueError ??
        after.lastError ??
        (failed > 0 ? t('producer.sync.itemsNotSentHint') : t('producer.sync.allSent'));
      Alert.alert(
        t('producer.settings.connectionTitle'),
        failed > 0 || after.pendingCount > 0
          ? t('producer.settings.retrySyncDetail', {
              fieldLog: b.fieldLog,
              harvest: b.harvestPlans,
              products: b.products,
              costs: b.costs,
              certs: b.certificatePhotos,
              errorLine,
            })
          : t('producer.settings.retrySyncDone', { success, failed }),
      );
    } catch {
      Alert.alert(t('error'), t('producer.settings.connectionFail'));
    } finally {
      setSyncRetryBusy(false);
    }
  }, [t]);

  return (
    <EnterpriseScreen
      fillViewport
      refreshing={refreshing}
      onRefresh={onRefresh}
      header={<GrowerStackHeader title={t('producer.tabs.settings')} />}
    >
      <View style={[growerUi.scrollContent, { paddingTop: 12 }]}>
        <LanguageSettingsBlock />

        <EnterpriseSettingsGroup
          title={t('producer.settings.connectionTitle')}
          icon={<Wifi size={20} color={enterpriseColors.primary} strokeWidth={1.5} />}
        >
          <Text style={growerUi.formLabel}>{t('producer.settings.apiUrlLabel')}</Text>
          <Text selectable style={growerUi.settingsRowDesc}>
            {API_URL}
          </Text>
          <EnterpriseSettingsButton
            label={t('producer.settings.testConnection')}
            onPress={() => void testApiConnection()}
            disabled={connectionChecking}
          />
          <EnterpriseSettingsButton
            label={t('producer.settings.retrySyncNow')}
            variant="outline"
            onPress={() => void retryOfflineSync()}
            disabled={syncRetryBusy}
          />
          <EnterpriseSettingsButton
            label={t('producer.sync.clearLocalQueue')}
            variant="danger"
            onPress={clearLocalUploadQueue}
          />
        </EnterpriseSettingsGroup>

        <EnterpriseSettingsGroup>
          <EnterpriseSettingsToggleRow
            title={t('producer.settings.notifications', 'Notifications')}
            description={t('producer.settings.orderNotifications')}
            icon={<Bell size={20} color={enterpriseColors.primary} strokeWidth={1.5} />}
            value={notifications}
            onValueChange={handleNotificationsToggle}
          />
          {notifications ? (
            <EnterpriseSettingsButton
              label={t('producer.settings.pushTestButton')}
              variant="outline"
              onPress={() => void sendTestPush()}
              disabled={pushTestBusy}
            />
          ) : null}
        </EnterpriseSettingsGroup>

        <EnterpriseSettingsGroup>
          <EnterpriseSettingsToggleRow
            title={t('producer.settings.autoSync', 'Auto sync')}
            description={t('producer.settings.autoSyncRecords')}
            icon={<RefreshCw size={20} color={enterpriseColors.primary} strokeWidth={1.5} />}
            value={autoSync}
            onValueChange={handleAutoSyncToggle}
          />
        </EnterpriseSettingsGroup>

        <EnterpriseSettingsGroup>
          <EnterpriseSettingsToggleRow
            title={t('producer.settings.gpsAlways')}
            description={t('producer.settings.autoGps')}
            icon={<Shield size={20} color={enterpriseColors.primary} strokeWidth={1.5} />}
            value={gpsAlways}
            onValueChange={handleGpsToggle}
          />
        </EnterpriseSettingsGroup>

        <EnterpriseSettingsGroup>
          <EnterpriseSettingsLinkRow
            title={t('producer.settings.about')}
            description={t('producer.settings.aboutSubtitle', { version: appVersion })}
            icon={<Info size={20} color={enterpriseColors.primary} strokeWidth={1.5} />}
            onPress={() =>
              Alert.alert(
                t('producer.settings.aboutAlertTitle'),
                t('producer.settings.aboutAlertBody', { version: appVersion }),
              )
            }
          />
        </EnterpriseSettingsGroup>
      </View>
    </EnterpriseScreen>
  );
}
