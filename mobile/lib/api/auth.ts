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
