import { offlineStorage } from './offline-storage';
import i18n from '../i18n/config';

export interface FarmBoundary {
  polygonCoordinates: Array<{ lat: number; lng: number }>;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

/** Must match backend default (see GPS_BOUNDARY_TOLERANCE_METERS). */
const DEFAULT_BOUNDARY_TOLERANCE_M = 80;

/** Same shapes as backend `GeometryUtil.polygonFromJson`. */
function polygonFromJson(coords: unknown): Array<{ lat: number; lng: number }> {
  if (coords == null) return [];

  if (typeof coords === 'object' && !Array.isArray(coords)) {
    const o = coords as Record<string, unknown>;
    if (o.type === 'Polygon' && Array.isArray(o.coordinates)) {
      const rings = o.coordinates as number[][][];
      const ring = rings[0];
      if (Array.isArray(ring)) {
        return ring
          .map((pt) => {
            if (Array.isArray(pt) && pt.length >= 2 && typeof pt[0] === 'number' && typeof pt[1] === 'number') {
              return { lng: pt[0], lat: pt[1] };
            }
            return null;
          })
          .filter(
            (x): x is { lat: number; lng: number } =>
              x !== null && Number.isFinite(x.lat) && Number.isFinite(x.lng),
          );
      }
    }
    if (typeof o.lat === 'number' && typeof o.lng === 'number') {
      return Number.isFinite(o.lat) && Number.isFinite(o.lng) ? [{ lat: o.lat, lng: o.lng }] : [];
    }
  }

  if (!Array.isArray(coords) || coords.length === 0) return [];

  const first = coords[0];
  if (Array.isArray(first) && typeof (first as number[])[0] === 'number') {
    return (coords as number[][])
      .map((pt) =>
        Array.isArray(pt) && pt.length >= 2 ? { lng: pt[0], lat: pt[1] } : null,
      )
      .filter(
        (x): x is { lat: number; lng: number } =>
          x !== null && Number.isFinite(x.lat) && Number.isFinite(x.lng),
      );
  }
  if (Array.isArray(first) && Array.isArray((first as unknown[])[0])) {
    const ring = coords[0] as number[][];
    return ring
      .map((pt) =>
        Array.isArray(pt) && pt.length >= 2 ? { lng: pt[0], lat: pt[1] } : null,
      )
      .filter(
        (x): x is { lat: number; lng: number } =>
          x !== null && Number.isFinite(x.lat) && Number.isFinite(x.lng),
      );
  }

  return (coords as unknown[])
    .map((p: unknown) => {
      const obj = p as Record<string, unknown>;
      if (typeof obj?.lat === 'number' && typeof obj?.lng === 'number') {
        return { lat: obj.lat, lng: obj.lng };
      }
      const arr = p as number[];
      if (Array.isArray(arr) && arr.length >= 2) {
        return { lng: arr[0], lat: arr[1] };
      }
      return null;
    })
    .filter(
      (x): x is { lat: number; lng: number } =>
        x !== null && Number.isFinite(x.lat) && Number.isFinite(x.lng),
    );
}

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

function minDistanceToPolygonBoundaryMeters(
  point: { lat: number; lng: number },
  polygon: Array<{ lat: number; lng: number }>,
): number {
  if (polygon.length < 2) return Infinity;
  let n = polygon.length;
  if (
    n >= 2 &&
    polygon[0].lat === polygon[n - 1].lat &&
    polygon[0].lng === polygon[n - 1].lng
  ) {
    n -= 1;
  }
  if (n < 2) return Infinity;
  const samples = 24;
  let min = Infinity;
  for (let i = 0; i < n; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % n];
    for (let s = 0; s <= samples; s++) {
      const t = s / samples;
      const lat = a.lat + t * (b.lat - a.lat);
      const lng = a.lng + t * (b.lng - a.lng);
      const d = haversineMeters(point, { lat, lng });
      if (d < min) min = d;
    }
  }
  return min;
}

function isPointInPolygon(
  lat: number,
  lng: number,
  polygon: Array<{ lat: number; lng: number }>,
): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Point inside polygon or within tolerance of edge (aligned with server GPS checks).
 */
export function verifyGPS(userLocation: UserLocation, farmBoundary: FarmBoundary): boolean {
  const { lat, lng } = userLocation;
  const polygon = farmBoundary.polygonCoordinates;

  if (polygon.length < 3) {
    return false;
  }

  if (isPointInPolygon(lat, lng, polygon)) {
    return true;
  }

  const acc =
    typeof userLocation.accuracy === 'number' && userLocation.accuracy > 0
      ? userLocation.accuracy
      : 0;
  const toleranceM = Math.max(DEFAULT_BOUNDARY_TOLERANCE_M, acc + 30);
  return minDistanceToPolygonBoundaryMeters({ lat, lng }, polygon) <= toleranceM;
}

/**
 * Estate ring and/or parcel rings — mirrors server rule: inside any boundary counts as valid.
 * Accepts the same JSON shapes as the API (GeoJSON, [lng,lat][], [{lat,lng}], …).
 */
export function verifyGPSAgainstEstateOrParcels(
  userLocation: UserLocation,
  estatePolygonRaw: unknown,
  parcelPolygonsRaw: unknown[],
): boolean {
  const estatePolygon = polygonFromJson(estatePolygonRaw);
  const parcelPolygons = parcelPolygonsRaw.map((raw) => polygonFromJson(raw));

  const acc =
    typeof userLocation.accuracy === 'number' && userLocation.accuracy > 0
      ? userLocation.accuracy
      : 0;
  const toleranceM = Math.max(DEFAULT_BOUNDARY_TOLERANCE_M, acc + 30);

  const tryRing = (ring: Array<{ lat: number; lng: number }>): boolean => {
    if (ring.length === 0) return false;
    if (ring.length === 1) {
      return haversineMeters(userLocation, ring[0]) <= Math.max(100, toleranceM);
    }
    if (ring.length >= 3) {
      return verifyGPS(userLocation, { polygonCoordinates: ring });
    }
    return false;
  };

  if (tryRing(estatePolygon)) return true;
  for (const pp of parcelPolygons) {
    if (tryRing(pp)) return true;
  }

  const anyBoundary =
    estatePolygon.length > 0 || parcelPolygons.some((p) => p.length > 0);
  if (!anyBoundary) return true;
  return false;
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
    return { valid: false, message: i18n.t('integrity.barcodeRequired') };
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

  // For fertilizers/pesticides, check local whitelist first
  const whitelist = await offlineStorage.getWhitelist();
  if (whitelist.includes(trimmedBarcode)) {
    return { valid: true };
  }

  // Then check supplier-registered material units (goods-in) on the server
  try {
    const { API_URL } = await import('./api-url');
    const res = await fetch(
      `${API_URL}/b2b-suppliers/public/material-barcodes/lookup?code=${encodeURIComponent(trimmedBarcode)}`,
      { method: 'GET' },
    );
    if (res.ok) {
      const data = (await res.json()) as {
        registered?: boolean;
        status?: string;
        businessName?: string | null;
        productName?: string | null;
        message?: string;
      };
      if (data.registered) {
        if (data.status === 'VOID') {
          return { valid: false, message: i18n.t('integrity.voidBarcode') };
        }
        const label =
          [data.businessName, data.productName].filter(Boolean).join(' · ') ||
          i18n.t('integrity.supplierRegisteredDefault');
        return { valid: true, message: `${label} (${data.status})` };
      }
    }
  } catch {
    // offline / server down — fall through
  }

  return {
    valid: false,
    message: i18n.t('integrity.notWhitelisted'),
  };
}
