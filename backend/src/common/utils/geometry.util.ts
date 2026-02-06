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
   * Check if a point is inside a polygon
   */
  static isPointInPolygon(point: Point, polygon: Point[]): boolean {
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
