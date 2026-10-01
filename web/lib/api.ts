import axios from 'axios';
import { WEB_API_BASE, WEB_DEV_API_FALLBACK } from './api-base';
import { axiosResponseStatus, isLikelyNetworkError } from './api-error';

const API_URL = WEB_API_BASE;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests; on production (non-localhost) ensure baseURL is correct even if env was missing at build
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      config.baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://api.biovera.app';
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

function isAuthNegotiationUrl(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.split('?')[0].replace(/\\/g, '/').toLowerCase();
  return (
    path.endsWith('/auth/login') ||
    path.endsWith('auth/login') ||
    path.includes('/auth/register') ||
    path.includes('/auth/verify-email')
  );
}

// Handle 401: clear stored session + redirect (same policy as mobile), except credential flows above.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isAuthNegotiationUrl(error.config?.url)) {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const returnTo = path + (window.location.search || '');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!path.includes('/login')) {
          if (path.startsWith('/buyer-portal')) {
            const q = returnTo && returnTo !== '/login/buyer' ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
            window.location.href = `/login/buyer${q}`;
          } else {
            window.location.href = '/login/producer';
          }
        }
      }
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  login: async (partnerCode: string, password: string) => {
    // Backend expects 'username' field (can be email or partnerCode)
    const response = await api.post('/auth/login', { username: partnerCode, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  verifyEmail: async (token: string) => {
    const response = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  verifyEmailCode: async (email: string, code: string) => {
    const response = await api.post('/auth/verify-email-code', { email, code });
    return response.data;
  },
  resendVerificationCode: async (email: string) => {
    const response = await api.post('/auth/resend-verification-code', { email });
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (token: string, password: string) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },
  registerBuyer: async (data: {
    email: string;
    partnerCode?: string;
    phone?: string;
    firstName: string;
    lastName: string;
    password: string;
    businessName?: string;
    companyPosition?: string;
    location?: { latitude: number; longitude: number };
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  }) => {
    const response = await api.post('/auth/register/buyer', data);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },
};

// Inventory API
export const inventoryAPI = {
  getAvailableProducts: async (city?: string, lat?: number, lng?: number) => {
    try {
      const params: any = {};
      if (city) params.city = city;
      if (lat) params.lat = lat.toString();
      if (lng) params.lng = lng.toString();
      const response = await api.get('/inventory/available', { params });
      return response.data;
    } catch (error: unknown) {
      if (isLikelyNetworkError(error)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Backend not available at ${API_URL}. Products will not be displayed.`);
        }
        return [];
      }
      const status = axiosResponseStatus(error);
      if (status !== undefined) {
        const data = (error as { response?: { data?: { message?: unknown } } }).response?.data;
        console.warn('API Error:', status, data?.message);
        return [];
      }
      console.warn('Error loading products:', error instanceof Error ? error.message : error);
      return [];
    }
  },
};

/** Same contract as Nest `OrdersService.create` (buyer POST /orders); aligns with mobile `ordersAPI.create`. */
export interface BuyerOrderCreatePayload {
  clientRequestId: string;
  productId: string;
  estateId?: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  deliveryAddress: { street: string; city: string; postalCode: string; country: string };
  deliveryNotes?: string;
  packOptionId?: string;
  packCount?: number;
}

// Orders API
export const ordersAPI = {
  create: async (orderData: BuyerOrderCreatePayload) => {
    try { return (await api.post('/orders', orderData)).data; }
    catch (error) {
      const code = (error as { response?: { data?: { code?: string } } }).response?.data?.code;
      if (orderData.clientRequestId && code === 'ORDER_REQUEST_MISMATCH') {
        return (await api.get(`/orders/checkout/${encodeURIComponent(orderData.clientRequestId)}`)).data;
      }
      throw error;
    }
  },
  getAll: async () => {
    const response = await api.get('/orders');
    return response.data;
  },
  getForGrower: async (queue?: 'prepare') => {
    const response = await api.get('/orders/grower', { params: queue ? { queue } : undefined });
    return response.data;
  },
  recordPacking: async (orderId: string, body: { packedPackCount: number; packedKg?: number }) => {
    const response = await api.patch(`/orders/grower/${orderId}/packing`, body);
    return response.data;
  },
  getAllAdmin: async (filters?: { status?: string; buyerId?: string; estateId?: string }) => {
    const response = await api.get('/orders/admin/all', { params: filters });
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  initiatePayment: async (id: string, paymentMethod: string, transactionId?: string) => {
    const response = await api.post(`/orders/${id}/pay`, { paymentMethod, transactionId });
    return response.data;
  },
  updateStatusAdmin: async (id: string, status: string) => {
    const response = await api.patch(`/orders/admin/${id}/status`, { status });
    return response.data;
  },
  updateFulfillmentAdmin: async (id: string, fulfillingEstateId: string | null) => {
    const response = await api.patch(`/orders/admin/${id}/fulfillment`, { fulfillingEstateId });
    return response.data;
  },
  approveOrderAdmin: async (id: string) => {
    const response = await api.post(`/orders/admin/${id}/approve`);
    return response.data;
  },
  rejectOrderAdmin: async (id: string, reason: string) => {
    const response = await api.post(`/orders/admin/${id}/reject`, { reason });
    return response.data;
  },
  confirmBankPaymentAdmin: async (id: string, transactionId?: string) => {
    const response = await api.post(`/orders/admin/${id}/confirm-bank-payment`, {
      transactionId: transactionId || undefined,
    });
    return response.data;
  },
};

// Missions API
export const missionsAPI = {
  getAllAdmin: async (filters?: { status?: string; growerId?: string; logisticsPartnerId?: string }) => {
    const response = await api.get('/missions/admin/all', { params: filters });
    return response.data;
  },
  getMyMissions: async (scope?: 'grower' | 'logistics') => {
    const response = await api.get('/missions/my-missions', {
      params: scope ? { scope } : {},
    });
    return response.data;
  },
  claimMission: async (
    missionId: string,
    body?: { vehicleId?: string; logisticsDriverId?: string },
  ) => {
    const response = await api.post(`/missions/${encodeURIComponent(missionId)}/claim`, body || {});
    return response.data;
  },
  setMissionLogisticsDriver: async (missionId: string, logisticsDriverId: string | null) => {
    const response = await api.patch(
      `/missions/${encodeURIComponent(missionId)}/assigned-logistics-driver`,
      { logisticsDriverId },
    );
    return response.data;
  },
  /** Grower journey map: logistics advances status after handover / en route. */
  advanceMissionLifecycle: async (
    missionId: string,
    step: 'DEPART_FARM' | 'START_TRANSIT' | 'COMPLETE_DELIVERY',
  ) => {
    const response = await api.patch(
      `/missions/${encodeURIComponent(missionId)}/lifecycle`,
      { step },
    );
    return response.data;
  },
  create: async (data: {
    batchId?: string;
    pickupLocation: { lat: number; lng: number; address?: string };
    pickupAddress: string;
    destinationAddress?: string;
    destinationCity?: string;
    loadInstructions?: string;
  }) => {
    const response = await api.post('/missions', data);
    return response.data;
  },
  getLogisticsPartnersAdmin: async () => {
    const response = await api.get('/missions/admin/logistics-partners');
    return response.data;
  },
  approveTransportAdmin: async (missionId: string) => {
    const response = await api.patch(
      `/missions/admin/${encodeURIComponent(missionId)}/approve-transport`,
    );
    return response.data;
  },
  rejectTransportAdmin: async (missionId: string, reason?: string) => {
    const response = await api.patch(
      `/missions/admin/${encodeURIComponent(missionId)}/reject-transport`,
      { reason },
    );
    return response.data;
  },
  setMissionDestinationAdmin: async (
    missionId: string,
    body: { destinationCity: string; destinationAddress: string },
  ) => {
    const response = await api.patch(`/missions/admin/${encodeURIComponent(missionId)}/destination`, body);
    return response.data;
  },
  cancelMissionAdmin: async (missionId: string, reason?: string) => {
    const response = await api.patch(`/missions/admin/${encodeURIComponent(missionId)}/cancel`, {
      ...(reason?.trim() ? { reason: reason.trim() } : {}),
    });
    return response.data;
  },
  assignMissionAdmin: async (
    missionId: string,
    body: { logisticsPartnerId: string; vehicleId?: string },
  ) => {
    const response = await api.patch(
      `/missions/admin/${encodeURIComponent(missionId)}/assign`,
      body,
    );
    return response.data;
  },
  /** Operations: buyer order + fulfilling farm → PENDING grower mission (prep + destination for later pickup) */
  createFromOrderAdmin: async (body: {
    orderId: string;
    opsNotes?: string;
    channel?: 'INDUSTRIAL' | 'RETAIL' | 'MIXED';
    targetKg?: number;
  }) => {
    const response = await api.post('/missions/admin/from-order', body);
    return response.data;
  },
};

/** Same-origin BFF: avoids POST hitting the Next app host by mistake; proxies to Nest (see /api/logistics/vehicles). */
export const logisticsVehiclesAPI = {
  list: async () => {
    if (typeof window === 'undefined') {
      const response = await api.get('/logistics-partner/vehicles');
      return response.data;
    }
    const token = localStorage.getItem('token');
    const res = await fetch('/api/logistics/vehicles', {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err: { response?: { data: unknown; status: number } } = {
        response: { data, status: res.status },
      };
      throw err;
    }
    return data;
  },
  create: async (body: {
    licensePlate: string;
    type: string;
    make?: string;
    model?: string;
    hasFrigo?: boolean;
    tempRangeMin?: number;
    tempRangeMax?: number;
    currentLocation?: { lat: number; lng: number };
  }) => {
    if (typeof window === 'undefined') {
      const response = await api.post('/logistics-partner/vehicles', body);
      return response.data;
    }
    const token = localStorage.getItem('token');
    const res = await fetch('/api/logistics/vehicles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err: { response?: { data: unknown; status: number } } = {
        response: { data, status: res.status },
      };
      throw err;
    }
    return data;
  },
};

export const logisticsDriversAPI = {
  list: async () => {
    const response = await api.get('/logistics-partner/drivers');
    return response.data;
  },
  create: async (body: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    photoDataUrl?: string;
  }) => {
    const response = await api.post('/logistics-partner/drivers', body);
    return response.data;
  },
  update: async (
    id: string,
    body: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      isActive: boolean;
      photoDataUrl: string;
    }>,
  ) => {
    const response = await api.patch(`/logistics-partner/drivers/${encodeURIComponent(id)}`, body);
    return response.data;
  },
};

// Deliveries API
export const deliveriesAPI = {
  /** Buyer's per-shipment receiving code (+ QR) the carrier scans at the dock to start the handover. */
  getBuyerReceivingCode: async (deliveryId: string) => {
    const response = await api.get(`/deliveries/buyer/${encodeURIComponent(deliveryId)}/receiving-code`);
    return response.data as { deliveryId: string; code: string; qrDataUrl: string; status: string; orderNumber?: string };
  },
  getBuyerDeliveries: async (status?: string) => {
    const response = await api.get('/deliveries/buyer/my-deliveries', { params: status ? { status } : {} });
    return response.data;
  },
  getByOrder: async (orderId: string) => {
    const response = await api.get(`/deliveries/buyer/order/${orderId}`);
    return response.data;
  },
  getByQR: async (qrCode: string) => {
    const response = await api.get(`/deliveries/qr/${qrCode}`);
    return response.data;
  },
  confirmDelivery: async (qrCode: string) => {
    const response = await api.post(`/deliveries/confirm/${qrCode}`);
    return response.data;
  },
  reportBuyerIssue: async (body: { deliveryId: string; description: string; photosBase64: string[] }) => {
    const response = await api.post('/deliveries/buyer/report-issue', body);
    return response.data;
  },
  confirmBuyerPickup: async (body: { deliveryId: string }) => {
    const response = await api.post('/deliveries/buyer/confirm-pickup', body);
    return response.data;
  },
  /** Download waybill PDF (auth required; buyer, driver, grower, admin). */
  downloadWaybillPdf: async (waybillId: string) => {
    const response = await api.get(`/waybills/document/${waybillId}/pdf`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },
};

/** Store / warehouse ramp handover — buyer completes after driver scans STORE- QR. See `buyer-portal/handover/[id]`. */
export const digitalHandoverAPI = {
  /** Carrier at the buyer's dock: scanned or typed buyer receiving code starts the handover. */
  initiate: async (body: { deliveryId: string; qrCode: string }) => {
    const response = await api.post('/digital-handover/initiate', body);
    return response.data;
  },
  getOne: async (handoverId: string) => {
    const response = await api.get(`/digital-handover/${encodeURIComponent(handoverId)}`);
    return response.data;
  },
  complete: async (body: {
    handoverId: string;
    revision?: number;
    qualityCheck: {
      visualCheck: 'FRESH' | 'DAMAGED';
      temperature: number;
      photoUrls: string[];
      signature?: string;
      notes?: string;
    };
  }) => {
    const response = await api.post('/digital-handover/complete', body);
    return response.data;
  },
};

// Estates API
export const estatesAPI = {
  // Admin endpoints
  getFulfillmentEstates: async () => {
    const response = await api.get('/estates/admin/fulfillment-estates');
    return response.data;
  },
  getPendingEstates: async () => {
    const response = await api.get('/estates/admin/pending');
    return response.data;
  },
  approveEstate: async (estateId: string) => {
    const response = await api.put(`/estates/${estateId}/approve`);
    return response.data;
  },
  rejectEstate: async (estateId: string, reason?: string) => {
    const response = await api.put(`/estates/${estateId}/reject`, { reason });
    return response.data;
  },
  create: async (estateData: { name: string; polygonCoordinates: any }) => {
    const response = await api.post('/estates', estateData);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/estates');
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await api.get(`/estates/${id}`);
    return response.data;
  },
  startCertification: async (id: string) => {
    const response = await api.post(`/estates/${id}/start-certification`);
    return response.data;
  },
};

// Parcels API
export const parcelsAPI = {
  create: async (estateId: string, parcelData: { polygonCoordinates: any; cropType?: string }) => {
    const response = await api.post(`/parcels/estate/${estateId}`, parcelData);
    return response.data;
  },
  getByEstate: async (estateId: string) => {
    const response = await api.get(`/parcels/estate/${estateId}`);
    return response.data;
  },
  getPending: async () => {
    const response = await api.get('/parcels/admin/pending');
    return response.data;
  },
  approve: async (parcelId: string) => {
    const response = await api.put(`/parcels/${parcelId}/approve`);
    return response.data;
  },
  /** Retail / store: PNG QR (data URL) for this parcel — links to /plot/{publicCode} */
  getPlotQr: async (parcelId: string) => {
    const response = await api.get<{ publicCode: string; publicUrl: string; qrCodeDataUrl: string }>(
      `/parcels/${parcelId}/qr`,
    );
    return response.data;
  },
};

// Admin catalogue products (planned supply + packaging)
export const catalogAPI = {
  getSupply: async () => (await api.get('/catalog/admin/supply')).data,
  listAdminProducts: async () => (await api.get('/catalog/admin/products')).data,
  getAdminProduct: async (id: string) => (await api.get(`/catalog/admin/products/${encodeURIComponent(id)}`)).data,
  createProduct: async (body: Record<string, unknown>) => (await api.post('/catalog/admin/products', body)).data,
  updateProduct: async (id: string, body: Record<string, unknown>) =>
    (await api.patch(`/catalog/admin/products/${encodeURIComponent(id)}`, body)).data,
  publishProduct: async (id: string) => (await api.post(`/catalog/admin/products/${encodeURIComponent(id)}/publish`)).data,
  archiveProduct: async (id: string) => (await api.post(`/catalog/admin/products/${encodeURIComponent(id)}/archive`)).data,
  addPackOption: async (productId: string, body: Record<string, unknown>) =>
    (await api.post(`/catalog/admin/products/${encodeURIComponent(productId)}/pack-options`, body)).data,
  updatePackOption: async (id: string, body: Record<string, unknown>) =>
    (await api.patch(`/catalog/admin/pack-options/${encodeURIComponent(id)}`, body)).data,
  adjustStock: async (productId: string, body: Record<string, unknown>) =>
    (await api.post(`/catalog/admin/products/${encodeURIComponent(productId)}/stock`, body)).data,
  getStockHistory: async (productId: string) =>
    (await api.get(`/catalog/admin/products/${encodeURIComponent(productId)}/stock`)).data,
  listPublicProducts: async () => (await api.get('/catalog/products')).data,
  getPublicProduct: async (id: string) => (await api.get(`/catalog/products/${encodeURIComponent(id)}`)).data,
};

// Harvest plans (harvest_announcements — grower notifies admin)
export const harvestAnnouncementsAPI = {
  getAll: async (params?: { status?: string; announcementType?: string; cropType?: string }) => {
    const response = await api.get('/harvest-announcements/admin/all', { params });
    return response.data || [];
  },
  getOne: async (id: string) => {
    const response = await api.get(`/harvest-announcements/admin/${id}`);
    return response.data;
  },
  updateAdmin: async (id: string, data: Record<string, unknown>) => {
    const response = await api.patch(`/harvest-announcements/admin/${id}`, data);
    return response.data;
  },
  setStatus: async (id: string, status: string) => {
    const response = await api.put(`/harvest-announcements/${id}/status`, { status });
    return response.data;
  },
  deletePlanting: async (id: string, reason?: string) => {
    const response = await api.delete(`/harvest-announcements/admin/${encodeURIComponent(id)}/planting`, {
      data: { reason },
    });
    return response.data;
  },
  /** Grower: list planting & harvest plans on parcels belonging to estates you own */
  getMine: async () => {
    const response = await api.get('/harvest-announcements/my-announcements');
    const raw = response.data as unknown;
    if (Array.isArray(raw)) return raw;
    if (raw !== null && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
      return (raw as { data: unknown[] }).data;
    }
    return [];
  },
  /** Grower: register planting or expected harvest (requires admin-approved parcel) */
  create: async (body: {
    parcelId: string;
    announcementType: 'HARVEST' | 'PLANTING';
    cropType: string;
    estimatedDate: string;
    estimatedQuantity?: number;
    notes?: string;
  }) => {
    const response = await api.post('/harvest-announcements', body);
    return response.data;
  },
};

/** Field diary entries (grower mobile + web read) */
export const fieldEntriesAPI = {
  list: async (params?: {
    farmId?: string;
    parcelId?: string;
    type?: string;
    limit?: number;
    skip?: number;
  }) => {
    const response = await api.get('/field-entries', { params });
    return response.data || [];
  },
};

/** Field diary entries persisted on server (admin view by partner code) */
export const fieldEntriesAdminAPI = {
  list: async (params?: { partnerCode?: string; limit?: number; skip?: number }) => {
    const response = await api.get('/field-entries/admin/list', { params });
    return response.data || [];
  },
};

/** Growth journal entries (read-only on web; create from mobile with photo + GPS) */
export const growthLogsAPI = {
  listByEstate: async (estateId: string) => {
    const response = await api.get(`/growth-logs/estate/${encodeURIComponent(estateId)}`);
    return response.data || [];
  },
  listByParcel: async (parcelId: string) => {
    const response = await api.get(`/growth-logs/parcel/${encodeURIComponent(parcelId)}`);
    return response.data || [];
  },
  adminList: async (params?: { moderationStatus?: string; limit?: number; partnerCode?: string }) => {
    const response = await api.get('/growth-logs/admin/list', { params });
    return response.data || [];
  },
  adminReject: async (id: string, reason?: string) => {
    const response = await api.patch(`/growth-logs/admin/${encodeURIComponent(id)}/reject`, { reason });
    return response.data;
  },
  adminDelete: async (id: string) => {
    const response = await api.delete(`/growth-logs/admin/${encodeURIComponent(id)}`);
    return response.data;
  },
};

export const materialControlAdminAPI = {
  listCompliancePhotos: async (params?: { partnerCode?: string; limit?: number }) => {
    const response = await api.get('/material-control/admin/compliance-photos', { params });
    return response.data || [];
  },
  deleteCompliancePhoto: async (id: string) => {
    const response = await api.delete(`/material-control/admin/compliance-photos/${encodeURIComponent(id)}`);
    return response.data;
  },
};

// Smart Lock API
export const smartLockAPI = {
  scanSeed: async (data: {
    inputSerialNumber: string;
    gpsLatitude: number;
    gpsLongitude: number;
    parcelId?: string;
  }) => {
    const response = await api.post('/smart-lock/scan', data);
    return response.data;
  },
  getParcelStatus: async (parcelId: string) => {
    const response = await api.get(`/smart-lock/parcel/${parcelId}/status`);
    return response.data;
  },
};

// HACCP API
export const haccpAPI = {
  getOverview: async () => {
    const response = await api.get('/haccp/admin/overview');
    return response.data;
  },
  getTrackData: async (batchId: string) => {
    const response = await api.get(`/haccp/track/${encodeURIComponent(batchId)}`);
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  getStatistics: async () => {
    const response = await api.get('/admin/statistics');
    return response.data;
  },
  getRecentActivities: async (limit?: number) => {
    const response = await api.get('/admin/recent-activities', { params: { limit } });
    return response.data;
  },
  getSupplySnapshot: async () => {
    const response = await api.get('/admin/operations/supply-snapshot');
    return response.data;
  },
};

// Users API (Admin)
export const usersAPI = {
  getMe: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  changeMyPassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await api.patch('/users/me/password', data);
    return response.data as { ok: boolean };
  },
  updatePreferredLanguage: async (preferredLanguage: string) => {
    const response = await api.patch('/users/me', { preferredLanguage });
    return response.data as { ok: boolean; preferredLanguage: string };
  },
  getAll: async (filters?: { role?: string; status?: string; search?: string }) => {
    const response = await api.get('/users/admin/all', { params: filters });
    return response.data;
  },
  getCommercialAgents: async () => {
    const response = await api.get('/users/admin/commercial-agents');
    return response.data;
  },
  getStatistics: async () => {
    const response = await api.get('/users/admin/statistics');
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await api.get(`/users/admin/${id}`);
    return response.data;
  },
  create: async (userData: {
    partnerCode: string;
    email?: string;
    phone?: string;
    firstName: string;
    lastName: string;
    productionCountry?: string;
    password?: string;
    roles?: string[];
    role?: string;
    autoGeneratePassword?: boolean;
    sendEmail?: boolean;
  }) => {
    const response = await api.post('/users/admin', userData);
    return response.data;
  },
  /** New random 12-char password; show once to user (e.g. supplier lost temp password). */
  adminResetPassword: async (id: string) => {
    const response = await api.post(`/users/admin/${id}/reset-password`);
    return response.data as {
      partnerCode: string;
      email: string | null;
      temporaryPassword: string;
    };
  },
  update: async (id: string, userData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    productionCountry?: string;
    roles?: string[];
    status?: string;
    /** Same shape as /buyers/company-profile — for BUYER users */
    buyerCompanyProfile?: Record<string, unknown> | null;
    /** Growers, farmers, logistics, B2B suppliers — must reference an active COMMERCIAL_AGENT */
    assignedAgentUserId?: string | null;
    /** COMMERCIAL_AGENT user — field office (admin) */
    commercialAgentProfile?: {
      officeName?: string | null;
      address: string;
      city: string;
      country: string;
      postalCode?: string | null;
    } | null;
  }) => {
    const response = await api.put(`/users/admin/${id}`, userData);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/users/admin/${id}`);
    return response.data;
  },
};

/** B2B partner stores (e.g. agri pharmacies) — admin creates login + map profile, no self-registration. */
/** Public: distributor / partner store interest from /suppliers (no auth) */
export const partnerApplicationsAPI = {
  create: async (data: {
    companyName: string;
    pib?: string;
    contactPerson: string;
    email: string;
    phone?: string;
    website?: string;
    productType?: string;
    certifications?: string[];
    description?: string;
  }) => {
    const response = await api.post('/partner-applications', data);
    return response.data as { id: string; referenceCode: string; message: string };
  },
  getStatus: async (referenceCode: string) => {
    try {
      const response = await api.get(`/partner-applications/public/status/${encodeURIComponent(referenceCode)}`);
      return response.data as {
        referenceCode: string;
        status: string;
        companyName: string;
        updatedAt: string;
      };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: unknown } } };
      const m = ax?.response?.data?.message;
      const msg = Array.isArray(m) ? m[0] : m;
      throw new Error(typeof msg === 'string' ? msg : 'No application with this reference code');
    }
  },
};

export const partnerApplicationsAdminAPI = {
  list: async (params?: { status?: string; search?: string }) => {
    const response = await api.get('/partner-applications/admin', { params });
    return response.data as Record<string, unknown>[];
  },
  getOne: async (id: string) => {
    const response = await api.get(`/partner-applications/admin/${id}`);
    return response.data;
  },
  update: async (
    id: string,
    data: {
      status?: string;
      internalNotes?: string;
      meetingAt?: string | null;
      linkedUserId?: string | null;
    },
  ) => {
    const response = await api.patch(`/partner-applications/admin/${id}`, data);
    return response.data;
  },
};

/** Logged-in grower: B2B partner store (catalog + direct order) — same routes as mobile */
export const growerSupplierB2bAPI = {
  getPublicStore: async (supplierUserId: string) => {
    const response = await api.get(
      `/b2b-suppliers/public/${encodeURIComponent(supplierUserId)}`,
    );
    return response.data as {
      id: string;
      businessName: string;
      description: string | null;
      website: string | null;
      address: string;
      postalCode: string | null;
      city: string;
      country: string;
      partnerCode: string | null;
      contactEmail: string | null;
      contactPhone: string | null;
      mapOnPublicDirectory?: boolean;
      catalog: Array<{
        id: string;
        name: string;
        description: string | null;
        unit: string;
        listPrice: number | null;
        sku: string | null;
        imageUrl: string | null;
      }>;
    };
  },
  getOrCreateThread: async (supplierUserId: string) => {
    const response = await api.post('/b2b-suppliers/threads', { supplierUserId });
    return response.data as { id: string; farmerId: string; supplierUserId: string; lastMessageAt: string };
  },
  /** Logged-in grower: B2B direct orders placed with material suppliers (newest first). */
  getMyDirectOrders: async () => {
    const response = await api.get('/b2b-suppliers/orders/mine');
    return response.data as Array<{
      id: string;
      supplierUserId: string;
      threadId: string | null;
      status: string;
      items: unknown;
      noteFromFarmer: string | null;
      noteFromSupplier: string | null;
      farmerReceivedAt: string | null;
      createdAt: string;
      updatedAt: string;
      supplier: { firstName: string | null; lastName: string | null; partnerCode: string | null } | null;
    }>;
  },
  /** After goods arrive: grower marks receipt (does not change supplier status) */
  markOrderReceivedAtFarm: async (orderId: string) => {
    const response = await api.post(
      `/b2b-suppliers/orders/${encodeURIComponent(orderId)}/farmer-received`,
    );
    return response.data as { id: string; farmerReceivedAt: string | null; status: string };
  },
  /** Logged-in grower: message threads with material suppliers. */
  getMyThreads: async () => {
    const response = await api.get('/b2b-suppliers/threads/mine');
    return response.data as Array<{
      id: string;
      farmerId: string;
      supplierUserId: string;
      lastMessageAt: string;
      supplier: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        partnerCode: string | null;
        material_supplier_profile: { businessName: string; city: string | null; country: string | null } | null;
      };
    }>;
  },
  getThreadMessages: async (threadId: string) => {
    const response = await api.get(`/b2b-suppliers/threads/${encodeURIComponent(threadId)}/messages`);
    return response.data as Array<{
      id: string;
      body: string;
      createdAt: string;
      sender: { id: string; firstName: string | null; lastName: string | null; partnerCode: string | null };
    }>;
  },
  postThreadMessage: async (threadId: string, body: string) => {
    const response = await api.post(`/b2b-suppliers/threads/${encodeURIComponent(threadId)}/messages`, { body });
    return response.data;
  },
  createDirectOrder: async (payload: {
    supplierUserId: string;
    items: { label: string; quantity: number; unit?: string }[];
    note?: string;
    threadId?: string;
  }) => {
    const response = await api.post('/b2b-suppliers/orders', payload);
    return response.data;
  },
};

