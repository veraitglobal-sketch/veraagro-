import type { ReturnCase } from './api/returns';

export function returnAction(row: ReturnCase, userId: string | undefined): 'collect' | 'receive' | null {
  if (!userId) return null;
  if (row.status === 'PLANNED' && row.carrierUserId === userId) return 'collect';
  if (row.status === 'COLLECTED' && row.receiverUserId === userId) return 'receive';
  return null;
}
