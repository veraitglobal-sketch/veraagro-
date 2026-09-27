import { Home, Sprout, BookOpen, Scissors } from 'lucide-react-native';
import type { GrowerHubConfig } from '../../../../design-system/GrowerHubScreen';

/** Polje tab — 4 grupe (nivo 1), bez pretrpanog menija. */
export const fieldHubConfig: GrowerHubConfig = {
  titleKey: 'producer.hubs.field.screenTitle',
  subtitleKey: 'producer.hubs.field.screenSubtitle',
  numbered: true,
  steps: [
    {
      key: 'estates',
      icon: Home,
      titleKey: 'producer.hubs.field.groups.estatesTitle',
      descKey: 'producer.hubs.field.groups.estatesDesc',
      href: '/(producer)/estates',
    },
    {
      key: 'cultivation',
      icon: Sprout,
      titleKey: 'producer.hubs.field.groups.cultivationTitle',
      descKey: 'producer.hubs.field.groups.cultivationDesc',
      href: '/(producer)/cultivation',
    },
    {
      key: 'diary',
      icon: BookOpen,
      titleKey: 'producer.hubs.field.groups.diaryTitle',
      descKey: 'producer.hubs.field.groups.diaryDesc',
      href: '/(producer)/field-diary',
    },
    {
      key: 'harvest',
      icon: Scissors,
      titleKey: 'producer.hubs.field.groups.harvestTitle',
      descKey: 'producer.hubs.field.groups.harvestDesc',
      href: '/(producer)/harvest-hub',
    },
  ],
};
