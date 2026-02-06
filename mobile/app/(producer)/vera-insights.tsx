import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, CheckCircle, ArrowRight, Info } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.178.27:3000';

interface CropInsight {
  id: string;
  cropName: string;
  veraScore: number; // 1-100
  historicalDeficit?: number; // Percentage shortage from last season
  whyText: string; // Explanation text
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  priceTrend: 'UP' | 'DOWN' | 'STABLE';
  seedId?: string; // ID of Vera Approved seed for this crop
}

/**
 * Vera Insights Screen
 * Shows market intelligence and profitability scores for crops
 * Matches buyer dashboard styling
 */
export default function VeraInsightsScreen() {
  const router = useRouter();
  const [insights, setInsights] = useState<CropInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      
      // Fetch from backend (public endpoint, token optional)
      const response = await axios.get(`${API_URL}/vera-insights`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      // Transform backend data to match frontend interface
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
      
      setInsights(transformedInsights.length > 0 ? transformedInsights : getMockInsights());
    } catch (error: any) {
      console.error('Error loading insights:', error);
      // Use mock data as fallback if backend is not available
      setInsights(getMockInsights());
    } finally {
      setLoading(false);
    }
  };

  const getMockInsights = (): CropInsight[] => [
    {
      id: '1',
      cropName: 'Hazelnut',
      veraScore: 95,
      historicalDeficit: 20,
      whyText: 'German confectioners are looking for more hazelnuts due to new eco-standards. Vera guarantees purchase because we have a direct contract.',
      riskLevel: 'LOW',
      priceTrend: 'UP',
      seedId: 'hazelnut-premium-1',
    },
    {
      id: '2',
      cropName: 'Apple',
      veraScore: 40,
      historicalDeficit: -15, // Oversupply
      whyText: 'Too much supply on the market, low price. We recommend waiting until next season.',
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.colors.success;
    if (score >= 60) return theme.colors.info;
    if (score >= 40) return theme.colors.warning;
    return theme.colors.error;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Moderate';
    return 'Low';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return theme.colors.success;
      case 'MEDIUM': return theme.colors.warning;
      case 'HIGH': return theme.colors.error;
      default: return theme.colors.text.secondary;
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'Low';
      case 'MEDIUM': return 'Medium';
      case 'HIGH': return 'High';
      default: return 'Unknown';
    }
  };

  const handleAcceptRecommendation = (insight: CropInsight) => {
    if (insight.seedId) {
      // Navigate to shop with filter for this seed
      router.push({
        pathname: '/(producer)/(tabs)/shop',
        params: { seedId: insight.seedId, cropName: insight.cropName },
      });
    } else {
      // Navigate to shop without filter
      router.push('/(producer)/(tabs)/shop');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: 60,
        paddingBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: theme.spacing.md }}>
          <ArrowLeft size={20} color={theme.colors.text.primary} strokeWidth={1} />
        </TouchableOpacity>
        <Text style={{
          fontSize: 18,
          fontWeight: '300',
          color: theme.colors.text.primary,
          letterSpacing: 0.5,
        }}>
          Vera Insights
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: theme.spacing.lg }}>
          {/* Intro Section */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '300',
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.sm,
              letterSpacing: 0.5,
            }}>
              Market Intelligence
            </Text>
            <Text style={{
              fontSize: 11,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              lineHeight: 18,
              letterSpacing: 0.2,
            }}>
              Overview of crop profitability and recommendations for the next season based on EU market analysis.
            </Text>
          </View>

          {/* Historical Deficit Overview */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '300',
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.sm,
              letterSpacing: 0.5,
            }}>
              Shortages Last Season
            </Text>
            <View style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.05)',
            }}>
              {insights
                .filter(i => i.historicalDeficit && i.historicalDeficit > 0)
                .map((insight) => (
                  <View key={insight.id} style={{ marginBottom: theme.spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '300',
                        color: theme.colors.text.primary,
                        marginBottom: theme.spacing.xs,
                        letterSpacing: 0.3,
                      }}>
                        {insight.cropName}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                        <AlertCircle size={14} color={theme.colors.warning} strokeWidth={1.5} />
                        <Text style={{
                          fontSize: 9,
                          fontWeight: '300',
                          color: theme.colors.text.secondary,
                          letterSpacing: 0.2,
                        }}>
                          {insight.historicalDeficit}% shortage
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              {insights.filter(i => i.historicalDeficit && i.historicalDeficit > 0).length === 0 && (
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: theme.colors.text.secondary,
                  fontStyle: 'italic',
                  letterSpacing: 0.2,
                }}>
                  No data on shortages for last season.
                </Text>
              )}
            </View>
          </View>

          {/* Crop Insights List */}
          <Text style={{
            fontSize: 12,
            fontWeight: '300',
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.sm,
            letterSpacing: 0.5,
          }}>
            Crop Profitability
          </Text>

          {insights.map((insight) => (
            <View
              key={insight.id}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.md,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.05)',
              }}
            >
              {/* Crop Header with Score */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '300',
                    color: theme.colors.text.primary,
                    marginBottom: theme.spacing.xs,
                    letterSpacing: 0.3,
                  }}>
                    {insight.cropName}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                    <View style={{
                      backgroundColor: getScoreColor(insight.veraScore),
                      paddingHorizontal: theme.spacing.xs,
                      paddingVertical: 2,
                      borderRadius: theme.borderRadius.sm,
                    }}>
                      <Text style={{
                        fontSize: 9,
                        fontWeight: '300',
                        color: theme.colors.background,
                        letterSpacing: 0.3,
                      }}>
                        Vera Score: {insight.veraScore}
                      </Text>
                    </View>
                    <Text style={{
                      fontSize: 9,
                      fontWeight: '300',
                      color: getScoreColor(insight.veraScore),
                      letterSpacing: 0.2,
                    }}>
                      {getScoreLabel(insight.veraScore)}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: theme.spacing.xs }}>
                  {insight.priceTrend === 'UP' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                      <TrendingUp size={16} color={theme.colors.success} strokeWidth={1.5} />
                      <Text style={{
                        fontSize: 9,
                        fontWeight: '300',
                        color: theme.colors.success,
                        letterSpacing: 0.2,
                      }}>
                        Price Rising
                      </Text>
                    </View>
                  )}
                  {insight.priceTrend === 'DOWN' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                      <TrendingDown size={16} color={theme.colors.error} strokeWidth={1.5} />
                      <Text style={{
                        fontSize: 9,
                        fontWeight: '300',
                        color: theme.colors.error,
                        letterSpacing: 0.2,
                      }}>
                        Price Falling
                      </Text>
                    </View>
                  )}
                  {insight.priceTrend === 'STABLE' && (
                    <Text style={{
                      fontSize: 9,
                      fontWeight: '300',
                      color: theme.colors.text.secondary,
                      letterSpacing: 0.2,
                    }}>
                      Stable Price
                    </Text>
                  )}
                  <View style={{
                    backgroundColor: getRiskColor(insight.riskLevel),
                    paddingHorizontal: theme.spacing.xs,
                    paddingVertical: 2,
                    borderRadius: theme.borderRadius.sm,
                  }}>
                    <Text style={{
                      fontSize: 9,
                      fontWeight: '300',
                      color: theme.colors.background,
                      letterSpacing: 0.2,
                    }}>
                      Risk: {getRiskLabel(insight.riskLevel)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Why Section */}
              <View style={{
                backgroundColor: theme.colors.background,
                borderRadius: theme.borderRadius.sm,
                padding: theme.spacing.sm,
                marginBottom: theme.spacing.sm,
                borderLeftWidth: 3,
                borderLeftColor: theme.colors.primary,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginBottom: theme.spacing.xs }}>
                  <Info size={14} color={theme.colors.primary} strokeWidth={1.5} />
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: theme.colors.text.primary,
                    letterSpacing: 0.3,
                  }}>
                    Why?
                  </Text>
                </View>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: theme.colors.text.secondary,
                  lineHeight: 16,
                  letterSpacing: 0.2,
                }}>
                  {insight.whyText}
                </Text>
              </View>

              {/* Action Button */}
              {insight.seedId && (
                <TouchableOpacity
                  onPress={() => handleAcceptRecommendation(insight)}
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
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: theme.colors.background,
                    letterSpacing: 0.3,
                  }}>
                    Accept recommendation and plan planting
                  </Text>
                  <ArrowRight size={16} color={theme.colors.background} strokeWidth={1.5} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
