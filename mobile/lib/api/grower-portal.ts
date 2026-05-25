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

/** Grower checklist items (compliance / certification photos in app). */
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
// Compliance Photos API (legacy estate uploads — prefer materialControlAPI + batch)
/** Label roll row from /material-control/my-label-rolls */
/** GET /material-control/compliance-status/:batchId */
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
export const plotMapperAPI = {
  getBlueprint: async (parcelId: string): Promise<PlotBlueprint | null> => {
    try {
      const response = await api.get(`/plot-mapper/parcel/${parcelId}`);
      return response.data ?? null;
    } catch {
      return null;
    }
  },
  /** @deprecated Use getBlueprint — kept for existing call sites. */
  getByParcel: async (parcelId: string): Promise<PlotBlueprint | null> =>
    plotMapperAPI.getBlueprint(parcelId),
  saveBlueprint: async (data: {
    parcelId: string;
    length: number;
    width: number;
    blueprintData: { zones: PlotBlueprintZone[]; partitions: PlotBlueprintPartition[] };
  }): Promise<PlotBlueprint> => {
    const response = await api.post('/plot-mapper/save', data);
    return response.data;
  },
  /** @deprecated Use saveBlueprint — kept for existing call sites. */
  save: async (data: {
    parcelId: string;
    length: number;
    width: number;
    blueprintData: { zones: PlotBlueprintZone[]; partitions: PlotBlueprintPartition[] };
  }): Promise<PlotBlueprint> => plotMapperAPI.saveBlueprint(data),
};
