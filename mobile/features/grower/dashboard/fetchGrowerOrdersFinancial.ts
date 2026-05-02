import { financialDashboardAPI } from '../../../lib/api';

export type OrdersFinancialSnapshot = {
  dashboardRole?: 'PLATFORM' | 'GROWER';
  farmerOrderShareTotal: number;
  farmerShareReleased: number;
  farmerShareInEscrow: number;
  farmerSharePending: number;
  estimatedVeraBonusDeliveredLots: number;
};

export async function fetchGrowerOrdersFinancial(): Promise<OrdersFinancialSnapshot | null> {
  try {
    const raw = await financialDashboardAPI.getDashboard();
    const s = raw.summary;
    if (!s) {
      return null;
    }
    const vera = s.estimatedVeraBonusDeliveredLots ?? s.veraBonusPaid ?? 0;
    return {
      dashboardRole: raw.dashboardRole,
      farmerOrderShareTotal: Number(s.farmerOrderShareTotal ?? 0),
      farmerShareReleased: Number(s.farmerShareReleased ?? 0),
      farmerShareInEscrow: Number(s.farmerShareInEscrow ?? 0),
      farmerSharePending: Number(s.farmerSharePending ?? 0),
      estimatedVeraBonusDeliveredLots: Number(vera),
    };
  } catch {
    return null;
  }
}
