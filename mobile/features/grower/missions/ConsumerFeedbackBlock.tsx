import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react-native';
import { enterpriseUi } from '../../../lib/enterprise-ui';
import { MissionDetailSection } from './MissionDetailSection';

interface ConsumerFeedbackBlockProps {
  feedback: { rating?: number; comment?: string } | null;
}

export default function ConsumerFeedbackBlock({ feedback }: ConsumerFeedbackBlockProps) {
  const { t } = useTranslation();
  if (!feedback) return null;

  return (
    <MissionDetailSection title={t('producer.missions.consumerFeedbackTitle')} icon={MessageSquare}>
      {feedback.rating != null ? (
        <Text style={enterpriseUi.navRowSubtitle}>
          {t('producer.missions.ratingWithMax', { n: feedback.rating })}
        </Text>
      ) : null}
      {feedback.comment ? <Text style={enterpriseUi.navRowTitle}>{feedback.comment}</Text> : null}
    </MissionDetailSection>
  );
}
