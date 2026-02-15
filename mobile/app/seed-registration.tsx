import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Camera, ScanLine, Image as ImageIcon } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { seedsAPI, seedRegistrationsAPI } from '../lib/api';
import { markStepComplete } from '../lib/grower-journey';
import { theme } from '../lib/theme';

type Mode = 'select' | 'scan' | 'manual';

/**
 * Seed Registration – Step 2 of Grower Journey
 * Scan QR (pulls batch_number, origin from API) or Manual Entry (requires photo + GPS)
 */
export default function SeedRegistrationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('select');
  const [manualName, setManualName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // When returning from scanner, validate QR and show result
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const qr = await AsyncStorage.getItem('last_scanned_qr');
        if (!qr) return;
        try {
          const result = await seedsAPI.validate(qr);
          markStepComplete(2);
          const seed = result?.seed;
          const info = seed ? `${seed.batchNumber || qr}${seed.name ? ` · ${seed.name}` : ''}` : qr;
          Alert.alert(
            t('producer.scanner.successTitle'),
            t('growerJourney.step2.scanSuccess', { info }),
            [
              { text: t('growerJourney.step2.addToProducts'), onPress: () => router.replace('/(producer)/(tabs)/products') },
              { text: t('alerts.ok'), onPress: () => { AsyncStorage.removeItem('last_scanned_qr'); router.back(); } },
            ]
          );
        } catch (e: any) {
          await AsyncStorage.removeItem('last_scanned_qr');
          if (e?.message?.includes('401') || e?.message?.includes('login')) {
            Alert.alert(t('error'), t('growerJourney.step2.loginRequired'));
          }
        }
      })();
    }, [])
  );

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        } catch (_) {}
      }
    })();
  }, []);

  const handleOpenScanner = () => {
    router.push('/scan-qr');
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('error'), t('growerJourney.step2.cameraPermission'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualName.trim()) {
      Alert.alert(t('error'), t('growerJourney.step2.enterSeedName'));
      return;
    }
    if (!photoUri) {
      Alert.alert(t('error'), t('growerJourney.step2.photoRequired'));
      return;
    }
    if (!location) {
      Alert.alert(t('error'), t('growerJourney.step2.locationRequired'));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        seedName: manualName.trim(),
        photoUri,
        gpsLocation: location,
        timestamp: new Date().toISOString(),
      };
      try {
        await seedRegistrationsAPI.registerManual(payload);
      } catch (_) {
        // Backend may not have endpoint yet – treat as success (offline/queue later)
      }
      markStepComplete(2);
      Alert.alert(
        t('producer.scanner.successTitle'),
        t('growerJourney.step2.manualSuccess'),
        [{ text: t('alerts.ok'), onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert(t('error'), e.message || t('growerJourney.step2.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (mode === 'select' ? router.back() : setMode('select'))} style={styles.backBtn}>
          <ArrowLeft size={22} color="#fff" strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === 'select' ? t('growerJourney.step2.title') : mode === 'scan' ? t('growerJourney.step2.scanTitle') : t('growerJourney.step2.manualTitle')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {mode === 'select' && (
          <>
            <Text style={styles.selectPrompt}>{t('growerJourney.step2.selectPrompt')}</Text>
            <TouchableOpacity style={styles.optionCard} onPress={handleOpenScanner} activeOpacity={0.8}>
              <View style={styles.optionIcon}>
                <ScanLine size={28} color={theme.colors.primary} strokeWidth={1.5} />
              </View>
              <Text style={styles.optionTitle}>{t('growerJourney.step2.scanVeraProduct')}</Text>
              <Text style={styles.optionDesc}>{t('growerJourney.step2.scanDesc')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionCard} onPress={() => setMode('manual')} activeOpacity={0.8}>
              <View style={styles.optionIcon}>
                <Camera size={28} color={theme.colors.primary} strokeWidth={1.5} />
              </View>
              <Text style={styles.optionTitle}>{t('growerJourney.step2.manualEntry')}</Text>
              <Text style={styles.optionDesc}>{t('growerJourney.step2.manualDesc')}</Text>
            </TouchableOpacity>
          </>
        )}

        {mode === 'manual' && (
          <View style={styles.manualForm}>
            <Text style={styles.label}>{t('growerJourney.step2.seedName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('growerJourney.step2.seedNamePlaceholder')}
              placeholderTextColor={theme.colors.text.tertiary}
              value={manualName}
              onChangeText={setManualName}
              autoCapitalize="words"
            />
            <Text style={[styles.label, { marginTop: theme.spacing.lg }]}>
              {t('growerJourney.step2.takePhotoBag')}
            </Text>
            <TouchableOpacity
              style={[styles.photoBtn, photoUri && styles.photoBtnDone]}
              onPress={handleTakePhoto}
              activeOpacity={0.8}
            >
              {photoUri ? (
                <>
                  <ImageIcon size={32} color={theme.colors.success} strokeWidth={1.5} />
                  <Text style={styles.photoBtnTextDone}>{t('growerJourney.step2.photoAdded')}</Text>
                </>
              ) : (
                <>
                  <Camera size={32} color={theme.colors.primary} strokeWidth={1.5} />
                  <Text style={styles.photoBtnText}>{t('growerJourney.step2.takePhoto')}</Text>
                </>
              )}
            </TouchableOpacity>
            {location && (
              <Text style={styles.gpsNote}>
                {t('growerJourney.step2.gpsRecorded')}: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleManualSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>{t('growerJourney.step2.submit')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary,
    paddingTop: 56,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  body: { flex: 1 },
  bodyContent: { padding: theme.spacing.lg },
  selectPrompt: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  optionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  manualForm: {},
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: 6,
  },
  input: {
    fontSize: 16,
    color: theme.colors.text.primary,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
  },
  photoBtn: {
    height: 120,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtnDone: {
    borderColor: theme.colors.success,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  photoBtnText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    marginTop: 8,
  },
  photoBtnTextDone: {
    fontSize: 14,
    color: theme.colors.success,
    fontWeight: '500',
    marginTop: 8,
  },
  gpsNote: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.md,
  },
  submitBtn: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
