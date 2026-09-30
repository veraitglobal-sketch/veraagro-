import { isAxiosError } from 'axios';
import api from './client';
import type { Order, Mission, FinancialDashboardApiResponse } from './types';

export const ordersAPI = {
  cancel: async (id: string): Promise<void> => { await api.post(`/orders/${encodeURIComponent(id)}/cancel`); },
  create: async (data: {
    clientRequestId: string;
    productId: string;
    estateId?: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    deliveryAddress: unknown;
    deliveryNotes?: string;
    packOptionId?: string;
    packCount?: number;
  }): Promise<Order> => {
    try { return (await api.post('/orders', data)).data; }
    catch (error) {
      const code = (error as { response?: { data?: { code?: string } } }).response?.data?.code;
      if (data.clientRequestId && code === 'ORDER_REQUEST_MISMATCH') {
        return (await api.get(`/orders/checkout/${encodeURIComponent(data.clientRequestId)}`)).data;
      }
      throw error;
    }
  },
  getAll: async (): Promise<Order[]> => {
    const response = await api.get('/orders');
    return response.data || [];
  },
  /** Producer: orders fulfilled from the caller's estates (GET /orders is buyer-only). */
  getForGrower: async (): Promise<Order[]> => {
    try {
      const response = await api.get('/orders/grower');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      // Older API without the grower route: no producer orders to show yet.
      if (isAxiosError(error) && error.response?.status === 404) return [];
      throw error;
    }
  },
  getOne: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
};

/** Prisma returns the lot relation as `batches`; screens read `batch` (public BATCH-… code, product). */
function withBatchRef<T>(raw: T): T {
  if (!raw || typeof raw !== 'object') return raw;
  const m = raw as Record<string, unknown>;
  if (m.batch || !m.batches || typeof m.batches !== 'object') return raw;
  return { ...m, batch: m.batches } as T;
}

/** Align with Prisma `MissionStatus` (backend). Not `DELIVERED` — use `COMPLETED`. */
export const missionsAPI = {
  getAll: async (options?: { scope?: 'grower' | 'logistics' }): Promise<Mission[]> => {
    const response = await api.get('/missions/my-missions', {
      ...(options?.scope ? { params: { scope: options.scope } } : {}),
    });
    return Array.isArray(response.data) ? response.data.map(withBatchRef) : [];
  },
  getOne: async (id: string): Promise<Mission> => {
    const response = await api.get(`/missions/${id}`);
    return withBatchRef(response.data);
  },
  create: async (data: {
    batchId: string;
    pickupLocation: { lat: number; lng: number; address?: string };
    pickupAddress: string;
    destinationAddress?: string;
    destinationCity?: string;
    loadInstructions?: string;
    harvestAnnouncementId?: string;
  }): Promise<Mission> => {
    const response = await api.post('/missions', data);
    return response.data;
  },
  getTracker: async (): Promise<unknown> => {
    const response = await api.get('/grower-portal/mission-tracker');
    return response.data;
  },
  getJourneyMap: async (missionId: string): Promise<unknown> => {
    const response = await api.get(`/grower-portal/journey-map/${missionId}`);
    return response.data;
  },
  getConsumerFeedback: async (batchId: string): Promise<unknown> => {
    const response = await api.get(`/grower-portal/consumer-feedback/${batchId}`);
    return response.data;
  },
  getFinancialStatus: async (batchId: string): Promise<unknown> => {
    const response = await api.get(`/grower-portal/financial-status/${batchId}`);
    return response.data;
  },
  advanceMissionLifecycle: async (
    missionId: string,
    step: 'DEPART_FARM' | 'START_TRANSIT' | 'COMPLETE_DELIVERY',
  ): Promise<Mission> => {
    const response = await api.patch(`/missions/${encodeURIComponent(missionId)}/lifecycle`, { step });
    return response.data;
  },
  /** Carrier names the driver who will load (null clears). */
  setLogisticsDriver: async (missionId: string, logisticsDriverId: string | null): Promise<Mission> => {
    const response = await api.patch(`/missions/${encodeURIComponent(missionId)}/assigned-logistics-driver`, {
      logisticsDriverId,
    });
    return withBatchRef(response.data);
  },
  claimMission: async (
    missionId: string,
    body?: { vehicleId?: string; logisticsDriverId?: string },
  ): Promise<Mission> => {
    const response = await api.post(`/missions/${encodeURIComponent(missionId)}/claim`, body ?? {});
    return response.data;
  },
};

export const financialDashboardAPI = {
  getDashboard: async (): Promise<FinancialDashboardApiResponse> => {
    const response = await api.get('/financial-dashboard');
    return response.data;
  },
};
