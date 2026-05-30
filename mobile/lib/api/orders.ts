import api from './client';
import type { Order, Mission, FinancialDashboardApiResponse } from './types';

export const ordersAPI = {
  create: async (data: {
    estateId?: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    deliveryAddress: unknown;
    deliveryNotes?: string;
  }): Promise<Order> => {
    const response = await api.post('/orders', data);
    return response.data;
  },
  getAll: async (): Promise<Order[]> => {
    const response = await api.get('/orders');
    return response.data || [];
  },
  getOne: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
};

/** Align with Prisma `MissionStatus` (backend). Not `DELIVERED` — use `COMPLETED`. */
export const missionsAPI = {
  getAll: async (options?: { scope?: 'grower' | 'logistics' }): Promise<Mission[]> => {
    const response = await api.get('/missions/my-missions', {
      ...(options?.scope ? { params: { scope: options.scope } } : {}),
    });
    return response.data || [];
  },
  getOne: async (id: string): Promise<Mission> => {
    const response = await api.get(`/missions/${id}`);
    return response.data;
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
