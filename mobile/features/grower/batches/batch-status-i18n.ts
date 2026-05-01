/** i18n key per API batch status (detail + list reuse producer.batches.*). */
export const BATCH_DETAIL_STATUS_KEYS: Record<string, string> = {
  PACKED: 'producer.batches.statusPacked',
  IN_HUB: 'producer.batches.statusInHub',
  IN_TRANSIT: 'producer.batches.statusInTransit',
  DELIVERED: 'producer.batches.statusDelivered',
};
