import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X, ScanLine } from 'lucide-react-native';
import { theme } from '../lib/theme';

/**
 * Public QR Scanner for Grower Journey (Step 2)
 * No auth required – saves scanned data to AsyncStorage and returns
 */
export default function ScanQRScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    try {
      await AsyncStorage.setItem('last_scanned_qr', data);
      router.back();
    } catch {
      setScanned(false);
      Alert.alert(t('common.error'), t('common.tryAgain'));
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.text}>Wait...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={[styles.text, styles.title]}>Allow camera</Text>
        <Text style={[styles.text, { marginBottom: 24, textAlign: 'center', paddingHorizontal: 32 }]}>
          To scan the bag.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={[styles.btn, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>OK</Text>
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
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <X size={24} color="#fff" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={styles.overlayTitle}>Scan</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            {!scanned && (
              <View style={styles.scanLine}>
                <ScanLine size={200} color={theme.colors.primary} strokeWidth={2} />
              </View>
            )}
          </View>
        </View>
        <View style={styles.bottomInfo}>
          <Text style={styles.instruction}>Point at QR code</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  text: { color: theme.colors.text.primary, fontSize: 14 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  btn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  btnText: { fontSize: 14, fontWeight: '500' },
  overlay: { flex: 1, backgroundColor: 'transparent' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  scanArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 12,
  },
  scanLine: { position: 'absolute' },
  bottomInfo: {
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
  },
  instruction: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
});