/** Logged-in material supplier: orders + threads + own profile (web + mobile) */
export const b2bSupplierPortalAPI = {
  getMyProfile: async () => {
    const response = await api.get('/b2b-suppliers/my/profile');
    return response.data as Record<string, unknown> | null;
  },
  /**
   * First-time: creates `material_supplier_profiles` when the user has MATERIAL_SUPPLIER
   * but no store row (e.g. role added manually). Use PATCH for updates once the profile exists.
   */
  createMyStoreProfile: async (data: {
    businessName: string;
    description?: string;
    website?: string;
    street: string;
    houseNumber?: string;
    postalCode: string;
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
  }) => {
    const response = await api.post('/b2b-suppliers/my/profile', data);
    return response.data as Record<string, unknown>;
  },
  /** Update store + contact: name, site, address, email, phone, person name. Address/coords change can clear map until re-verified. */
  patchMyStore: async (data: {
    businessName?: string;
    description?: string;
    website?: string;
    street?: string;
    houseNumber?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  }) => {
    const response = await api.patch('/b2b-suppliers/my/profile', data);
    return response.data as Record<string, unknown>;
  },
  getIncomingOrders: async () => {
    const response = await api.get('/b2b-suppliers/orders/incoming');
    return (response.data || []) as Array<{
      id: string;
      status: string;
      createdAt: string;
      items: unknown;
      noteFromFarmer?: string;
      farmerReceivedAt?: string | null;
      farmer?: { firstName?: string; lastName?: string; partnerCode?: string };
    }>;
  },
  getMyThreads: async () => {
    const response = await api.get('/b2b-suppliers/threads/mine-as-supplier');
    return (response.data || []) as Array<{
      id: string;
      lastMessageAt: string;
      farmer?: { firstName?: string; lastName?: string; partnerCode?: string };
    }>;
  },
  getThreadMessages: async (threadId: string) => {
    const response = await api.get(`/b2b-suppliers/threads/${encodeURIComponent(threadId)}/messages`);
    return (response.data || []) as Array<{ id: string; body: string; createdAt: string }>;
  },
  postMessage: async (threadId: string, body: string) => {
    const response = await api.post(`/b2b-suppliers/threads/${encodeURIComponent(threadId)}/messages`, { body });
    return response.data;
  },
  patchOrderStatus: async (orderId: string, data: { status: string; noteFromSupplier?: string }) => {
    const response = await api.patch(`/b2b-suppliers/orders/${encodeURIComponent(orderId)}/status`, data);
    return response.data;
  },
  getApprovedProducts: async () => {
    const response = await api.get('/b2b-suppliers/my/approved-products');
    return response.data as Array<{
      id: string;
      category: string;
      name: string;
      variety: string | null;
      unit: string;
      packSize: string | null;
      imageUrl: string | null;
      isBioVeraBrand: boolean;
      description: string | null;
    }>;
  },
  getMySeedBags: async (status?: string) => {
    const response = await api.get('/b2b-suppliers/me/seed-bags', { params: status ? { status } : {} });
    return response.data as {
      bags: Array<{
        id: string;
        serialNumber: string;
        status: string;
        bagNumber: number | null;
        approvedProductId: string | null;
        productName: string;
        lotNumber: string | null;
        seedCropYear: number | null;
      }>;
      grouped: Array<{
        approvedProductId: string | null;
        productName: string;
        lotNumber: string;
        seedCropYear: number | null;
        count: number;
      }>;
    };
  },
  receiveSeedBags: async (serials: string[]) => {
    const response = await api.post('/b2b-suppliers/me/seed-bags/receive', { serials });
    return response.data as { results: Array<{ serial: string; ok: boolean; reason?: string }> };
  },
  sellSeedBags: async (body: {
    growerPartnerCode?: string;
    growerId?: string;
    serials: string[];
    directOrderId?: string;
  }) => {
    const response = await api.post('/b2b-suppliers/me/seed-bags/sell', body);
    return response.data as {
      growerId: string;
      results: Array<{ serial: string; ok: boolean; reason?: string }>;
    };
  },
  getMyCatalog: async () => {
    const response = await api.get('/b2b-suppliers/my/catalog');
    return response.data as Array<{
      id: string;
      name: string;
      description: string | null;
      unit: string;
      listPrice: number | null;
      sku: string | null;
      imageUrl: string | null;
      isActive: boolean;
      sortOrder: number;
      createdAt: string;
      updatedAt: string;
      approvedProductId?: string | null;
      approvedProduct?: { id: string; name: string; category: string; isBioVeraBrand: boolean };
    }>;
  },
  createCatalogItem: async (data: {
    approvedProductId: string;
    description?: string;
    listPrice?: number;
    sku?: string;
  }) => {
    const response = await api.post('/b2b-suppliers/my/catalog', data);
    return response.data;
  },
  updateCatalogItem: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      unit?: string;
      listPrice?: number | null;
      sku?: string;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) => {
    const response = await api.patch(`/b2b-suppliers/my/catalog/${encodeURIComponent(id)}`, data);
    return response.data;
  },
  deleteCatalogItem: async (id: string) => {
    const response = await api.delete(`/b2b-suppliers/my/catalog/${encodeURIComponent(id)}`);
    return response.data;
  },
  /** JPEG / PNG / WebP, max 3MB (server may resize). */
  uploadCatalogItemImage: async (itemId: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post(
      `/b2b-suppliers/my/catalog/${encodeURIComponent(itemId)}/image`,
      formData,
      {
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        transformRequest: [
          (data, headers) => {
            if (data instanceof FormData) {
              const h = headers as { delete?: (k: string) => void; [key: string]: unknown };
              if (typeof h.delete === 'function') {
                h.delete('Content-Type');
              } else {
                delete h['Content-Type'];
                delete h['content-type'];
              }
            }
            return data;
          },
        ],
      },
    );
    return response.data as Record<string, unknown>;
  },
  deleteCatalogItemImage: async (itemId: string) => {
    const response = await api.delete(
      `/b2b-suppliers/my/catalog/${encodeURIComponent(itemId)}/image`,
    );
    return response.data;
  },
  /** Register a physical barcode when goods arrive (unique in the whole system). */
  getMyMaterialBarcodes: async (params?: { status?: string }) => {
    const response = await api.get('/b2b-suppliers/my/material-barcodes', { params });
    return response.data as Array<{
      id: string;
      barcode: string;
      status: string;
      lotNumber: string | null;
      note: string | null;
      receivedAt: string;
      soldAt: string | null;
      catalogItem: { id: string; name: string; unit: string; sku: string | null } | null;
      soldToFarmer: {
        id: string;
        firstName: string;
        lastName: string;
        partnerCode: string;
      } | null;
      directOrder: { id: string; status: string; createdAt: string } | null;
    }>;
  },
  registerMaterialBarcode: async (data: {
    barcode: string;
    catalogItemId?: string;
    lotNumber?: string;
    note?: string;
  }) => {
    const response = await api.post('/b2b-suppliers/my/material-barcodes', data);
    return response.data;
  },
  updateMaterialBarcode: async (
    id: string,
    data: { status: 'SOLD' | 'VOID'; soldToFarmerId?: string; directOrderId?: string },
  ) => {
    const response = await api.patch(`/b2b-suppliers/my/material-barcodes/${encodeURIComponent(id)}`, data);
    return response.data;
  },
};

