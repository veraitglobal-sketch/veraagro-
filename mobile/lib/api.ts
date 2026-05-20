import axios, { type AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api-url';
import { notifyAuthUnauthorized } from './auth-events';
import { apiErrorMessage, axiosResponseStatus, isLikelyNetworkError } from './api-error';

/** 401 on these routes is credential/registration UX, not an expired JWT. */
export function isAuthNegotiationUrl(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.split('?')[0].replace(/\\/g, '/');
  const lower = path.toLowerCase();
  return (
    lower.endsWith('/auth/login') ||
    lower.endsWith('auth/login') ||
    lower.includes('/auth/register') ||
    lower.includes('/auth/verify-email')
  );
}

export { getApiUrl, API_URL, PRODUCTION_API_URL } from './api-url';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 25000,
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting token:', error);
  }
  return config;
});

// 401 handling — align with web: clear auth + navigate home (parity with JWT expiry).
// Exclude /auth/login, /auth/register*, /auth/verify-email so wrong password does not wipe session.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const reqUrl = error.config?.url;
    if (status === 401 && !isAuthNegotiationUrl(reqUrl)) {
      notifyAuthUnauthorized();
    }
    return Promise.reject(error);
  },
);

// Types
export interface Product {
  id: string;
  batchId: string;
  productName: string;
  quantity: number;
  unit: string;
  harvestDate: string;
  estate: {
    id: string;
    name: string;
    location?: string;
    owner?: {
      firstName: string;
      lastName: string;
    };
  };
  parcel?: {
    id: string;
    cropType: string;
  };
  price?: number;
  rating?: number;
  daysInConversion?: number;
  hasDigitalPassport?: boolean;
}

export interface Estate {
  id: string;
  name: string;
  location?: string;
  status: string;
  certificationStartDate?: string;
  daysRemaining?: number;
  calculatedArea: number;
  parcels?: Parcel[];
  polygonCoordinates?: Array<{ lat: number; lng: number }>;
  owner?: {
    firstName: string;
    lastName: string;
    partnerCode: string;
  };
}

export interface Parcel {
  id: string;
  cropType: string;
  calculatedArea: number;
  plantingDate?: string;
  status: string;
  /** Set when an administrator has approved the parcel; required for batches and entry log sync */
  approvedAt?: string | null;
  polygonCoordinates?: unknown;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

// Auth API
export const authAPI = {
  login: async (partnerCode: string, password: string) => {
    const response = await api.post('/auth/login', { username: partnerCode, password });
    return response.data;
  },
  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
  },
  registerGrower: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    totalHectares?: number;
  }) => {
    const response = await api.post('/auth/register/grower', data);
    return response.data;
  },
  verifyEmail: async (token: string) => {
    const response = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
    return response.data;
  },
};

// AI Assistant (no auth required)
export interface AiAssistantResponse {
  answer: string;
  suggestedActions?: Array<{ label: string; url: string }>;
  quickActions?: Array<{ label: string; query: string }>;
  askForContact?: boolean;
  sessionId: string;
}

export const aiAssistantApi = {
  query: async (
    query: string,
    options?: { language?: string; sessionId?: string }
  ): Promise<AiAssistantResponse> => {
    const response = await api.post<AiAssistantResponse>('/ai-assistant/query', {
      query,
      language: options?.language ?? 'en',
      sessionId: options?.sessionId,
    });
    return response.data;
  },
};

// Inventory API (Public - no auth required)
export const inventoryAPI = {
  getAvailableProducts: async (city?: string, lat?: number, lng?: number): Promise<Product[]> => {
    try {
      const params: any = {};
      if (city) params.city = city;
      if (lat && lng) {
        params.lat = lat.toString();
        params.lng = lng.toString();
      }
      const response = await api.get('/inventory/available', { params });
      // Return empty array if no data instead of throwing error
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: unknown) {
      // If it's a network error, return empty array silently (backend not available)
      if (isLikelyNetworkError(error)) {
        console.warn('Backend not available, returning empty products list');
        return [];
      }
      // If it's a 404, endpoint doesn't exist yet
      if (axiosResponseStatus(error) === 404) {
        console.warn('Endpoint not found, returning empty products list');
        return [];
      }
      // For other errors, log but still return empty array to prevent UI errors
      console.warn('Error fetching products:', error instanceof Error ? error.message : error);
      return [];
    }
  },
};

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

