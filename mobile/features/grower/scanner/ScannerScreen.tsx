import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanLine, X, Check } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { materialValidator } from '../../../lib/integrity-guard';

/**
 * QR/Barcode Scanner Screen
 * - returnTo=products: for My products – scanned QR is passed to the form (no whitelist)
 * - otherwise: validate against whitelist (field log / materials)
 */
export default function ScannerScreen() {
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string; materialKind?: string }>();
  const isForProducts = params.returnTo === 'products' || params.returnTo === 'seed-registration';
  const isMaterialAdd = params.returnTo === 'material-add';
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [validating, setValidating] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);
    setBarcode(data);
    setValidating(true);

    try {
      if (isForProducts) {
        await AsyncStorage.setItem('last_scanned_qr', data);
        setValidating(false);
        router.back();
        return;
      }
      if (isMaterialAdd) {
        const kindParam = params.materialKind;
        const kind =
          kindParam === 'SEED' || kindParam === 'FERTILIZER' || kindParam === 'PESTICIDE'
            ? kindParam
            : 'FERTILIZER';
        const result = await materialValidator(data, kind);
        if (!result.valid) {
          Alert.alert(t('alerts.warning'), result.message || t('producer.scanner.barcodeNotOnWhitelist'), [
            {
              text: t('alerts.tryAgain'),
              onPress: () => {
                setScanned(false);
                setBarcode(null);
              },
            },
          ]);
          setValidating(false);
          return;
        }
        await AsyncStorage.setItem('last_material_barcode', data);
        setValidating(false);
        router.back();
        return;
      }

      const result = await materialValidator(data);
      setIsValid(result.valid);

      if (result.valid) {
        await AsyncStorage.setItem('last_scanned_barcode', data);
        Alert.alert(t('producer.scanner.successTitle'), t('producer.scanner.validBarcodeMessage', { code: data }), [
          { text: t('alerts.ok'), onPress: () => router.back() },
        ]);
      } else {
        Alert.alert(t('alerts.warning'), result.message || t('producer.scanner.barcodeNotOnWhitelist'), [
          {
            text: t('alerts.tryAgain'),
            onPress: () => {
              setScanned(false);
              setBarcode(null);
              setIsValid(null);
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Validation error:', error);
      Alert.alert(t('error'), t('producer.scanner.barcodeValidationFailed'));
      setScanned(false);
      setBarcode(null);
    } finally {
      setValidating(false);
    }
  };

  const handleReset = () => {
    setScanned(false);
    setBarcode(null);
    setIsValid(null);
    setValidating(false);
  };

  if (!permission) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={[styles.text, { marginTop: 16 }]}>{t('producer.scanner.checkingPermissions')}</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={[styles.text, styles.title, { marginBottom: 16 }]}>
          {t('producer.scanner.permissionNeeded')}
        </Text>
        <Text style={[styles.text, { marginBottom: 24, textAlign: 'center', paddingHorizontal: 32 }]}>
          {t('producer.scanner.cameraPermissionBody')}
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={[styles.button, { backgroundColor: theme.colors.accent }]}
        >
          <Text style={[styles.buttonText, { color: theme.colors.background }]}>
            {t('producer.scanner.allowCamera')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39'],
        }}
      />
      <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="box-none">
        {/* Top bar */}
        <View
          style={[
            styles.topBar,
            {
              paddingTop: p.headerTop,
              paddingLeft: p.screenPaddingLeft,
              paddingRight: p.screenPaddingRight,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeButton}
          >
            <X size={24} color={theme.colors.text.inverse} strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={styles.overlayTitle}>{t('producer.scanner.scanBarcode')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Scanning area */}
        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            {/* Corner indicators */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            
            {/* Scanning line animation */}
            {!scanned && (
              <View style={styles.scanLine}>
                <ScanLine size={200} color={theme.colors.accent} strokeWidth={2} />
              </View>
            )}
          </View>
        </View>

        {/* Bottom info */}
        <View style={styles.bottomInfo}>
          {validating ? (
            <View style={styles.statusContainer}>
              <ActivityIndicator size="small" color={theme.colors.accent} />
              <Text style={styles.statusText}>{t('producer.scanner.validating')}</Text>
            </View>
          ) : scanned && barcode ? (
            <View style={styles.statusContainer}>
              {isValid ? (
                <>
                  <Check size={20} color={theme.colors.success} strokeWidth={2} />
                  <Text style={[styles.statusText, { color: theme.colors.success }]}>
                    {t('producer.scanner.validBarcode')}
                  </Text>
                </>
              ) : (
                <>
                  <X size={20} color={theme.colors.error} strokeWidth={2} />
                  <Text style={[styles.statusText, { color: theme.colors.error }]}>
                    {t('producer.scanner.barcodeInvalid')}
                  </Text>
                </>
              )}
            </View>
          ) : (
            <Text style={styles.instructionText}>
              {t('producer.scanner.placeBarcode')}
            </Text>
          )}

          {scanned && (
            <TouchableOpacity
              onPress={handleReset}
              style={[styles.resetButton, { borderColor: theme.colors.border }]}
            >
              <Text style={[styles.resetButtonText, { color: theme.colors.text.primary }]}>
                {t('producer.scanner.scanAgain')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.inverse,
    letterSpacing: 0.5,
  },
  scanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
    borderWidth: 2,
    borderColor: theme.colors.accent,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: theme.colors.accent,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -100 }],
  },
  bottomInfo: {
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    color: theme.colors.text.inverse,
  },
  instructionText: {
    fontSize: 13,
    color: theme.colors.text.inverse,
    textAlign: 'center',
    opacity: 0.9,
  },
  resetButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: theme.colors.background,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  text: {
    color: theme.colors.text.primary,
    fontSize: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
