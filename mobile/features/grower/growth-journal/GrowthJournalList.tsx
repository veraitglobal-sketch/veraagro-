import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image as ImageIcon } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import type { GrowthLog } from '../../../lib/api';
import { GrowthLogCard } from './GrowthLogCard';

interface GrowthJournalListProps {
  logs: GrowthLog[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

export function GrowthJournalList({
  logs,
  loading,
  refreshing,
  onRefresh,
}: GrowthJournalListProps) {
  const { t } = useTranslation();
  return (
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <View style={{ padding: theme.spacing.md }}>
        {loading ? (
          <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
            <Text style={{ color: colors.text.secondary, fontSize: 13 }}>
              {t('producer.growthJournal.loading')}
            </Text>
          </View>
        ) : logs.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: theme.borderRadius.lg,
              padding: 24,
              borderWidth: 0.5,
              borderColor: colors.border,
              alignItems: 'center',
            }}
          >
            <ImageIcon size={32} color={colors.text.secondary} strokeWidth={1} />
            <Text
              style={{
                fontSize: 13,
                marginTop: 12,
                textAlign: 'center',
                color: colors.text.secondary,
              }}
            >
              {t('producer.growthJournal.noLogs')}
            </Text>
            <Text
              style={{
                fontSize: 11,
                marginTop: 8,
                textAlign: 'center',
                color: colors.text.secondary,
              }}
            >
              {t('producer.growthJournal.addPhotosToTrack')}
            </Text>
          </View>
        ) : (
          <View style={{ gap: theme.spacing.md }}>
            {logs.map((log) => (
              <GrowthLogCard key={log.id} log={log} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
