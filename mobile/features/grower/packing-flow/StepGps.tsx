/**
 * Step 3: GPS/Timestamp – Automatic log
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppLocaleTag, formatAppDateTime, a11yIconButton } from '../../../lib/date-locale';
import { MapPin, Check } from 'lucide-react-native';
import * as Location from 'expo-location';
import { ensureForegroundLocationPermission } from '../../../lib/grower-permissions';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';

export type GpsCapturePayload = { lat: number; lng: number; timestamp: string };

interface Props {
  onCaptured: (payload: GpsCapturePayload) => void;
}

export default function StepGps({ onCaptured }: Props) {
  const { t } = useTranslation();
  const dateLocale = useAppLocaleTag();
  const [loading, setLoading] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);

  const capture = async () => {
    setLoading(true);
    try {
      const granted = await ensureForegroundLocationPermission(t, { rationale: true });
      if (!granted) return;
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
      <View style={[enterpriseUi.inAppPanel, styles.card]}>
        <View style={styles.iconWell}>
          <MapPin size={32} color={enterpriseColors.primary} strokeWidth={1.5} />
        </View>
        <Text style={enterpriseUi.navRowTitle}>{t('packingFlow.step3.title')}</Text>
        <Text style={[enterpriseUi.navRowSubtitle, styles.subtitle]}>{t('packingFlow.step3.subtitle')}</Text>

        {captured ? (
          <View style={styles.capturedWrap}>
            <View style={styles.successRow}>
              <Check size={22} color={enterpriseColors.primary} strokeWidth={2} />
              <Text style={styles.successText}>{t('packingFlow.step3.captured')}</Text>
            </View>
            {location ? (
              <Text style={styles.coords}>
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </Text>
            ) : null}
            {timestamp ? (
              <Text style={styles.time}>{formatAppDateTime(timestamp, dateLocale)}</Text>
            ) : null}
          </View>
        ) : (
          <TouchableOpacity
            style={[enterpriseUi.authBtnPrimary, styles.captureBtn, loading && styles.captureBtnDisabled]}
            onPress={() => void capture()}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color={enterpriseColors.white} size="small" />
            ) : (
              <>
                <MapPin size={22} color={enterpriseColors.white} strokeWidth={1.5} />
                <Text style={enterpriseUi.authBtnPrimaryText}>{t('packingFlow.step3.capture')}</Text>
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
    padding: 20,
  },
  iconWell: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: enterpriseColors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 18,
  },
  capturedWrap: {
    backgroundColor: enterpriseColors.primaryTint,
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: enterpriseColors.gray200,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: enterpriseColors.primary,
  },
  coords: {
    fontSize: 14,
    color: enterpriseColors.gray700,
    fontFamily: 'monospace',
  },
  time: {
    fontSize: 14,
    color: enterpriseColors.gray600,
    marginTop: 6,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
  },
  captureBtnDisabled: {
    opacity: 0.6,
  },
});
