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

// Orders API
export const ordersAPI = {
  create: async (data: {
    estateId?: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    deliveryAddress: any;
    deliveryNotes?: string;
  }): Promise<Order> => {
    const response = await api.post('/orders', data);
    return response.data;
  },
  
  getAll: async (): Promise<Order[]> => {
    const response = await api.get('/orders');
    return response.data || [];
  },
  
  getOne: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
};

/**
 * Same payload as web /passport — GET /qr/verify/:batchId (full traceability).
 */
export const passportAPI = {
  getByBatchId: async (batchId: string): Promise<ProductPassport> => {
    try {
      const id = encodeURIComponent(batchId);
      const response = await axios.get(`${API_URL}/qr/verify/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (axiosResponseStatus(error) === 404) {
        throw new Error('Batch not found. Invalid QR code.');
      }
      throw error;
    }
  },
};
