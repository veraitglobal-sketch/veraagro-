import api from './client';
import type {
  AiAssistantResponse,
  DigitalHandover,
  PlotBlueprint,
  PlotBlueprintZone,
  PlotBlueprintPartition,
} from './types';

export const aiAssistantApi = {
  query: async (
    query: string,
    options?: { language?: string; sessionId?: string },
  ): Promise<AiAssistantResponse> => {
    const response = await api.post<AiAssistantResponse>('/ai-assistant/query', {
      query,
      language: options?.language ?? 'en',
      sessionId: options?.sessionId,
    });
    return response.data;
  },
};

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
    revision?: number;
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
