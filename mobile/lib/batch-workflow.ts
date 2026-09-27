export type BatchReference = { id: string; batchId?: string };

export function normalizeBatchReference(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
}

/** Both UUID links and printed BATCH codes resolve to the same internal ID. Never substitute another lot. */
export function resolveWorkflowBatch<T extends BatchReference>(rows: T[], reference: string): T | undefined {
  return rows.find((row) => row.id === reference || row.batchId === reference);
}

const paths = {
  packing: '/(producer)/packing-flow',
  labels: '/(producer)/package-badges',
  quality: '/(producer)/quality-entry',
  compliance: '/(producer)/compliance-photos',
  transport: '/(producer)/missions-create',
  detail: '/(producer)/batch/[id]',
} as const;

export function batchWorkflowHref(step: keyof typeof paths, batchId: string) {
  const id = batchId.trim();
  if (!id) throw new Error('A batch is required to continue this workflow');
  return { pathname: paths[step], params: step === 'detail' ? { id } : { batchId: id } };
}
