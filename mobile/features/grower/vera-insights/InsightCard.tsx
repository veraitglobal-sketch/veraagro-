import { View, Text, TouchableOpacity } from 'react-native';
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
  const scoreColor = getScoreColor(insight.veraScore, theme);
  const riskColor = getRiskColor(insight.riskLevel, theme);

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 0.5,
        borderColor: 'rgba(0, 0, 0, 0.05)',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: theme.spacing.sm,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '300',
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.xs,
              letterSpacing: 0.3,
            }}
          >
            {insight.cropName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
            <View
              style={{
                backgroundColor: scoreColor,
                paddingHorizontal: theme.spacing.xs,
                paddingVertical: 2,
                borderRadius: theme.borderRadius.sm,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '300',
                  color: theme.colors.background,
                  letterSpacing: 0.3,
                }}
              >
                Vera Score: {insight.veraScore}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 9,
                fontWeight: '300',
                color: scoreColor,
                letterSpacing: 0.2,
              }}
            >
              {getScoreLabel(insight.veraScore)}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: theme.spacing.xs }}>
          {insight.priceTrend === 'UP' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
              <TrendingUp size={16} color={theme.colors.success} strokeWidth={1.5} />
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '300',
                  color: theme.colors.success,
                  letterSpacing: 0.2,
                }}
              >
                Price Rising
              </Text>
            </View>
          )}
          {insight.priceTrend === 'DOWN' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
              <TrendingDown size={16} color={theme.colors.error} strokeWidth={1.5} />
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '300',
                  color: theme.colors.error,
                  letterSpacing: 0.2,
                }}
              >
                Price Falling
              </Text>
            </View>
          )}
          {insight.priceTrend === 'STABLE' && (
            <Text
              style={{
                fontSize: 9,
                fontWeight: '300',
                color: theme.colors.text.secondary,
                letterSpacing: 0.2,
              }}
            >
              Stable Price
            </Text>
          )}
          <View
            style={{
              backgroundColor: riskColor,
              paddingHorizontal: theme.spacing.xs,
              paddingVertical: 2,
              borderRadius: theme.borderRadius.sm,
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: '300',
                color: theme.colors.background,
                letterSpacing: 0.2,
              }}
            >
              Risk: {getRiskLabel(insight.riskLevel)}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={{
          backgroundColor: theme.colors.background,
          borderRadius: theme.borderRadius.sm,
          padding: theme.spacing.sm,
          marginBottom: theme.spacing.sm,
          borderLeftWidth: 3,
          borderLeftColor: theme.colors.primary,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.xs,
            marginBottom: theme.spacing.xs,
          }}
        >
          <Info size={14} color={theme.colors.primary} strokeWidth={1.5} />
          <Text
            style={{
              fontSize: 11,
              fontWeight: '300',
              color: theme.colors.text.primary,
              letterSpacing: 0.3,
            }}
          >
            Why?
          </Text>
        </View>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '300',
            color: theme.colors.text.secondary,
            lineHeight: 16,
            letterSpacing: 0.2,
          }}
        >
          {insight.whyText}
        </Text>
      </View>

      {insight.seedId && (
        <TouchableOpacity
          onPress={() => onAcceptRecommendation(insight)}
          activeOpacity={0.7}
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.md,
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.xs,
            borderWidth: 0.5,
            borderColor: 'rgba(0, 0, 0, 0.05)',
          }}
        >
          <CheckCircle size={16} color={theme.colors.background} strokeWidth={1.5} />
          <Text
            style={{
              fontSize: 11,
              fontWeight: '300',
              color: theme.colors.background,
              letterSpacing: 0.3,
            }}
          >
            Accept recommendation and plan planting
          </Text>
          <ArrowRight size={16} color={theme.colors.background} strokeWidth={1.5} />
        </TouchableOpacity>
      )}
    </View>
  );
}
