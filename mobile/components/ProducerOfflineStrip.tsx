import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react-native';
import { useNetwork } from '../contexts/NetworkContext';

/**
 * Thin banner when there is no Internet — grower still sees cached lists and can queue work.
 */
export function ProducerOfflineStrip() {
  const { t } = useTranslation();
  const { isOnline, isChecking } = useNetwork();

  if (isChecking || isOnline) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#FEF3C7',
        borderBottomWidth: 1,
        borderBottomColor: '#F59E0B',
      }}
    >
      <WifiOff size={18} color="#92400E" strokeWidth={1.5} />
      <Text style={{ flex: 1, fontSize: 13, color: '#92400E', lineHeight: 18 }}>
        {t('producer.offline.banner')}
      </Text>
    </View>
  );
}
