import { useState, useEffect, useCallback } from 'react';
import { batchesAPI } from '../../../lib/api';
import { colors } from '../../../lib/colors';

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
  };
}

export function useBatchDetailData(batchId: string | undefined) {
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadBatch = useCallback(async () => {
    if (!batchId) return;
    try {
      setLoading(true);
      const data = await batchesAPI.getOne(batchId);
      setBatch(mergeBatchTraceabilityResponse(data));
    } catch (error) {
      console.error('Error loading batch:', error);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    if (batchId) loadBatch();
  }, [batchId, loadBatch]);

  return { batch, loading, onRefresh: loadBatch };
}

export function getBatchStatusColor(status: string): string {
  switch (status) {
    case 'PACKED': return colors.accent;
    case 'IN_HUB': return colors.warning;
    case 'IN_TRANSIT': return colors.primary;
    case 'DELIVERED': return colors.success || colors.primary;
    default: return colors.text.secondary;
  }
}
