import { View, Text } from 'react-native';
import { Package, Calendar } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';

export default function BatchProductBlock({ batch }: { batch: any }) {
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
        <Package size={18} color={colors.text.primary} strokeWidth={1} />
        <Text style={{ fontSize: 15, fontWeight: '300', color: colors.text.primary, marginLeft: theme.spacing.xs, letterSpacing: 0.3 }}>
          Proizvod
        </Text>
      </View>
      <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.secondary, marginBottom: theme.spacing.xs }}>
        {batch.productName || 'Nepoznat proizvod'}
      </Text>
      {batch.quantity && (
        <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.secondary }}>
          Količina: {batch.quantity} {batch.unit || 'kg'}
        </Text>
      )}
      {batch.harvestDate && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.xs }}>
          <Calendar size={14} color={colors.text.secondary} strokeWidth={1} />
          <Text style={{ fontSize: 11, fontWeight: '300', color: colors.text.secondary, marginLeft: 4 }}>
            Berba: {new Date(batch.harvestDate).toLocaleDateString('sr-RS')}
          </Text>
        </View>
      )}
    </View>
  );
}
