import { parseFieldOperation } from '../../shared/passport/field-operation';
import { formatWeatherObservationPreview } from '../../shared/passport/weather-entry';
import { parseWeatherObservation } from '../../shared/passport/weather-observation';
import type { FieldEntry } from './api/types';
import type { FieldLogHistoryItem, PendingPlantingEntry, PendingWeatherObservation } from './offline-storage';

const BACKEND_TYPE_TO_ACTIVITY: Record<string, FieldLogHistoryItem['activityType']> = {
  SETVA: 'Planting',
  PRIHRANA: 'Fertilizing',
  PRSKANJE: 'Spraying',
  BERBA: 'Harvest',
  SPRAYING: 'Spraying',
  FERTILIZING: 'Fertilizing',
  IRRIGATION: 'Irrigation',
  INSPECTION: 'Inspection',
  WEATHER: 'Weather',
};

type EntryRow = FieldEntry & {
  parcelId?: string | null;
  plantingId?: string | null;
  materialName?: string | null;
  materialQuantity?: number | null;
  materialUnit?: string | null;
  seedSerialNumber?: string | null;
  areaHa?: number | null;
  occurredAt?: string;
  clientReference?: string | null;
  notes?: string | null;
  data?: Record<string, unknown>;
};

function plantingPreview(entry: EntryRow, farmName?: string): string {
  const data = entry.data ?? {};
  const bags = Array.isArray(data.bags) ? data.bags : [];
  const bagCount = bags.length || 1;
  const lot = typeof data.lot === 'string' ? data.lot : '';
  const qty = entry.materialQuantity ?? (typeof data.materialQuantity === 'number' ? data.materialQuantity : null);
  const name = entry.materialName ?? (typeof data.materialName === 'string' ? data.materialName : 'seed');
  const bagPart = lot
    ? ` (${bagCount} bag${bagCount === 1 ? '' : 's'}, lot ${lot})`
    : bagCount > 1
      ? ` (${bagCount} bags)`
      : bagCount === 1
        ? ' (1 bag)'
        : '';
  const farmPart = farmName ? ` — ${farmName}` : '';
  return `Planting — ${qty ?? '?'} kg ${name}${bagPart}${farmPart}`;
}

function buildDetailData(entry: EntryRow): FieldLogHistoryItem['detailData'] {
  const data = entry.data ?? {};
  const bags = Array.isArray(data.bags)
    ? data.bags.map((b) => ({
        serial: typeof b.serial === 'string' ? b.serial : '',
        quantityKg: typeof b.quantityKg === 'number' ? b.quantityKg : undefined,
      }))
    : entry.seedSerialNumber
      ? [{ serial: entry.seedSerialNumber, quantityKg: entry.materialQuantity ?? undefined }]
      : [];
  const loc = data.location as { lat?: number; lng?: number } | undefined;
  return {
    operation: (() => { try { return parseFieldOperation(data.operation); } catch { return undefined; } })(),
    type: entry.type,
    bags,
    parcelId: entry.parcelId ?? (typeof data.parcelId === 'string' ? data.parcelId : undefined),
    areaHa: entry.areaHa ?? (typeof data.areaHa === 'number' ? data.areaHa : undefined),
    date: entry.occurredAt ?? (typeof data.date === 'string' ? data.date : undefined),
    lat: loc?.lat ?? undefined,
    lng: loc?.lng ?? undefined,
    notes: typeof data.notes === 'string' ? data.notes : undefined,
    photos: Array.isArray(data.photos) ? data.photos.filter((p) => typeof p === 'string') : [],
    materialName: entry.materialName ?? undefined,
    materialQuantity: entry.materialQuantity ?? undefined,
    materialUnit: entry.materialUnit ?? undefined,
  };
}

