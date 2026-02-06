import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// For iOS simulator, use localhost. For physical devices, use the network IP
const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // iOS simulator can use localhost
  if (Platform.OS === 'ios' && __DEV__) {
    return 'http://localhost:3000';
  }
  // Default to network IP for physical devices
  return 'http://192.168.178.27:3000';
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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

// Error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      AsyncStorage.removeItem('auth_token');
      AsyncStorage.removeItem('auth_user');
    }
    return Promise.reject(error);
  }
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
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

// Auth API
export const authAPI = {
  login: async (partnerCode: string, password: string) => {
    const response = await api.post('/auth/login', { partnerCode, password });
    return response.data;
  },
  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
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
    } catch (error: any) {
      // If it's a network error, return empty array silently (backend not available)
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        console.warn('Backend not available, returning empty products list');
        return [];
      }
      // If it's a 404, endpoint doesn't exist yet
      if (error.response?.status === 404) {
        console.warn('Endpoint not found, returning empty products list');
        return [];
      }
      // For other errors, log but still return empty array to prevent UI errors
      console.warn('Error fetching products:', error.message || error);
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
    } catch (error: any) {
      // If it's a network error, return empty array silently (backend not available)
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        console.warn('Backend not available, returning empty estates list');
        return [];
      }
      // If it's a 404, endpoint doesn't exist yet
      if (error.response?.status === 404) {
        console.warn('Endpoint not found, returning empty estates list');
        return [];
      }
      // For other errors, log but still return empty array to prevent UI errors
      console.warn('Error fetching estates:', error.message || error);
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
  status: string;
}

export const retailLocationsAPI = {
  // Public endpoint - no auth required
  getAllPublic: async (country?: string): Promise<RetailLocation[]> => {
    try {
      const params: any = {};
      if (country) params.country = country;
      const response = await api.get('/distributors/public/map', { params });
      return response.data || [];
    } catch (error: any) {
      // If it's a network error, return empty array silently (backend not available)
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        console.warn('Backend not available, returning empty retail locations list');
        return [];
      }
      // If it's a 404, endpoint doesn't exist yet
      if (error.response?.status === 404) {
        console.warn('Endpoint not found, returning empty retail locations list');
        return [];
      }
      // For other errors, log but still return empty array to prevent UI errors
      console.warn('Error fetching retail locations:', error.message || error);
      return [];
    }
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
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        console.warn('Backend not available, returning empty field entries list');
        return [];
      }
      console.warn('Error fetching field entries:', error.message || error);
      return [];
    }
  },
};

// Growth Logs API
export interface GrowthLog {
  id: string;
  estateId: string;
  parcelId?: string;
  imageUrl: string;
  gpsLatitude: number;
  gpsLongitude: number;
  notes?: string;
  growthStage?: string;
  createdAt: string;
  parcel?: {
    id: string;
    cropType: string;
  };
}

export const growthLogsAPI = {
  getAllByEstate: async (estateId: string): Promise<GrowthLog[]> => {
    try {
      const response = await api.get(`/growth-logs/estate/${estateId}`);
      return response.data || [];
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        console.warn('Backend not available, returning empty growth logs list');
        return [];
      }
      console.warn('Error fetching growth logs:', error.message || error);
      return [];
    }
  },
  getAllByParcel: async (parcelId: string): Promise<GrowthLog[]> => {
    try {
      const response = await api.get(`/growth-logs/parcel/${parcelId}`);
      return response.data || [];
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        console.warn('Backend not available, returning empty growth logs list');
        return [];
      }
      console.warn('Error fetching growth logs:', error.message || error);
      return [];
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
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  deliveryAddress: any;
  deliveryNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export const ordersAPI = {
  create: async (data: {
    estateId: string;
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

// Digital Passport API (Public - no auth required for QR scanning)
export interface ProductPassport {
  batch: {
    batchId: string;
    productName: string;
    quantity: number;
    unit: string;
    harvestDate: string;
  };
  origin: {
    estate: {
      name: string;
      location: any;
    };
    parcel: {
      cropType: string;
      coordinates: any;
    } | null;
    farmer: {
      name: string;
      trustScore: number;
    };
  };
  timeline: Array<{
    stage: string;
    date: string | Date;
    location: string;
    farmer: string | null;
  }>;
  map: {
    center: { latitude: number; longitude: number } | null;
    polygon: any;
  };
  trustScore: number;
}

export const passportAPI = {
  getByBatchId: async (batchId: string): Promise<ProductPassport> => {
    try {
      // Public endpoint - no auth token needed
      const response = await axios.get(`${API_URL}/digital-passports/batch/${batchId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
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
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Batch not found.');
      }
      throw error;
    }
  },
  getAll: async (estateId?: string): Promise<any[]> => {
    const params = estateId ? { estateId } : {};
    const response = await api.get('/batches', { params });
    return response.data || [];
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
};

// Quality Entry API
export interface QualityEntry {
  id: string;
  batchId: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  qualityScore?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  batch?: any;
}

export const qualityEntryAPI = {
  create: async (data: {
    batchId: string;
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
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
  canCreateShipment: async (batchId: string): Promise<boolean> => {
    const response = await api.get(`/quality-entry/can-create-shipment/${batchId}`);
    return response.data.canCreate || false;
  },
};

// Missions API
export interface Mission {
  id: string;
  batchId: string;
  status: 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  fromHubId?: string;
  toHubId: string;
  driverId?: string;
  createdAt: string;
  updatedAt: string;
  batch?: any;
  driver?: any;
}

export const missionsAPI = {
  getAll: async (): Promise<Mission[]> => {
    const response = await api.get('/missions/my-missions');
    return response.data || [];
  },
  getOne: async (id: string): Promise<Mission> => {
    const response = await api.get(`/missions/${id}`);
    return response.data;
  },
  create: async (data: {
    batchId: string;
    toHubId: string;
    fromHubId?: string;
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
};

// Notifications API
export interface Notification {
  id: string;
  type: 'ACTION_REQUIRED' | 'REMINDER' | 'ALERT' | 'SYSTEM';
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

export const notificationsAPI = {
  getAll: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications');
    return response.data || [];
  },
  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
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

// Compliance Photos API
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

// Materials Whitelist API
export interface Material {
  id: string;
  barcode: string;
  name: string;
  type: 'FERTILIZER' | 'PESTICIDE' | 'SEED' | 'OTHER';
  manufacturer?: string;
  certification?: string;
}

export const materialsAPI = {
  getWhitelist: async (): Promise<Material[]> => {
    try {
      const response = await api.get('/compliance/white-list');
      return response.data || [];
    } catch (error: any) {
      // If backend not available, return empty array
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        console.warn('Backend not available, returning empty whitelist');
        return [];
      }
      throw error;
    }
  },
};

// Seeds API
export const seedsAPI = {
  validate: async (serialNumber: string) => {
    try {
      const response = await api.get(`/seeds/validate/${encodeURIComponent(serialNumber)}`);
      return response.data;
    } catch (error: any) {
      // Handle network errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }
      // Handle API errors
      if (error.response?.status === 404) {
        throw new Error('Seed not found. Please check the serial number.');
      }
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Seed is already used or expired');
      }
      if (error.response?.status === 403) {
        throw new Error(error.response.data?.message || 'This seed is not assigned to you');
      }
      if (error.response?.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      // Generic error
      throw new Error(error.response?.data?.message || error.message || 'Validation failed');
    }
  },
  getAvailable: async () => {
    const response = await api.get('/seeds/available');
    return response.data || [];
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

export default api;
