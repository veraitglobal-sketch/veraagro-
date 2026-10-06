import { useState } from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerStyles } from '../../../lib/grower-ui';
import type { FieldLogHistoryItem } from '../../../lib/offline-storage';

type Props = {
  items: FieldLogHistoryItem[];
  formatWhen: (iso: string) => string;
  onDiscard: (id: string) => void;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  maxItems?: number;
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

function statusLabelKey(status: FieldLogHistoryItem['status']): string {
  if (status === 'pending') return 'producer.fieldLogForm.histStatus_waitingSync';
  return `producer.fieldLogForm.histStatus_${status}`;
}

export function FieldLogHistoryPanel({
  items,
  formatWhen,
  onDiscard,
  collapsible = true,
  defaultExpanded = false,
  maxItems = 20,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultExpanded || !collapsible);
  const [detail, setDetail] = useState<FieldLogHistoryItem | null>(null);

  const visible = items.slice(0, maxItems);

  const renderRow = (h: FieldLogHistoryItem, index: number, total: number) => {
    const ss = statusColors(h.status);
    const canDiscard = h.status === 'pending' || h.status === 'error' || h.status === 'unrecoverable';
    return (
      <Pressable
        key={h.id}
        onPress={() => setDetail(h)}
        style={[styles.row, index < total - 1 && styles.rowBorder]}
      >
        <View style={styles.rowTop}>
          <Text style={styles.when}>{formatWhen(h.timestamp)}</Text>
          <View style={[growerStyles.statusPill, { backgroundColor: ss.bg }]}>
            <Text style={[growerStyles.statusPillText, { color: ss.fg }]}>
              {t(statusLabelKey(h.status), { defaultValue: h.status })}
            </Text>
          </View>
        </View>
        <Text style={styles.preview} numberOfLines={2}>
          {h.journalNotesPreview}
        </Text>
        {canDiscard ? (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              onDiscard(h.id);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          >
            <Text style={styles.discard}>{t('producer.fieldLogForm.discardQueueConfirm')}</Text>
          </TouchableOpacity>
        ) : null}
      </Pressable>
    );
  };

  return (
    <>
      <View style={[enterpriseUi.inAppPanel, styles.wrap]}>
        {collapsible ? (
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
        ) : (
          <View style={styles.toggle}>
            <Text style={enterpriseUi.navRowTitle}>
              {t('producer.fieldLogForm.historyTitle', { count: items.length })}
            </Text>
          </View>
        )}

        {open ? (
          <View style={styles.body}>
            {visible.length === 0 ? (
              <Text style={styles.empty}>{t('producer.fieldLogForm.historyEmpty')}</Text>
            ) : (
              visible.map((h, index) => renderRow(h, index, visible.length))
            )}
          </View>
        ) : null}
      </View>

      <Modal visible={detail != null} animationType="slide" transparent onRequestClose={() => setDetail(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('producer.fieldLogForm.historyDetailTitle')}</Text>
              <TouchableOpacity onPress={() => setDetail(null)} hitSlop={12}>
                <X size={22} color={enterpriseColors.gray700} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {detail ? (
                <>
                  <Text style={styles.modalWhen}>{formatWhen(detail.timestamp)}</Text>
                  <Text style={styles.modalPreview}>{detail.journalNotesPreview}</Text>
                  {detail.detailData?.operation ? <View style={styles.detailBlock}>
                    {detail.detailData.operation.endedAt ? <Text>{t('glossary.productionHistory.until')}: {formatWhen(detail.detailData.operation.endedAt)}</Text> : null}
                    {detail.detailData.operation.materialName ? <Text>{detail.detailData.operation.materialName} · {detail.detailData.operation.quantity} {detail.detailData.operation.unit}</Text> : null}
                    {detail.detailData.operation.waterLitres != null ? <Text>{t('glossary.productionHistory.waterLitres')}: {detail.detailData.operation.waterLitres} L</Text> : null}
                    {detail.detailData.operation.method ? <Text>{t('glossary.productionHistory.method')}: {detail.detailData.operation.method}</Text> : null}
                    {detail.detailData.photos?.map((uri, i) => <Image key={i} source={{ uri }} style={{ width: 180, height: 120, marginTop: 8 }} />)}
                  </View> : null}
                  {detail.detailData?.bags?.length ? (
                    <View style={styles.detailBlock}>
                      <Text style={styles.detailLabel}>{t('producer.fieldLogForm.historyBags')}</Text>
                      {detail.detailData.bags.map((bag) => (
                        <Text key={bag.serial} style={styles.detailValue}>
                          {bag.serial}
                          {bag.quantityKg != null ? ` · ${bag.quantityKg} kg` : ''}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                  {detail.detailData?.areaHa != null ? (
                    <Text style={styles.detailLine}>
                      {t('producer.fieldLogForm.historyArea', { ha: detail.detailData.areaHa })}
                    </Text>
                  ) : null}
                  {detail.detailData?.lat != null && detail.detailData?.lng != null ? (
                    <Text style={styles.detailLine}>
                      {t('producer.fieldLogForm.historyGps', {
                        lat: detail.detailData.lat.toFixed(5),
                        lng: detail.detailData.lng.toFixed(5),
                      })}
                    </Text>
                  ) : null}
                  {detail.detailData?.notes ? (
                    <Text style={styles.detailLine}>{detail.detailData.notes}</Text>
                  ) : null}
                  {detail.error ? (
                    <Text style={[styles.detailLine, styles.detailError]}>{detail.error}</Text>
                  ) : null}
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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
    fontSize: 13.5,
    color: enterpriseColors.gray600,
    paddingVertical: 12,
    lineHeight: 19,
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
  preview: {
    fontSize: 13.5,
    fontWeight: '500',
    color: enterpriseColors.primary,
    marginTop: 4,
    lineHeight: 19,
    letterSpacing: -0.15,
  },
  discard: {
    fontSize: 14,
    fontWeight: '600',
    color: enterpriseColors.destructive,
    marginTop: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: enterpriseColors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: enterpriseColors.gray900,
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalWhen: {
    fontSize: 14,
    color: enterpriseColors.gray600,
    marginBottom: 8,
  },
  modalPreview: {
    fontSize: 16,
    fontWeight: '600',
    color: enterpriseColors.primary,
    marginBottom: 16,
    lineHeight: 22,
  },
  detailBlock: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: enterpriseColors.gray700,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: enterpriseColors.gray900,
    marginBottom: 4,
  },
  detailLine: {
    fontSize: 14,
    color: enterpriseColors.gray900,
    marginBottom: 8,
    lineHeight: 20,
  },
  detailError: {
    color: enterpriseColors.destructive,
  },
});
