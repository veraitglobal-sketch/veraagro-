import api from './client';
import { Platform } from 'react-native';
import type { DocumentPickerAsset } from 'expo-document-picker';

export type GrowerCatalogProduct = {
  id: string;
  name: string;
  variety: string | null;
  description: string | null;
  storageConditions: string | null;
  imageUrl: string | null;
  estateId: string | null;
  sourcePlantingId: string | null;
  plannedQuantityKg: number;
  status: string;
};

export const growerCatalogAPI = {
  documents: async (catalogProductId: string): Promise<Array<{ id: string; title: string; verificationStatus: string }>> =>
    (await api.get('/passport-documents/grower', { params: { catalogProductId } })).data,
  uploadDocument: async (asset: DocumentPickerAsset, fields: Record<string, string>) => {
    const body = new FormData();
    Object.entries(fields).forEach(([key, value]) => { if (value) body.append(key, value); });
    if (Platform.OS === 'web') {
      body.append('file', asset.file ?? await (await fetch(asset.uri)).blob(), asset.name);
    } else {
      body.append('file', { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/pdf' } as unknown as Blob);
    }
    return (await api.post('/passport-documents/grower', body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  },
  list: async (): Promise<GrowerCatalogProduct[]> => {
    const response = await api.get('/catalog/grower/products');
    return Array.isArray(response.data) ? response.data : [];
  },
  create: async (body: Record<string, unknown>) => {
    const response = await api.post('/catalog/grower/products', body);
    return response.data;
  },
  update: async (id: string, body: Record<string, unknown>) => {
    const response = await api.patch(`/catalog/grower/products/${encodeURIComponent(id)}`, body);
    return response.data;
  },
};
