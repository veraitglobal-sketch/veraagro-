import { useTranslation } from 'react-i18next';
import { GrowerPageHero, GrowerPartnerPill } from '../../../components/enterprise/GrowerPageHero';
type Props = {
  farmName: string;
  greetingLine: string;
  partnerCode?: string | null;
};

/** Home hero block — farm name on gradient (mock layout). */
export function HomeDashboardHeader({
  farmName,
  greetingLine,
  partnerCode,
}: Props) {
  const { t } = useTranslation();
  const status = t('producer.dashboard.homeLeadShort');

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
