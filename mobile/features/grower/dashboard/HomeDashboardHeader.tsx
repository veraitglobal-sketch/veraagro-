import { useTranslation } from 'react-i18next';
import { GrowerPageHero, GrowerPartnerPill } from '../../../components/enterprise/GrowerPageHero';
import { parcelStatusLine, type ParcelStats } from './parcelStatusLine';

type Props = {
  farmName: string;
  greetingLine: string;
  partnerCode?: string | null;
  parcelSteps: ParcelStats;
  estateCount: number;
};

/** Home hero block — farm name on gradient (mock layout). */
export function HomeDashboardHeader({
  farmName,
  greetingLine,
  partnerCode,
  parcelSteps,
  estateCount,
}: Props) {
  const { t } = useTranslation();
  const status = parcelStatusLine(t, estateCount, parcelSteps);

  const footer = partnerCode ? (
    <GrowerPartnerPill label={t('producer.dashboard.partner')} code={partnerCode} />
  ) : null;

  return (
    <GrowerPageHero
      eyebrow={greetingLine}
      title={farmName}
      subtitle={status}
      footer={footer}
    />
  );
}
