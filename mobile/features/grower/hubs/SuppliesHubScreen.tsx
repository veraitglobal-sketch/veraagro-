import { useTranslation } from 'react-i18next';
import { GrowerHubScreen } from '../../../design-system/GrowerHubScreen';
import { useGrowerDashboard } from '../../../contexts/GrowerDashboardContext';
import { suppliesStatusLine } from './suppliesStatusLine';
import { suppliesHubConfig } from './config/supplies.hub';

export default function SuppliesHubScreen() {
  const { t } = useTranslation();
  const data = useGrowerDashboard();

  const statusLine = suppliesStatusLine(
    t,
    data.unreadCount,
    data.suppliesSnapshot,
    data.suppliesSnapshotLoaded,
  );

  return <GrowerHubScreen config={{ ...suppliesHubConfig, statusLine }} />;
}
