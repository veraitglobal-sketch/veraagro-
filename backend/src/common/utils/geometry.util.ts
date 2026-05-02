/**
 * Geometry utilities for GPS polygon calculations
 * Used for Smart-Lock validation (area matching)
 */

export interface Point {
  lat: number;
  lng: number;
}

export class GeometryUtil {
  /**
   * Calculate area of a polygon using Shoelace formula
   * Returns area in square meters
   */
  static calculatePolygonArea(points: Point[]): number {
    if (points.length < 3) {
      return 0;
    }

    // Close the polygon if not already closed
    const closedPoints = [...points];
    if (
      closedPoints[0].lat !== closedPoints[closedPoints.length - 1].lat ||
      closedPoints[0].lng !== closedPoints[closedPoints.length - 1].lng
    ) {
      closedPoints.push(closedPoints[0]);
    }

    let area = 0;
    const earthRadius = 6371000; // Earth radius in meters

    for (let i = 0; i < closedPoints.length - 1; i++) {
      const p1 = closedPoints[i];
      const p2 = closedPoints[i + 1];

      // Convert to radians
      const lat1 = (p1.lat * Math.PI) / 180;
      const lng1 = (p1.lng * Math.PI) / 180;
      const lat2 = (p2.lat * Math.PI) / 180;
      const lng2 = (p2.lng * Math.PI) / 180;

      // Calculate area using spherical excess formula (simplified)
      area +=
        ((lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2))) *
        (earthRadius * earthRadius);
    }

    return Math.abs(area) / 2;
  }

/**
 * Normalize estate/parcel `polygonCoordinates` JSON (Prisma Json) to points for point-in-polygon.
 * Supports: [{lat,lng}], GeoJSON ring [[lng,lat],...], Polygon { type, coordinates }.
 */
  static polygonFromJson(coords: unknown): Point[] {
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
            .filter((x): x is Point => x !== null && Number.isFinite(x.lat) && Number.isFinite(x.lng));
        }
      }
      if (typeof o.lat === 'number' && typeof o.lng === 'number') {
        return Number.isFinite(o.lat) && Number.isFinite(o.lng) ? [{ lat: o.lat, lng: o.lng }] : [];
      }
    }

    if (!Array.isArray(coords) || coords.length === 0) return [];

    const first = coords[0];
    // Nested ring: [[lng,lat], [lng,lat], ...]
    if (Array.isArray(first) && typeof first[0] === 'number') {
      return (coords as number[][])
        .map((pt) =>
          Array.isArray(pt) && pt.length >= 2 ? { lng: pt[0], lat: pt[1] } : null,
        )
        .filter((x): x is Point => x !== null && Number.isFinite(x.lat) && Number.isFinite(x.lng));
    }
    // Double-nested: [[[lng,lat],...]] (some stored rings)
    if (Array.isArray(first) && Array.isArray(first[0])) {
      const ring = coords[0] as number[][];
      return ring
        .map((pt) =>
          Array.isArray(pt) && pt.length >= 2 ? { lng: pt[0], lat: pt[1] } : null,
        )
        .filter((x): x is Point => x !== null && Number.isFinite(x.lat) && Number.isFinite(x.lng));
    }

    return (coords as unknown[])
      .map((p: unknown) => {
        const o = p as Record<string, unknown>;
        if (typeof o?.lat === 'number' && typeof o?.lng === 'number') {
          return { lat: o.lat, lng: o.lng };
        }
        const arr = p as number[];
        if (Array.isArray(arr) && arr.length >= 2) {
          return { lng: arr[0], lat: arr[1] };
        }
        return null;
      })
      .filter((x): x is Point => x !== null && Number.isFinite(x.lat) && Number.isFinite(x.lng));
  }

  /**
   * Check if a point is inside a polygon
   */
  static isPointInPolygon(point: Point, polygon: Point[]): boolean {
    if (!polygon || polygon.length < 3) {
      return false;
    }
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng;
      const yi = polygon[i].lat;
      const xj = polygon[j].lng;
      const yj = polygon[j].lat;

      const intersect =
        yi > point.lat !== yj > point.lat &&
        point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }
    return inside;
  }

  /**
   * Minimum great-circle distance from point to polygon edges (sampled segments).
   * Handles rings where first vertex repeats last.
   */
  static minDistanceToPolygonBoundaryMeters(point: Point, polygon: Point[]): number {
    if (!polygon || polygon.length < 2) {
      return Infinity;
    }
    let n = polygon.length;
    if (
      n >= 2 &&
      polygon[0].lat === polygon[n - 1].lat &&
      polygon[0].lng === polygon[n - 1].lng
    ) {
      n -= 1;
    }
    if (n < 2) {
      return Infinity;
    }
    let min = Infinity;
    for (let i = 0; i < n; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % n];
      const d = this.distancePointToSegmentMeters(point, a, b);
      if (d < min) min = d;
    }
    return min;
  }

  /** Approximate distance from point to segment AB by sampling (good enough for boundary tolerance). */
  static distancePointToSegmentMeters(p: Point, a: Point, b: Point, samples = 24): number {
    let minD = Infinity;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const lat = a.lat + t * (b.lat - a.lat);
      const lng = a.lng + t * (b.lng - a.lng);
      const d = this.calculateDistance(p, { lat, lng });
      if (d < minD) minD = d;
    }
    return minD;
  }

  /** Inside polygon, or within tolerance meters of its boundary (typical phone GPS error). */
  static isPointInPolygonOrWithinBoundaryMeters(
    point: Point,
    polygon: Point[],
    toleranceMeters: number,
  ): boolean {
    if (!polygon || polygon.length < 3 || toleranceMeters < 0) {
      return false;
    }
    if (this.isPointInPolygon(point, polygon)) {
      return true;
    }
    if (toleranceMeters === 0) {
      return false;
    }
    return this.minDistanceToPolygonBoundaryMeters(point, polygon) <= toleranceMeters;
  }

  /**
   * Calculate distance between two GPS points (Haversine formula)
   * Returns distance in meters
   */
  static calculateDistance(point1: Point, point2: Point): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
