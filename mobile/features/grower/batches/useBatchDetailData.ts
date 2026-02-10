import { useState, useEffect, useCallback } from 'react';
import { batchesAPI } from '../../../lib/api';
import { colors } from '../../../lib/colors';

export function useBatchDetailData(batchId: string | undefined) {
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadBatch = useCallback(async () => {
    if (!batchId) return;
    try {
      setLoading(true);
      const data = await batchesAPI.getOne(batchId);
      setBatch(data);
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

export function getBatchStatusLabel(status: string): string {
  switch (status) {
    case 'PACKED': return 'Pakovano';
    case 'IN_HUB': return 'U hubu';
    case 'IN_TRANSIT': return 'U transportu';
    case 'DELIVERED': return 'Isporučeno';
    default: return status;
  }
}
