import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useVeraInsightsData } from './useVeraInsightsData';
import ShortagesSection from './ShortagesSection';
import InsightCard from './InsightCard';

export default function VeraInsightsScreen() {
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const { insights, loading } = useVeraInsightsData();

  const handleAcceptRecommendation = () => {
    router.push('/(producer)/(tabs)/products');
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          paddingTop: p.headerTop,
          paddingBottom: theme.spacing.md,
          paddingLeft: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          backgroundColor: theme.colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(0, 0, 0, 0.08)',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ marginRight: theme.spacing.md }}
        >
          <ArrowLeft size={20} color={theme.colors.text.primary} strokeWidth={1} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '300',
            color: theme.colors.text.primary,
            letterSpacing: 0.5,
          }}
        >
          Vera Insights
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View
          style={{
            paddingTop: theme.spacing.lg,
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
            paddingBottom: Math.max(p.bottomInset, theme.spacing.lg),
          }}
        >
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '300',
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.sm,
                letterSpacing: 0.5,
              }}
            >
              Market Intelligence
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '300',
                color: theme.colors.text.secondary,
                lineHeight: 18,
                letterSpacing: 0.2,
              }}
            >
              Overview of crop profitability and recommendations for the next season based on EU
              market analysis.
            </Text>
          </View>

          <ShortagesSection insights={insights} />

          <Text
            style={{
              fontSize: 12,
              fontWeight: '300',
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.sm,
              letterSpacing: 0.5,
            }}
          >
            Crop Profitability
          </Text>

          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onAcceptRecommendation={handleAcceptRecommendation}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
