import { ShoppingBag, Calculator } from 'lucide-react-native';
import type { GrowerHubConfig } from '../../../../design-system/GrowerHubScreen';

/** Nabavka tab — 2 grupe (+ mapa unutar Nabavke). */
export const suppliesHubConfig: GrowerHubConfig = {
  titleKey: 'producer.hubs.supplies.screenTitle',
  subtitleKey: 'producer.hubs.supplies.screenSubtitle',
  steps: [
    {
      key: 'procurement',
      icon: ShoppingBag,
      titleKey: 'producer.hubs.supplies.groups.procurementTitle',
      descKey: 'producer.hubs.supplies.groups.procurementDesc',
      href: '/(producer)/procurement',
    },
    {
      key: 'economics',
      icon: Calculator,
      titleKey: 'producer.hubs.supplies.groups.economicsTitle',
      descKey: 'producer.hubs.supplies.groups.economicsDesc',
      href: '/(producer)/farm-economics',
    },
  ],
};