export function fieldEntryToHistoryItem(entry: EntryRow, farmName?: string): FieldLogHistoryItem {
  const data = entry.data ?? {};
  if (entry.type === 'WEATHER' && data.weather) {
    try {
      const weather = parseWeatherObservation(data.weather);
      const notes = typeof data.notes === 'string' ? data.notes : entry.notes ?? undefined;
      return {
        id: entry.id,
        clientReference: entry.clientReference ?? undefined,
        timestamp: weather.from,
        activityType: 'Weather',
        estateId: entry.farmId,
        parcelId: entry.parcelId ?? (typeof data.parcelId === 'string' ? data.parcelId : undefined),
        harvestAnnouncementId:
          entry.plantingId ?? (typeof data.plantingId === 'string' ? data.plantingId : undefined),
        journalNotesPreview: formatWeatherObservationPreview(weather, notes),
        status: 'synced',
        detailData: {
          type: 'WEATHER',
          weather,
          notes,
          date: weather.from,
        },
      };
    } catch {
      /* fall through to generic preview */
    }
  }
  return {
    id: entry.id,
    clientReference: entry.clientReference ?? undefined,
    timestamp: entry.occurredAt ?? entry.createdAt,
    activityType: BACKEND_TYPE_TO_ACTIVITY[entry.type] ?? 'Planting',
    estateId: entry.farmId,
    parcelId: entry.parcelId ?? (typeof data.parcelId === 'string' ? data.parcelId : undefined),
    harvestAnnouncementId:
      entry.plantingId ?? (typeof data.plantingId === 'string' ? data.plantingId : undefined),
    journalNotesPreview:
      entry.type === 'SETVA'
        ? plantingPreview(entry, farmName)
        : [entry.materialName, typeof data.notes === 'string' ? data.notes : ''].filter(Boolean).join(' — '),
    materialID: entry.seedSerialNumber ?? undefined,
    materialQuantity: entry.materialQuantity != null ? String(entry.materialQuantity) : undefined,
    status: 'synced',
    detailData: buildDetailData(entry),
  };
}

export function pendingWeatherToHistoryItem(row: PendingWeatherObservation): FieldLogHistoryItem {
  const weather = row.payload.data.weather;
  return {
    id: row.id,
    clientReference: row.id,
    timestamp: weather.from,
    activityType: 'Weather',
    estateId: row.farmId,
    parcelId: row.parcelId,
    harvestAnnouncementId: row.plantingId,
    journalNotesPreview: formatWeatherObservationPreview(weather, row.payload.data.notes),
    status: row.status === 'error' ? 'error' : row.status === 'syncing' ? 'syncing' : 'pending',
    error: row.error,
    detailData: {
      type: 'WEATHER',
      weather,
      notes: row.payload.data.notes,
      date: row.payload.data.date,
    },
  };
}

export function pendingPlantingToHistoryItem(row: PendingPlantingEntry, farmName?: string): FieldLogHistoryItem {
  const payload = row.payload as {
    type?: string;
    farmId?: string;
    clientReference?: string;
    seedSerialNumber?: string;
    data?: Record<string, unknown>;
  };
  const data = payload.data ?? {};
  const bags = Array.isArray(data.bags) ? data.bags : [];
  const fakeEntry: EntryRow = {
    id: row.id,
    type: payload.type ?? 'SETVA',
    farmId: payload.farmId ?? '',
    clientReference: payload.clientReference ?? row.id,
    parcelId: typeof data.parcelId === 'string' ? data.parcelId : undefined,
    plantingId: typeof data.plantingId === 'string' ? data.plantingId : undefined,
    materialName: typeof data.materialName === 'string' ? data.materialName : undefined,
    materialQuantity:
      typeof data.materialQuantity === 'number' ? data.materialQuantity : bags.reduce((s, b) => s + (b.quantityKg ?? 0), 0),
    materialUnit: typeof data.materialUnit === 'string' ? data.materialUnit : 'kg',
    areaHa: typeof data.areaHa === 'number' ? data.areaHa : undefined,
    seedSerialNumber: payload.seedSerialNumber,
    occurredAt: typeof data.date === 'string' ? data.date : row.timestamp,
    createdAt: row.timestamp,
    data: {
      ...data,
      date: typeof data.date === 'string' ? data.date : row.timestamp,
    },
  };
  return {
    ...fieldEntryToHistoryItem(fakeEntry, farmName),
    id: row.id,
    clientReference: payload.clientReference ?? row.id,
    status: row.status === 'error' ? 'error' : row.status === 'syncing' ? 'syncing' : 'pending',
    error: row.error,
  };
}

function mergeKey(item: FieldLogHistoryItem): string {
  const ref = item.clientReference?.trim();
  return ref || item.id;
}

export function mergeFieldLogHistory(
  local: FieldLogHistoryItem[],
  api: FieldLogHistoryItem[],
  pending: FieldLogHistoryItem[],
): FieldLogHistoryItem[] {
  const byKey = new Map<string, FieldLogHistoryItem>();
  for (const item of [...local, ...api, ...pending]) {
    const key = mergeKey(item);
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, item);
      continue;
    }
    if (prev.status === 'synced' && item.status !== 'synced') continue;
    if (item.status === 'synced') {
      byKey.set(key, item);
      continue;
    }
    if (item.timestamp.localeCompare(prev.timestamp) > 0) {
      byKey.set(key, item);
    }
  }
  return [...byKey.values()].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 20);
}
