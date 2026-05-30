import { useTranslation } from 'react-i18next';
import { GrowerHubScreen } from '../../../design-system/GrowerHubScreen';
import { useGrowerDashboard } from '../../../contexts/GrowerDashboardContext';
import { chainStatusLine } from './chainStatusLine';
import { chainHubConfig } from './config/chain.hub';

export default function ChainHubScreen() {
  const { t } = useTranslation();
  const data = useGrowerDashboard();

  const statusLine = chainStatusLine(t, {
    batchTotal: data.batchTotalCount,
    lotsReady: data.batchesReadyForTransport,
    activeMissions: data.activeMissions.length,
  });

  return <GrowerHubScreen config={{ ...chainHubConfig, statusLine }} />;
}
