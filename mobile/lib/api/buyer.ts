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
    } catch (error: unknown) {
      // If it's a network error, return empty array silently (backend not available)
      if (isLikelyNetworkError(error)) {
        console.warn('Backend not available, returning empty products list');
        return [];
      }
      // If it's a 404, endpoint doesn't exist yet
      if (axiosResponseStatus(error) === 404) {
        console.warn('Endpoint not found, returning empty products list');
        return [];
      }
      // For other errors, log but still return empty array to prevent UI errors
      console.warn('Error fetching products:', error instanceof Error ? error.message : error);
      return [];
    }
  },
};