export interface CreateHarvestPlanBody {
  parcelId: string;
  announcementType: 'HARVEST' | 'PLANTING';
  cropType: string;
  estimatedDate: string;
  estimatedQuantity?: number;
  plannedLoadingStart?: string;
  plannedLoadingEnd?: string;
  loadQuantityKg?: number;
  marketChannel?: string;
  qualityGrade?: string;
  sortingSpec?: string;
  notes?: string;
}

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
export interface RetailLocation {
  id: string;
  name: string;
  city: string;
  country: string;
  address?: string;
  latitude: number;
  longitude: number;
  type: string;
  status?: string;
  /** Merged map: retail from distributors / hubs */
  kind?: 'retail' | 'supplier';
  /** B2B material supplier (seeds, inputs) — same as `id` for API calls */
  supplierUserId?: string;
  description?: string;
}

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

// Field Entries API
export interface FieldEntry {
  id: string;
  type: string;
  farmId: string;
  data: {
    date: string;
    location?: { lat: number; lng: number };
    notes?: string;
  };
  createdAt: string;
}

export const fieldEntriesAPI = {
  getAll: async (farmId?: string): Promise<FieldEntry[]> => {
    try {
      const params = farmId ? { farmId } : {};
      const response = await api.get('/field-entries', { params });
      return response.data || [];
    } catch (error: unknown) {
      if (isLikelyNetworkError(error)) {
        console.warn('Backend not available, returning empty field entries list');
        return [];
      }
      console.warn('Error fetching field entries:', error instanceof Error ? error.message : error);
      return [];
    }
  },
};

// Growth Logs API
export interface GrowthLog {
  id: string;
  estateId: string;
  parcelId?: string;
  harvestAnnouncementId?: string | null;
  imageUrl: string;
  gpsLatitude: number;
  gpsLongitude: number;
  notes?: string;
  growthStage?: string;
  createdAt: string;
  deviceTimestamp?: string;
  parcel?: {
    id: string;
    cropType: string;
  };
  plan?: {
    id: string;
    cropType: string;
    announcementType: string;
    estimatedDate: string;
    status: string;
  };
}

/** Prisma returns `parcels` relation; mobile UI expects `parcel`. */
function normalizeGrowthLogRow(row: Record<string, unknown>): GrowthLog {
  const parcels = row.parcels as { id: string; cropType: string } | null | undefined;
  const ha = row.harvest_announcements as
    | {
        id: string;
        cropType: string;
        announcementType: string;
        estimatedDate: string;
        status: string;
      }
    | null
    | undefined;
  const { parcels: _p, harvest_announcements: _ha, ...rest } = row;
  return {
    ...(rest as unknown as GrowthLog),
    parcel: parcels ? { id: parcels.id, cropType: parcels.cropType } : undefined,
    plan: ha
      ? {
          id: ha.id,
          cropType: ha.cropType,
          announcementType: ha.announcementType,
          estimatedDate: ha.estimatedDate,
          status: ha.status,
        }
      : undefined,
  };
}

export const growthLogsAPI = {
  getAllByEstate: async (estateId: string): Promise<GrowthLog[]> => {
    try {
      const response = await api.get(`/growth-logs/estate/${estateId}`);
      const raw = response.data;
      if (!Array.isArray(raw)) return [];
      return raw.map((r: Record<string, unknown>) => normalizeGrowthLogRow(r));
    } catch (error: unknown) {
      if (isLikelyNetworkError(error)) {
        console.warn('Backend not available, returning empty growth logs list');
        return [];
      }
      console.warn('Error fetching growth logs:', error instanceof Error ? error.message : error);
      return [];
    }
  },
  getAllByParcel: async (parcelId: string): Promise<GrowthLog[]> => {
    try {
      const response = await api.get(`/growth-logs/parcel/${parcelId}`);
      const raw = response.data;
      if (!Array.isArray(raw)) return [];
      return raw.map((r: Record<string, unknown>) => normalizeGrowthLogRow(r));
    } catch (error: unknown) {
      if (isLikelyNetworkError(error)) {
        console.warn('Backend not available, returning empty growth logs list');
        return [];
      }
      console.warn('Error fetching growth logs:', error instanceof Error ? error.message : error);
      return [];
    }
  },
  create: async (data: {
    estateId: string;
    parcelId: string;
    harvestAnnouncementId: string;
    imageUrl: string;
    imageHash: string;
    gpsLatitude: number;
    gpsLongitude: number;
    deviceId: string;
    deviceTimestamp: string;
    notes?: string;
    growthStage?: string;
    materialBarcode?: string;
    materialKind?: 'SEED' | 'FERTILIZER' | 'PESTICIDE';
    requiresMaterialBarcode?: boolean;
  }): Promise<GrowthLog> => {
    try {
      const response = await api.post('/growth-logs', data);
      return response.data;
    } catch (error: unknown) {
      if (axiosResponseStatus(error) === 404) {
        throw new Error(
          'API ruta /growth-logs nije na serveru. Pokreni deploy najnovijeg backend-a na Railway.',
        );
      }
      throw error;
    }
  },
};

