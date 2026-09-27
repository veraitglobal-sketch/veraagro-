import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Camera, ClipboardCheck, FileText, Package, QrCode, Truck } from 'lucide-react-native';
import { EnterpriseNavSection } from '../../../design-system/EnterpriseNavSection';
import { batchWorkflowHref } from '../../../lib/batch-workflow';

type Step = 'packing' | 'labels' | 'quality' | 'compliance' | 'transport' | 'detail';

const STEP_ICON = {
  packing: Package,
  labels: QrCode,
  quality: ClipboardCheck,
  compliance: Camera,
  transport: Truck,
  detail: FileText,
} as const;

export function BatchWorkflowActions({ batchId, steps }: { batchId: string; steps: Step[] }) {
  const { t } = useTranslation();
  const router = useRouter();
  if (!batchId) return null;
  return (
    <EnterpriseNavSection
      title={t('batchWorkflow.continueTitle')}
      items={steps.map((step) => ({
        key: step,
        title: t(`batchWorkflow.${step}`),
        icon: STEP_ICON[step],
        onPress: () => router.push(batchWorkflowHref(step, batchId)),
      }))}
    />
  );
}
