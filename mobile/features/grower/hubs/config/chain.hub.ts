import { Package, ClipboardList, Truck, QrCode } from 'lucide-react-native';
import type { GrowerHubConfig } from '../../../../design-system/GrowerHubScreen';

/** Lanac tab — 4 grupe. Novi lot = FAB na listi lotova. */
export const chainHubConfig: GrowerHubConfig = {
  titleKey: 'producer.hubs.chain.screenTitle',
  subtitleKey: 'producer.hubs.chain.screenSubtitle',
  numbered: true,
  steps: [
    {
      key: 'batches',
      icon: Package,
      titleKey: 'producer.hubs.chain.groups.batchesTitle',
      descKey: 'producer.hubs.chain.groups.batchesDesc',
      href: '/(producer)/batches',
    },
    {
      key: 'post-harvest',
      icon: ClipboardList,
      titleKey: 'producer.hubs.chain.groups.postHarvestTitle',
      descKey: 'producer.hubs.chain.groups.postHarvestDesc',
      href: '/(producer)/post-harvest',
    },
    {
      key: 'missions',
      icon: Truck,
      titleKey: 'producer.hubs.chain.workflow.missionsTitle',
      descKey: 'producer.hubs.chain.workflow.missionsDesc',
      href: '/(producer)/missions',
    },
    {
      key: 'badges',
      icon: QrCode,
      titleKey: 'producer.hubs.chain.workflow.badgesTitle',
      descKey: 'producer.hubs.chain.workflow.badgesDesc',
      href: '/(producer)/package-badges',
    },
  ],
};
