import { View, Text, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image as ImageIcon } from 'lucide-react-native';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import type { GrowthLog } from '../../../lib/api';
import { GrowthLogCard } from './GrowthLogCard';

interface GrowthJournalListProps {
  logs: GrowthLog[];
  loading: boolean;
  logsLoading: boolean;
}

/** Log cards only — parent screen owns the ScrollView. */
export function GrowthJournalList({ logs, loading, logsLoading }: GrowthJournalListProps) {
  const { t } = useTranslation();
  const showInitialSpinner = loading && logs.length === 0;
  const showLogsSpinner = logsLoading && logs.length === 0;

  if (showInitialSpinner) {
    return (
      <View style={{ paddingVertical: 24, alignItems: 'center' }}>
        <Text style={enterpriseUi.navRowSubtitle}>{t('producer.growthJournal.loading')}</Text>
      </View>
    );
  }

  if (showLogsSpinner) {
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator color={enterpriseColors.primary} />
        <Text style={[enterpriseUi.navRowSubtitle, { marginTop: 12 }]}>
          {t('producer.growthJournal.loadingLogs')}
        </Text>
      </View>
    );
  }

  if (logs.length === 0) {
    return (
      <View style={[growerUi.emptyCard, { marginTop: 4 }]}>
        <ImageIcon size={32} color={enterpriseColors.gray600} strokeWidth={1.5} />
        <Text style={[enterpriseUi.navRowTitle, { marginTop: 12, textAlign: 'center' }]}>
          {t('producer.growthJournal.noLogs')}
        </Text>
        <Text style={[enterpriseUi.navRowSubtitle, { marginTop: 8, textAlign: 'center' }]}>
          {t('producer.growthJournal.addPhotosToTrack')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 12, paddingTop: 4 }}>
      <Text style={enterpriseUi.inAppSectionLabel}>{t('producer.growthJournal.entriesSection')}</Text>
      {logs.map((log) => (
        <GrowthLogCard key={log.id} log={log} />
      ))}
    </View>
  );
}
