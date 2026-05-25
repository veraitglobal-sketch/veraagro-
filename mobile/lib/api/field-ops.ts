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

// Field Entries API
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
