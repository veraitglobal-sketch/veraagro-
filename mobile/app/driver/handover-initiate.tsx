import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Camera, QrCode } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '../../lib/colors';
import { digitalHandoverAPI } from '../../lib/api';
import StepIndicator from '../../components/StepIndicator';

/**
 * Driver Handover Initiate Screen
 * Driver scans QR code when arriving at store
 */
export default function HandoverInitiateScreen() {
  const router = useRouter();
  const { deliveryId } = useLocalSearchParams<{ deliveryId: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleScanQR = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to scan QR code');
        return;
      }
    }
    setScanning(true);
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (!deliveryId) {
      Alert.alert('Error', 'Delivery ID is missing');
      setScanning(false);
      return;
    }

    setScanning(false);
    setLoading(true);

    try {
      const handover = await digitalHandoverAPI.initiate({
        deliveryId,
        qrCode: data,
      });

      Alert.alert(
        'Handover Initiated',
        'Store manager has been notified. Please wait for quality audit.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to initiate handover');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, fontSize: 13, color: colors.text.secondary, fontWeight: '300' }}>
          Initiating handover...
        </Text>
      </View>
    );
  }

  if (scanning) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 20, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
          <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, letterSpacing: 0.5 }}>
            Scan Store QR Code
          </Text>
        </View>

        <CameraView
          style={{ flex: 1 }}
          facing="back"
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View
              style={{
                width: 250,
                height: 250,
                borderWidth: 0.5,
                borderColor: colors.primary,
                borderRadius: 8,
                backgroundColor: 'transparent',
              }}
            />
            <Text
              style={{
                marginTop: 20,
                fontSize: 13,
                color: colors.background,
                fontWeight: '300',
                textAlign: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: 8,
                borderRadius: 4,
              }}
            >
              Position QR code within frame
            </Text>
          </View>
        </CameraView>

        <TouchableOpacity
          onPress={() => setScanning(false)}
          style={{
            padding: 16,
            backgroundColor: colors.background,
            borderTopWidth: 0.5,
            borderTopColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '400', color: colors.text.primary, textAlign: 'center' }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
        <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.primary, letterSpacing: 0.5 }}>
          Initiate Handover
        </Text>
      </View>

      <View style={{ padding: 20 }}>
        <StepIndicator currentStep={1} totalSteps={3} labels={['Skeniranje', 'Provera', 'Potpis']} />

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 8,
            padding: 20,
            borderWidth: 0.5,
            borderColor: colors.border,
            marginTop: 20,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '300',
              color: colors.text.primary,
              letterSpacing: 0.3,
              marginBottom: 12,
            }}
          >
            When you arrive at the store, scan the QR code located at the store entrance or provided by the store manager.
          </Text>

          <TouchableOpacity
            onPress={handleScanQR}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 16,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 20,
            }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <QrCode size={20} color={colors.background} strokeWidth={1} />
              <Text style={{ fontSize: 14, fontWeight: '400', color: colors.background, letterSpacing: 0.5 }}>
                Scan QR Code
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
