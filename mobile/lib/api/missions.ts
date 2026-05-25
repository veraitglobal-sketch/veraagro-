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

// Missions API
/** Align with Prisma `MissionStatus` (backend). Not `DELIVERED` — use `COMPLETED`. */
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
export const financialDashboardAPI = {
  getDashboard: async (): Promise<FinancialDashboardApiResponse> => {
    const response = await api.get('/financial-dashboard');
    return response.data;
  },
};
