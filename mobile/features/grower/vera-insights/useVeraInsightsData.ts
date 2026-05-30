import { useState, useEffect, useCallback } from 'react';
import type { TFunction } from 'i18next';
import api from '../../../lib/api';
import type { CropInsight } from './types';

function mapInsightRow(item: Record<string, unknown>): CropInsight {
  return {
    id: String(item.id ?? ''),
    cropName: String(item.cropName ?? ''),
    veraScore: Number(item.veraScore ?? 0),
    historicalDeficit: Number(item.historicalDeficit ?? 0),
    whyText: String(item.whyText ?? ''),
    riskLevel: (item.riskLevel as CropInsight['riskLevel']) ?? 'MEDIUM',
    priceTrend: (item.priceTrend as CropInsight['priceTrend']) ?? 'STABLE',
    seedId: item.seedId != null ? String(item.seedId) : undefined,
  };
}

export function useVeraInsightsData() {
  const [insights, setInsights] = useState<CropInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadInsights = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/vera-insights');
      const rows = Array.isArray(response.data) ? response.data : [];
      setInsights(rows.map((item) => mapInsightRow(item as Record<string, unknown>)));
      setLoadError(false);
    } catch (error: unknown) {
      console.error('Error loading insights:', error);
      setInsights([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  return { insights, loading, loadError, loadInsights };
}

export type VeraInsightsTheme = {
  colors: {
    success: string;
    info: string;
    warning: string;
    error: string;
    background: string;
    text?: { primary: string; secondary: string };
  };
};

export function getScoreColor(score: number, theme: VeraInsightsTheme): string {
  if (score >= 80) return theme.colors.success;
  if (score >= 60) return theme.colors.info;
  if (score >= 40) return theme.colors.warning;
  return theme.colors.error;
}

export function getScoreLabel(score: number, t: TFunction): string {
  if (score >= 80) return t('producer.insights.scoreExcellent');
  if (score >= 60) return t('producer.insights.scoreGood');
  if (score >= 40) return t('producer.insights.scoreModerate');
  return t('producer.insights.scoreLow');
}

export function getRiskColor(risk: string, theme: VeraInsightsTheme): string {
  switch (risk) {
    case 'LOW':
      return theme.colors.success;
    case 'MEDIUM':
      return theme.colors.warning;
    case 'HIGH':
      return theme.colors.error;
    default:
      return theme.colors.text?.secondary ?? '#6B7280';
  }
}

export function getRiskLabel(risk: string, t: TFunction): string {
  switch (risk) {
    case 'LOW':
      return t('producer.insights.riskLow');
    case 'MEDIUM':
      return t('producer.insights.riskMedium');
    case 'HIGH':
      return t('producer.insights.riskHigh');
    default:
      return t('producer.insights.riskUnknown');
  }
}
