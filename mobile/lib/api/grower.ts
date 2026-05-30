import api from './client';
import { apiErrorMessage, axiosResponseStatus, isLikelyNetworkError } from '../api-error';
import type {
  FieldEntry,
  GrowthLog,
  CompliancePhoto,
  Material,
  CreateHarvestPlanBody,
  LabelRollRow,
  ComplianceBatchStatus,
  RequiredCertification,
  PlotBlueprint,
  PlotBlueprintZone,
  PlotBlueprintPartition,
  FarmerProfileMeResponse,
} from './types';

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

export type GrowerPortalCostRow = {
  id: string;
  type: 'product' | 'manual';
  productId?: string;
  label: string;
  amount: number;
  currency?: string;
  note?: string;
  estateId?: string;
  parcelId?: string;
  harvestAnnouncementId?: string;
  parcelLabel?: string;
  plantingLabel?: string;
  timestamp: string;
  status: 'synced';
};

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
  getCosts: async (): Promise<GrowerPortalCostRow[]> => {
    try {
      const response = await api.get('/grower-portal/costs');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: unknown) {
      if (isLikelyNetworkError(error)) return [];
      console.warn('Error fetching grower costs:', error instanceof Error ? error.message : error);
      return [];
    }
  },
};

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
        type: ((row.materialType || row.type) as Material['type']) || 'OTHER',
        manufacturer: (row.manufacturer as string) || undefined,
        certification: (row.certification as string) || undefined,
        phiDays: row.phiDays != null ? Number(row.phiDays) : undefined,
        mrlLimit: row.mrlLimit != null ? Number(row.mrlLimit) : undefined,
      }));
    } catch (error: unknown) {
      if (isLikelyNetworkError(error)) {
        console.warn('Backend not available, returning empty whitelist');
        return [];
      }
      throw error;
    }
  },
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
    } as unknown as Blob);
    const response = await api.post('/seed-registrations', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export const compliancePhotosAPI = {
  getAll: async (estateId?: string, parcelId?: string): Promise<CompliancePhoto[]> => {
    const params: Record<string, string> = {};
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
    } as unknown as Blob);
    formData.append('gpsLocation', JSON.stringify(data.gpsLocation));
    formData.append('type', data.type);
    if (data.notes) formData.append('notes', data.notes);

    const response = await api.post('/compliance/photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export const farmerProfileAPI = {
  getMyProfile: async (): Promise<FarmerProfileMeResponse> => {
    const response = await api.get('/farmer-profile/me');
    return response.data;
  },
};
