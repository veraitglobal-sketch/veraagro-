import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useVeraInsightsData } from './useVeraInsightsData';
import ShortagesSection from './ShortagesSection';
import InsightCard from './InsightCard';
import EmptyState from '../../../components/EmptyState';

export default function VeraInsightsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();
  const { insights, loading, loadError, loadInsights } = useVeraInsightsData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInsights();
    } finally {
      setRefreshing(false);
    }
  }, [loadInsights]);

  const handleAcceptRecommendation = () => {
    router.push('/(producer)/(tabs)/products');
  };

  if (loading && insights.length === 0) {
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
            fontWeight: '400',
            color: theme.colors.text.primary,
            letterSpacing: 0.5,
          }}
        >
          {t('producer.veraInsights.title')}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
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
                fontSize: 14,
                fontWeight: '400',
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.sm,
                letterSpacing: 0.5,
              }}
            >
              {t('producer.veraInsights.market')}
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '400',
                color: theme.colors.text.secondary,
                lineHeight: 18,
                letterSpacing: 0.2,
              }}
            >
              {t('producer.veraInsights.marketLead')}
            </Text>
          </View>

          {loadError ? (
            <View
              style={{
                padding: theme.spacing.md,
                marginBottom: theme.spacing.lg,
                borderRadius: 12,
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <Text style={{ fontSize: 15, color: theme.colors.text.primary, lineHeight: 22 }}>
                {t('producer.veraInsights.loadError')}
              </Text>
              <TouchableOpacity
                onPress={() => void loadInsights()}
                style={{ marginTop: 12, minHeight: 48, justifyContent: 'center' }}
                accessibilityRole="button"
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.primary }}>
                  {t('producer.wallet.retry')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!loadError && insights.length === 0 ? (
            <EmptyState message={t('producer.veraInsights.empty')} />
          ) : null}

          {!loadError && insights.length > 0 ? <ShortagesSection insights={insights} /> : null}

          {!loadError && insights.length > 0 ? (
            <>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '400',
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.sm,
                  letterSpacing: 0.5,
                }}
              >
                {t('producer.veraInsights.profitability')}
              </Text>

              {insights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onAcceptRecommendation={handleAcceptRecommendation}
                />
              ))}
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
