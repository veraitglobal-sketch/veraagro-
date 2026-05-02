import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, RefreshCw, Shield, Info } from 'lucide-react-native';
import Constants from 'expo-constants';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { LanguageSettingsBlock } from '../../../components/LanguageSettingsBlock';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
