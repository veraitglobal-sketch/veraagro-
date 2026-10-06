import axios from 'axios';
import api from './client';
import { API_URL } from '../api-url';
import { axiosResponseStatus } from '../api-error';
import type {
  BatchAvailability,
  QualityEntry,
  LogisticsDriverRow,
  LogisticsVehicleRow,
  PackageBadgeType,
} from './types';

export const batchesAPI = {
  getAvailability: async (batchId: string): Promise<BatchAvailability> => {
    try {
      const response = await axios.get(`${API_URL}/batches/${batchId}/availability`);
      return response.data;
    } catch (error: unknown) {
      if (axiosResponseStatus(error) === 404) {
        throw new Error('Batch not found.');
      }
      throw error;
    }
  },
  getAll: async (estateId?: string): Promise<any[]> => {
    const params = estateId ? { estateId } : {};
    const response = await api.get('/batches', { params });
    return Array.isArray(response.data) ? response.data : [];
  },
  getOne: async (batchId: string): Promise<any> => {
    const response = await api.get(`/batches/${batchId}/traceability`);
    return response.data;
  },
  getWorkflow: async (batchId: string): Promise<BatchWorkflowContext> => {
    const response = await api.get(`/batches/${encodeURIComponent(batchId)}/workflow`);
    return response.data;
  },
  getPassportCompleteness: async (batchRef: string) => {
    const response = await api.get(`/batches/${encodeURIComponent(batchRef)}/passport-completeness`);
    return response.data;
  },
  create: async (data: {
    estateId: string;
    parcelId?: string;
    harvestAnnouncementId?: string;
    productName: string;
    quantity: number;
    unit: string;
    harvestDate: string;
  }): Promise<any> => {
    const response = await api.post('/batches', data);
    return response.data;
  },
  recordPackingFlow: async (
    batchRef: string,
    body: {
      latitude: number;
      longitude: number;
      completedAt?: string;
      cratePhotoBase64?: string;
      qualityPhotoBase64?: string;
    },
  ): Promise<{ success: boolean; batchId: string; id: string; photosSaved?: boolean }> => {
    const response = await api.post(`/batches/${encodeURIComponent(batchRef)}/packing-flow`, body);
    return response.data;
  },
};

export const qualityEntryAPI = {
  create: async (data: {
    batchId: string;
    parcelId?: string;
    qualityScore?: number;
    notes?: string;
  }): Promise<QualityEntry> => {
    const response = await api.post('/quality-entry', data);
    return response.data;
  },
  getByBatch: async (batchId: string): Promise<QualityEntry | null> => {
    try {
      const response = await api.get(`/quality-entry/batch/${batchId}`);
      return response.data;
    } catch (error: unknown) {
      if (axiosResponseStatus(error) === 404) {
        return null;
      }
      throw error;
    }
  },
  canCreateShipment: async (batchId: string): Promise<boolean> => {
    const response = await api.get(`/quality-entry/can-create-shipment/${batchId}`);
    return response.data.canCreate || false;
  },
  submitHandoverReceiverProof: async (data: {
    missionId: string;
    receiverName: string;
    receiverSignatureDataUrl?: string;
  }): Promise<{ success: true; receiverProofPdfHash: string; message: string }> => {
    const response = await api.post('/quality-entry/handover/receiver-proof', data);
    return response.data;
  },
  getHandoverReceiverPdf: async (missionId: string): Promise<ArrayBuffer> => {
    const response = await api.get(
      `/quality-entry/handover/mission/${encodeURIComponent(missionId)}/receiver-pdf`,
      { responseType: 'arraybuffer' },
    );
    return response.data;
  },
  submitLoadingHandover: async (data: {
    missionId: string;
    insideTruckTemperature: number;
    palletPhotos: string[];
    truckInteriorPhotos: string[];
    notes?: string;
    pickupDriverId: string;
    pickupBadgePhoto: string;
    pickupDriverSignatureDataUrl: string;
  }): Promise<unknown> => {
    const response = await api.post('/quality-entry/handover', data);
    return response.data;
  },
};

export const logisticsVehiclesAPI = {
  list: async (): Promise<LogisticsVehicleRow[]> => {
    const response = await api.get('/logistics-partner/vehicles');
    return Array.isArray(response.data) ? response.data : [];
  },
  create: async (body: {
    licensePlate: string;
    type: string;
    make?: string;
    model?: string;
    hasFrigo?: boolean;
    tempRangeMin?: number;
    tempRangeMax?: number;
  }): Promise<LogisticsVehicleRow> => {
    const response = await api.post('/logistics-partner/vehicles', body);
    return response.data;
  },
};

export const logisticsDriversAPI = {
  list: async (): Promise<LogisticsDriverRow[]> => {
    const response = await api.get('/logistics-partner/drivers');
    return Array.isArray(response.data) ? response.data : [];
  },
  create: async (body: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  }): Promise<LogisticsDriverRow> => {
    const response = await api.post('/logistics-partner/drivers', body);
    return response.data;
  },
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
  scan: async (serial: string) => {
    const response = await api.get(`/package-badges/scan/${encodeURIComponent(serial)}`);
    return response.data;
  },
  supplierReceiveFromFactory: async (data: { rootSerial: string; printOrderId?: string }) => {
    const response = await api.post('/package-badges/supplier/receive-from-factory', data);
    return response.data;
  },
  supplierTransferToGrower: async (data: {
    rootSerial: string;
    newGrowerUserId?: string;
    farmerQrCode?: string;
    growerPartnerCode?: string;
  }) => {
    const response = await api.post('/package-badges/supplier/transfer-to-grower', data);
    return response.data;
  },
  listSupplierStock: async () => {
    const response = await api.get('/package-badges/supplier/stock');
    return Array.isArray(response.data) ? response.data : [];
  },
  listMyPackages: async () => {
    const response = await api.get('/package-badges/mine/packages');
    return Array.isArray(response.data) ? response.data : [];
  },
  publicResolve: async (serial: string) => {
    const { data } = await axios.get(`${API_URL}/public/badges/${encodeURIComponent(serial)}`);
    return data;
  },
};

export interface BatchWorkflowContext {
  harvestPlan: { id: string; parcelId?: string; sourcePlantingId?: string | null; cropType: string; estimatedDate: string; status: string } | null;
  mission: { id: string; missionNumber: string; status: string; batchId: string | null } | null;
}
