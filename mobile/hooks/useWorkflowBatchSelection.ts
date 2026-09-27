import { useCallback, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { normalizeBatchReference, resolveWorkflowBatch, type BatchReference } from '../lib/batch-workflow';

/** Explicit links take priority over list order, including while the list is still loading. */
export function useWorkflowBatchSelection<T extends BatchReference>(rows: T[], autoSelectFirst = true) {
  const params = useLocalSearchParams<{ batchId?: string | string[] }>();
  const requested = normalizeBatchReference(params.batchId);
  const [choice, setChoice] = useState<{ requested: string; id: string } | null>(null);
  const reference = choice?.requested === requested ? choice.id : requested;
  const selectedBatch = reference
    ? resolveWorkflowBatch(rows, reference)
    : autoSelectFirst ? rows[0] : undefined;
  const setSelectedBatchId = useCallback((id: string) => setChoice({ requested, id }), [requested]);
  return {
    selectedBatch,
    selectedBatchId: selectedBatch?.id ?? '',
    missingRequestedBatch: Boolean(reference && !selectedBatch),
    setSelectedBatchId,
  };
}
