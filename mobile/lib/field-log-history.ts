import type { FieldEntry } from './api/types';
import type { FieldLogHistoryItem, PendingPlantingEntry } from './offline-storage';

const BACKEND_TYPE_TO_ACTIVITY: Record<string, FieldLogHistoryItem['activityType']> = {
  SETVA: 'Planting',
  PRIHRANA: 'Fertilizing',
  PRSKANJE: 'Spraying',
  BERBA: 'Harvest',
};

type EntryRow = FieldEntry & {
  parcelId?: string | null;
  plantingId?: string | null;
  materialName?: string | null;
  materialQuantity?: number | null;
  seedSerialNumber?: string | null;
  occurredAt?: string;
  data?: Record<string, unknown>;
};

function plantingPreview(entry: EntryRow, farmName?: string): string {
  const data = entry.data ?? {};
  const bags = Array.isArray(data.bags) ? data.bags : [];
  const bagCount = bags.length || 1;
  const lot = typeof data.lot === 'string' ? data.lot : '';
  const qty = entry.materialQuantity ?? (typeof data.materialQuantity === 'number' ? data.materialQuantity : null);
  const name = entry.materialName ?? (typeof data.materialName === 'string' ? data.materialName : 'seed');
  const bagPart = bagCount > 1 ? ` (${bagCount} bags${lot ? `, lot ${lot}` : ''})` : lot ? ` (lot ${lot})` : '';
  const farmPart = farmName ? ` — ${farmName}` : '';
  return `Planting — ${qty ?? '?'} kg ${name}${bagPart}${farmPart}`;
}

export function fieldEntryToHistoryItem(entry: EntryRow, farmName?: string): FieldLogHistoryItem {
  const data = entry.data ?? {};
  return {
    id: entry.id,
    timestamp: entry.occurredAt ?? entry.createdAt,
    activityType: BACKEND_TYPE_TO_ACTIVITY[entry.type] ?? 'Planting',
    estateId: entry.farmId,
    parcelId: entry.parcelId ?? (typeof data.parcelId === 'string' ? data.parcelId : undefined),
    harvestAnnouncementId:
      entry.plantingId ?? (typeof data.plantingId === 'string' ? data.plantingId : undefined),
    journalNotesPreview:
      entry.type === 'SETVA'
        ? plantingPreview(entry, farmName)
        : `${entry.type} — ${entry.materialName ?? ''}`.trim(),
    materialID: entry.seedSerialNumber ?? undefined,
    materialQuantity: entry.materialQuantity != null ? String(entry.materialQuantity) : undefined,
    status: 'synced',
  };
}

export function pendingPlantingToHistoryItem(row: PendingPlantingEntry, farmName?: string): FieldLogHistoryItem {
  const payload = row.payload as {
    type?: string;
    farmId?: string;
    seedSerialNumber?: string;
    data?: Record<string, unknown>;
  };
  const data = payload.data ?? {};
  const bags = Array.isArray(data.bags) ? data.bags : [];
  const fakeEntry: EntryRow = {
    id: row.id,
    type: payload.type ?? 'SETVA',
    farmId: payload.farmId ?? '',
    parcelId: typeof data.parcelId === 'string' ? data.parcelId : undefined,
    plantingId: typeof data.plantingId === 'string' ? data.plantingId : undefined,
    materialName: typeof data.materialName === 'string' ? data.materialName : undefined,
    materialQuantity:
      typeof data.materialQuantity === 'number' ? data.materialQuantity : bags.reduce((s, b) => s + (b.quantityKg ?? 0), 0),
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
    status: row.status === 'error' ? 'error' : row.status === 'syncing' ? 'syncing' : 'pending',
    error: row.error,
  };
}

export function mergeFieldLogHistory(
  local: FieldLogHistoryItem[],
  api: FieldLogHistoryItem[],
  pending: FieldLogHistoryItem[],
): FieldLogHistoryItem[] {
  const byId = new Map<string, FieldLogHistoryItem>();
  for (const item of [...local, ...api, ...pending]) {
    const prev = byId.get(item.id);
    if (!prev || item.status === 'synced' || (prev.status !== 'synced' && item.timestamp > prev.timestamp)) {
      byId.set(item.id, item);
    }
  }
  return [...byId.values()].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 80);
}
