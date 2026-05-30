import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Info, CheckCircle, ArrowRight } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import type { CropInsight } from './types';
import {
  getScoreColor,
  getScoreLabel,
  getRiskColor,
  getRiskLabel,
} from './useVeraInsightsData';

interface InsightCardProps {
  insight: CropInsight;
  onAcceptRecommendation: (insight: CropInsight) => void;
}

export default function InsightCard({ insight, onAcceptRecommendation }: InsightCardProps) {
  const { t } = useTranslation();
  const scoreColor = getScoreColor(insight.veraScore, theme);
  const riskColor = getRiskColor(insight.riskLevel, theme);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cropName}>{insight.cropName}</Text>
          <View style={styles.scoreRow}>
            <View style={[styles.badge, { backgroundColor: scoreColor }]}>
              <Text style={styles.badgeOnColor}>
                {t('producer.insights.veraScore', { score: insight.veraScore })}
              </Text>
            </View>
            <Text style={[styles.scoreLabel, { color: scoreColor }]}>
              {getScoreLabel(insight.veraScore, t)}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: theme.spacing.xs }}>
          {insight.priceTrend === 'UP' && (
            <View style={styles.trendRow}>
              <TrendingUp size={18} color={theme.colors.success} strokeWidth={1.75} />
              <Text style={[styles.trendText, { color: theme.colors.success }]}>
                {t('producer.insights.priceRising')}
              </Text>
            </View>
          )}
          {insight.priceTrend === 'DOWN' && (
            <View style={styles.trendRow}>
              <TrendingDown size={18} color={theme.colors.error} strokeWidth={1.75} />
              <Text style={[styles.trendText, { color: theme.colors.error }]}>
                {t('producer.insights.priceFalling')}
              </Text>
            </View>
          )}
          {insight.priceTrend === 'STABLE' && (
            <Text style={styles.stableText}>{t('producer.insights.stablePrice')}</Text>
          )}
          <View style={[styles.badge, { backgroundColor: riskColor }]}>
            <Text style={styles.badgeOnColor}>
              {t('producer.insights.risk', { label: getRiskLabel(insight.riskLevel, t) })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.whyBox}>
        <View style={styles.whyHeader}>
          <Info size={16} color={theme.colors.primary} strokeWidth={1.75} />
          <Text style={styles.whyTitle}>{t('producer.insights.why')}</Text>
        </View>
        <Text style={styles.whyBody}>{insight.whyText}</Text>
      </View>

      {insight.seedId && (
        <TouchableOpacity
          onPress={() => onAcceptRecommendation(insight)}
          activeOpacity={0.7}
          style={styles.cta}
        >
          <CheckCircle size={18} color={theme.colors.background} strokeWidth={1.75} />
          <Text style={styles.ctaText}>{t('producer.insights.acceptPlan')}</Text>
          <ArrowRight size={18} color={theme.colors.background} strokeWidth={1.75} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  cropName: {
    ...theme.typography.bodySmall,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  badgeOnColor: {
    ...theme.typography.badge,
    color: theme.colors.background,
  },
  scoreLabel: {
    ...theme.typography.caption,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  trendText: {
    ...theme.typography.caption,
    fontWeight: '500',
  },
  stableText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  whyBox: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  whyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  whyTitle: {
    ...theme.typography.bodySmall,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  whyBody: {
    ...theme.typography.bodySmall,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  cta: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    minHeight: 48,
  },
  ctaText: {
    ...theme.typography.bodySmall,
    fontWeight: '600',
    color: theme.colors.background,
  },
});