// Orders API
export interface Order {
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  status: string;
  deliveryAddress: any;
  deliveryNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export const ordersAPI = {
  create: async (data: {
    estateId?: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    deliveryAddress: any;
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

/**
 * Same payload as web /passport — GET /qr/verify/:batchId (full traceability).
 */
export interface ProductPassport {
  qrId?: string;
  batch: {
    batchId: string;
    productName: string;
    quantity: number;
    unit: string;
    harvestDate: string;
    status?: string;
    isCompromised?: boolean;
  };
  origin: {
    farmName: string;
    regionLabel?: string;
    productionCountry?: string | null;
    harvestLocation?: string;
    harvestRegion?: string;
    harvestPeriod?: string | null;
    estateCalculatedAreaHa?: number;
    parcelCalculatedAreaHa?: number | null;
    estateMapCenter?: { lat: number; lng: number } | null;
    parcelMapCenter?: { lat: number; lng: number } | null;
  };
  farmer: {
    name: string;
    photo?: string | null;
    farmerProfileUrl?: string | null;
  };
  /** High-level journey timestamps (same as backend timeline object) */
  timeline: {
    harvested: string;
    verified?: string | null;
    loaded?: string | null;
    arrived?: string | null;
  };
  treatments?: Array<{
    appliedAt: string;
    productName: string;
    dosage: string;
    waterVolume?: number | null;
    reason?: string | null;
    deviceTimestamp: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
    gpsAccuracyM?: number | null;
  }>;
  missions?: Array<{
    id?: string;
    missionNumber?: string;
    status?: string;
    pickupAddress?: string;
    estimatedPickupTime?: string | null;
    assignedAt?: string | null;
    acceptedAt?: string | null;
    logisticsPartner?: { name: string } | null;
    vehicle?: {
      vehicleNumber?: string;
      licensePlate?: string;
      type?: string;
      make?: string;
      model?: string;
    };
    locationLogs?: Array<{
      timestamp: string;
      latitude: number;
      longitude: number;
      accuracy: number | null;
      address: string | null;
    }>;
    borderWaits?: Array<{
      borderName: string | null;
      borderArrivalTime: string;
      borderExitTime: string;
      waitTimeMinutes: number;
    }>;
    pickedUpAt?: string | null;
    deliveredAt?: string | null;
  }>;
  coldChainProof?: {
    temperatureData?: Array<{ timestamp: string; temperature: number; location?: string }>;
    minTemp?: number | null;
    maxTemp?: number | null;
    avgTemp?: number | null;
  };
  sustainability?: { totalDistanceKm?: string };
  protocol360?: {
    overallStatus?: string;
    levels?: Array<{ level: number; name: string; status: string; badgeText?: string }>;
  };
}

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

// Batch Availability API (Public)
export interface BatchAvailability {
  batchId: string;
  productName: string;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reservedPercentage: number;
  unit: string;
  isSoldOut: boolean;
}

export const batchesAPI = {
  getAvailability: async (batchId: string): Promise<BatchAvailability> => {
    try {
      // Public endpoint - no auth token needed
      const response = await axios.get(`${API_URL}/batches/${batchId}/availability`);
      return response.data;
    } catch (error: unknown) {
      if (axiosResponseStatus(error) === 404) {
        throw new Error('Batch not found.');
      }
      throw error;
    }
  },
  getAll: async (estateId?: string): Promise<any[]> => {
    try {
      const params = estateId ? { estateId } : {};
      const response = await api.get('/batches', { params });
      return response.data || [];
    } catch (error: unknown) {
      if (isLikelyNetworkError(error)) {
        console.warn('Backend not available, returning empty batches list');
        return [];
      }
      throw error;
    }
  },
  getOne: async (batchId: string): Promise<any> => {
    const response = await api.get(`/batches/${batchId}/traceability`);
    return response.data;
  },
  create: async (data: {
    estateId: string;
    parcelId?: string;
    productName: string;
    quantity: number;
    unit: string;
    harvestDate: string;
  }): Promise<any> => {
    const response = await api.post('/batches', data);
    return response.data;
  },
  /** Log packing wizard completion (GPS) — batchRef is internal id or public batchId */
  recordPackingFlow: async (
    batchRef: string,
    body: {
      latitude: number;
      longitude: number;
      completedAt?: string;
      /** Raw base64 or data-URL; both crate + quality should be sent together */
      cratePhotoBase64?: string;
      qualityPhotoBase64?: string;
    },
  ): Promise<{ success: boolean; batchId: string; id: string; photosSaved?: boolean }> => {
    const response = await api.post(`/batches/${encodeURIComponent(batchRef)}/packing-flow`, body);
    return response.data;
  },
};

// Quality Entry API
export interface QualityEntry {
  id: string;
  batchId: string;
  /** Aligned with Prisma `QualityEntryStatus` (backend) */
  status: 'DRAFT' | 'COMPLETED' | 'VERIFIED' | 'REJECTED';
  qualityScore?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  batch?: any;
}

export const qualityEntryAPI = {
  create: async (data: {
    batchId: string;
    parcelId?: string;
    qualityScore?: number;
    notes?: string;
  }): Promise<QualityEntry> => {
    const response = await api.post('/quality-entry', data);
    return response.data;
  },
  getByBatch: async (batchId: string): Promise<QualityEntry | null> => {
    try {
      const response = await api.get(`/quality-entry/batch/${batchId}`);
      return response.data;
    } catch (error: unknown) {
      if (axiosResponseStatus(error) === 404) {
        return null;
      }
      throw error;
    }
  },
  canCreateShipment: async (batchId: string): Promise<boolean> => {
    const response = await api.get(`/quality-entry/can-create-shipment/${batchId}`);
    return response.data.canCreate || false;
  },
  /** After loading handover: receiver name + optional signature (data URL) for PDF audit trail */
  submitHandoverReceiverProof: async (data: {
    missionId: string;
    receiverName: string;
    receiverSignatureDataUrl?: string;
  }): Promise<{ success: true; receiverProofPdfHash: string; message: string }> => {
    const response = await api.post('/quality-entry/handover/receiver-proof', data);
    return response.data;
  },
  /**
   * PDF only exists after submitHandoverReceiverProof. Returns raw bytes (RN-friendly; wrap in
   * Blob in environments that support it, or write with expo-file-system).
   */
  getHandoverReceiverPdf: async (missionId: string): Promise<ArrayBuffer> => {
    const response = await api.get(
      `/quality-entry/handover/mission/${encodeURIComponent(missionId)}/receiver-pdf`,
      { responseType: 'arraybuffer' },
    );
    return response.data;
  },

  /** Farm loading handover — temperature, pallet & truck photos, badge + driver signature → mission READY_FOR_LOADING */
  submitLoadingHandover: async (data: {
    missionId: string;
    insideTruckTemperature: number;
    palletPhotos: string[];
    truckInteriorPhotos: string[];
    notes?: string;
    pickupDriverId: string;
    pickupBadgePhoto: string;
    pickupDriverSignatureDataUrl: string;
  }): Promise<unknown> => {
    const response = await api.post('/quality-entry/handover', data);
    return response.data;
  },
};

export type LogisticsDriverRow = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
};

export type LogisticsVehicleRow = {
  id: string;
  vehicleNumber: string;
  type: string;
  make?: string | null;
  model?: string | null;
  licensePlate: string;
  hasFrigo: boolean;
  tempRangeMin?: number;
  tempRangeMax?: number;
  status: string;
};

export const logisticsVehiclesAPI = {
  list: async (): Promise<LogisticsVehicleRow[]> => {
    const response = await api.get('/logistics-partner/vehicles');
    return Array.isArray(response.data) ? response.data : [];
  },
  create: async (body: {
    licensePlate: string;
    type: string;
    make?: string;
    model?: string;
    hasFrigo?: boolean;
    tempRangeMin?: number;
    tempRangeMax?: number;
  }): Promise<LogisticsVehicleRow> => {
    const response = await api.post('/logistics-partner/vehicles', body);
    return response.data;
  },
};

export const logisticsDriversAPI = {
  list: async (): Promise<LogisticsDriverRow[]> => {
    const response = await api.get('/logistics-partner/drivers');
    return Array.isArray(response.data) ? response.data : [];
  },
  create: async (body: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  }): Promise<LogisticsDriverRow> => {
    const response = await api.post('/logistics-partner/drivers', body);
    return response.data;
  },
};

export type PackageBadgeType = 'PALLET_MASTER' | 'BOX_CHILD' | 'ROLL_LINE';

export const packageBadgesAPI = {
  register: async (data: {
    parentSerial: string;
    type: PackageBadgeType;
    childSerials: string[];
    ownerUserId?: string;
    batchId?: string;
    farmerQrCode?: string;
    printOrderId?: string;
  }) => {
    const response = await api.post('/package-badges/register', data);
    return response.data;
  },
  previewPrintOrder: async (data: { parentCount: number; childrenPerParent: number; serialPrefix?: string }) => {
    const response = await api.post('/package-badges/print-orders/preview', data);
    return response.data;
  },
  createPrintOrder: async (data: {
    parentCount: number;
    childrenPerParent: number;
    serialPrefix?: string;
    printerSupplierId?: string;
    notesToPrinter?: string;
  }) => {
    const response = await api.post('/package-badges/print-orders', data);
    return response.data;
  },
  listMyPrintOrders: async () => {
    const response = await api.get('/package-badges/print-orders/mine');
    return response.data;
  },
  markPrintOrderSent: async (id: string) => {
    const response = await api.patch(`/package-badges/print-orders/${encodeURIComponent(id)}/sent`, {});
    return response.data;
  },
  returnTreeToSupplier: async (data: { rootSerial: string; supplierUserId: string }) => {
    const response = await api.post('/package-badges/return-to-supplier', data);
    return response.data;
  },
  /** MATERIAL_SUPPLIER: tree returned from grower — assign to new grower */
  supplierTransferToGrower: async (data: { rootSerial: string; newGrowerUserId: string }) => {
    const response = await api.post('/package-badges/supplier/transfer-to-grower', data);
    return response.data;
  },
  scan: async (serial: string) => {
    const response = await api.get(`/package-badges/scan/${encodeURIComponent(serial)}`);
    return response.data;
  },
  /** Unauthenticated: QR on package resolves to farmer / batch links */
  publicResolve: async (serial: string) => {
    const { data } = await axios.get(`${API_URL}/public/badges/${encodeURIComponent(serial)}`);
    return data;
  },
};

// Missions API
/** Align with Prisma `MissionStatus` (backend). Not `DELIVERED` — use `COMPLETED`. */
export type MissionAssignedDriver = {
  id?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
  photoUrl?: string | null;
};

export type MissionVehicleInfo = {
  id?: string;
  vehicleNumber?: string;
  licensePlate?: string;
  make?: string | null;
  model?: string | null;
  type?: string;
};

export interface Mission {
  id: string;
  /** Human-readable, e.g. MISSION-2026-0001-AB12 */
  missionNumber?: string;
  batchId?: string | null;
  status: string;
  fromHubId?: string;
  toHubId?: string;
  driverId?: string;
  logisticsPartnerId?: string | null;
  assignedLogisticsDriverId?: string | null;
  vehicleId?: string | null;
  logisticsPartnerLabel?: string | null;
  hasAssignedPickupDriver?: boolean;
  createdAt: string;
  updatedAt: string;
  batch?: unknown;
  /** Mapped for grower API responses */
  assignedDriver?: MissionAssignedDriver | null;
  vehicleInfo?: MissionVehicleInfo | null;
  logisticsCompanyContact?: { firstName?: string; lastName?: string; phone?: string | null } | null;
  assigned_logistics_driver?: MissionAssignedDriver | null;
  vehicles?: MissionVehicleInfo | null;
  driver?: MissionAssignedDriver | null;
}

export const missionsAPI = {
  /**
   * When `scope` is set, the backend returns that hat (grower list vs logistics pool + assigned).
   * Omit to let the server infer from your JWT.
   */
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
  /** Matches backend CreateMissionDto — pickup + destination for routing / load planning. */
  create: async (data: {
    batchId: string;
    pickupLocation: { lat: number; lng: number; address?: string };
    pickupAddress: string;
    destinationAddress?: string;
    destinationCity?: string;
    loadInstructions?: string;
    /** Links mission to grower harvest plan when ops requires CONFIRMED plan or to disambiguate parcels */
    harvestAnnouncementId?: string;
  }): Promise<Mission> => {
    const response = await api.post('/missions', data);
    return response.data;
  },
  getTracker: async (): Promise<any> => {
    const response = await api.get('/grower-portal/mission-tracker');
    return response.data;
  },
  getJourneyMap: async (missionId: string): Promise<any> => {
    const response = await api.get(`/grower-portal/journey-map/${missionId}`);
    return response.data;
  },
  getConsumerFeedback: async (batchId: string): Promise<any> => {
    const response = await api.get(`/grower-portal/consumer-feedback/${batchId}`);
    return response.data;
  },
  getFinancialStatus: async (batchId: string): Promise<any> => {
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
  /** PENDING pool only — assigns partner + frigo vehicle, status → ASSIGNED */
  claimMission: async (
    missionId: string,
    body?: { vehicleId?: string; logisticsDriverId?: string },
  ): Promise<Mission> => {
    const response = await api.post(`/missions/${encodeURIComponent(missionId)}/claim`, body ?? {});
    return response.data;
  },
};

/** Same contract as web `GET /financial-dashboard` (grower vs platform by JWT roles). */
export interface FinancialDashboardApiResponse {
  dashboardRole?: 'PLATFORM' | 'GROWER';
  summary?: {
    farmerOrderShareTotal?: number;
    farmerShareReleased?: number;
    farmerShareInEscrow?: number;
    farmerSharePending?: number;
    estimatedVeraBonusDeliveredLots?: number;
    veraBonusPaid?: number;
    totalProfit?: number;
    seedMargin?: number;
    [key: string]: unknown;
  };
  monthly?: { totalBatches?: number; totalQuantity?: number; period?: string };
  yearly?: { totalBatches?: number; totalQuantity?: number; period?: string };
}

export const financialDashboardAPI = {
  getDashboard: async (): Promise<FinancialDashboardApiResponse> => {
    const response = await api.get('/financial-dashboard');
    return response.data;
  },
};

// Notifications API
export interface Notification {
  id: string;
  type: 'ACTION_REQUIRED' | 'REMINDER' | 'ALERT' | 'SYSTEM';
  title: string;
  message: string;
  actionUrl?: string;
  /** Set by client from API `read` or Prisma `status === 'READ'`. */
  read: boolean;
  createdAt: string;
  /** Present when API returns Prisma row as-is. */
  status?: 'UNREAD' | 'READ';
}

function normalizeNotificationRow(n: Record<string, unknown>): Notification {
  const status = n.status as string | undefined;
  return {
    ...(n as unknown as Notification),
    read: n.read === true || status === 'READ',
  };
}

export const notificationsAPI = {
  getAll: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications');
    const raw = response.data;
    if (!Array.isArray(raw)) return [];
    return raw.map((n: Record<string, unknown>) => normalizeNotificationRow(n));
  },
  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },
  sendTestPush: async (): Promise<{ ok: boolean; pushEnabled: boolean; devices: number }> => {
    const response = await api.post('/notifications/push/test', {});
    return response.data;
  },
};

/** Grower checklist items (compliance / certification photos in app). */
export interface RequiredCertification {
  id: string;
  title: string;
  description?: string;
}

export const growerPortalAPI = {
  getRequiredCertifications: async (): Promise<RequiredCertification[]> => {
    const response = await api.get('/grower-portal/required-certifications');
    const data = response.data;
    if (!Array.isArray(data)) return [];
    return data.map((c: { id: string; title: string; description?: string }) => ({
      id: String(c.id),
      title: String(c.title),
      description: c.description,
    }));
  },
};

// Digital Handover API
export interface DigitalHandover {
  id: string;
  deliveryId: string;
  driverId: string;
  storeQrCode: string;
  status: 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED';
  qualityStatus?: 'FRESH' | 'DAMAGED';
  temperature?: number;
  photoUrls: string[];
  signature?: string;
  notes?: string;
  completedBy?: string;
  completedAt?: string;
  initiatedAt: string;
}

// Compliance Photos API (legacy estate uploads — prefer materialControlAPI + batch)
export interface CompliancePhoto {
  id: string;
  estateId: string;
  parcelId?: string;
  photoUrl: string;
  gpsLocation: { lat: number; lng: number };
  type: string;
  notes?: string;
  createdAt: string;
  estate?: Estate;
  parcel?: Parcel;
}

/** Label roll row from /material-control/my-label-rolls */
export interface LabelRollRow {
  serialNumber: string;
  status: string;
  soldAt: string | null;
  productName: string;
}

/** GET /material-control/compliance-status/:batchId */
export interface ComplianceBatchStatus {
  publicBatchId: string;
  complete: boolean;
  requiredPhotoTypes: string[];
  uploadedPhotoTypes: string[];
  missingPhotoTypes: string[];
  stickerRollId: string | null;
  stickerStatus: string | null;
  lastComplianceAt: string | null;
}

export const materialControlAPI = {
  getMyLabelRolls: async (): Promise<LabelRollRow[]> => {
    const response = await api.get('/material-control/my-label-rolls');
    return Array.isArray(response.data) ? response.data : [];
  },
  getComplianceStatus: async (batchId: string): Promise<ComplianceBatchStatus> => {
    const response = await api.get(`/material-control/compliance-status/${encodeURIComponent(batchId)}`);
    return response.data;
  },
  verifySticker: async (body: { batchId: string; stickerRollId: string; parcelId?: string | null }) => {
    const response = await api.post('/material-control/verify-sticker', body);
    return response.data;
  },
  /**
   * Same contract as web: `photos` = three data URLs in order PUNNETS, LABELING, PALLETIZATION.
   */
  uploadCompliancePhotos: async (body: {
    batchId: string;
    stickerRollId: string;
    photos: string[];
    parcelId?: string | null;
  }) => {
    const response = await api.post('/material-control/compliance-photos', body, { timeout: 120000 });
    return response.data;
  },
};

// Materials Whitelist API
export interface Material {
  id: string;
  barcode: string;
  name?: string;
  productName?: string;
  type?: 'FERTILIZER' | 'PESTICIDE' | 'SEED' | 'OTHER';
  manufacturer?: string;
  certification?: string;
  phiDays?: number; // Pre-Harvest Interval (days)
  mrlLimit?: number;
}

// KYC API (Pillar 1)
export const kycAPI = {
  uploadDocument: async (docType: string, fileUrl: string) => {
    const response = await api.post('/kyc/documents', { docType, fileUrl });
    return response.data;
  },
  getMyDocuments: async () => {
    const response = await api.get('/kyc/documents');
    return response.data;
  },
  getStatus: async () => {
    const response = await api.get('/kyc/status');
    return response.data;
  },
};

// Treatment Logs API (Pillar 2 - Phyto-Log)
export interface TreatmentLog {
  id: string;
  parcelId: string;
  productId: string;
  productName: string;
  dosage: string;
  appliedAt: string;
  gpsLatitude: number;
  gpsLongitude: number;
  needsAudit?: boolean;
}

export const treatmentLogsAPI = {
  create: async (data: {
    parcelId: string;
    productId: string;
    productName: string;
    dosage: string;
    waterVolume?: number;
    reason?: string;
    appliedAt: string;
    gpsLatitude: number;
    gpsLongitude: number;
    gpsAccuracy?: number;
    deviceId?: string;
    deviceTimestamp: string;
  }) => {
    const response = await api.post('/treatment-logs', data);
    return response.data;
  },
  getByParcel: async (parcelId: string) => {
    const response = await api.get(`/treatment-logs/parcel/${parcelId}`);
    return response.data;
  },
  getAll: async (parcelId?: string) => {
    const params = parcelId ? { parcelId } : {};
    const response = await api.get('/treatment-logs', { params });
    return response.data;
  },
  getHarvestAllowed: async (parcelId: string) => {
    const response = await api.get(`/treatment-logs/harvest-allowed/${parcelId}`);
    return response.data;
  },
};

export const materialsAPI = {
  getWhitelist: async (): Promise<Material[]> => {
    try {
      const response = await api.get('/compliance/white-list');
      const raw = response.data;
      if (!Array.isArray(raw)) return [];
      return raw.map((row: Record<string, unknown>) => ({
        id: String(row.id ?? row.barcode),
        barcode: String(row.barcode ?? ''),
        name: (row.name as string) || (row.productName as string) || undefined,
        productName: (row.productName as string) || undefined,
        type:
          ((row.materialType || row.type) as Material['type']) || 'OTHER',
        manufacturer: (row.manufacturer as string) || undefined,
        certification: (row.certification as string) || undefined,
        phiDays: row.phiDays != null ? Number(row.phiDays) : undefined,
        mrlLimit: row.mrlLimit != null ? Number(row.mrlLimit) : undefined,
      }));
    } catch (error: unknown) {
      // If backend not available, return empty array
      if (isLikelyNetworkError(error)) {
        console.warn('Backend not available, returning empty whitelist');
        return [];
      }
      throw error;
    }
  },
  /**
   * Register a product on the compliance whitelist: display name, barcode, category (seed / spray / fert / other).
   */
  submitGrower: async (body: {
    barcode: string;
    productName: string;
    manufacturer?: string;
    materialType: 'FERTILIZER' | 'PESTICIDE' | 'SEED' | 'OTHER';
    description?: string;
  }) => {
    const response = await api.post('/compliance/white-list/grower', body);
    return response.data;
  },
};

/** Link platform seed batch to parcel (area + GPS smart-lock). */
export const smartLockAPI = {
  linkSeedToParcel: async (data: {
    inputSerialNumber: string;
    parcelId: string;
    gpsLatitude: number;
    gpsLongitude: number;
    deviceId?: string;
  }) => {
    const response = await api.post('/smart-lock/scan', data);
    return response.data as {
      alreadyLinked?: boolean;
      message?: string;
      seed?: { serialNumber: string; name?: string; batchNumber?: string };
    };
  },
  getParcelStatus: async (parcelId: string) => {
    const response = await api.get(`/smart-lock/parcel/${encodeURIComponent(parcelId)}/status`);
    return response.data;
  },
};

// Seeds API
export const seedsAPI = {
  validate: async (serialNumber: string) => {
    try {
      const response = await api.get(`/seeds/validate/${encodeURIComponent(serialNumber)}`);
      return response.data;
    } catch (error: unknown) {
      if (isLikelyNetworkError(error)) {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }
      const status = axiosResponseStatus(error);
      if (status === 404) {
        throw new Error('Seed not found. Please check the serial number.');
      }
      if (status === 400) {
        throw new Error(apiErrorMessage(error, 'Seed is already used or expired'));
      }
      if (status === 403) {
        throw new Error(apiErrorMessage(error, 'This seed is not assigned to you'));
      }
      if (status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw new Error(apiErrorMessage(error, 'Validation failed'));
    }
  },
  getAvailable: async () => {
    const response = await api.get('/seeds/available');
    return response.data || [];
  },
};

/**
 * Manual seed registration (Step 2 Grower Journey)
 * POST /seed-registrations with photo + GPS + timestamp
 * Backend TBD – when implemented, will persist to DB + Cloud Storage
 */
export const seedRegistrationsAPI = {
  registerManual: async (data: {
    seedName: string;
    photoUri: string;
    gpsLocation: { lat: number; lng: number };
    timestamp: string;
  }) => {
    const formData = new FormData();
    formData.append('seedName', data.seedName);
    formData.append('gpsLocation', JSON.stringify(data.gpsLocation));
    formData.append('timestamp', data.timestamp);
    formData.append('photo', {
      uri: data.photoUri,
      type: 'image/jpeg',
      name: 'seed-bag.jpg',
    } as any);
    const response = await api.post('/seed-registrations', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export const compliancePhotosAPI = {
  getAll: async (estateId?: string, parcelId?: string): Promise<CompliancePhoto[]> => {
    const params: any = {};
    if (estateId) params.estateId = estateId;
    if (parcelId) params.parcelId = parcelId;
    const response = await api.get('/compliance/photos', { params });
    return response.data || [];
  },
  getOne: async (id: string): Promise<CompliancePhoto> => {
    const response = await api.get(`/compliance/photos/${id}`);
    return response.data;
  },
  upload: async (data: {
    estateId: string;
    parcelId?: string;
    photoUri: string;
    gpsLocation: { lat: number; lng: number };
    type: string;
    notes?: string;
  }): Promise<CompliancePhoto> => {
    const formData = new FormData();
    formData.append('estateId', data.estateId);
    if (data.parcelId) formData.append('parcelId', data.parcelId);
    formData.append('photo', {
      uri: data.photoUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);
    formData.append('gpsLocation', JSON.stringify(data.gpsLocation));
    formData.append('type', data.type);
    if (data.notes) formData.append('notes', data.notes);

    const response = await api.post('/compliance/photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const digitalHandoverAPI = {
  initiate: async (data: {
    deliveryId: string;
    qrCode: string;
  }): Promise<DigitalHandover> => {
    const response = await api.post('/digital-handover/initiate', data);
    return response.data;
  },
  complete: async (data: {
    handoverId: string;
    qualityCheck: {
      visualCheck: 'FRESH' | 'DAMAGED';
      temperature: number;
      photoUrls: string[];
      signature?: string;
      notes?: string;
    };
  }): Promise<DigitalHandover & { pdfPath?: string }> => {
    const response = await api.post('/digital-handover/complete', data);
    return response.data;
  },
  getOne: async (id: string): Promise<DigitalHandover> => {
    const response = await api.get(`/digital-handover/${id}`);
    return response.data;
  },
};

/** Plot mapper: parcel blueprint (zones, partitions). Used by features/grower/plot-mapper. */
export interface PlotBlueprintZone {
  id: string;
  name: string;
  coordinates: { x1: number; y1: number; x2: number; y2: number };
  area: number;
  cropType?: string;
  plantingDate?: string;
  status?: string;
}

export interface PlotBlueprintPartition {
  id: string;
  type: 'HORIZONTAL' | 'VERTICAL';
  position: number;
}

export interface PlotBlueprint {
  parcelId: string;
  length: number;
  width: number;
  blueprintData: {
    zones: PlotBlueprintZone[];
    partitions: PlotBlueprintPartition[];
  };
}

export const plotMapperAPI = {
  getByParcel: async (parcelId: string): Promise<PlotBlueprint | null> => {
    try {
      const response = await api.get(`/parcels/${parcelId}/blueprint`);
      return response.data ?? null;
    } catch {
      return null;
    }
  },
  save: async (data: {
    parcelId: string;
    length: number;
    width: number;
    blueprintData: { zones: PlotBlueprintZone[]; partitions: PlotBlueprintPartition[] };
  }): Promise<PlotBlueprint> => {
    const response = await api.post(`/parcels/${data.parcelId}/blueprint`, data);
    return response.data;
  },
};

export default api;
