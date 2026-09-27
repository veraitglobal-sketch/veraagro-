import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { useCostCalculatorData } from './useCostCalculatorData';
import CostEntryForm from './CostEntryForm';
import CostList from './CostList';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { HubMetricsStrip } from '../hubs/HubMetricsStrip';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { formatEur } from '../../../lib/format-money';
import { useAppLocaleTag } from '../../../lib/date-locale';

export default function CostCalculatorScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    costs,
    parcels,
    allocationLoading,
    plantingsForParcel,
    resolveAllocationLabels,
    loading,
    listRefreshing,
    refreshAll,
    addCost,
    removeCost,
  } = useCostCalculatorData();
  const [showForm, setShowForm] = useState(false);

  const refreshList = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);

  const handleAddCost = useCallback(
    async (entry: Parameters<typeof addCost>[0]) => {
      await addCost(entry);
      setShowForm(false);
    },
    [addCost],
  );

  const locale = useAppLocaleTag();

  const metricRows = useMemo(
    () => [
      {
        key: 'costs',
        type: 'count' as const,
        label: t('producer.costCalculator.costLinesMetric'),
        count: costs.length,
      },
      {
        key: 'total',
        type: 'text' as const,
        label: t('producer.costCalculator.total'),
        value: formatEur(costs.reduce((sum, c) => sum + c.amount, 0), locale),
      },
    ],
    [t, costs, locale],
  );

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(producer)/(tabs)/profile');
    }
  };

  const listBottomPad = Math.max(insets.bottom, 12) + 58 + 16;

  const listHeader = (
    <View style={styles.headerBlock}>
      <HubMetricsStrip rows={metricRows} />
      <TouchableOpacity
        onPress={() => setShowForm(true)}
        activeOpacity={0.88}
        style={[enterpriseUi.authBtnPrimary, styles.addBtn]}
      >
        <Plus size={18} color={enterpriseColors.white} strokeWidth={2.2} />
        <Text style={enterpriseUi.authBtnPrimaryText}>{t('producer.costCalculator.addCostAmount')}</Text>
      </TouchableOpacity>
      {showForm ? (
        <View style={[enterpriseUi.authPanel, styles.formCard]}>
          <CostEntryForm
            parcels={parcels}
            allocationLoading={allocationLoading}
            plantingsForParcel={plantingsForParcel}
            resolveAllocationLabels={resolveAllocationLabels}
            onSubmit={handleAddCost}
            onCancel={() => setShowForm(false)}
          />
        </View>
      ) : null}
      <Text style={[enterpriseUi.inAppSectionLabel, styles.listTitle]}>
        {t('producer.costCalculator.costListTitle')}
      </Text>
    </View>
  );

  return (
    <View style={growerUi.canvas}>
      <GrowerStackHeader
        title={t('producer.costCalculator.title')}
        subtitle={t('producer.costCalculator.screenLeadShort')}
        onBack={goBack}
      />
      <CostList
        costs={costs}
        loading={loading}
        listRefreshing={listRefreshing}
        onRefresh={refreshList}
        onDelete={removeCost}
        ListHeaderComponent={listHeader}
        contentPaddingBottom={listBottomPad}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    marginBottom: 12,
  },
  hint: {
    marginBottom: 12,
  },
  formCard: {
    marginBottom: 14,
  },
  listTitle: {
    marginTop: 4,
    marginBottom: 10,
  },
});
