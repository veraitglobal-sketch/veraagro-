import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';

export default function MissionHeader() {
  const router = useRouter();
  return (
    <View
      className="px-4 pt-12 pb-4 border-b-[0.5px] flex-row items-center"
      style={{
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
      }}
    >
      <TouchableOpacity onPress={() => router.back()} style={{ marginRight: theme.spacing.md }}>
        <ArrowLeft size={24} color={colors.text.primary} strokeWidth={1.5} />
      </TouchableOpacity>
      <Text
        className="text-lg flex-1"
        style={{
          color: colors.text.primary,
          fontWeight: '300',
          letterSpacing: 0.3,
        }}
      >
        Detalji Misije
      </Text>
    </View>
  );
}
