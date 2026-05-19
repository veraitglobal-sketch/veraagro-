import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react-native';
import { enterpriseUi } from '../../../lib/enterprise-ui';
import type { Mission } from '../../../lib/api';
import { MissionDetailSection } from './MissionDetailSection';

interface BatchInfoBlockProps {
  mission: Mission;
}

export default function BatchInfoBlock({ mission }: BatchInfoBlockProps) {
  const { t } = useTranslation();
  if (!mission.batch) return null;
  const batch = mission.batch as { batchId?: string; productName?: string };

  return (
    <MissionDetailSection title={t('producer.missionsCreate.batchLabel')} icon={Package}>
      <Text style={enterpriseUi.navRowSubtitle}>{batch.batchId || mission.batchId}</Text>
      {batch.productName ? (
        <Text style={enterpriseUi.navRowTitle}>{batch.productName}</Text>
      ) : null}
    </MissionDetailSection>
  );
}
