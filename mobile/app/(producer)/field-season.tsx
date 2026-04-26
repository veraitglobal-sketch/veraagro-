import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import GrowerJourneyScreen from '../../features/grower/steps/GrowerJourneyScreen';
import { theme } from '../../lib/theme';

/**
 * Stack entry for “View steps” from dashboard — same content as the Steps tab, with a back control.
 */
export default function FieldSeasonScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 52,
          paddingHorizontal: theme.spacing.md,
          paddingBottom: theme.spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: theme.spacing.md }} hitSlop={12}>
          <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text.primary }}>{t('producer.fieldSeason.title')}</Text>
      </View>
      <GrowerJourneyScreen showStatusBanner />
    </View>
  );
}
