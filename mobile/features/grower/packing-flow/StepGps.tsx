/**
 * Step 3: GPS/Timestamp – Automatic log (capture location + time)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin, Check } from 'lucide-react-native';
import * as Location from 'expo-location';
import { theme } from '../../../lib/theme';

export type GpsCapturePayload = { lat: number; lng: number; timestamp: string };

interface Props {
  onCaptured: (payload: GpsCapturePayload) => void;
}

export default function StepGps({ onCaptured }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);

  const capture = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('alerts.warning'), t('estates.locationPermissionRequired'));
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const ts = new Date().toISOString();
      const payload = { lat: loc.coords.latitude, lng: loc.coords.longitude, timestamp: ts };
      setLocation({ lat: payload.lat, lng: payload.lng });
      setTimestamp(ts);
      setCaptured(true);
      onCaptured(payload);
    } catch (err) {
      console.error('GPS capture:', err);
      Alert.alert(t('error'), t('estates.getLocationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <MapPin size={40} color={theme.colors.primary} style={styles.icon} />
        <Text style={styles.title}>{t('packingFlow.step3.title')}</Text>
        <Text style={styles.subtitle}>{t('packingFlow.step3.subtitle')}</Text>

        {captured ? (
          <View style={styles.capturedWrap}>
            <View style={styles.successRow}>
              <Check size={24} color={theme.colors.success} />
              <Text style={styles.successText}>{t('packingFlow.step3.captured')}</Text>
            </View>
            {location && (
              <Text style={styles.coords}>
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </Text>
            )}
            {timestamp && (
              <Text style={styles.time}>{new Date(timestamp).toLocaleString()}</Text>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.captureBtn, loading && styles.captureBtnDisabled]}
            onPress={capture}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MapPin size={24} color="#fff" />
                <Text style={styles.captureBtnText}>{t('packingFlow.step3.capture')}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  icon: { marginBottom: theme.spacing.md },
  title: { ...theme.typography.h3, color: theme.colors.text.primary, marginBottom: theme.spacing.xs },
  subtitle: { ...theme.typography.bodySmall, color: theme.colors.text.secondary, marginBottom: theme.spacing.lg },
  capturedWrap: {
    backgroundColor: theme.colors.successLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.sm },
  successText: { fontSize: 16, fontWeight: '600', color: theme.colors.success },
  coords: { ...theme.typography.bodySmall, color: theme.colors.text.secondary, fontFamily: 'monospace' },
  time: { ...theme.typography.bodySmall, color: theme.colors.text.secondary, marginTop: theme.spacing.xs },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    minHeight: 56,
  },
  captureBtnDisabled: { opacity: 0.6 },
  captureBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
