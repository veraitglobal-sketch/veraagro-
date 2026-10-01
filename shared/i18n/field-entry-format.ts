/** Field diary row preview — shared by web + mobile grower field diary. */

export type FieldEntryRow = {
  id: string;
  type: string;
  farmId: string;
  createdAt: string;
  occurredAt?: string | null;
  parcelId?: string | null;
  plantingId?: string | null;
  materialName?: string | null;
  materialQuantity?: number | null;
  materialUnit?: string | null;
  seedSerialNumber?: string | null;
  areaHa?: number | null;
  clientReference?: string | null;
  data?: Record<string, unknown> | null;
};

const TYPE_LABEL: Record<string, string> = {
  SETVA: 'Planting',
  PRIHRANA: 'Fertilizing',
  PRSKANJE: 'Spraying',
  BERBA: 'Harvest',
};

export function fieldEntryActivityLabel(type: string): string {
  return TYPE_LABEL[type?.toUpperCase()] ?? type;
}

function plantingPreview(entry: FieldEntryRow, farmName?: string): string {
  const data = entry.data ?? {};
  const bags = Array.isArray(data.bags) ? data.bags : [];
  const bagCount = bags.length || 1;
  const lot = typeof data.lot === 'string' ? data.lot : '';
  const qty =
    entry.materialQuantity ??
    (typeof data.materialQuantity === 'number' ? data.materialQuantity : null);
  const name =
    entry.materialName ??
    (typeof data.materialName === 'string' ? data.materialName : 'seed');
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

/** List row: "Planting — 5 kg Bio Vera Raspberry seed (1 bag, lot NS2606)" */
export function formatFieldEntryPreview(entry: FieldEntryRow, farmName?: string): string {
  if (entry.type === 'SETVA') return plantingPreview(entry, farmName);
  const name = entry.materialName ?? '';
  return `${fieldEntryActivityLabel(entry.type)} — ${name}`.trim();
}

export function fieldEntryDetailData(entry: FieldEntryRow) {
  const data = entry.data ?? {};
  const bags = Array.isArray(data.bags)
    ? data.bags.map((b: { serial?: string; quantityKg?: number }) => ({
        serial: typeof b.serial === 'string' ? b.serial : '',
        quantityKg: typeof b.quantityKg === 'number' ? b.quantityKg : undefined,
      }))
    : entry.seedSerialNumber
      ? [{ serial: entry.seedSerialNumber, quantityKg: entry.materialQuantity ?? undefined }]
      : [];
  const loc = data.location as { lat?: number; lng?: number } | undefined;
  return {
    type: entry.type,
    bags,
    parcelId:
      entry.parcelId ?? (typeof data.parcelId === 'string' ? data.parcelId : undefined),
    areaHa: entry.areaHa ?? (typeof data.areaHa === 'number' ? data.areaHa : undefined),
    date: entry.occurredAt ?? (typeof data.date === 'string' ? data.date : undefined),
    lat: loc?.lat,
    lng: loc?.lng,
    notes: typeof data.notes === 'string' ? data.notes : undefined,
    photos: Array.isArray(data.photos)
      ? data.photos.filter((p): p is string => typeof p === 'string')
      : [],
    materialName: entry.materialName ?? undefined,
    materialQuantity: entry.materialQuantity ?? undefined,
    materialUnit: entry.materialUnit ?? undefined,
  };
}
