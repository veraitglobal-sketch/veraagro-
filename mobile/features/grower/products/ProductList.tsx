import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { PendingProduct } from '../../../lib/offline-storage';
import { theme } from '../../../lib/theme';

interface ProductListProps {
  products: PendingProduct[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

function ProductItem({ item }: { item: PendingProduct }) {
  const statusLabel = item.status === 'pending' ? 'Sačuvano u telefonu' : item.status === 'syncing' ? 'Šalje se…' : item.status;
  return (
    <View style={styles.item}>
      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
      {item.contents ? <Text style={styles.contents} numberOfLines={2}>{item.contents}</Text> : null}
      <View style={styles.meta}>
        <Text style={styles.metaText}>{item.quantity} {item.unit}</Text>
        {item.parcelOrEstate ? <Text style={styles.metaText}> • {item.parcelOrEstate}</Text> : null}
      </View>
      <Text style={styles.status}>{statusLabel}</Text>
    </View>
  );
}

export default function ProductList({ products, loading, onRefresh }: ProductListProps) {
  if (loading && products.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.secondary}>Učitavanje…</Text>
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.secondary}>Nema unetih proizvoda. Dodajte QR ili ručni unos.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ProductItem item={item} />}
      onRefresh={onRefresh}
      refreshing={loading}
      contentContainerStyle={styles.list}
      style={styles.flatList}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: theme.spacing.md, paddingBottom: theme.spacing['2xl'] },
  flatList: { flex: 1 },
  item: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 0.5,
    borderColor: theme.colors.border,
  },
  name: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 4 },
  contents: { fontSize: 14, color: theme.colors.text.secondary, marginBottom: 4 },
  meta: { flexDirection: 'row', flexWrap: 'wrap' },
  metaText: { fontSize: 13, color: theme.colors.text.tertiary },
  status: { fontSize: 12, color: theme.colors.primary, marginTop: 6 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  secondary: { fontSize: 16, color: theme.colors.text.secondary, textAlign: 'center' },
});
