import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import type { Order } from '../../../lib/api';

export default function DeliveryBlock({ order }: { order: Order }) {
  const { t } = useTranslation();
  const addr = order.deliveryAddress;
  if (!addr) return null;
  return (
    <View
      style={{
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <MapPin size={18} color={theme.colors.text.primary} strokeWidth={1} />
        <Text style={{ fontSize: 15, fontWeight: '400', color: theme.colors.text.primary, marginLeft: theme.spacing.xs, letterSpacing: 0.3 }}>
          {t('producer.orders.deliveryAddress')}
        </Text>
      </View>
      {typeof addr === 'string' ? (
        <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.secondary }}>{addr}</Text>
      ) : (
        <>
          {addr.street && <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.secondary }}>{addr.street}</Text>}
          {addr.city && (
            <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.secondary, marginTop: theme.spacing.xs }}>
              {addr.city}{addr.postalCode ? `, ${addr.postalCode}` : ''}
            </Text>
          )}
          {addr.country && (
            <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.secondary, marginTop: theme.spacing.xs }}>
              {addr.country}
            </Text>
          )}
        </>
      )}
    </View>
  );
}
