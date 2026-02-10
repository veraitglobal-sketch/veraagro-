import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_ENTRIES_KEY = 'pending_field_entries';
const PENDING_PRODUCTS_KEY = 'pending_products';
const PENDING_COSTS_KEY = 'pending_costs';
const WHITELIST_KEY = 'material_whitelist';

export interface PendingFieldEntry {
  id: string;
  activityType: 'Setva' | 'Đubrenje' | 'Prskanje' | 'Žetva';
  materialID?: string;
  photoUri: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  error?: string;
}

/** Proizvod unet offline (QR ili ručno) – šta proizvod sadrži */
export interface PendingProduct {
  id: string;
  source: 'qr' | 'manual';
  qrCode?: string;
  name: string;
  contents: string; // šta sadrži
  quantity: number;
  unit: string;
  parcelOrEstate?: string;
  timestamp: string;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  error?: string;
}

/** Trošak unet u kalkulator (preneseni proizvod ili ručni iznos) */
export interface PendingCost {
  id: string;
  type: 'product' | 'manual'; // product = prenesen iz Moji proizvodi, manual = korisnik dodao iznos
  productId?: string; // ako type === 'product', referenca na pending/synced product
  label: string; // npr. "Gorivo", "Đubrivo", ili naziv proizvoda
  amount: number;
  currency?: string;
  timestamp: string;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  error?: string;
}

// Mock whitelist - u produkciji bi se učitavala sa servera
const MOCK_WHITELIST = [
  'BIO-001-2024',
  'BIO-002-2024',
  'ORG-FERT-001',
  'ORG-SEED-001',
];

export const offlineStorage = {
  // Get all pending entries
  async getPendingEntries(): Promise<PendingFieldEntry[]> {
    try {
      const data = await AsyncStorage.getItem(PENDING_ENTRIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting pending entries:', error);
      return [];
    }
  },

  // Save pending entry
  async savePendingEntry(entry: Omit<PendingFieldEntry, 'id' | 'timestamp' | 'status'>): Promise<string> {
    try {
      const entries = await this.getPendingEntries();
      const newEntry: PendingFieldEntry = {
        ...entry,
        id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };
      entries.push(newEntry);
      await AsyncStorage.setItem(PENDING_ENTRIES_KEY, JSON.stringify(entries));
      return newEntry.id;
    } catch (error) {
      console.error('Error saving pending entry:', error);
      throw error;
    }
  },

  // Remove entry after sync
  async removeEntry(id: string): Promise<void> {
    try {
      const entries = await this.getPendingEntries();
      const filtered = entries.filter(e => e.id !== id);
      await AsyncStorage.setItem(PENDING_ENTRIES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing entry:', error);
      throw error;
    }
  },

  // Get whitelist
  async getWhitelist(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(WHITELIST_KEY);
      return data ? JSON.parse(data) : MOCK_WHITELIST;
    } catch (error) {
      console.error('Error getting whitelist:', error);
      return MOCK_WHITELIST;
    }
  },

  // Save whitelist
  async saveWhitelist(whitelist: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(WHITELIST_KEY, JSON.stringify(whitelist));
    } catch (error) {
      console.error('Error saving whitelist:', error);
      throw error;
    }
  },

  // --- Pending products (Moji proizvodi) ---
  async getPendingProducts(): Promise<PendingProduct[]> {
    try {
      const data = await AsyncStorage.getItem(PENDING_PRODUCTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting pending products:', error);
      return [];
    }
  },

  async savePendingProduct(entry: Omit<PendingProduct, 'id' | 'timestamp' | 'status'>): Promise<string> {
    try {
      const list = await this.getPendingProducts();
      const newEntry: PendingProduct = {
        ...entry,
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };
      list.push(newEntry);
      await AsyncStorage.setItem(PENDING_PRODUCTS_KEY, JSON.stringify(list));
      return newEntry.id;
    } catch (error) {
      console.error('Error saving pending product:', error);
      throw error;
    }
  },

  async removeProduct(id: string): Promise<void> {
    try {
      const list = await this.getPendingProducts();
      const filtered = list.filter((p) => p.id !== id);
      await AsyncStorage.setItem(PENDING_PRODUCTS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing product:', error);
      throw error;
    }
  },

  async updateProductStatus(id: string, status: PendingProduct['status'], error?: string): Promise<void> {
    try {
      const list = await this.getPendingProducts();
      const item = list.find((p) => p.id === id);
      if (item) {
        item.status = status;
        if (error) item.error = error;
        await AsyncStorage.setItem(PENDING_PRODUCTS_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.error('Error updating product status:', e);
    }
  },

  // --- Pending costs (Kalkulator troškova) ---
  async getPendingCosts(): Promise<PendingCost[]> {
    try {
      const data = await AsyncStorage.getItem(PENDING_COSTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting pending costs:', error);
      return [];
    }
  },

  async savePendingCost(entry: Omit<PendingCost, 'id' | 'timestamp' | 'status'>): Promise<string> {
    try {
      const list = await this.getPendingCosts();
      const newEntry: PendingCost = {
        ...entry,
        id: `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };
      list.push(newEntry);
      await AsyncStorage.setItem(PENDING_COSTS_KEY, JSON.stringify(list));
      return newEntry.id;
    } catch (error) {
      console.error('Error saving pending cost:', error);
      throw error;
    }
  },

  async removeCost(id: string): Promise<void> {
    try {
      const list = await this.getPendingCosts();
      const filtered = list.filter((c) => c.id !== id);
      await AsyncStorage.setItem(PENDING_COSTS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing cost:', error);
      throw error;
    }
  },

  async updateCostStatus(id: string, status: PendingCost['status'], error?: string): Promise<void> {
    try {
      const list = await this.getPendingCosts();
      const item = list.find((c) => c.id === id);
      if (item) {
        item.status = status;
        if (error) item.error = error;
        await AsyncStorage.setItem(PENDING_COSTS_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.error('Error updating cost status:', e);
    }
  },
};
