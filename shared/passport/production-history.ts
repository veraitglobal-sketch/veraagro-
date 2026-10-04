export type HistoryDate = Date | string | null | undefined;
export type ProductionEvent = {
  id: string; kind: string; date: string | null; endDate?: string | null;
  recordedAt?: string | null; source: string;
  facts: Array<{ label: string; value: string }>;
  photos?: string[];
};

export function historyDate(value: HistoryDate): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export function sortProductionHistory(events: ProductionEvent[]): ProductionEvent[] {
  return events.sort((a, b) => (a.date ? Date.parse(a.date) : Infinity) -
    (b.date ? Date.parse(b.date) : Infinity) || a.id.localeCompare(b.id));
}
