import { offlineStorage } from './offline-storage';

export interface FarmBoundary {
  polygonCoordinates: Array<{ lat: number; lng: number }>;
}

export interface UserLocation {
  lat: number;
  lng: number;
}

/**
 * Verify if user location is within farm boundaries
 * Uses point-in-polygon algorithm
 */
export function verifyGPS(userLocation: UserLocation, farmBoundary: FarmBoundary): boolean {
  const { lat, lng } = userLocation;
  const polygon = farmBoundary.polygonCoordinates;

  if (polygon.length < 3) {
    return false; // Invalid polygon
  }

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect = ((yi > lat) !== (yj > lat)) && 
                     (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Validate material barcode against whitelist
 * For seeds, validates against database
 */
export async function materialValidator(
  barcode: string,
  type?: 'SEED' | 'FERTILIZER' | 'PESTICIDE'
): Promise<{ valid: boolean; message?: string }> {
  if (!barcode || barcode.trim().length === 0) {
    return { valid: false, message: 'Barkod je obavezan' };
  }

  const trimmedBarcode = barcode.trim();

  // If it's a seed (starts with SEED- or looks like seed code), validate against database
  if (type === 'SEED' || trimmedBarcode.toUpperCase().startsWith('SEED')) {
    try {
      const { seedsAPI } = await import('./api');
      const result = await seedsAPI.validate(trimmedBarcode);
      return { 
        valid: true, 
        message: `Seed validated: ${result.seed?.name || trimmedBarcode}` 
      };
    } catch (error: any) {
      // Handle network errors gracefully
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        return { 
          valid: false, 
          message: 'Cannot connect to server. Please check your internet connection.' 
        };
      }
      // Handle API errors
      const errorMessage = error.response?.data?.message || error.message || 'Seed not found or invalid';
      return { 
        valid: false, 
        message: errorMessage
      };
    }
  }

  // For fertilizers/pesticides, check whitelist
  const whitelist = await offlineStorage.getWhitelist();
  const isValid = whitelist.includes(trimmedBarcode);

  if (!isValid) {
    return { 
      valid: false, 
      message: 'Materijal nije na whitelist-i. Kontaktirajte administratora.' 
    };
  }

  return { valid: true };
}
