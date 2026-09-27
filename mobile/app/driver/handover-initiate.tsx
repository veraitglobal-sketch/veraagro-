import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { QrCode } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { theme } from '../../lib/theme';
import { digitalHandoverAPI } from '../../lib/api';
import { apiErrorMessage } from '../../lib/api-error';
import StepIndicator from '../../components/StepIndicator';

/**
 * Driver: document the load (reminder), then scan store QR to initiate handover.
 */
export default function HandoverInitiateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { deliveryId } = useLocalSearchParams<{ deliveryId: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: t('handover.initTitle'), headerBackTitle: t('common.back') });
  }, [navigation, t]);

  const handleScanQR = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(t('common.permissionRequired'), t('handover.errCamera'));
        return;
      }
    }
    setScanning(true);
  };

  const submitCode = (code: string) => handleBarcodeScanned({ data: code.trim() });

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (!deliveryId) {
      Alert.alert(t('error'), t('handover.errDeliveryId'));
      setScanning(false);
      return;
    }
    setScanning(false);
    setLoading(true);
    try {
      await digitalHandoverAPI.initiate({
        deliveryId,
        qrCode: data,
      });
      Alert.alert(t('handover.initSuccessTitle'), t('handover.initSuccessBody'), [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    } catch (error: unknown) {
      Alert.alert(t('error'), apiErrorMessage(error, t('handover.errInit')));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.muted}>{t('handover.initiating')}</Text>
      </View>
    );
  }

  if (scanning) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={styles.topBar}>
          <Text style={styles.heading}>{t('handover.scanningTitle')}</Text>
        </View>
        <View style={{ flex: 1, position: 'relative' }}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
          <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="box-none">
            <View style={styles.frame} />
            <Text style={styles.hintOnCam}>{t('handover.positionQr')}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setScanning(false)} style={styles.cancelBar}>
          <Text style={styles.cancelText}>{t('handover.cancel')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: 20 }}>
        <View
          style={{
            backgroundColor: `${theme.colors.primary}0d`,
            borderRadius: 8,
            borderWidth: 0.5,
            borderColor: `${theme.colors.primary}40`,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 14, color: theme.colors.text.primary, lineHeight: 18 }}>{t('logistics.handoverInit.documentFirst')}</Text>
        </View>
        <StepIndicator currentStep={1} totalSteps={3} labels={[t('handover.stepScan'), t('handover.stepAudit'), t('handover.stepSign')]} />
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 8,
            padding: 20,
            borderWidth: 0.5,
            borderColor: theme.colors.border,
            marginTop: 20,
          }}
        >
          <Text style={styles.instructions}>{t('handover.initSubtitle')}</Text>
          <TouchableOpacity
            onPress={handleScanQR}
            style={{
              backgroundColor: theme.colors.primary,
              paddingVertical: 16,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 20,
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('handover.scanCta')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <QrCode size={20} color={theme.colors.background} strokeWidth={1} />
              <Text style={{ fontSize: 14, fontWeight: '400', color: theme.colors.background, letterSpacing: 0.5 }}>
                {t('handover.scanCta')}
              </Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.instructions, { marginTop: 20 }]}>{t('handover.manualLabel')}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TextInput
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="STORE-…"
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.codeInput}
              accessibilityLabel={t('handover.manualLabel')}
            />
            <TouchableOpacity
              onPress={() => void submitCode(manualCode)}
              disabled={!manualCode.trim()}
              style={[styles.codeBtn, !manualCode.trim() && { opacity: 0.45 }]}
              accessibilityRole="button"
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{t('handover.manualSubmit')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  muted: { marginTop: 16, fontSize: 13, color: theme.colors.text.secondary, fontWeight: '400' },
  topBar: { padding: 20, borderBottomWidth: 0.5, borderBottomColor: theme.colors.border },
  heading: { fontSize: 16, fontWeight: '400', color: theme.colors.text.primary, letterSpacing: 0.5 },
  overlay: { justifyContent: 'center', alignItems: 'center' },
  frame: { width: 250, height: 250, borderWidth: 0.5, borderColor: theme.colors.primary, borderRadius: 8, backgroundColor: 'transparent' },
  hintOnCam: {
    marginTop: 20,
    fontSize: 13,
    color: theme.colors.background,
    fontWeight: '400',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 4,
  },
  cancelBar: { padding: 16, backgroundColor: theme.colors.background, borderTopWidth: 0.5, borderTopColor: theme.colors.border },
  cancelText: { fontSize: 14, fontWeight: '400', color: theme.colors.text.primary, textAlign: 'center' },
  codeInput: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    fontSize: 16,
    letterSpacing: 1,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
  },
  codeBtn: { height: 46, paddingHorizontal: 16, borderRadius: 10, backgroundColor: theme.colors.primary, justifyContent: 'center' },
  instructions: { fontSize: 13, fontWeight: '400', color: theme.colors.text.primary, letterSpacing: 0.3, lineHeight: 20 },
});
