import api from './client';
import type { CatalogPackOption } from './types';

export type CatalogProduct = {
  id: string;
  productName: string;
  name: string;
  category?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  unit: string;
  quantity: number;
  availableKg: number;
  availableUntil?: string | null;
  estate?: { id: string; name: string };
  catalogProduct: true;
  packOptions: CatalogPackOption[];
};

export const catalogAPI = {
  listProducts: async (): Promise<CatalogProduct[]> => {
    const response = await api.get('/catalog/products');
    return Array.isArray(response.data) ? response.data : [];
  },
  getProduct: async (id: string): Promise<CatalogProduct> => {
    const response = await api.get(`/catalog/products/${encodeURIComponent(id)}`);
    return response.data;
  },
};
