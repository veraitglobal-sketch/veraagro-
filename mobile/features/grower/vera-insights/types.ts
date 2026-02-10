export interface CropInsight {
  id: string;
  cropName: string;
  veraScore: number;
  historicalDeficit?: number;
  whyText: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  priceTrend: 'UP' | 'DOWN' | 'STABLE';
  seedId?: string;
}
