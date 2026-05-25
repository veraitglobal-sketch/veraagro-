import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './client';
import { API_URL } from '../api-url';
import { apiErrorMessage, axiosResponseStatus, isLikelyNetworkError } from '../api-error';
import type {
  Product,
  Estate,
  Parcel,
  Category,
  AiAssistantResponse,
  RetailLocation,
  FieldEntry,
  GrowthLog,
  Order,
  ProductPassport,
  BatchAvailability,
  QualityEntry,
  LogisticsDriverRow,
  LogisticsVehicleRow,
  PackageBadgeType,
  MissionAssignedDriver,
  MissionVehicleInfo,
  Mission,
  FinancialDashboardApiResponse,
  Notification,
  RequiredCertification,
  DigitalHandover,
  CompliancePhoto,
  LabelRollRow,
  ComplianceBatchStatus,
  Material,
  TreatmentLog,
  PlotBlueprintZone,
  PlotBlueprintPartition,
  PlotBlueprint,
  CreateHarvestPlanBody,
} from './types';

// Estates API
export const estatesAPI = {
  // Public endpoint - no auth required
  getAllPublic: async (): Promise<Estate[]> => {
    try {
      const response = await api.get('/estates/public/all');
      return response.data || [];
    } catch (error: unknown) {
      // If it's a network error, return empty array silently (backend not available)
      if (isLikelyNetworkError(error)) {
        console.warn('Backend not available, returning empty estates list');
        return [];
      }
      // If it's a 404, endpoint doesn't exist yet
      if (axiosResponseStatus(error) === 404) {
        console.warn('Endpoint not found, returning empty estates list');
        return [];
      }
      // For other errors, log but still return empty array to prevent UI errors
      console.warn('Error fetching estates:', error instanceof Error ? error.message : error);
      return [];
    }
  },
  // Requires auth
  getAll: async (): Promise<Estate[]> => {
    const response = await api.get('/estates');
    return response.data || [];
  },
  getOne: async (id: string): Promise<Estate> => {
    const response = await api.get(`/estates/${id}`);
    return response.data;
  },
  /** Estate GPS boundary (polygon + version) for offline / map cache sync */
  getBoundary: async (id: string): Promise<{
    id: string;
    name: string;
    updatedAt: string;
    polygonCoordinates: unknown;
  }> => {
    const response = await api.get(`/estates/${id}/boundary`);
    return response.data;
  },
  create: async (data: { name: string; polygonCoordinates: any }): Promise<Estate> => {
    const response = await api.post('/estates', data);
    return response.data;
  },
  update: async (id: string, data: { name?: string; polygonCoordinates?: any }): Promise<Estate> => {
    const response = await api.put(`/estates/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/estates/${id}`);
  },
};

// Parcels API
export const parcelsAPI = {
  create: async (
    estateId: string,
    data: { polygonCoordinates: any; cropType?: string }
  ): Promise<Parcel> => {
    const response = await api.post(`/parcels/estate/${estateId}`, data);
    return response.data;
  },
  getByEstate: async (estateId: string): Promise<Parcel[]> => {
    const response = await api.get(`/parcels/estate/${estateId}`);
    return response.data || [];
  },
};

export const harvestAnnouncementsAPI = {
  create: async (data: CreateHarvestPlanBody) => {
    const response = await api.post('/harvest-announcements', data);
    return response.data;
  },
  getMy: async () => {
    const response = await api.get('/harvest-announcements/my-announcements', { timeout: 25000 });
    const raw = response.data as unknown;
    if (Array.isArray(raw)) return raw;
    if (raw !== null && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
      return (raw as { data: unknown[] }).data;
    }
    return [];
  },
};

// Market Prices API (Public)
export const marketPricesAPI = {
  getAllActive: async () => {
    const response = await api.get('/market-prices');
    return response.data || [];
  },
  getCurrent: async (cropType: string) => {
    const response = await api.get(`/market-prices/current/${cropType}`);
    return response.data;
  },
};

// Retail Locations API (Public - where products can be purchased)
export const retailLocationsAPI = {
  // Public endpoint - no auth required
  getAllPublic: async (country?: string): Promise<RetailLocation[]> => {
    try {
      const params: any = {};
      if (country) params.country = country;
      const response = await api.get('/distributors/public/map', { params });
      return response.data || [];
    } catch (error: unknown) {
      // If it's a network error, return empty array silently (backend not available)
      if (isLikelyNetworkError(error)) {
        console.warn('Backend not available, returning empty retail locations list');
        return [];
      }
      // If it's a 404, endpoint doesn't exist yet
      if (axiosResponseStatus(error) === 404) {
        console.warn('Endpoint not found, returning empty retail locations list');
        return [];
      }
      // For other errors, log but still return empty array to prevent UI errors
      console.warn('Error fetching retail locations:', error instanceof Error ? error.message : error);
      return [];
    }
  },
};