export const b2bSuppliersAdminAPI = {
  createStore: async (data: {
    partnerCode?: string;
    email: string;
    phone?: string;
    firstName: string;
    lastName: string;
    password?: string;
    autoGeneratePassword?: boolean;
    businessName: string;
    description?: string;
    /** Street / road name */
    street: string;
    houseNumber?: string;
    postalCode: string;
    city: string;
    country: string;
    /** Only if you must override automatic geocoding */
    latitude?: number;
    longitude?: number;
    mapApproved?: boolean;
    isVeraPartner?: boolean;
  }) => {
    const response = await api.post('/b2b-suppliers/admin/create-store', data);
    return response.data as {
      user: Record<string, unknown>;
      profile: Record<string, unknown>;
      password?: string;
      passwordGenerated: boolean;
    };
  },
  /** Set supplier visible on the public grower map (after address is correct). */
  approveSupplierMap: async (supplierUserId: string) => {
    const response = await api.post(
      `/b2b-suppliers/admin/approve/${encodeURIComponent(supplierUserId)}`,
    );
    return response.data;
  },
  linkCatalogItem: async (catalogItemId: string, approvedProductId: string | null) => {
    const response = await api.patch(
      `/b2b-suppliers/admin/supplier-catalog-items/${encodeURIComponent(catalogItemId)}`,
      { approvedProductId },
    );
    return response.data;
  },
  getNetworkOverview: async () => {
    const response = await api.get('/b2b-suppliers/admin/network-overview');
    return response.data as {
      suppliers: Array<{
        userId: string;
        businessName: string;
        address: string;
        city: string;
        country: string;
        mapApproved: boolean;
        user: {
          id: string;
          partnerCode: string;
          firstName: string;
          lastName: string;
          status: string;
          email?: string | null;
          phone?: string | null;
        };
        stats: {
          threadCount: number;
          orderCount: number;
          linkedFarmerCount: number;
          approvedCatalogCount: number;
          unlinkedCatalogCount: number;
        };
        catalogItems: Array<{
          id: string;
          name: string;
          approvedProductId: string | null;
          isActive: boolean;
        }>;
        linkedFarmers: Array<{
          id: string;
          firstName: string;
          lastName: string;
          partnerCode: string;
          status: string;
          hasMessageThread: boolean;
          hasOrder: boolean;
        }>;
      }>;
      recentOrders: Array<{
        id: string;
        status: string;
        createdAt: string;
        items: unknown;
        noteFromFarmer?: string | null;
        farmer: { id: string; firstName: string; lastName: string; partnerCode: string };
        supplier: { id: string; partnerCode: string; businessName: string | null; city: string | null };
      }>;
    };
  },
};

