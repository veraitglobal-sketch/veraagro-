import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../../lib/api-url';
import type { CropInsight } from './types';

function getMockInsights(): CropInsight[] {
  return [
    {
      id: '1',
      cropName: 'Hazelnut',
      veraScore: 95,
      historicalDeficit: 20,
      whyText:
        'German confectioners are looking for more hazelnuts due to new eco-standards. Vera guarantees purchase because we have a direct contract.',
      riskLevel: 'LOW',
      priceTrend: 'UP',
      seedId: 'hazelnut-premium-1',
    },
    {
      id: '2',
      cropName: 'Apple',
      veraScore: 40,
      historicalDeficit: -15,
      whyText:
        'Too much supply on the market, low price. We recommend waiting until next season.',
      riskLevel: 'HIGH',
      priceTrend: 'DOWN',
    },
    {
      id: '3',
      cropName: 'Raspberry',
      veraScore: 75,
      historicalDeficit: 10,
      whyText: 'Stable demand, good price. Vera partners have priority in purchase.',
      riskLevel: 'MEDIUM',
      priceTrend: 'STABLE',
      seedId: 'raspberry-bio-1',
    },
    {
      id: '4',
      cropName: 'Plum',
      veraScore: 68,
      historicalDeficit: 5,
      whyText: 'Moderate demand. Good option for diversification.',
      riskLevel: 'MEDIUM',
      priceTrend: 'STABLE',
    },
  ];
}

export function useVeraInsightsData() {
  const [insights, setInsights] = useState<CropInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInsights = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/vera-insights`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const transformedInsights = (response.data || []).map((item: any) => ({
        id: item.id,
        cropName: item.cropName,
        veraScore: item.veraScore,
        historicalDeficit: item.historicalDeficit,
        whyText: item.whyText,
        riskLevel: item.riskLevel,
        priceTrend: item.priceTrend,
        seedId: item.seedId,
      }));
      setInsights(
        transformedInsights.length > 0 ? transformedInsights : getMockInsights()
      );
    } catch (error: any) {
      console.error('Error loading insights:', error);
      setInsights(getMockInsights());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  return { insights, loading, loadInsights };
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

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Moderate';
  return 'Low';
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

export function getRiskLabel(risk: string): string {
  switch (risk) {
    case 'LOW':
      return 'Low';
    case 'MEDIUM':
      return 'Medium';
    case 'HIGH':
      return 'High';
    default:
      return 'Unknown';
  }
}
