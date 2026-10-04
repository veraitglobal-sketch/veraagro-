export type FieldOperationType = 'IRRIGATION' | 'INSPECTION' | 'SPRAYING' | 'FERTILIZING';
export const FIELD_OPERATION_TYPES: FieldOperationType[] = ['IRRIGATION', 'INSPECTION', 'SPRAYING', 'FERTILIZING'];
export type FieldOperation = {
  type: FieldOperationType;
  occurredAt: string;
  endedAt?: string;
  materialName?: string;
  quantity?: number;
  unit?: 'L' | 'mL' | 'kg' | 'g';
  waterLitres?: number;
  areaHa?: number;
  method?: string;
  notes?: string;
};

export function parseFieldOperation(input: unknown, now = Date.now()): FieldOperation {
  if (!input || typeof input !== 'object') throw Error('Invalid field operation');
  const v = input as Record<string, unknown>;
  if (!FIELD_OPERATION_TYPES.includes(v.type as FieldOperationType)) throw Error('Invalid activity');
  const date = (value: unknown) => {
    if (typeof value !== 'string' || !value.trim()) throw Error('Activity time is required');
    const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/.exec(value);
    if (!parts) throw Error('Date and time are required');
    const [, year, month, day, hour, minute, second] = parts;
    if (+month < 1 || +month > 12 || +day < 1 || +day > new Date(Date.UTC(+year, +month, 0)).getUTCDate() || +hour > 23 || +minute > 59 || +(second ?? 0) > 59) throw Error('Invalid activity time');
    const d = new Date(value);
    if (!Number.isFinite(d.getTime()) || d.getTime() > now + 300000) throw Error('Invalid activity time');
    return d.toISOString();
  };
  const text = (value: unknown) => typeof value === 'string' ? value.trim().slice(0, 2000) || undefined : undefined;
  const positive = (value: unknown) => {
    if (value == null) return undefined;
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) throw Error('Quantity must be positive');
    return value;
  };
  const result: FieldOperation = { type: v.type as FieldOperationType, occurredAt: date(v.occurredAt) };
  if (v.endedAt) {
    result.endedAt = date(v.endedAt);
    if (result.endedAt < result.occurredAt) throw Error('End precedes start');
  }
  result.notes = text(v.notes);
  result.method = text(v.method);
  result.areaHa = positive(v.areaHa);
  result.waterLitres = positive(v.waterLitres);
  if (result.type === 'IRRIGATION' && !result.waterLitres) throw Error('Water volume is required');
  if (result.type === 'INSPECTION' && !result.notes) throw Error('Inspection findings are required');
  if (result.type === 'SPRAYING' || result.type === 'FERTILIZING') {
    result.materialName = text(v.materialName);
    result.quantity = positive(v.quantity);
    if (!result.materialName || !result.quantity || !['L', 'mL', 'kg', 'g'].includes(String(v.unit))) {
      throw Error('Product, quantity and unit are required');
    }
    result.unit = v.unit as FieldOperation['unit'];
  }
  return result;
}