// Security Alerts API
export const securityAlertsAPI = {
  getAll: async (filters?: {
    type?: string;
    severity?: string;
    status?: string;
    userId?: string;
    estateId?: string;
  }) => {
    const response = await api.get('/security-alerts', { params: filters });
    return response.data;
  },
  getStatistics: async () => {
    const response = await api.get('/security-alerts/statistics');
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await api.get(`/security-alerts/${id}`);
    return response.data;
  },
  updateStatus: async (id: string, data: {
    status: string;
    reviewNotes?: string;
    resolution?: string;
  }) => {
    const response = await api.put(`/security-alerts/${id}/status`, data);
    return response.data;
  },
};

// Buyers API
export const buyersAPI = {
  getStatistics: async () => {
    const response = await api.get('/buyers/statistics');
    return response.data;
  },
  getAnalytics: async (startDate?: string, endDate?: string) => {
    const response = await api.get('/buyers/analytics', { params: { startDate, endDate } });
    return response.data;
  },
  getSuppliers: async () => {
    const response = await api.get('/buyers/suppliers');
    return response.data;
  },
  getCompanyProfile: async () => {
    const response = await api.get('/buyers/company-profile');
    return response.data as {
      company: {
        legalEntity: string;
        taxId: string;
        headquarters: string;
        generalDirector: string;
        financeManager: string;
      };
      deliveryLocations: unknown[];
      authorizedPersonnel: unknown[];
    };
  },
  updateCompanyProfile: async (body: {
    company: {
      legalEntity: string;
      taxId: string;
      headquarters: string;
      generalDirector: string;
      financeManager: string;
    };
    deliveryLocations: unknown[];
    authorizedPersonnel: unknown[];
  }) => {
    const response = await api.put('/buyers/company-profile', body);
    return response.data;
  },
};

