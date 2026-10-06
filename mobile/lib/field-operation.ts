import { parseFieldOperation, type FieldOperationType } from '../../shared/passport/field-operation';
import type { PendingFieldEntry } from './offline-storage';

export type OperationForm = { occurredAt: string; endedAt: string; materialName: string; quantity: string;
  unit: string; waterLitres: string; areaHa: string; method: string };
export function emptyOperationForm(): OperationForm {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return { occurredAt: local, endedAt: '', materialName: '', quantity: '', unit: 'L', waterLitres: '', areaHa: '', method: '' };
}
export function operationFromForm(type: FieldOperationType, form: OperationForm, notes: string) {
  const number = (value: string) => value.trim() ? Number(value.replace(',', '.')) : undefined;
  return parseFieldOperation({ ...form, type, notes, endedAt: form.endedAt || undefined,
    quantity: number(form.quantity), waterLitres: number(form.waterLitres), areaHa: number(form.areaHa) });
}
export function operationEntryPayload(entry: PendingFieldEntry, farmId: string, photo: string) {
  const operation = parseFieldOperation(entry.operation);
  if (!entry.plantingId) throw Error('Select a planting linked to this activity');
  const material = operation.type === 'SPRAYING' || operation.type === 'FERTILIZING';
  if (material && !entry.materialID?.trim()) throw Error('Material barcode required');
  return { type: operation.type, farmId, clientReference: entry.id,
    ...(material ? { fertilizerBarcode: entry.materialID!.trim() } : {}),
    data: { parcelId: entry.parcelId, plantingId: entry.plantingId, date: operation.occurredAt,
      operation, location: entry.location, photos: [photo], notes: operation.notes,
      capturedAt: entry.timestamp } };
}
