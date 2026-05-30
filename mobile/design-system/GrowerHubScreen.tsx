import { useMemo } from 'react';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { GrowerHeroSheetScaffold } from './scaffolds/GrowerHeroSheetScaffold';
import { EnterpriseNavSection, type EnterpriseNavItem } from './EnterpriseNavSection';
import { GrowerHeroTopBar } from '../components/enterprise/GrowerHeroTopBar';
import { GrowerPageHero } from '../components/enterprise/GrowerPageHero';
import { useGrowerTabRefresh } from '../hooks/useGrowerTabRefresh';

export type HubStepDef = {
  key: string;
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  href: Href;
};

export type GrowerHubConfig = {
  titleKey: string;
  subtitleKey: string;
  statusLine?: string;
  sectionTitleKey?: string;
  steps: HubStepDef[];
};

type Props = {
  config: GrowerHubConfig;
};

export function GrowerHubScreen({ config }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const tabRefresh = useGrowerTabRefresh();

  const items = useMemo((): EnterpriseNavItem[] => {
    return config.steps.map((step) => ({
      key: step.key,
      title: t(step.titleKey),
      subtitle: t(step.descKey),
      icon: step.icon as ComponentType<{ size?: number; color?: string; strokeWidth?: number }>,
      onPress: () => router.push(step.href),
    }));
  }, [config.steps, router, t]);

  return (
    <GrowerHeroSheetScaffold
      topBar={<GrowerHeroTopBar />}
      hero={
        <GrowerPageHero
          eyebrow={t('producer.brand.productLine')}
          title={t(config.titleKey)}
          subtitle={config.statusLine ?? t(config.subtitleKey)}
        />
      }
      refreshing={tabRefresh.refreshing}
      onRefresh={() => void tabRefresh.onRefresh()}
    >
      <EnterpriseNavSection
        title={config.sectionTitleKey ? t(config.sectionTitleKey) : undefined}
        items={items}
      />
    </GrowerHeroSheetScaffold>
  );
}