/** B2B material suppliers (seeds, inputs) – public map + grower contact / orders */
export const b2bSuppliersAPI = {
  getPublicMap: async (): Promise<RetailLocation[]> => {
    try {
      const response = await api.get('/b2b-suppliers/public/map');
      const list = (response.data || []) as any[];
      return list.map((p) => ({
        id: p.id,
        name: p.name,
        city: p.city,
        country: p.country,
        address: p.address,
        latitude: p.latitude,
        longitude: p.longitude,
        type: p.type || 'MATERIAL_SUPPLIER',
        kind: 'supplier' as const,
        supplierUserId: p.id,
        description: p.description,
      }));
    } catch {
      return [];
    }
  },
  getPublic: async (userId: string) => {
    const response = await api.get(`/b2b-suppliers/public/${encodeURIComponent(userId)}`);
    return response.data;
  },
  getOrCreateThread: async (supplierUserId: string) => {
    const response = await api.post('/b2b-suppliers/threads', { supplierUserId });
    return response.data as { id: string };
  },
  getMessages: async (threadId: string) => {
    const response = await api.get(`/b2b-suppliers/threads/${encodeURIComponent(threadId)}/messages`);
    return response.data;
  },
  postMessage: async (threadId: string, body: string) => {
    const response = await api.post(`/b2b-suppliers/threads/${encodeURIComponent(threadId)}/messages`, { body });
    return response.data;
  },
  createOrder: async (payload: {
    supplierUserId: string;
    items: { label: string; quantity: number; unit?: string }[];
    note?: string;
    threadId?: string;
  }) => {
    const response = await api.post('/b2b-suppliers/orders', payload);
    return response.data;
  },
  /** Logged-in grower: B2B orders to material suppliers. */
  getMyDirectOrders: async () => {
    const response = await api.get('/b2b-suppliers/orders/mine');
    return response.data || [];
  },
  markOrderReceivedAtFarm: async (orderId: string) => {
    const response = await api.post(`/b2b-suppliers/orders/${encodeURIComponent(orderId)}/farmer-received`);
    return response.data;
  },
  /** Logged-in grower: message threads with material suppliers. */
  getMyThreadsAsFarmer: async () => {
    const response = await api.get('/b2b-suppliers/threads/mine');
    return response.data || [];
  },
  getMyProfile: async () => {
    const response = await api.get('/b2b-suppliers/my/profile');
    return response.data;
  },
  patchMyStore: async (data: Record<string, unknown>) => {
    const response = await api.patch('/b2b-suppliers/my/profile', data);
    return response.data;
  },
  getIncomingOrders: async () => {
    const response = await api.get('/b2b-suppliers/orders/incoming');
    return response.data || [];
  },
  getMyThreads: async () => {
    const response = await api.get('/b2b-suppliers/threads/mine-as-supplier');
    return response.data || [];
  },
  getThreadMessages: async (threadId: string) => {
    const response = await api.get(`/b2b-suppliers/threads/${encodeURIComponent(threadId)}/messages`);
    return response.data || [];
  },
  patchOrderStatus: async (orderId: string, data: { status: string; noteFromSupplier?: string }) => {
    const response = await api.patch(`/b2b-suppliers/orders/${encodeURIComponent(orderId)}/status`, data);
    return response.data;
  },
  getMyCatalog: async () => {
    const response = await api.get('/b2b-suppliers/my/catalog');
    return (response.data || []) as Array<{
      id: string;
      name: string;
      description: string | null;
      unit: string;
      listPrice: number | null;
      sku: string | null;
      imageUrl: string | null;
      isActive?: boolean;
    }>;
  },
  createCatalogItem: async (data: {
    name: string;
    description?: string;
    unit?: string;
    listPrice?: number;
    sku?: string;
  }) => {
    const response = await api.post('/b2b-suppliers/my/catalog', data);
    return response.data as { id: string };
  },
  updateCatalogItem: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      unit?: string;
      listPrice?: number | null;
      sku?: string;
    },
  ) => {
    const response = await api.patch(`/b2b-suppliers/my/catalog/${encodeURIComponent(id)}`, data);
    return response.data;
  },
  deleteCatalogItem: async (id: string) => {
    const response = await api.delete(`/b2b-suppliers/my/catalog/${encodeURIComponent(id)}`);
    return response.data;
  },
  uploadCatalogItemImage: async (itemId: string, photoUri: string) => {
    const formData = new FormData();
    formData.append('image', {
      uri: photoUri,
      type: 'image/jpeg',
      name: 'product.jpg',
    } as unknown as Blob);
    const response = await api.post(
      `/b2b-suppliers/my/catalog/${encodeURIComponent(itemId)}/image`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },
  deleteCatalogItemImage: async (itemId: string) => {
    const response = await api.delete(
      `/b2b-suppliers/my/catalog/${encodeURIComponent(itemId)}/image`,
    );
    return response.data;
  },
};
