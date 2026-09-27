import api from './client';

export interface ReturnCase {
  id: string; status: 'PLANNED' | 'COLLECTED' | 'RECEIVED'; revision: number;
  carrierUserId: string; receiverUserId: string; destinationAddress: string; instructions: string;
  collectedAt?: string; receivedAt?: string; stockStatus?: 'QUARANTINED' | 'WRITTEN_OFF' | 'RESTOCKED'; stockRevision?: number;
  dispositions?: { id: string; action: string; notes: string; createdAt: string }[];
  delivery: { deliveryNumber: string; orders: { orderNumber: string; productName: string; quantity: number; unit: string } };
  refund?: { status: string; amountCents: number; currency: string; confirmedAt?: string; reconciliation?: { createdAt: string; entries: { id: string; amountCents: number; method: 'WALLET_RECOVERY' | 'PLATFORM_COST' }[] } | null } | null;
}
export const returnsAPI = {
  async list(): Promise<ReturnCase[]> { return (await api.get('/delivery-returns')).data; },
  async evidence(id: string): Promise<{ collectionPhotos: string[]; receiptPhotos: string[]; dispositions?: { id: string }[] }> { return (await api.get(`/delivery-returns/${encodeURIComponent(id)}/evidence`)).data; },
  async dispositionEvidence(id: string, decisionId: string): Promise<{ photos: string[] }> { return (await api.get(`/delivery-returns/${encodeURIComponent(id)}/disposition/${encodeURIComponent(decisionId)}/evidence`)).data; },
  async record(id: string, step: 'collect' | 'receive', revision: number, photos: string[], notes: string) {
    return (await api.post(`/delivery-returns/${encodeURIComponent(id)}/${step}`, { revision, photos, notes, fullShipment: true })).data;
  },
};
