import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Moon, Globe, Shield, Info } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
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
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [gpsAlways, setGpsAlways] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
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
  };

  const saveSetting = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

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
        paddingTop: 60,
        paddingBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
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
            Podešavanja
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: theme.spacing.lg }}>
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
                    Notifikacije
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    marginTop: 2,
                    letterSpacing: 0.2,
                  }}>
                    Obaveštenja o porudžbinama i statusu
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
                <Globe size={20} color={theme.colors.text.primary} strokeWidth={1} />
                <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '300',
                    color: theme.colors.text.primary,
                    letterSpacing: 0.3,
                  }}>
                    Automatska sinhronizacija
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    marginTop: 2,
                    letterSpacing: 0.2,
                  }}>
                    Automatski šalji zapise kada si online
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
                    GPS uvek aktivan
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    marginTop: 2,
                    letterSpacing: 0.2,
                  }}>
                    Uzmi GPS automatski pri unosu zapisa
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
          <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: 'rgba(0, 0, 0, 0.1)',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Info size={20} color={theme.colors.text.primary} strokeWidth={1} />
              <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.3,
                }}>
                  O aplikaciji
                </Text>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: theme.colors.text.secondary,
                  marginTop: 2,
                  letterSpacing: 0.2,
                }}>
                  BioVera Producer App v1.0.0
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