// Invoices API
export const invoicesAPI = {
  getAll: async (filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get('/invoices', { params: filters });
    return response.data;
  },
  getByOrder: async (orderId: string) => {
    const response = await api.get(`/invoices/order/${orderId}`);
    return response.data;
  },
  getOne: async (invoiceId: string) => {
    const response = await api.get(`/invoices/${invoiceId}`);
    return response.data;
  },
  download: async (invoiceId: string) => {
    const response = await api.get(`/invoices/${invoiceId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
  sendEmail: async (invoiceId: string, email?: string) => {
    const response = await api.post(`/invoices/${invoiceId}/send-email`, { email });
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },
  markAsRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
};

// Digital Passports API
export const digitalPassportsAPI = {
  getByBatch: async (batchId: string) => {
    const response = await api.get(`/digital-passports/batch/${batchId}`);
    return response.data;
  },
  getById: async (passportId: string) => {
    const response = await api.get(`/digital-passports/${passportId}`);
    return response.data;
  },
};

// Vera Transparency API
export const veraTransparencyAPI = {
  groupBatches: async (batchIds: string[]) => {
    const response = await api.post('/vera-transparency/batch-manager/group', { batchIds });
    return response.data;
  },
  validateGrouping: async (batchIds: string[]) => {
    const response = await api.post('/vera-transparency/batch-manager/validate', { batchIds });
    return response.data;
  },
  generateQRCode: async (batchId: string) => {
    const response = await api.get(`/vera-transparency/batch/${batchId}/qr-code`);
    return response.data;
  },
  getDeepDive: async (batchId: string) => {
    const response = await api.get(`/vera-transparency/batch/${batchId}/deep-dive`);
    return response.data;
  },
};

// Batches API
export const batchesAPI = {
  getAll: async () => {
    const response = await api.get('/batches');
    return response.data;
  },
  getMyBatches: async () => {
    const response = await api.get('/batches');
    return response.data; // Backend returns only user's batches
  },
  getOne: async (batchId: string) => {
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
  }) => {
    const response = await api.post('/batches', data);
    return response.data;
  },
  moveToHub: async (batchId: string, hubId: string, driverId?: string) => {
    const response = await api.post(`/batches/${batchId}/move-to-hub`, { hubId, driverId });
    return response.data;
  },
  reportIssue: async (batchId: string, issue: string) => {
    const response = await api.post(`/batches/${batchId}/report-issue`, { issue });
    return response.data;
  },
  getAvailability: async (batchId: string) => {
    const response = await api.get(`/batches/${batchId}/availability`);
    return response.data;
  },
};

export type PackageBadgeType = 'PALLET_MASTER' | 'BOX_CHILD' | 'ROLL_LINE';

export type PackageBadgeScanResult = {
  scannedSerial: string;
  isChild: boolean;
  parent: {
    serial: string;
    type: string;
    farmerQrCode?: string | null;
    batchId?: string | null;
    lifecycle?: string;
  };
  children: {
    serial: string;
    type: string;
    farmerQrCode?: string | null;
    batchId?: string | null;
    lifecycle?: string;
  }[];
};

export type PackageBadgePublicResolve = {
  serial: string;
  type: string;
  farmerProfileUrl: string;
  farmerQrCode?: string | null;
  publicBatchId?: string | null;
  passportUrl?: string | null;
  hint?: string;
};

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
  /** Material supplier: physical return from grower — tree becomes yours (RETURNED_TO_SUPPLIER). */
  supplierReceiveFromGrower: async (data: { rootSerial: string; fromGrowerUserId: string }) => {
    const response = await api.post('/package-badges/supplier/receive-from-grower', data);
    return response.data;
  },
  supplierTransferToGrower: async (data: { rootSerial: string; newGrowerUserId: string }) => {
    const response = await api.post('/package-badges/supplier/transfer-to-grower', data);
    return response.data;
  },
  /** Authenticated: full tree (grower owns, or logistics/buyer/admin). */
  scan: async (serial: string): Promise<PackageBadgeScanResult> => {
    const response = await api.get(`/package-badges/scan/${encodeURIComponent(serial.trim())}`);
    return response.data;
  },
  /** No auth: consumer-style links (farmer page, passport when lot linked). */
  publicResolve: async (serial: string): Promise<PackageBadgePublicResolve> => {
    const base = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
      ? process.env.NEXT_PUBLIC_API_URL || 'https://api.biovera.app'
      : API_URL;
    const res = await axios.get(`${String(base).replace(/\/$/, '')}/public/badges/${encodeURIComponent(serial.trim())}`);
    return res.data;
  },
};

// Buyer Trade Panel API
export const buyerTradePanelAPI = {
  getSupplyAndDemand: async () => {
    const response = await api.get('/buyer-trade-panel/supply-demand');
    return response.data;
  },
  getRealTimePrices: async () => {
    const response = await api.get('/buyer-trade-panel/prices');
    return response.data;
  },
  checkPriceEscalation: async (productName?: string) => {
    const response = await api.get(`/buyer-trade-panel/price-escalation${productName ? `?productName=${productName}` : ''}`);
    return response.data;
  },
  applySurgePricing: async (productName: string, increasePercent: number) => {
    const response = await api.post('/buyer-trade-panel/surge-pricing', { productName, increasePercent });
    return response.data;
  },
  getHarvestForecast: async (weeks: number = 4) => {
    const response = await api.get(`/buyer-trade-panel/forecast?weeks=${weeks}`);
    return response.data;
  },
  createPreOrder: async (data: {
    productName: string;
    quantity: number;
    unit: string;
    requestedDeliveryDate: string;
    lockPrice: boolean;
  }) => {
    const response = await api.post('/buyer-trade-panel/pre-order', data);
    return response.data;
  },
  setCriticalThreshold: async (productName: string, threshold: number) => {
    const response = await api.post('/buyer-trade-panel/critical-threshold', { productName, threshold });
    return response.data;
  },
};

// Command & control (admin)
export const commandControlAPI = {
  getDashboard: async () => {
    const response = await api.get('/command-control/dashboard');
    return response.data;
  },
  getStatus: async () => {
    const response = await api.get('/command-control/status');
    return response.data;
  },
  pause: async (reason: string) => {
    const response = await api.post('/command-control/pause', { reason });
    return response.data;
  },
  resume: async () => {
    const response = await api.post('/command-control/resume', {});
    return response.data;
  },
  reassign: async (missionId: string, newDriverId: string, reason: string) => {
    const response = await api.post(`/command-control/reassign/${missionId}`, { newDriverId, reason });
    return response.data;
  },
};

// Market Prices API
export const marketPricesAPI = {
  getAllActive: async () => {
    const response = await api.get('/market-prices');
    return response.data;
  },
  getCurrent: async (cropType: string) => {
    const response = await api.get(`/market-prices/current/${cropType}`);
    return response.data;
  },
  getHistory: async (cropType: string) => {
    const response = await api.get(`/market-prices/history/${cropType}`);
    return response.data;
  },
  create: async (priceData: {
    cropType: string;
    buyPrice: number;
    sellPrice: number;
    effectiveFrom?: string;
    effectiveTo?: string;
  }) => {
    const response = await api.post('/market-prices', priceData);
    return response.data;
  },
  update: async (id: string, priceData: {
    buyPrice?: number;
    sellPrice?: number;
    effectiveTo?: string;
    isActive?: boolean;
  }) => {
    const response = await api.put(`/market-prices/${id}`, priceData);
    return response.data;
  },
};

// Standard Engine API
export const standardEngineAPI = {
  checkLoadingApproval: async (batchId: string) => {
    const response = await api.get(`/standard-engine/check/${batchId}`);
    return response.data;
  },
  approveForLoading: async (batchId: string) => {
    const response = await api.post(`/standard-engine/approve/${batchId}`);
    return response.data;
  },
};

// Financial Dashboard API
export const financialDashboardAPI = {
  getDashboard: async () => {
    const response = await api.get('/financial-dashboard');
    return response.data;
  },
};

// Group Sync API
export const groupSyncAPI = {
  getAvailableGroups: async () => {
    const response = await api.get('/group-sync/groups');
    return response.data;
  },
  getGroupStatistics: async (groupId: string) => {
    const response = await api.get(`/group-sync/groups/${groupId}/statistics`);
    return response.data;
  },
  sendGroupInstruction: async (
    groupId: string,
    instruction: {
      title: string;
      message: string;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      actionUrl?: string;
    },
  ) => {
    const response = await api.post(
      `/group-sync/groups/${groupId}/send-instruction`,
      instruction,
    );
    return response.data;
  },
};

export const suppliersAPI = {
  downloadProspect: async () => {
    try {
      const response = await api.get('/suppliers/prospect/download', {
        responseType: 'blob',
      });
      
      // Check if response is actually a blob
      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format');
      }
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bio-vera-supplier-prospect.pdf');
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error: unknown) {
      console.error('Error downloading prospect:', error);
      throw error;
    }
  },
};

export const qualityControlLevelsAPI = {
  getProtocol360Status: async (batchId: string) => {
    const response = await api.get(`/quality-control-levels/batch/${batchId}`);
    return response.data;
  },
  getProtocol360Info: async () => {
    const response = await api.get('/quality-control-levels/protocol-360');
    return response.data;
  },
};

export const growersAPI = {
  downloadProspect: async () => {
    try {
      const response = await api.get('/growers/prospect/download', {
        responseType: 'blob',
      });
      
      // Check if response is actually a blob
      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format');
      }
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bio-vera-grower-prospect.pdf');
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error: unknown) {
      console.error('Error downloading prospect:', error);
      throw error;
    }
  },
  downloadPackagingGuidelines: async () => {
    try {
      const response = await api.get('/growers/packaging-guidelines/download', {
        responseType: 'blob',
      });
      
      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format');
      }
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bio-vera-packaging-guidelines.pdf');
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error: unknown) {
      console.error('Error downloading packaging guidelines:', error);
      throw error;
    }
  },
  downloadFieldManagementGuide: async () => {
    try {
      const response = await api.get('/growers/field-management-guide/download', {
        responseType: 'blob',
      });
      
      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format');
      }
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bio-vera-field-management-guide.pdf');
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error: unknown) {
      console.error('Error downloading field management guide:', error);
      throw error;
    }
  },
  downloadProtocol: async () => {
    try {
      const response = await api.get('/growers/protocol/download', {
        responseType: 'blob',
      });
      
      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format');
      }
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bio-vera-protocol.pdf');
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error: unknown) {
      console.error('Error downloading protocol:', error);
      throw error;
    }
  },
  downloadCertificationRequirements: async () => {
    try {
      const response = await api.get('/growers/certification-requirements/download', {
        responseType: 'blob',
      });
      
      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format');
      }
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bio-vera-certification-requirements.pdf');
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error: unknown) {
      console.error('Error downloading certification requirements:', error);
      throw error;
    }
  },
  downloadMobileAppGuide: async () => {
    const { growerAppGuidePdfPath, growerAppGuidePdfFilename } = await import('@/lib/grower-app-guide');
    const locale =
      typeof document !== 'undefined'
        ? document.documentElement.lang || 'sr'
        : 'sr';
    const pdfPath = growerAppGuidePdfPath(locale);
    const filename = growerAppGuidePdfFilename(locale);
    const link = document.createElement('a');
    link.href = pdfPath;
    link.setAttribute('download', filename);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
  downloadPaymentProcessGuide: async () => {
    try {
      const response = await api.get('/growers/payment-process-guide/download', {
        responseType: 'blob',
      });
      
      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format');
      }
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bio-vera-payment-process-guide.pdf');
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error: unknown) {
      console.error('Error downloading payment process guide:', error);
      throw error;
    }
  },
  downloadQualityStandards: async () => {
    try {
      const response = await api.get('/growers/quality-standards/download', {
        responseType: 'blob',
      });
      
      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format');
      }
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bio-vera-quality-standards.pdf');
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error: unknown) {
      console.error('Error downloading quality standards:', error);
      throw error;
    }
  },
};

/** English BioVera Fresh partner prospect PDF (same convention as grower/supplier/logistics prospects). */
export const bioVeraFreshAPI = {
  downloadProspect: async () => {
    try {
      const response = await api.get('/biovera-fresh/prospect/download', {
        responseType: 'blob',
      });

      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format');
      }

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bio-vera-fresh-prospect.pdf');
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error: unknown) {
      console.error('Error downloading BioVera Fresh prospect:', error);
      throw error;
    }
  },
};

export const logisticsPartnerAPI = {
  downloadProspect: async () => {
    try {
      const response = await api.get('/logistics-partner/prospect/download', {
        responseType: 'blob',
      });
      
      // Check if response is actually a blob
      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format');
      }
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bio-vera-logistics-partner-prospect.pdf');
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error: unknown) {
      console.error('Error downloading prospect:', error);
      throw error;
    }
  },
  downloadTransportOperationsGuide: async () => {
    try {
      const response = await api.get('/logistics-partner/transport-operations-guide/download', {
        responseType: 'blob',
      });
      
      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format');
      }
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bio-vera-transport-operations-guide.pdf');
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error: unknown) {
      console.error('Error downloading transport operations guide:', error);
      throw error;
    }
  },
  downloadColdChainProtocol: async () => {
    try {
      const response = await api.get('/logistics-partner/cold-chain-protocol/download', {
        responseType: 'blob',
      });
      
      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format');
      }
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bio-vera-cold-chain-protocol.pdf');
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error: unknown) {
      console.error('Error downloading cold chain protocol:', error);
      throw error;
    }
  },
  downloadMobileAppGuide: async () => {
    try {
      const response = await api.get('/logistics-partner/mobile-app-guide/download', {
        responseType: 'blob',
      });
      
      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format');
      }
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bio-vera-mobile-app-guide-logistics.pdf');
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error: unknown) {
      console.error('Error downloading mobile app guide:', error);
      throw error;
    }
  },
  downloadPaymentProcessGuide: async () => {
    try {
      const response = await api.get('/logistics-partner/payment-process-guide/download', {
        responseType: 'blob',
      });
      
      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format');
      }
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bio-vera-payment-process-guide-logistics.pdf');
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error: unknown) {
      console.error('Error downloading payment process guide:', error);
      throw error;
    }
  },
  downloadGPSTrackingStandards: async () => {
    try {
      const response = await api.get('/logistics-partner/gps-tracking-standards/download', {
        responseType: 'blob',
      });
      
      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format');
      }
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bio-vera-gps-tracking-standards.pdf');
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error: unknown) {
      console.error('Error downloading GPS tracking standards:', error);
      throw error;
    }
  },
};

export const farmerProfileAPI = {
  getMyProfile: async () => {
    const response = await api.get('/farmer-profile/me');
    return response.data;
  },
  
  updateProfile: async (data: {
    farmerBio?: string;
    yearsOfExperience?: number;
    generation?: string;
  }) => {
    const response = await api.put('/farmer-profile/me', data);
    return response.data;
  },
  
  uploadPhoto: async (file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    // Do not set Content-Type manually: the instance defaults to application/json, and
    // "multipart/form-data" without a boundary breaks parsing. Let the browser set
    // multipart/form-data; boundary=... for FormData.
    const response = await api.post('/farmer-profile/me/photo', formData, {
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      transformRequest: [
        (data, headers) => {
          if (data instanceof FormData) {
            const h = headers as { delete?: (k: string) => void; [key: string]: unknown };
            if (typeof h.delete === 'function') {
              h.delete('Content-Type');
            } else {
              delete h['Content-Type'];
              delete h['content-type'];
            }
          }
          return data;
        },
      ],
    });
    return response.data;
  },
  
  getByQrCode: async (qrCode: string) => {
    const response = await api.get(`/farmer-profile/qr/${qrCode}`);
    return response.data;
  },
  
  getQrCodeImage: async (qrCode: string) => {
    const response = await api.get(`/farmer-profile/qr/${qrCode}/image`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(response.data);
  },

  /** Get QR code image for the logged-in grower (authenticated). Returns blob URL. */
  getMyQrCodeImage: async () => {
    const response = await api.get('/farmer-profile/me/qr-image', {
      responseType: 'blob',
    });
    return URL.createObjectURL(response.data);
  },
};

// Production API URL - used when NEXT_PUBLIC_API_URL is missing or invalid at build time
const CONTACT_API_BASE = 'https://api.biovera.app';

/** Get Formspree endpoint from env */
export function getFormspreeEndpoint(): string {
  return typeof process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT === 'string'
    ? process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT.trim()
    : '';
}

/**
 * Submit application form (growers, logistics, suppliers) to Formspree.
 * Uses same endpoint as contact form - add _form_type so you can distinguish in Formspree.
 */
export async function submitApplicationForm(
  formType: string,
  data: Record<string, string | string[] | boolean | File | null | number | undefined>
): Promise<{ success: boolean; message?: string }> {
  const endpoint = getFormspreeEndpoint();
  if (!endpoint) {
    throw new Error('Form submissions are not configured. Please contact us at info@biovera.app');
  }
  const fd = new FormData();
  fd.append('_form_type', formType);
  fd.append('subject', `${formType} Application`);
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (value instanceof File) {
      fd.append(key, value);
    } else if (Array.isArray(value)) {
      fd.append(key, value.join(', '));
    } else if (typeof value === 'boolean') {
      fd.append(key, value ? 'Yes' : 'No');
    } else {
      fd.append(key, String(value));
    }
  }
  const res = await fetch(endpoint, {
    method: 'POST',
    body: fd,
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  });
  const result = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (res.ok && result.ok !== false) {
    return { success: true, message: 'Thank you for your application. We will contact you within 3-5 business days.' };
  }
  throw new Error(result?.error || 'Failed to submit application. Please try again or contact info@biovera.app');
}

function resolveMarketingApiBase(): string {
  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const raw =
    typeof process.env.NEXT_PUBLIC_API_URL === 'string' ? process.env.NEXT_PUBLIC_API_URL.trim() : '';
  const candidate = raw.startsWith('http') ? raw.replace(/\/$/, '') : '';
  const isLocalhost = candidate.includes('localhost') || candidate.includes('127.0.0.1');
  return isLocal
    ? candidate && !isLocalhost
      ? candidate
      : WEB_DEV_API_FALLBACK
    : candidate && !isLocalhost
      ? candidate
      : CONTACT_API_BASE;
}

export const contactAPI = {
  submitInquiry: async (data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    phone?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    const formspreeEndpoint = getFormspreeEndpoint();
    if (formspreeEndpoint) {
      const fd = new FormData();
      fd.append('name', data.name);
      fd.append('email', data.email);
      fd.append('subject', data.subject);
      fd.append('message', data.message);
      if (data.phone) fd.append('phone', data.phone);

      const res = await fetch(formspreeEndpoint, {
        method: 'POST',
        body: fd,
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      const result = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && result.ok !== false) {
        return { success: true, message: 'Thank you for your message. We will get back to you soon.' };
      }
      throw new Error(result?.error || 'Failed to send message');
    }

    const baseUrl = resolveMarketingApiBase();
    const res = await fetch(`${baseUrl}/contact/submit`, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(60000),
    });
    const result = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
    if (!res.ok) {
      const err = new Error(result?.message || 'Failed to send message') as Error & {
        response?: { status: number; data: unknown };
      };
      err.response = { status: res.status, data: result };
      throw err;
    }
    return { success: result.success ?? true, message: result.message };
  },
};

/** Job applications via POST /careers/apply → same ADMIN_EMAIL as contact form. */
export const careersApplyAPI = {
  submit: async (data: {
    name: string;
    email: string;
    phone?: string;
    roleKey?: string;
    appliedRoleTitle: string;
    coverLetter: string;
    linkedinUrl?: string;
    resumeBase64: string;
    resumeFileName: string;
    resumeMimeType: string;
  }): Promise<{ success: boolean; message?: string }> => {
    const baseUrl = resolveMarketingApiBase();
    const res = await fetch(`${baseUrl}/careers/apply`, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(90000),
    });
    const result = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
    if (!res.ok) {
      const err = new Error(result?.message || 'Failed to send application') as Error & {
        response?: { status: number; data: unknown };
      };
      err.response = { status: res.status, data: result };
      throw err;
    }
    return { success: result.success ?? true, message: result.message };
  },
};

// Seed production API (Bio Vera label traceability — admin)
export type SeedRunStatus = 'PLANNED' | 'LABELS_ISSUED' | 'PRODUCED' | 'RELEASED' | 'RECALLED';

export interface SeedInstructions {
  sowingTime?: string;
  spacingDepth?: string;
  seedRate?: string;
  soilTemperature?: string;
  irrigation?: string;
  firstSteps?: string;
  storage?: string;
  safety?: string;
  harvestWindow?: string;
}

export interface SeedApprovedProduct {
  id: string;
  category: string;
  name: string;
  variety?: string | null;
  cropType?: string | null;
  manufacturer?: string | null;
  isBioVeraBrand: boolean;
  description?: string | null;
  imageUrl?: string | null;
  unit: string;
  packSize?: string | null;
  status: 'ACTIVE' | 'RETIRED';
  instructions?: SeedInstructions | null;
  instructionsPdfUrl?: string | null;
  videoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SeedProducer {
  id: string;
  name: string;
  country: string;
  city?: string | null;
  address?: string | null;
  licenseNumber?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  userId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SeedBag {
  id: string;
  serialNumber: string;
  status: string;
  bagNumber?: number | null;
  assignedToUserId?: string | null;
  soldToGrowerId?: string | null;
  plantedParcelId?: string | null;
  plantedAt?: string | null;
  manufacturedAt?: string | null;
  expiresAt?: string | null;
  custody?: Array<{
    id: string;
    event: string;
    createdAt: string;
    note?: string | null;
    growerId?: string | null;
    parcelId?: string | null;
  }>;
  productionRun?: SeedProductionRun | null;
  approvedProduct?: SeedApprovedProduct | null;
}

export interface SeedProductionRun {
  id: string;
  approvedProductId: string;
  producerId: string;
  lotNumber: string;
  seedCropYear: number;
  productionDate?: string | null;
  originCountry: string;
  originRegion?: string | null;
  bagSizeLabel: string;
  bagsPlanned: number;
  bagsProduced?: number | null;
  germinationPct?: number | null;
  purityPct?: number | null;
  certificateUrls: string[];
  expiresAt?: string | null;
  status: SeedRunStatus;
  recallReason?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  approvedProduct?: SeedApprovedProduct;
  producer?: SeedProducer;
  bagCounts?: Record<string, number>;
  bags?: SeedBag[];
}

export interface SeedDashboard {
  totals: {
    labeled: number;
    produced: number;
    voided: number;
    available: number;
    assigned: number;
    planted: number;
    recalled: number;
  };
  runs: SeedProductionRun[];
  plantedParcels: Array<{
    serialNumber: string;
    plantedParcelId: string | null;
    plantedAt: string | null;
    productionRun: { lotNumber: string };
  }>;
}

export const seedProductionAPI = {
  getDashboard: async (): Promise<SeedDashboard> =>
    (await api.get('/seed-production/dashboard')).data,
  listApprovedProducts: async (): Promise<SeedApprovedProduct[]> =>
    (await api.get('/seed-production/approved-products')).data,
  createApprovedProduct: async (body: Record<string, unknown>): Promise<SeedApprovedProduct> =>
    (await api.post('/seed-production/approved-products', body)).data,
  updateApprovedProduct: async (id: string, body: Record<string, unknown>): Promise<SeedApprovedProduct> =>
    (await api.patch(`/seed-production/approved-products/${encodeURIComponent(id)}`, body)).data,
  retireApprovedProduct: async (id: string): Promise<SeedApprovedProduct> =>
    (await api.post(`/seed-production/approved-products/${encodeURIComponent(id)}/retire`)).data,
  listProducers: async (): Promise<SeedProducer[]> =>
    (await api.get('/seed-production/producers')).data,
  createProducer: async (body: Record<string, unknown>): Promise<SeedProducer> =>
    (await api.post('/seed-production/producers', body)).data,
  updateProducer: async (id: string, body: Record<string, unknown>): Promise<SeedProducer> =>
    (await api.patch(`/seed-production/producers/${encodeURIComponent(id)}`, body)).data,
  listRuns: async (): Promise<SeedProductionRun[]> =>
    (await api.get('/seed-production/runs')).data,
  getRun: async (id: string): Promise<SeedProductionRun> =>
    (await api.get(`/seed-production/runs/${encodeURIComponent(id)}`)).data,
  createRun: async (body: Record<string, unknown>): Promise<SeedProductionRun> =>
    (await api.post('/seed-production/runs', body)).data,
  issueLabels: async (id: string): Promise<SeedProductionRun> =>
    (await api.post(`/seed-production/runs/${encodeURIComponent(id)}/issue-labels`)).data,
  downloadLabelsCsv: async (runId: string): Promise<Blob> => {
    const response = await api.get(`/seed-production/runs/${encodeURIComponent(runId)}/labels.csv`, {
      responseType: 'blob',
    });
    return response.data;
  },
  downloadLabelsPdf: async (runId: string, format: 'sheet' | 'roll' = 'sheet'): Promise<Blob> => {
    const response = await api.get(`/seed-production/runs/${encodeURIComponent(runId)}/labels.pdf`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
  labelsCsvUrl: (runId: string) =>
    `${WEB_API_BASE}/seed-production/runs/${encodeURIComponent(runId)}/labels.csv`,
  labelsPdfUrl: (runId: string, format: 'sheet' | 'roll' = 'sheet') => {
    const base = `${WEB_API_BASE}/seed-production/runs/${encodeURIComponent(runId)}/labels.pdf`;
    return format === 'roll' ? `${base}?format=roll` : base;
  },
  confirmProduction: async (id: string, body: Record<string, unknown>): Promise<SeedProductionRun> =>
    (await api.post(`/seed-production/runs/${encodeURIComponent(id)}/confirm-production`, body)).data,
  releaseRun: async (id: string): Promise<SeedProductionRun> =>
    (await api.post(`/seed-production/runs/${encodeURIComponent(id)}/release`)).data,
  recallRun: async (id: string, reason: string) =>
    (await api.post(`/seed-production/runs/${encodeURIComponent(id)}/recall`, { reason })).data as {
      run: SeedProductionRun;
      affectedGrowers: string[];
      affectedParcels: Array<{ plantedParcelId: string | null; serialNumber: string }>;
    },
  getRecallPreview: async (id: string) =>
    (await api.get(`/seed-production/runs/${encodeURIComponent(id)}/recall-preview`)).data as {
      lotNumber: string;
      bagsToRecall: number;
      byStatus: Record<string, number>;
      growers: Array<{ id: string; firstName: string; lastName: string; partnerCode: string }>;
      affectedParcels: Array<{
        parcelId: string;
        serialNumbers: string[];
        plantedAt: string | null;
        cropType: string | null;
        estateName: string | null;
        areaM2: number | null;
      }>;
    },
  previewAssignBags: async (id: string, serials: string[]) =>
    (await api.post(`/seed-production/runs/${encodeURIComponent(id)}/assign-preview`, { serials })).data as {
      results: Array<{ serial: string; ok: boolean; reason?: string }>;
    },
  uploadCertificate: async (file: File): Promise<{ url: string }> => {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post('/seed-production/upload-certificate', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getParcelPlantedBags: async (parcelId: string) =>
    (await api.get(`/seed-production/parcels/${encodeURIComponent(parcelId)}/planted-bags`)).data as {
      parcel: { id: string; cropType: string | null; calculatedArea: number };
      plantedBags: {
        count: number;
        totalKg: number;
        lots: string[];
        bags: Array<{
          serialNumber: string;
          status: string;
          lotNumber: string | null;
          bagSizeLabel: string | null;
          bagKg: number;
          plantedAt: string | null;
        }>;
      };
    },
  assignBags: async (id: string, body: { growerId?: string; growerPartnerCode?: string; serials: string[] }) =>
    (await api.post(`/seed-production/runs/${encodeURIComponent(id)}/assign`, body)).data,
  shipBags: async (id: string, body: { supplierUserId: string; serials: string[] }) =>
    (await api.post(`/seed-production/runs/${encodeURIComponent(id)}/ship`, body)).data as {
      supplierUserId: string;
      results: Array<{ serial: string; ok: boolean; reason?: string }>;
    },
  getBag: async (serial: string): Promise<SeedBag> =>
    (await api.get(`/seed-production/bags/${encodeURIComponent(serial)}`)).data,
  inviteProducer: async (id: string, body: { firstName: string; lastName: string; email: string }) =>
    (await api.post(`/seed-production/producers/${encodeURIComponent(id)}/invite`, body)).data as {
      userId: string;
      partnerCode: string;
      email: string;
    },
  unlinkProducer: async (id: string) =>
    (await api.post(`/seed-production/producers/${encodeURIComponent(id)}/unlink-user`)).data,
  getReportsSummary: async (params?: { year?: number; productId?: string }) =>
    (await api.get('/seed-production/reports/summary', { params })).data as {
      byProductYear: Array<Record<string, unknown>>;
      suppliers: Array<Record<string, unknown>>;
      plantedParcels: Array<Record<string, unknown>>;
    },
  downloadBagsRegisterCsv: async (params?: { runId?: string; status?: string; supplierUserId?: string }) => {
    const response = await api.get('/seed-production/reports/bags.csv', { params, responseType: 'blob' });
    return response.data as Blob;
  },
  getRecallImpact: async (runId: string) =>
    (await api.get(`/seed-production/reports/recall-impact/${encodeURIComponent(runId)}`)).data as {
      lotNumber: string;
      bagsToRecall: number;
      byStatus: Record<string, number>;
      growers: Array<{ id: string; firstName: string; lastName: string; partnerCode: string; phone?: string | null }>;
      affectedParcels: Array<{
        parcelId: string;
        serialNumbers: string[];
        plantedAt: string | null;
        cropType: string | null;
        estateName: string | null;
        areaM2: number | null;
      }>;
    },
};

export const seedProducerAPI = {
  me: async () => (await api.get('/seed-producer/me')).data,
  listRuns: async () => (await api.get('/seed-producer/runs')).data as Array<{
    id: string;
    lotNumber: string;
    seedCropYear: number;
    product: string;
    variety?: string | null;
    bagsPlanned: number;
    bagsProduced?: number | null;
    status: string;
    productionDate?: string | null;
    labelsReady: boolean;
  }>,
  getRun: async (id: string) => (await api.get(`/seed-producer/runs/${encodeURIComponent(id)}`)).data as SeedProductionRun,
  downloadLabelsCsv: async (runId: string): Promise<Blob> => {
    const response = await api.get(`/seed-producer/runs/${encodeURIComponent(runId)}/labels.csv`, { responseType: 'blob' });
    return response.data;
  },
  downloadLabelsPdf: async (runId: string, format: 'sheet' | 'roll' = 'sheet'): Promise<Blob> => {
    const response = await api.get(`/seed-producer/runs/${encodeURIComponent(runId)}/labels.pdf`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
  confirmProduction: async (id: string, body: Record<string, unknown>) =>
    (await api.post(`/seed-producer/runs/${encodeURIComponent(id)}/confirm-production`, body)).data,
  uploadCertificate: async (runId: string, file: File): Promise<{ certificateUrls: string[] }> => {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post(`/seed-producer/runs/${encodeURIComponent(runId)}/certificates`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default api;
