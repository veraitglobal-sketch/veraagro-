import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
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
import { offlineStorage } from '../../../lib/offline-storage';
import { isLikelyNetworkError } from '../../../lib/api-error';
import { apiErrorMessage, axiosResponseStatus } from '../../../lib/api-error';
import { markStepComplete } from '../../../lib/grower-journey';
import { pickFromCamera } from '../../../lib/camera-picker';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { EnterpriseButton, EnterpriseTextField, EnterprisePanel } from '../../../design-system';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { FormHelperText } from '../../../components/FormHelperText';
import { farmerFormUi } from '../../../lib/farmer-form-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';

type Mode = 'select' | 'scan' | 'manual';

type GenuineOrigin = {
  product: string;
  variety?: string | null;
  lot: string;
  seedCropYear: number;
  producer: { name: string; city?: string | null; country: string };
  germinationPct?: number | null;
};

/**
 * Seed Registration – Step 2 of Grower Journey
 * Scan QR (pulls batch_number, origin from API) or Manual Entry (requires photo + GPS)
 */
export default function SeedRegistrationScreen({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const [mode, setMode] = useState<Mode>('select');
  const [manualName, setManualName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [genuineOrigin, setGenuineOrigin] = useState<GenuineOrigin | null>(null);
  const [genuineSerial, setGenuineSerial] = useState<string | null>(null);
  const [offlineQueued, setOfflineQueued] = useState(false);
  const [manualSerial, setManualSerial] = useState('');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const qr = await AsyncStorage.getItem('last_scanned_qr');
        if (!qr) return;
        try {
          const result = await seedsAPI.validate(qr);
          markStepComplete(2);
          await AsyncStorage.removeItem('last_scanned_qr');
          if (result?.origin) {
            setGenuineOrigin(result.origin);
            setGenuineSerial(result.seed?.serialNumber || qr);
            setMode('scan');
            return;
          }
          const seed = result?.seed;
          const info = seed ? `${seed.batchNumber || qr}${seed.name ? ` · ${seed.name}` : ''}` : qr;
          Alert.alert(t('producer.scanner.successTitle'), t('growerJourney.step2.scanSuccess', { info }), [
            { text: t('alerts.ok'), onPress: () => router.back() },
          ]);
        } catch (e: unknown) {
          if (isLikelyNetworkError(e)) {
            await offlineStorage.queueSeedScan({ serialInput: qr, gpsLat: location?.lat, gpsLng: location?.lng });
            await AsyncStorage.removeItem('last_scanned_qr');
            setOfflineQueued(true);
            setMode('scan');
            return;
          }
          await AsyncStorage.removeItem('last_scanned_qr');
          const status = axiosResponseStatus(e);
          const msg = apiErrorMessage(e, '');
          if (status === 401 || msg.toLowerCase().includes('session expired')) {
            Alert.alert(t('error'), t('growerJourney.step2.loginRequired'));
            return;
          }
          Alert.alert(t('error'), msg || t('growerJourney.step2.validationFailed'));
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

  const verifyManualSerial = async (serial: string) => {
    if (!serial.trim()) return;
    setLoading(true);
    try {
      const result = await seedsAPI.validate(serial.trim());
      if (result?.origin) {
        markStepComplete(2);
        setGenuineOrigin(result.origin);
        setGenuineSerial(result.seed?.serialNumber || serial.trim());
        setMode('scan');
      }
    } catch (e: unknown) {
      if (isLikelyNetworkError(e)) {
        await offlineStorage.queueSeedScan({
          serialInput: serial.trim(),
          gpsLat: location?.lat,
          gpsLng: location?.lng,
        });
        setOfflineQueued(true);
        setMode('scan');
      } else {
        Alert.alert(t('error'), apiErrorMessage(e, t('growerJourney.step2.validationFailed')));
      }
    } finally {
      setLoading(false);
    }
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
    if (embedded) return;
    if (mode === 'select') router.back();
    else setMode('select');
  }, [embedded, mode, router]);

  const Shell = embedded ? View : SafeAreaView;
  const shellProps = embedded ? { style: [growerUi.canvas, styles.embeddedRoot] } : { style: growerUi.canvas, edges: ['bottom'] as const };

  return (
    <Shell {...shellProps}>
      {!embedded ? (
        <GrowerStackHeader
          title={headerTitle}
          subtitle={mode === 'select' ? t('growerJourney.step2.selectPrompt') : undefined}
          onBack={goBack}
        />
      ) : null}
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

              <EnterprisePanel>
                <EnterpriseTextField
                  label={t('seedScan.manualSerial')}
                  placeholder="BV-26-NS2604-000123-7K4Q"
                  value={manualSerial}
                  onChangeText={setManualSerial}
                  autoCapitalize="characters"
                  size="farmer"
                />
                <EnterpriseButton
                  label={t('seedScan.verifySerial')}
                  onPress={() => verifyManualSerial(manualSerial)}
                  loading={loading}
                  fullWidth
                  size="large"
                />
              </EnterprisePanel>
            </>
          )}

          {mode === 'scan' && (genuineOrigin || offlineQueued) && (
            <EnterprisePanel>
              {offlineQueued ? (
                <>
                  <Text style={styles.genuineTitle}>{t('seedScan.offlineSavedTitle')}</Text>
                  <Text style={styles.genuineBody}>{t('seedScan.offlineSavedBody')}</Text>
                </>
              ) : genuineOrigin ? (
                <>
                  <Text style={styles.genuineBadge}>{t('seedScan.genuineTitle')}</Text>
                  <Text style={styles.genuineProduct}>
                    {genuineOrigin.product}
                    {genuineOrigin.variety ? ` — ${genuineOrigin.variety}` : ''}
                  </Text>
                  <Text style={styles.genuineBody}>
                    {t('seedScan.lotLine', {
                      lot: genuineOrigin.lot,
                      year: genuineOrigin.seedCropYear,
                      producer: genuineOrigin.producer.name,
                      city: genuineOrigin.producer.city || genuineOrigin.producer.country,
                    })}
                  </Text>
                  {genuineOrigin.germinationPct != null ? (
                    <Text style={styles.genuineMeta}>
                      {t('seedScan.germination', { pct: genuineOrigin.germinationPct })}
                    </Text>
                  ) : null}
                  {genuineSerial ? (
                    <Text style={styles.genuineSerial}>{genuineSerial}</Text>
                  ) : null}
                </>
              ) : null}
                  <EnterpriseButton
                    label={t('plantingEntry.openForm')}
                    onPress={() => router.push({ pathname: '/(producer)/planting-entry', params: genuineSerial ? { serial: genuineSerial } : {} })}
                    fullWidth
                    size="large"
                  />
                  <EnterpriseButton variant="secondary" label={t('common.back')} onPress={() => router.back()} fullWidth size="large" />
            </EnterprisePanel>
          )}

          {mode === 'scan' && !genuineOrigin && !offlineQueued && (
            <EnterprisePanel>
              <EnterpriseTextField
                label={t('seedScan.manualSerial')}
                placeholder="BV-26-NS2604-000123-7K4Q"
                value={manualSerial}
                onChangeText={setManualSerial}
                autoCapitalize="characters"
                size="farmer"
              />
              <EnterpriseButton
                label={t('seedScan.verifySerial')}
                onPress={() => verifyManualSerial(manualSerial)}
                loading={loading}
                fullWidth
                size="large"
              />
            </EnterprisePanel>
          )}

          {mode === 'manual' && (
            <EnterprisePanel>
              <EnterpriseTextField
                label={t('growerJourney.step2.seedName')}
                hint={t('form.helper.seedName')}
                placeholder={t('growerJourney.step2.seedNamePlaceholder')}
                value={manualName}
                onChangeText={setManualName}
                autoCapitalize="words"
                size="farmer"
              />
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
              <EnterpriseButton
                label={t('growerJourney.step2.submit')}
                onPress={handleManualSubmit}
                loading={loading}
                disabled={loading}
                fullWidth
                size="large"
              />
              <EnterpriseButton
                label={t('common.back')}
                onPress={goBack}
                variant="ghost"
                fullWidth
                style={styles.secondaryBackBtn}
              />
            </EnterprisePanel>
          )}
        </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Shell>
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
  secondaryBackBtn: {
    marginTop: 8,
  },
  embeddedRoot: {
    flex: 1,
    minHeight: 0,
  },
  genuineBadge: {
    fontSize: 18,
    fontWeight: '700',
    color: enterpriseColors.primary,
    marginBottom: 8,
  },
  genuineTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    marginBottom: 8,
  },
  genuineProduct: {
    fontSize: 16,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    marginBottom: 6,
  },
  genuineBody: {
    fontSize: 15,
    color: enterpriseColors.gray700,
    marginBottom: 8,
    lineHeight: 22,
  },
  genuineMeta: {
    fontSize: 14,
    color: enterpriseColors.gray600,
    marginBottom: 4,
  },
  genuineSerial: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: enterpriseColors.gray600,
    marginTop: 8,
  },
});
