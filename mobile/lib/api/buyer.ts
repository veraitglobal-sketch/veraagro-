import axios from 'axios';
import api from './client';
import { API_URL } from '../api-url';
import { axiosResponseStatus, isLikelyNetworkError } from '../api-error';
import type { Product, RetailLocation, ProductPassport } from './types';

export const inventoryAPI = {
  getAvailableProducts: async (city?: string, lat?: number, lng?: number): Promise<Product[]> => {
    try {
      const params: Record<string, string> = {};
      if (city) params.city = city;
      if (lat != null && lng != null) {
        params.lat = lat.toString();
        params.lng = lng.toString();
      }
      const response = await api.get('/inventory/available', { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: unknown) {
      if (isLikelyNetworkError(error)) {
        console.warn('Backend not available, returning empty products list');
        return [];
      }
      if (axiosResponseStatus(error) === 404) {
        console.warn('Endpoint not found, returning empty products list');
        return [];
      }
      console.warn('Error fetching products:', error instanceof Error ? error.message : error);
      return [];
    }
  },
};

export const passportAPI = {
  getByBatchId: async (batchId: string): Promise<ProductPassport> => {
    try {
      const id = encodeURIComponent(batchId);
      const response = await axios.get(`${API_URL}/qr/verify/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (axiosResponseStatus(error) === 404) {
        throw new Error('Batch not found. Invalid QR code.');
      }
      throw error;
    }
  },
};

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

export const retailLocationsAPI = {
  getAllPublic: async (country?: string): Promise<RetailLocation[]> => {
    try {
      const params: Record<string, string> = {};
      if (country) params.country = country;
      const response = await api.get('/distributors/public/map', { params });
      return response.data || [];
    } catch (error: unknown) {
      if (isLikelyNetworkError(error)) {
        console.warn('Backend not available, returning empty retail locations list');
        return [];
      }
      if (axiosResponseStatus(error) === 404) {
        console.warn('Endpoint not found, returning empty retail locations list');
        return [];
      }
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
      const list = (response.data || []) as Array<Record<string, unknown>>;
      return list.map((p) => ({
        id: String(p.id),
        name: String(p.name),
        city: String(p.city),
        country: String(p.country),
        address: p.address as string | undefined,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        type: (p.type as string) || 'MATERIAL_SUPPLIER',
        kind: 'supplier' as const,
        supplierUserId: String(p.id),
        description: p.description as string | undefined,
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
  getMyDirectOrders: async () => {
    const response = await api.get('/b2b-suppliers/orders/mine');
    return response.data || [];
  },
  markOrderReceivedAtFarm: async (orderId: string) => {
    const response = await api.post(`/b2b-suppliers/orders/${encodeURIComponent(orderId)}/farmer-received`);
    return response.data;
  },
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
