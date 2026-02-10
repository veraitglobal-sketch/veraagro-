import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { PendingCost } from '../../../lib/offline-storage';
import { theme } from '../../../lib/theme';

interface CostListProps {
  costs: PendingCost[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

function CostItem({ item }: { item: PendingCost }) {
  const statusLabel = item.status === 'pending' ? 'Sačuvano u telefonu' : item.status === 'syncing' ? 'Šalje se…' : item.status;
  return (
    <View style={styles.item}>
      <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
      <View style={styles.row}>
        <Text style={styles.amount}>{item.amount} {item.currency || 'EUR'}</Text>
        <Text style={styles.status}>{statusLabel}</Text>
      </View>
    </View>
  );
}

export default function CostList({ costs, loading, onRefresh }: CostListProps) {
  const total = costs.reduce((sum, c) => sum + c.amount, 0);

  if (loading && costs.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.secondary}>Učitavanje…</Text>
      </View>
    );
  }

  return (
    <>
      {costs.length > 0 && (
        <View style={styles.totalBar}>
          <Text style={styles.totalLabel}>Ukupno</Text>
          <Text style={styles.totalAmount}>{total.toFixed(2)} EUR</Text>
        </View>
      )}
      <FlatList
        data={costs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CostItem item={item} />}
        onRefresh={onRefresh}
        refreshing={loading}
        contentContainerStyle={styles.list}
        style={styles.flatList}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.secondary}>Nema unetih troškova. Dodajte iznos ili prenesite iz Moji proizvodi.</Text>
          </View>
        }
      />
    </>
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
  label: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  amount: { fontSize: 15, color: theme.colors.primary, fontWeight: '600' },
  status: { fontSize: 12, color: theme.colors.text.tertiary },
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  totalLabel: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary },
  totalAmount: { fontSize: 18, fontWeight: '700', color: theme.colors.primary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  secondary: { fontSize: 16, color: theme.colors.text.secondary, textAlign: 'center' },
});
