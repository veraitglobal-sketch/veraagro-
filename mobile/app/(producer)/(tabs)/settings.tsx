import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, RefreshCw, Shield, Info, Wifi } from 'lucide-react-native';
import Constants from 'expo-constants';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { LanguageSettingsBlock } from '../../../components/LanguageSettingsBlock';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../../lib/api-url';
import { syncService } from '../../../lib/sync-service';

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
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [gpsAlways, setGpsAlways] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionChecking, setConnectionChecking] = useState(false);
  const [syncRetryBusy, setSyncRetryBusy] = useState(false);
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

  const handleNotificationsToggle = (value: boolean) => {
    setNotifications(value);
    saveSetting(SETTINGS_KEYS.NOTIFICATIONS, value);
  };

  const handleAutoSyncToggle = (value: boolean) => {
    setAutoSync(value);
    saveSetting(SETTINGS_KEYS.AUTO_SYNC, value);
  };

  const handleGpsToggle = (value: boolean) => {
    setGpsAlways(value);
    saveSetting(SETTINGS_KEYS.GPS_ALWAYS, value);
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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: p.headerTop,
        paddingBottom: theme.spacing.md,
        paddingLeft: p.screenPaddingLeft,
        paddingRight: p.screenPaddingRight,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: theme.spacing.md }}
          >
            <ArrowLeft size={20} color={theme.colors.text.primary} strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={{
            fontSize: 18,
            fontWeight: '300',
            color: theme.colors.text.primary,
            letterSpacing: 1,
          }}>
            {t('producer.tabs.settings')}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View
          style={{
            paddingTop: theme.spacing.lg,
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
            paddingBottom: Math.max(p.bottomInset, theme.spacing.lg),
          }}
        >
          <LanguageSettingsBlock />

          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.md,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.1)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              <Wifi size={20} color={theme.colors.text.primary} strokeWidth={1} />
              <Text
                style={{
                  marginLeft: theme.spacing.md,
                  fontSize: 14,
                  fontWeight: '600',
                  color: theme.colors.text.primary,
                }}
              >
                {t('producer.settings.connectionTitle')}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '300',
                color: theme.colors.text.secondary,
                marginBottom: 4,
              }}
            >
              {t('producer.settings.apiUrlLabel')}
            </Text>
            <Text
              selectable
              style={{
                fontSize: 12,
                fontWeight: '400',
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.md,
              }}
            >
              {API_URL}
            </Text>
            <TouchableOpacity
              onPress={() => void testApiConnection()}
              disabled={connectionChecking}
              activeOpacity={0.7}
              style={{
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.primary,
                marginBottom: theme.spacing.sm,
                opacity: connectionChecking ? 0.6 : 1,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.background, textAlign: 'center' }}>
                {t('producer.settings.testConnection')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => void retryOfflineSync()}
              disabled={syncRetryBusy}
              activeOpacity={0.7}
              style={{
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.borderRadius.md,
                borderWidth: 0.5,
                borderColor: theme.colors.primary,
                marginBottom: theme.spacing.sm,
                opacity: syncRetryBusy ? 0.6 : 1,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.primary, textAlign: 'center' }}>
                {t('producer.settings.retrySyncNow')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={clearLocalUploadQueue}
              activeOpacity={0.7}
              style={{
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.borderRadius.md,
                borderWidth: 0.5,
                borderColor: theme.colors.error,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.error, textAlign: 'center' }}>
                {t('producer.sync.clearLocalQueue')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Notifications */}
          <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: 'rgba(0, 0, 0, 0.1)',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Bell size={20} color={theme.colors.text.primary} strokeWidth={1} />
                <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '300',
                    color: theme.colors.text.primary,
                    letterSpacing: 0.3,
                  }}>
                    {t('producer.settings.notifications', 'Notifications')}
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    marginTop: 2,
                    letterSpacing: 0.2,
                  }}>
                    {t('producer.settings.orderNotifications')}
                  </Text>
                </View>
              </View>
              <Switch
                value={notifications}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={theme.colors.background}
              />
            </View>
          </View>

          {/* Auto Sync */}
          <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: 'rgba(0, 0, 0, 0.1)',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <RefreshCw size={20} color={theme.colors.text.primary} strokeWidth={1} />
                <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '300',
                    color: theme.colors.text.primary,
                    letterSpacing: 0.3,
                  }}>
                    {t('producer.settings.autoSync', 'Auto sync')}
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    marginTop: 2,
                    letterSpacing: 0.2,
                  }}>
                    {t('producer.settings.autoSyncRecords')}
                  </Text>
                </View>
              </View>
              <Switch
                value={autoSync}
                onValueChange={handleAutoSyncToggle}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={theme.colors.background}
              />
            </View>
          </View>

          {/* GPS Always */}
          <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: 'rgba(0, 0, 0, 0.1)',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Shield size={20} color={theme.colors.text.primary} strokeWidth={1} />
                <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '300',
                    color: theme.colors.text.primary,
                    letterSpacing: 0.3,
                  }}>
                    {t('producer.settings.gpsAlwaysTitle')}
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    marginTop: 2,
                    letterSpacing: 0.2,
                  }}>
                    {t('producer.settings.gpsAlwaysSubtitle')}
                  </Text>
                </View>
              </View>
              <Switch
                value={gpsAlways}
                onValueChange={handleGpsToggle}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={theme.colors.background}
              />
            </View>
          </View>

          {/* About */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                t('producer.settings.aboutAlertTitle'),
                t('producer.settings.aboutAlertBody', { version: appVersion }),
              )
            }
            style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: 'rgba(0, 0, 0, 0.1)',
          }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Info size={20} color={theme.colors.text.primary} strokeWidth={1} />
              <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                }}>
                  {t('producer.settings.aboutTitle')}
                </Text>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: theme.colors.text.secondary,
                  marginTop: 2,
                  letterSpacing: 0.2,
                }}>
                  {t('producer.settings.aboutSubtitle', { version: appVersion })}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
