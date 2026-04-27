import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

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

// Handle 401 errors - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
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
  }
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
    } catch (error: any) {
      // Silently handle network errors - don't throw, just return empty array
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        // Only log in development mode
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Backend not available at ${API_URL}. Products will not be displayed.`);
        }
        return []; // Return empty array instead of throwing
      } else if (error.response) {
        // Server responded with error status - return empty array
        console.warn('API Error:', error.response.status, error.response.data?.message);
        return [];
      } else {
        // Other errors - return empty array
        console.warn('Error loading products:', error.message);
        return [];
      }
    }
  },
};

// Orders API
export const ordersAPI = {
  create: async (orderData: any) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/orders');
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
  claimMission: async (missionId: string, body?: { vehicleId?: string }) => {
    const response = await api.post(`/missions/${encodeURIComponent(missionId)}/claim`, body || {});
    return response.data;
  },
  create: async (data: {
    batchId?: string;
    pickupLocation: { lat: number; lng: number; address?: string };
    pickupAddress: string;
    destinationAddress: string;
    destinationCity: string;
    loadInstructions?: string;
  }) => {
    const response = await api.post('/missions', data);
    return response.data;
  },
  getLogisticsPartnersAdmin: async () => {
    const response = await api.get('/missions/admin/logistics-partners');
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

// Deliveries API
export const deliveriesAPI = {
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
  /** Download waybill PDF (auth required; buyer, driver, grower, admin). */
  downloadWaybillPdf: async (waybillId: string) => {
    const response = await api.get(`/waybills/document/${waybillId}/pdf`, {
      responseType: 'blob',
    });
    return response.data as Blob;
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
  /** Grower: list own planting & harvest plans */
  getMine: async () => {
    const response = await api.get('/harvest-announcements/my-announcements');
    return response.data || [];
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
        stats: { threadCount: number; orderCount: number; linkedFarmerCount: number };
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('Error downloading certification requirements:', error);
      throw error;
    }
  },
  downloadMobileAppGuide: async () => {
    try {
      const response = await api.get('/growers/mobile-app-guide/download', {
        responseType: 'blob',
      });
      
      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format');
      }
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bio-vera-mobile-app-guide.pdf');
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error: any) {
      console.error('Error downloading mobile app guide:', error);
      throw error;
    }
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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('Error downloading quality standards:', error);
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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

    // Backend API (Railway) - production ALWAYS uses api.biovera.app, never localhost
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const raw = typeof process.env.NEXT_PUBLIC_API_URL === 'string' ? process.env.NEXT_PUBLIC_API_URL.trim() : '';
    const candidate = raw.startsWith('http') ? raw.replace(/\/$/, '') : '';
    const isLocalhost = candidate.includes('localhost') || candidate.includes('127.0.0.1');
    const baseUrl = isLocal
      ? (candidate && !isLocalhost ? candidate : 'http://localhost:3004')
      : (candidate && !isLocalhost ? candidate : CONTACT_API_BASE);
    const url = `${baseUrl}/contact/submit`;

    const res = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(60000),
    });
    const result = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
    if (!res.ok) {
      const err = new Error(result?.message || 'Failed to send message') as Error & { response?: { status: number; data: unknown } };
      err.response = { status: res.status, data: result };
      throw err;
    }
    return { success: result.success ?? true, message: result.message };
  },
};

export default api;
