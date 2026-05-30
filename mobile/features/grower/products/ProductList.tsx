import React from 'react';
import { View, Text, FlatList, StyleSheet, type ListRenderItem } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PendingProduct } from '../../../lib/offline-storage';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerStyles, growerUi } from '../../../lib/grower-ui';
import EmptyState from '../../../components/EmptyState';

interface ProductListProps {
  products: PendingProduct[];
  loading: boolean;
  listRefreshing: boolean;
  onRefresh: () => Promise<void>;
  ListHeaderComponent?: React.ReactElement;
  contentPaddingBottom?: number;
}

function ProductItem({ item }: { item: PendingProduct }) {
  const { t } = useTranslation();
  const statusLabel =
    item.status === 'pending'
      ? t('producer.products.savedOnDevice')
      : item.status === 'syncing'
        ? t('producer.products.syncing')
        : item.status;

  const statusTone =
    item.status === 'synced'
      ? { bg: enterpriseColors.primaryTint, text: enterpriseColors.primary }
      : { bg: enterpriseColors.gray100, text: enterpriseColors.gray700 };

  return (
    <View style={[enterpriseUi.inAppPanel, styles.item]}>
      <Text style={enterpriseUi.navRowTitle} numberOfLines={1}>
        {item.name}
      </Text>
      {item.contents ? (
        <Text style={enterpriseUi.navRowSubtitle} numberOfLines={2}>
          {item.contents}
        </Text>
      ) : null}
      <View style={styles.meta}>
        <Text style={enterpriseUi.navRowSubtitle}>
          {item.quantity} {item.unit}
        </Text>
        {item.parcelOrEstate ? (
          <Text style={enterpriseUi.navRowSubtitle}> · {item.parcelOrEstate}</Text>
        ) : null}
      </View>
      <View style={[growerStyles.statusPill, { backgroundColor: statusTone.bg, marginTop: 8 }]}>
        <Text style={[growerStyles.statusPillText, { color: statusTone.text }]}>{statusLabel}</Text>
      </View>
    </View>
  );
}

export default function ProductList({
  products,
  loading,
  listRefreshing,
  onRefresh,
  ListHeaderComponent,
  contentPaddingBottom = 24,
}: ProductListProps) {
  const { t } = useTranslation();

  const renderItem: ListRenderItem<PendingProduct> = ({ item }) => <ProductItem item={item} />;

  if (loading && products.length === 0) {
    return (
      <View style={styles.flex}>
        {ListHeaderComponent}
        <View style={styles.centered}>
          <Text style={enterpriseUi.navRowSubtitle}>{t('producer.products.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      onRefresh={() => void onRefresh()}
      refreshing={listRefreshing}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <EmptyState message={t('producer.products.noProducts')} />
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
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
});
