import { useState, useCallback, useRef } from 'react';
import { batchesAPI } from '../../../lib/api';
import { theme } from '../../../lib/theme';
import { useFocusEffect } from '@react-navigation/native';

/** API returns { batch, traceability }; the detail screen expects a merged flat object. */
function mergeBatchTraceabilityResponse(
  data: { batch?: Record<string, unknown>; traceability?: Record<string, unknown> } | null,
): any | null {
  if (!data?.batch) return null;
  const b = data.batch;
  const t = data.traceability || {};
  const loc = t.currentLocation as
    | { hubId?: string; hubName?: string; city?: string }
    | string
    | null
    | undefined;
  let currentHub: { name?: string; city?: string } | null = null;
  if (loc && typeof loc === 'object' && loc !== null && 'hubName' in loc) {
    currentHub = { name: (loc as { hubName: string }).hubName, city: (loc as { city?: string }).city };
  } else if (typeof loc === 'string') {
    currentHub = { name: loc };
  }
  const rawLh = t.locationHistory;
  const locationHistory = Array.isArray(rawLh) ? rawLh : rawLh == null ? [] : [];
  return {
    ...b,
    harvestedBy: t.harvestedBy,
    transportedByDriver: t.transportedBy,
    currentHub,
    locationHistory,
    qualityIssues: t.qualityIssues ?? b.qualityIssues,
    origin: t.origin,
    packing: t.packing,
  };
}

export function useBatchDetailData(batchId: string | undefined) {
  const [result, setResult] = useState<{ reference: string; batch: any } | null>(null);
  const batch = result && result.reference === batchId ? result.batch : null;
  const requestNumber = useRef(0);
  const [loading, setLoading] = useState(true);

  const loadBatch = useCallback(async () => {
    const request = ++requestNumber.current;
    if (!batchId) {
      setResult(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await batchesAPI.getOne(batchId);
      if (request === requestNumber.current) setResult({ reference: batchId, batch: mergeBatchTraceabilityResponse(data) });
    } catch (error) {
      console.error('Error loading batch:', error);
    } finally {
      if (request === requestNumber.current) setLoading(false);
    }
  }, [batchId]);

  useFocusEffect(useCallback(() => {
    void loadBatch();
    return () => { requestNumber.current++; };
  }, [loadBatch]));

  return { batch, loading, onRefresh: loadBatch };
}

export function getBatchStatusColor(status: string): string {
  switch (status) {
    case 'PACKED':
    case 'QUALITY_VERIFIED':
      return theme.colors.accent;
    case 'IN_HUB': return theme.colors.warning;
    case 'IN_TRANSIT': return theme.colors.primary;
    case 'DELIVERED': return theme.colors.success || theme.colors.primary;
    case 'RETURNED': return theme.colors.warning;
    case 'EXPIRED': return theme.colors.text.secondary;
    default: return theme.colors.text.secondary;
  }
}
