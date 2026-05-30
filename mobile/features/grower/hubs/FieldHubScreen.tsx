import { useTranslation } from 'react-i18next';
import { GrowerHubScreen } from '../../../design-system/GrowerHubScreen';
import { useGrowerDashboard } from '../../../contexts/GrowerDashboardContext';
import { parcelStatusLine } from '../dashboard/parcelStatusLine';
import { fieldHubConfig } from './config/field.hub';

export default function FieldHubScreen() {
  const { t } = useTranslation();
  const data = useGrowerDashboard();
  const ps = data.parcelSteps;
  const statusLine = ps.loaded
    ? parcelStatusLine(t, data.estates.length, ps, 'producer.hubs.field.leadShort')
    : undefined;

  return <GrowerHubScreen config={{ ...fieldHubConfig, statusLine }} />;
}
