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

// Notifications API
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
