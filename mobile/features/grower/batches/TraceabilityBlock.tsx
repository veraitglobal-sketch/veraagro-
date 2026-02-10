import { View, Text } from 'react-native';
import { User, Truck, MapPin } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';

export default function TraceabilityBlock({ batch }: { batch: any }) {
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
      <Text style={{ fontSize: 15, fontWeight: '300', color: colors.text.primary, marginBottom: theme.spacing.md, letterSpacing: 0.3 }}>
        Traceability
      </Text>
      {batch.harvestedBy && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm, paddingBottom: theme.spacing.sm, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
          <User size={14} color={colors.text.secondary} strokeWidth={1} />
          <View style={{ marginLeft: theme.spacing.xs, flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '300', color: colors.text.secondary }}>Berba</Text>
            <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.primary }}>
              {batch.harvestedBy.firstName} {batch.harvestedBy.lastName}
            </Text>
          </View>
        </View>
      )}
      {batch.transportedByDriver && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm, paddingBottom: theme.spacing.sm, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
          <Truck size={14} color={colors.text.secondary} strokeWidth={1} />
          <View style={{ marginLeft: theme.spacing.xs, flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '300', color: colors.text.secondary }}>Transport</Text>
            <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.primary }}>
              {batch.transportedByDriver.firstName} {batch.transportedByDriver.lastName}
            </Text>
          </View>
        </View>
      )}
      {batch.currentHub && (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MapPin size={14} color={colors.text.secondary} strokeWidth={1} />
          <View style={{ marginLeft: theme.spacing.xs, flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '300', color: colors.text.secondary }}>Trenutna lokacija</Text>
            <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.primary }}>
              {batch.currentHub.name || 'Hub'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
