import { View, Text } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';
import type { Order } from '../../../lib/api';

export default function DeliveryBlock({ order }: { order: Order }) {
  const addr = order.deliveryAddress;
  if (!addr) return null;
  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 0.5,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <MapPin size={18} color={colors.text.primary} strokeWidth={1} />
        <Text style={{ fontSize: 15, fontWeight: '300', color: colors.text.primary, marginLeft: theme.spacing.xs, letterSpacing: 0.3 }}>
          Adresa isporuke
        </Text>
      </View>
      {typeof addr === 'string' ? (
        <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.secondary }}>{addr}</Text>
      ) : (
        <>
          {addr.street && <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.secondary }}>{addr.street}</Text>}
          {addr.city && (
            <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.secondary, marginTop: theme.spacing.xs }}>
              {addr.city}{addr.postalCode ? `, ${addr.postalCode}` : ''}
            </Text>
          )}
          {addr.country && (
            <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.secondary, marginTop: theme.spacing.xs }}>
              {addr.country}
            </Text>
          )}
        </>
      )}
    </View>
  );
}
