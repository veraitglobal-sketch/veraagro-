import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerStyles } from '../../../lib/grower-ui';
import type { FieldLogHistoryItem } from '../../../lib/offline-storage';

type Props = {
  items: FieldLogHistoryItem[];
  formatWhen: (iso: string) => string;
  activityLabel: (activityType: string) => string;
  onDiscard: (id: string) => void;
};

function statusColors(status: FieldLogHistoryItem['status']): { bg: string; fg: string } {
  if (status === 'synced') {
    return { bg: enterpriseColors.primaryTint, fg: enterpriseColors.primary };
  }
  if (status === 'unrecoverable' || status === 'error') {
    return { bg: enterpriseColors.destructiveTint, fg: enterpriseColors.destructive };
  }
  if (status === 'syncing') {
    return { bg: enterpriseColors.gray100, fg: enterpriseColors.gray900 };
  }
  return { bg: enterpriseColors.gray100, fg: enterpriseColors.gray700 };
}

export function FieldLogHistoryCollapsible({ items, formatWhen, activityLabel, onDiscard }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <View style={[enterpriseUi.inAppPanel, styles.wrap]}>
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.75}
        style={styles.toggle}
        accessibilityRole="button"
      >
        <Text style={enterpriseUi.navRowTitle}>
          {t('producer.fieldLogForm.historyToggleShort', { count: items.length })}
        </Text>
        {open ? (
          <ChevronUp size={20} color={enterpriseColors.gray600} strokeWidth={1.5} />
        ) : (
          <ChevronDown size={20} color={enterpriseColors.gray600} strokeWidth={1.5} />
        )}
      </TouchableOpacity>

      {open ? (
        <View style={styles.body}>
          {items.length === 0 ? (
            <Text style={styles.empty}>{t('producer.fieldLogForm.historyEmpty')}</Text>
          ) : (
            items.slice(0, 8).map((h, index) => {
              const ss = statusColors(h.status);
              return (
                <View
                  key={h.id}
                  style={[styles.row, index < Math.min(items.length, 8) - 1 && styles.rowBorder]}
                >
                  <View style={styles.rowTop}>
                    <Text style={styles.when}>{formatWhen(h.timestamp)}</Text>
                    <View style={[growerStyles.statusPill, { backgroundColor: ss.bg }]}>
                      <Text style={[growerStyles.statusPillText, { color: ss.fg }]}>
                        {t(`producer.fieldLogForm.histStatus_${h.status}`, { defaultValue: h.status })}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.activity}>{activityLabel(String(h.activityType))}</Text>
                  {h.status === 'pending' || h.status === 'error' || h.status === 'unrecoverable' ? (
                    <TouchableOpacity
                      onPress={() => onDiscard(h.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                    >
                      <Text style={styles.discard}>{t('producer.fieldLogForm.discardQueueConfirm')}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
    marginBottom: 8,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    minHeight: 56,
    paddingVertical: 12,
  },
  body: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  empty: {
    fontSize: 15,
    color: enterpriseColors.gray600,
    paddingVertical: 12,
    lineHeight: 21,
  },
  row: {
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  when: {
    fontSize: 14,
    fontWeight: '500',
    color: enterpriseColors.gray900,
    flex: 1,
    letterSpacing: -0.1,
  },
  activity: {
    fontSize: 15,
    fontWeight: '500',
    color: enterpriseColors.primary,
    marginTop: 4,
    letterSpacing: -0.15,
  },
  discard: {
    fontSize: 14,
    fontWeight: '600',
    color: enterpriseColors.destructive,
    marginTop: 8,
  },
});
