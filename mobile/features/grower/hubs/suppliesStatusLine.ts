import type { TFunction } from 'i18next';
import type { SuppliesSnapshot } from './fetchSuppliesSnapshot';

export function suppliesStatusLine(
  t: TFunction,
  unreadCount: number,
  snap: SuppliesSnapshot | null,
  loaded: boolean,
): string {
  if (loaded && snap && snap.partnerOrdersAwaitingReceive > 0) {
    return t('producer.hubs.supplies.statusAwaitingReceive', {
      count: snap.partnerOrdersAwaitingReceive,
    });
  }
  if (unreadCount > 0) {
    return t('producer.hubs.supplies.statusSummary', { count: unreadCount });
  }
  return t('producer.hubs.supplies.leadShort');
}
