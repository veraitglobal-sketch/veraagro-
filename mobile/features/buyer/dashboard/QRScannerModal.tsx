import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import { CameraView } from 'expo-camera';
import { theme } from '../../../lib/theme';

type Props = {
  visible: boolean;
  headerTop: number;
  screenPaddingLeft: number;
  screenPaddingRight: number;
  onClose: () => void;
  onBarcodeScanned: (data: { data: string }) => void;
};

export function QRScannerModal({
  visible,
  headerTop,
  screenPaddingLeft,
  screenPaddingRight,
  onClose,
  onBarcodeScanned,
}: Props) {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={onBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'ean13', 'ean8', 'code128'],
          }}
        />
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'space-between' }]} pointerEvents="box-none">
          <View
            style={{
              paddingTop: headerTop,
              paddingLeft: screenPaddingLeft,
              paddingRight: screenPaddingRight,
              paddingBottom: theme.spacing.md,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '400',
                color: theme.colors.text.inverse,
                letterSpacing: 0.5,
              }}
            >
              {t('buyer.dashboard.scanCode')}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} color={theme.colors.text.inverse} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View
              style={{
                width: 250,
                height: 250,
                borderWidth: 0.5,
                borderColor: theme.colors.primary,
                borderRadius: theme.borderRadius.md,
                backgroundColor: 'transparent',
              }}
            />
          </View>

          <View
            style={{
              padding: theme.spacing.lg,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '400',
                color: theme.colors.text.inverse,
                textAlign: 'center',
                letterSpacing: 0.3,
              }}
            >
              {t('buyer.dashboard.scannerHint')}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
