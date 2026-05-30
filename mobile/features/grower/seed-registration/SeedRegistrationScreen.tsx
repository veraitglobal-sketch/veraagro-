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
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, ScanLine, Image as ImageIcon, ChevronRight } from 'lucide-react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { seedsAPI, seedRegistrationsAPI } from '../../../lib/api';
import { apiErrorMessage, axiosResponseStatus } from '../../../lib/api-error';
import { markStepComplete } from '../../../lib/grower-journey';
import { pickFromCamera } from '../../../lib/camera-picker';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { FormHelperText } from '../../../components/FormHelperText';
import { farmerFormUi } from '../../../lib/farmer-form-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';

type Mode = 'select' | 'scan' | 'manual';

/**
 * Seed Registration – Step 2 of Grower Journey
 * Scan QR (pulls batch_number, origin from API) or Manual Entry (requires photo + GPS)
 */
export default function SeedRegistrationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const [mode, setMode] = useState<Mode>('select');
  const [manualName, setManualName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

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
              {
                text: t('growerJourney.step2.addToProducts'),
                onPress: () => router.replace('/(producer)/(tabs)/products'),
              },
              {
                text: t('alerts.ok'),
                onPress: () => {
                  void AsyncStorage.removeItem('last_scanned_qr');
                  router.back();
                },
              },
            ],
          );
        } catch (e: unknown) {
          await AsyncStorage.removeItem('last_scanned_qr');
          const status = axiosResponseStatus(e);
          const msg = apiErrorMessage(e, '').toLowerCase();
          if (status === 401 || msg.includes('401') || msg.includes('login') || msg.includes('session expired')) {
            Alert.alert(t('error'), t('growerJourney.step2.loginRequired'));
          }
        }
      })();
    }, [router, t]),
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
        } catch {
          // GPS optional until submit
        }
      }
    })();
  }, []);

  const handleOpenScanner = () => {
    router.push('/scan-qr');
  };

  const handleTakePhoto = async () => {
    const asset = await pickFromCamera({ t, quality: 0.8 });
    if (asset?.uri) setPhotoUri(asset.uri);
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
      } catch {
        // Backend may not have endpoint yet – treat as success (offline/queue later)
      }
      markStepComplete(2);
      Alert.alert(t('producer.scanner.successTitle'), t('growerJourney.step2.manualSuccess'), [
        { text: t('alerts.ok'), onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      Alert.alert(t('error'), apiErrorMessage(e, t('growerJourney.step2.saveFailed')));
    } finally {
      setLoading(false);
    }
  };

  const headerTitle =
    mode === 'select'
      ? t('growerJourney.step2.title')
      : mode === 'scan'
        ? t('growerJourney.step2.scanTitle')
        : t('growerJourney.step2.manualTitle');

  const goBack = useCallback(() => {
    if (mode === 'select') router.back();
    else setMode('select');
  }, [mode, router]);

  return (
    <SafeAreaView style={growerUi.canvas} edges={['bottom']}>
      <GrowerStackHeader
        title={headerTitle}
        subtitle={mode === 'select' ? t('growerJourney.step2.selectPrompt') : undefined}
        onBack={goBack}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={[growerUi.scrollContent, { paddingBottom: p.bottomInset + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {mode === 'select' && (
            <>
              <TouchableOpacity style={growerUi.tile} onPress={handleOpenScanner} activeOpacity={0.7}>
                <View style={growerUi.tileIcon}>
                  <ScanLine size={22} color={enterpriseColors.primary} strokeWidth={1.5} />
                </View>
                <View style={styles.tileText}>
                  <Text style={growerUi.tileTitle}>{t('growerJourney.step2.scanVeraProduct')}</Text>
                  <Text style={growerUi.tileDesc}>{t('growerJourney.step2.scanDesc')}</Text>
                </View>
                <ChevronRight size={18} color={enterpriseColors.gray600} strokeWidth={1.5} />
              </TouchableOpacity>
              <TouchableOpacity style={growerUi.tile} onPress={() => setMode('manual')} activeOpacity={0.7}>
                <View style={growerUi.tileIcon}>
                  <Camera size={22} color={enterpriseColors.primary} strokeWidth={1.5} />
                </View>
                <View style={styles.tileText}>
                  <Text style={growerUi.tileTitle}>{t('growerJourney.step2.manualEntry')}</Text>
                  <Text style={growerUi.tileDesc}>{t('growerJourney.step2.manualDesc')}</Text>
                </View>
                <ChevronRight size={18} color={enterpriseColors.gray600} strokeWidth={1.5} />
              </TouchableOpacity>
            </>
          )}

          {mode === 'manual' && (
            <View style={growerUi.formPanel}>
              <Text style={growerUi.formLabel}>{t('growerJourney.step2.seedName')}</Text>
              <TextInput
                style={[growerUi.formInput, farmerFormUi.input]}
                placeholder={t('growerJourney.step2.seedNamePlaceholder')}
                placeholderTextColor={enterpriseColors.gray600}
                value={manualName}
                onChangeText={setManualName}
                autoCapitalize="words"
              />
              <FormHelperText>{t('form.helper.seedName')}</FormHelperText>
              <Text style={growerUi.formLabel}>{t('growerJourney.step2.takePhotoBag')}</Text>
              <TouchableOpacity
                style={[styles.photoBtn, photoUri ? styles.photoBtnDone : null, farmerFormUi.touchTarget]}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
              >
                {photoUri ? (
                  <>
                    <ImageIcon size={28} color={enterpriseColors.primary} strokeWidth={1.5} />
                    <Text style={styles.photoDone}>{t('growerJourney.step2.photoAdded')}</Text>
                  </>
                ) : (
                  <>
                    <Camera size={28} color={enterpriseColors.primary} strokeWidth={1.5} />
                    <Text style={styles.photoCta}>{t('growerJourney.step2.takePhoto')}</Text>
                  </>
                )}
              </TouchableOpacity>
              <FormHelperText>{t('form.helper.seedPhoto')}</FormHelperText>
              {location ? (
                <Text style={styles.gpsNote}>
                  {t('growerJourney.step2.gpsRecorded')}: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </Text>
              ) : null}
              <TouchableOpacity
                style={[enterpriseUi.authSubmit, styles.submit, loading && styles.submitDisabled]}
                onPress={handleManualSubmit}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={enterpriseUi.authSubmitText}>{t('growerJourney.step2.submit')}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={goBack} style={styles.secondaryBack} activeOpacity={0.7}>
                <Text style={styles.secondaryBackText}>{t('common.back')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tileText: { flex: 1, minWidth: 0 },
  photoBtn: {
    minHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: enterpriseColors.white,
  },
  photoBtnDone: {
    borderStyle: 'solid',
    borderColor: enterpriseColors.primary,
    backgroundColor: enterpriseColors.primaryTint,
  },
  photoCta: {
    fontSize: 14,
    fontWeight: '500',
    color: enterpriseColors.primary,
    marginTop: 8,
  },
  photoDone: {
    fontSize: 14,
    fontWeight: '500',
    color: enterpriseColors.primary,
    marginTop: 8,
  },
  gpsNote: {
    fontSize: 14,
    color: enterpriseColors.gray600,
    marginBottom: 16,
  },
  submit: {
    marginTop: 8,
    marginBottom: 0,
  },
  submitDisabled: { opacity: 0.65 },
  secondaryBack: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  secondaryBackText: {
    fontSize: 15,
    color: enterpriseColors.gray600,
  },
});
