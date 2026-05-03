/** Helpers for sketching parcel / estate polygons on react-native-maps (tap vs freehand). */

export type MapLonLat = { lat: number; lng: number };

const EARTH_R_M = 6_371_000;

export function haversineMeters(a: MapLonLat, b: MapLonLat): number {
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return EARTH_R_M * c;
}

/** During onPanDrag, keep stroke lightweight by sampling ~every minMeters. */
export function appendPanSample(
  stroke: MapLonLat[],
  lat: number,
  lng: number,
  minMeters = 5,
): MapLonLat[] {
  const p: MapLonLat = { lat, lng };
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return stroke;
  if (stroke.length === 0) return [p];
  const last = stroke[stroke.length - 1];
  if (haversineMeters(last, p) >= minMeters) return [...stroke, p];
  return stroke;
}

type XY = { x: number; y: number };

function projectM(p: MapLonLat, refLatDeg: number): XY {
  const cos = Math.cos((refLatDeg * Math.PI) / 180);
  const x = ((p.lng * Math.PI) / 180) * EARTH_R_M * cos;
  const y = ((p.lat * Math.PI) / 180) * EARTH_R_M;
  return { x, y };
}

function distPointSegM(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const ab2 = abx * abx + aby * aby;
  if (ab2 < 1e-12) return Math.hypot(apx, apy);
  let t = (apx * abx + apy * aby) / ab2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * abx;
  const cy = ay + t * aby;
  return Math.hypot(px - cx, py - cy);
}

function rdpKeeps(points: MapLonLat[], epsilonM: number): boolean[] {
  const n = points.length;
  if (n <= 2) return Array.from({ length: n }, () => true);
  const refLat = points.reduce((s, q) => s + q.lat, 0) / n;
  const proj = points.map((pt) => projectM(pt, refLat));
  const keep = Array.from({ length: n }, () => false);
  keep[0] = true;
  keep[n - 1] = true;

  function recurse(i0: number, i1: number) {
    if (i1 <= i0 + 1) return;
    const a = proj[i0];
    const b = proj[i1];
    let maxD = 0;
    let maxIdx = i0;
    for (let i = i0 + 1; i < i1; i++) {
      const d = distPointSegM(proj[i].x, proj[i].y, a.x, a.y, b.x, b.y);
      if (d > maxD) {
        maxD = d;
        maxIdx = i;
      }
    }
    if (maxD > epsilonM) {
      keep[maxIdx] = true;
      recurse(i0, maxIdx);
      recurse(maxIdx, i1);
    }
  }

  recurse(0, n - 1);
  return keep;
}

export function simplifyRdpMeters(points: MapLonLat[], epsilonM: number): MapLonLat[] {
  if (points.length <= 2) return points.slice();
  const keep = rdpKeeps(points, epsilonM);
  const out: MapLonLat[] = [];
  for (let i = 0; i < points.length; i++) if (keep[i]) out.push(points[i]);
  return out.length >= 2 ? out : points.slice();
}

export type FinalizeFreehandResult =
  | { ok: true; ring: MapLonLat[] }
  | { ok: false; reason: 'few' | 'open' };

/**
 * Cheap ring from a finger stroke: simplify, require min vertices, and that the loop is nearly closed.
 */
export function finalizeFreehandRing(
  stroke: MapLonLat[],
  opts?: { simplifyMeters?: number; minPoints?: number; maxOpenGapMeters?: number },
): FinalizeFreehandResult {
  const simplifyM = opts?.simplifyMeters ?? 12;
  const minPts = opts?.minPoints ?? 3;
  const maxGap = opts?.maxOpenGapMeters ?? 80;

  if (stroke.length < minPts) return { ok: false, reason: 'few' };
  const ring = simplifyRdpMeters(stroke, simplifyM);
  if (ring.length < minPts) return { ok: false, reason: 'few' };
  const gap = haversineMeters(ring[0], ring[ring.length - 1]);
  if (gap > maxGap) return { ok: false, reason: 'open' };
  return { ok: true, ring };
}
