import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Calculator, Plus } from 'lucide-react-native';
import { useCostCalculatorData } from './useCostCalculatorData';
import CostEntryForm from './CostEntryForm';
import CostList from './CostList';
import { theme } from '../../../lib/theme';

export default function CostCalculatorScreen() {
  const { t } = useTranslation();
  const { costs, products, loading, listRefreshing, load, addCost } = useCostCalculatorData();
  const [showForm, setShowForm] = useState(false);

  const refreshList = useCallback(async () => {
    await load({ silent: true });
  }, [load]);

  const handleAddCost = useCallback(
    async (entry: Parameters<typeof addCost>[0]) => {
      await addCost(entry);
      setShowForm(false);
    },
    [addCost]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('producer.costCalculator.title')}</Text>
        <Text style={styles.subtitle}>{t('producer.costCalculator.subtitle')}</Text>
      </View>

      <TouchableOpacity
        style={styles.bigButton}
        onPress={() => setShowForm(true)}
      >
        <Plus size={28} color={theme.colors.text.inverse} strokeWidth={1.5} />
        <Text style={styles.bigButtonText}>{t('producer.costCalculator.addCostAmount')}</Text>
      </TouchableOpacity>

      {products.length > 0 && (
        <View style={styles.productsHint}>
          <Text style={styles.productsHintText}>
            {t('producer.costCalculator.productsTransferNote')}
          </Text>
        </View>
      )}

      {showForm && (
        <View style={styles.formCard}>
          <CostEntryForm
            onSubmit={handleAddCost}
            onCancel={() => setShowForm(false)}
          />
        </View>
      )}

      <View style={styles.listHeader}>
        <Calculator size={20} color={theme.colors.text.secondary} strokeWidth={1} />
        <Text style={styles.listTitle}>{t('producer.costCalculator.costListTitle')}</Text>
      </View>
      <CostList costs={costs} loading={loading} listRefreshing={listRefreshing} onRefresh={refreshList} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.md },
  title: { ...theme.typography.h3, color: theme.colors.text.primary },
  subtitle: { ...theme.typography.bodySmall, color: theme.colors.text.secondary, marginTop: 4 },
  bigButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    minHeight: 56,
  },
  bigButtonText: { fontSize: 18, fontWeight: '600', color: theme.colors.text.inverse },
  productsHint: { marginHorizontal: theme.spacing.md, marginBottom: theme.spacing.sm },
  productsHintText: { fontSize: 13, color: theme.colors.text.tertiary },
  formCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 0.5,
    borderColor: theme.colors.border,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: theme.spacing.md,
    marginBottom: 8,
  },
  listTitle: { ...theme.typography.body, fontWeight: '600', color: theme.colors.text.primary },
});
