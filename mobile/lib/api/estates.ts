import api from './client';
import { axiosResponseStatus, isLikelyNetworkError } from '../api-error';
import type { Estate, Parcel } from './types';

export const estatesAPI = {
  getAllPublic: async (): Promise<Estate[]> => {
    try {
      const response = await api.get('/estates/public/all');
      return response.data || [];
    } catch (error: unknown) {
      if (isLikelyNetworkError(error)) {
        console.warn('Backend not available, returning empty estates list');
        return [];
      }
      if (axiosResponseStatus(error) === 404) {
        console.warn('Endpoint not found, returning empty estates list');
        return [];
      }
      console.warn('Error fetching estates:', error instanceof Error ? error.message : error);
      return [];
    }
  },
  getAll: async (): Promise<Estate[]> => {
    const response = await api.get('/estates');
    return response.data || [];
  },
  getOne: async (id: string): Promise<Estate> => {
    const response = await api.get(`/estates/${id}`);
    return response.data;
  },
  getBoundary: async (id: string): Promise<{
    id: string;
    name: string;
    updatedAt: string;
    polygonCoordinates: unknown;
  }> => {
    const response = await api.get(`/estates/${id}/boundary`);
    return response.data;
  },
  create: async (data: { name: string; polygonCoordinates: unknown }): Promise<Estate> => {
    const response = await api.post('/estates', data);
    return response.data;
  },
  update: async (id: string, data: { name?: string; polygonCoordinates?: unknown }): Promise<Estate> => {
    const response = await api.put(`/estates/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/estates/${id}`);
  },
};

export const parcelsAPI = {
  create: async (
    estateId: string,
    data: { polygonCoordinates: unknown; cropType?: string },
  ): Promise<Parcel> => {
    const response = await api.post(`/parcels/estate/${estateId}`, data);
    return response.data;
  },
  getByEstate: async (estateId: string): Promise<Parcel[]> => {
    const response = await api.get(`/parcels/estate/${estateId}`);
    return response.data || [];
  },
};
