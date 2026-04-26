/**
 * Shared Backend Service (API Client)
 * Web and Mobile use this – no duplicated API logic
 * Token storage is injected via getToken()
 */

export type GetTokenFn = () => Promise<string | null>;

export interface BackendServiceConfig {
  baseURL: string;
  getToken: GetTokenFn;
  timeout?: number;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Axios-like request config (works without axios for tree-shaking / lightweight)
async function request<T>(
  baseURL: string,
  path: string,
  opts: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    getToken: GetTokenFn;
    timeout?: number;
  }
): Promise<T> {
  const token = await opts.getToken();
  const url = `${baseURL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    opts.timeout ?? 10000
  );

  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!res.ok) {
    const err: ApiError = {
      message: (await res.json().catch(() => ({})))?.message ?? res.statusText,
      status: res.status,
    };
    throw err;
  }

  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

/**
 * Create backend service instance – inject getToken per platform
 * Mobile: () => AsyncStorage.getItem('auth_token')
 * Web:   () => Promise.resolve(localStorage.getItem('token'))
 */
export function createBackendService(config: BackendServiceConfig) {
  const { baseURL, getToken, timeout = 10000 } = config;

  return {
    // Treatment logs / PHI
    async getEarliestHarvestDate(parcelId: string) {
      return request<{ date: string | null; reason?: string }>(
        baseURL,
        `/treatment-logs/parcel/${parcelId}/earliest-harvest`,
        { getToken, timeout }
      );
    },

    async getTreatmentLogs(parcelId?: string) {
      const q = parcelId ? `?parcelId=${parcelId}` : '';
      return request<unknown[]>(baseURL, `/treatment-logs${q}`, {
        getToken,
        timeout,
      });
    },

    // Harvest announcements
    async createHarvestAnnouncement(dto: {
      parcelId: string;
      announcementType: 'HARVEST' | 'PLANTING';
      cropType: string;
      estimatedDate: string;
      estimatedQuantity?: number;
      notes?: string;
    }) {
      return request<unknown>(baseURL, '/harvest-announcements', {
        method: 'POST',
        body: dto,
        getToken,
        timeout,
      });
    },

    // Estates / Parcels
    async getEstates() {
      return request<unknown[]>(baseURL, '/estates', { getToken, timeout });
    },

    async getParcels(estateId: string) {
      return request<unknown[]>(baseURL, `/estates/${estateId}/parcels`, {
        getToken,
        timeout,
      });
    },

    // Farm detail (admin) – single farmer overview. Optional `include` = comma list of sections.
    async getFarmDetail(farmerId: string, include?: string) {
      const q = include
        ? `?include=${encodeURIComponent(include)}`
        : '';
      return request<{
        meta?: { schemaVersion: number; generatedAt: string };
        farmer: unknown;
        materialBalance?: unknown;
        trust?: unknown;
        kycDocuments?: unknown[];
        counts?: unknown;
        estates: unknown[];
        fieldPhotos: unknown[];
        compliancePhotos: unknown[];
        complianceLogs?: unknown[];
        labResults: unknown[];
        treatmentLogs: unknown[];
        harvestAnnouncements: unknown[];
        batches: unknown[];
        batchesSummary?: unknown[];
        missions?: unknown[];
      }>(baseURL, `/admin/farmers/${farmerId}${q}`, { getToken, timeout });
    },

    // Packing flow – submit packing record
    async submitPackingRecord(dto: {
      batchId: string;
      qrCode?: string;
      photoUrl?: string;
      photoType?: string;
      gpsLatitude: number;
      gpsLongitude: number;
      timestamp: string;
    }) {
      return request<unknown>(baseURL, '/packing-records', {
        method: 'POST',
        body: dto,
        getToken,
        timeout,
      });
    },

    // Batches
    async getBatches(estateId?: string) {
      const q = estateId ? `?estateId=${estateId}` : '';
      return request<unknown[]>(baseURL, `/batches${q}`, {
        getToken,
        timeout,
      });
    },
  };
}

export type BackendService = ReturnType<typeof createBackendService>;
