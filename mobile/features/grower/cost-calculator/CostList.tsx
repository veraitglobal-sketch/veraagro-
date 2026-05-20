import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, type ListRenderItem } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react-native';
import { PendingCost } from '../../../lib/offline-storage';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerStyles, growerUi } from '../../../lib/grower-ui';

interface CostListProps {
  costs: PendingCost[];
  loading: boolean;
  listRefreshing: boolean;
  onRefresh: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  ListHeaderComponent?: React.ReactElement;
  contentPaddingBottom?: number;
}

function CostItem({
  item,
  onDelete,
}: {
  item: PendingCost;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  const statusLabel =
    item.status === 'pending'
      ? t('producer.costCalculator.savedOnDevice')
      : item.status === 'syncing'
        ? t('producer.costCalculator.syncing')
        : item.status;

  const statusTone =
    item.status === 'synced'
      ? { bg: enterpriseColors.primaryTint, text: enterpriseColors.primary }
      : { bg: enterpriseColors.gray100, text: enterpriseColors.gray700 };

  const confirmDelete = () => {
    Alert.alert(
      t('producer.costCalculator.deleteTitle'),
      t('producer.costCalculator.deleteBody', { name: item.label }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('producer.costCalculator.deleteConfirm'),
          style: 'destructive',
          onPress: () => void onDelete(item.id),
        },
      ],
    );
  };

  return (
    <View style={[enterpriseUi.inAppPanel, styles.item]}>
      <View style={styles.itemTop}>
        <View style={styles.itemCopy}>
          <Text style={enterpriseUi.navRowTitle} numberOfLines={2}>
            {item.label}
          </Text>
          {item.parcelLabel ? (
            <Text style={styles.allocationLine} numberOfLines={2}>
              {item.plantingLabel
                ? t('producer.costCalculator.allocationLine', {
                    parcel: item.parcelLabel,
                    planting: item.plantingLabel,
                  })
                : item.parcelLabel}
            </Text>
          ) : null}
          {item.note?.trim() ? (
            <Text style={enterpriseUi.navRowSubtitle} numberOfLines={3}>
              {item.note.trim()}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={confirmDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.deleteBtn}
          accessibilityRole="button"
          accessibilityLabel={t('producer.costCalculator.deleteConfirm')}
        >
          <Trash2 size={20} color={enterpriseColors.destructive} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <Text style={styles.amount}>
          {item.amount} {item.currency || 'EUR'}
        </Text>
        <View style={[growerStyles.statusPill, { backgroundColor: statusTone.bg }]}>
          <Text style={[growerStyles.statusPillText, { color: statusTone.text }]}>{statusLabel}</Text>
        </View>
      </View>
    </View>
  );
}

export default function CostList({
  costs,
  loading,
  listRefreshing,
  onRefresh,
  onDelete,
  ListHeaderComponent,
  contentPaddingBottom = 24,
}: CostListProps) {
  const { t } = useTranslation();
  const total = costs.reduce((sum, c) => sum + c.amount, 0);

  const renderItem: ListRenderItem<PendingCost> = ({ item }) => (
    <CostItem item={item} onDelete={(id) => void onDelete(id)} />
  );

  const listFooter =
    costs.length > 0 ? (
      <View style={[enterpriseUi.inAppPanel, styles.totalBar]}>
        <Text style={enterpriseUi.navRowTitle}>{t('producer.costCalculator.total')}</Text>
        <Text style={styles.totalAmount}>{total.toFixed(2)} EUR</Text>
      </View>
    ) : null;

  if (loading && costs.length === 0) {
    return (
      <View style={styles.flex}>
        {ListHeaderComponent}
        <View style={styles.centered}>
          <Text style={enterpriseUi.navRowSubtitle}>{t('producer.costCalculator.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={costs}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      onRefresh={() => void onRefresh()}
      refreshing={listRefreshing}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={listFooter}
      ListEmptyComponent={
        <View style={growerUi.emptyCard}>
          <Text style={enterpriseUi.navRowSubtitle}>{t('producer.costCalculator.noCosts')}</Text>
        </View>
      }
      contentContainerStyle={[styles.list, { paddingBottom: contentPaddingBottom }]}
      style={styles.flex}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  item: {
    padding: 16,
    marginBottom: 10,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
  },
  deleteBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  allocationLine: {
    fontSize: 14,
    fontWeight: '500',
    color: enterpriseColors.primary,
    marginTop: 4,
    lineHeight: 20,
  },
  amount: {
    fontSize: 16,
    fontWeight: '500',
    color: enterpriseColors.primary,
    letterSpacing: -0.2,
  },
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '300',
    color: enterpriseColors.primary,
    letterSpacing: -0.4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
});
