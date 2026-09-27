import api from './client';
import { axiosResponseStatus } from '../api-error';

export interface DeliveryReview {
  status: string; outcome?: string | null; resolution?: string | null; resolvedAt?: string | null;
}
export interface BuyerDelivery {
  returnCase?: { id: string; status: string; stockStatus?: string; collectedAt?: string; receivedAt?: string;
    refund?: { status: string; amountCents: number; currency: string; confirmedAt?: string } | null } | null;
  id: string; orderId: string; deliveryNumber: string; status: string;
  buyerPickupConfirmedAt?: string | null; confirmedAt?: string | null;
  digital_handovers?: { id: string; status: string; disputes?: Array<DeliveryReview & { id: string; reason: string }> } | null;
  buyer_delivery_issues?: Array<DeliveryReview & { id: string; description: string; photoUrls: string[]; createdAt: string }>;
}
export const buyerDeliveriesAPI = {
  async get(reference: { orderId: string } | { deliveryId: string }): Promise<BuyerDelivery | null> {
    const path = 'orderId' in reference ? `order/${encodeURIComponent(reference.orderId)}` : `shipment/${encodeURIComponent(reference.deliveryId)}`;
    try { return (await api.get(`/deliveries/buyer/${path}`)).data; }
    catch (error) { if (axiosResponseStatus(error) === 404) return null; throw error; }
  },
  async confirm(deliveryId: string): Promise<unknown> {
    return (await api.post('/deliveries/buyer/confirm-pickup', { deliveryId })).data;
  },
  async report(deliveryId: string, description: string, photosBase64: string[]): Promise<{ id: string }> {
    return (await api.post('/deliveries/buyer/report-issue', { deliveryId, description, photosBase64 })).data;
  },
};
