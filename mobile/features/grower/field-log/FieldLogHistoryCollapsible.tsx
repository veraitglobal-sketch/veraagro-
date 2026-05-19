import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import type { FieldLogHistoryItem } from '../../../lib/offline-storage';

type Props = {
  items: FieldLogHistoryItem[];
  formatWhen: (iso: string) => string;
  activityLabel: (activityType: string) => string;
  onDiscard: (id: string) => void;
};

function statusStyle(status: FieldLogHistoryItem['status']): { bg: string; color: string } {
  if (status === 'synced') return { bg: `${enterpriseColors.primary}18`, color: enterpriseColors.primary };
  if (status === 'unrecoverable' || status === 'error') {
    return { bg: '#FEE2E2', color: '#B91C1C' };
  }
  if (status === 'syncing') return { bg: `${enterpriseColors.primary}14`, color: enterpriseColors.primary };
  return { bg: '#FEF3C7', color: '#B45309' };
}

export function FieldLogHistoryCollapsible({ items, formatWhen, activityLabel, onDiscard }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.75}
        style={styles.toggle}
        accessibilityRole="button"
      >
        <Text style={styles.toggleLabel}>
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
            items.slice(0, 8).map((h) => {
              const ss = statusStyle(h.status);
              return (
                <View key={h.id} style={styles.row}>
                  <View style={styles.rowTop}>
                    <Text style={styles.when}>{formatWhen(h.timestamp)}</Text>
                    <View style={[styles.badge, { backgroundColor: ss.bg }]}>
                      <Text style={[styles.badgeText, { color: ss.color }]}>
                        {t(`producer.fieldLogForm.histStatus_${h.status}`, { defaultValue: h.status })}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.activity}>{activityLabel(String(h.activityType))}</Text>
                  {(h.status === 'pending' || h.status === 'error' || h.status === 'unrecoverable') ? (
                    <TouchableOpacity onPress={() => onDiscard(h.id)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}>
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
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
    overflow: 'hidden',
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 52,
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.gray900,
  },
  body: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  empty: {
    fontSize: 14,
    color: enterpriseColors.gray600,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  row: {
    paddingVertical: 10,
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
    fontSize: 13,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activity: {
    fontSize: 14,
    fontWeight: '500',
    color: enterpriseColors.primary,
    marginTop: 4,
  },
  discard: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
    marginTop: 6,
  },
});
