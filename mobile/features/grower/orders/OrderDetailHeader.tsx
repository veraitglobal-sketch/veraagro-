import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';

export default function OrderDetailHeader() {
  const router = useRouter();
  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.md,
        paddingTop: 48,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
      }}
    >
      <TouchableOpacity onPress={() => router.back()} style={{ marginRight: theme.spacing.md }}>
        <ArrowLeft size={24} color={colors.text.primary} strokeWidth={1.5} />
      </TouchableOpacity>
      <Text style={{ fontSize: 18, fontWeight: '300', color: colors.text.primary, letterSpacing: 0.3, flex: 1 }}>
        Detalji Porudžbine
      </Text>
    </View>
  );
}
