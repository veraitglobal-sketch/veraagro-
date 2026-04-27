import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image as ImageIcon } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import type { GrowthLog } from '../../../lib/api';
import { GrowthLogCard } from './GrowthLogCard';

interface GrowthJournalListProps {
  logs: GrowthLog[];
  loading: boolean;
  /** Loading logs after estate/parcel change (estates already loaded). */
  logsLoading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

export function GrowthJournalList({
  logs,
  loading,
  logsLoading,
  refreshing,
  onRefresh,
}: GrowthJournalListProps) {
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();
  const showInitialSpinner = loading && logs.length === 0;
  const showLogsSpinner = logsLoading && !loading;

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
      <View
        style={{
          paddingTop: theme.spacing.md,
          paddingLeft: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          paddingBottom: Math.max(p.bottomInset, theme.spacing.lg),
        }}
      >
        {showInitialSpinner ? (
          <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
            <Text style={{ color: colors.text.secondary, fontSize: 13 }}>
              {t('producer.growthJournal.loading')}
            </Text>
          </View>
        ) : showLogsSpinner ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.text.secondary, fontSize: 13, marginTop: 12 }}>
              {t('producer.growthJournal.loadingLogs')}
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
                fontSize: 15,
                fontWeight: '600',
                marginTop: 12,
                textAlign: 'center',
                color: colors.text.primary,
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
                lineHeight: 17,
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
