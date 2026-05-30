import { Tabs } from 'expo-router';
import { growerTabScreenOptions } from '../../../lib/enterprise-ui';
import { GrowerTabBar, GrowerTabBarRenderer } from '../../../components/enterprise/GrowerTabBar';
import {
  GROWER_MAIN_TAB_OPTIONS,
  GROWER_HIDDEN_TAB_OPTIONS,
} from '../../../lib/grower-tab-screen-options';

/**
 * Grower tabs: Home → Field → Chain → Supplies → Profile.
 * No hooks here — dynamic options in layout cause React Navigation update loops.
 * @see docs/GROWER_MOBILE_IA_REDESIGN.md
 */
export default function ProducerTabsLayout() {
  return (
    <Tabs screenOptions={growerTabScreenOptions} tabBar={GrowerTabBarRenderer}>
      <Tabs.Screen name="index" options={GROWER_MAIN_TAB_OPTIONS.index} />
      <Tabs.Screen name="field" options={GROWER_MAIN_TAB_OPTIONS.field} />
      <Tabs.Screen name="chain" options={GROWER_MAIN_TAB_OPTIONS.chain} />
      <Tabs.Screen name="supplies" options={GROWER_MAIN_TAB_OPTIONS.supplies} />
      <Tabs.Screen name="profile" options={GROWER_MAIN_TAB_OPTIONS.profile} />
      <Tabs.Screen name="steps" options={GROWER_HIDDEN_TAB_OPTIONS.steps} />
      <Tabs.Screen name="products" options={GROWER_HIDDEN_TAB_OPTIONS.products} />
      <Tabs.Screen name="cost-calculator" options={GROWER_HIDDEN_TAB_OPTIONS['cost-calculator']} />
      <Tabs.Screen name="certifications" options={GROWER_HIDDEN_TAB_OPTIONS.certifications} />
      <Tabs.Screen name="banned-substances" options={GROWER_HIDDEN_TAB_OPTIONS['banned-substances']} />
      <Tabs.Screen name="field-log" options={GROWER_HIDDEN_TAB_OPTIONS['field-log']} />
      <Tabs.Screen name="harvest" options={GROWER_HIDDEN_TAB_OPTIONS.harvest} />
      <Tabs.Screen name="settings" options={GROWER_HIDDEN_TAB_OPTIONS.settings} />
    </Tabs>
  );
}
