import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Package, QrCode, Plus } from 'lucide-react-native';
import { useProductsData } from './useProductsData';
import ProductEntryForm from './ProductEntryForm';
import ProductList from './ProductList';
import { theme } from '../../../lib/theme';
import { HubSummaryMetrics } from '../hubs/HubSummaryMetrics';

export default function ProductsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { products, loading, listRefreshing, load, addProduct } = useProductsData();
  const [showForm, setShowForm] = useState(false);
  const [scannedQr, setScannedQr] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const readScanned = async () => {
        try {
          const qr = await AsyncStorage.getItem('last_scanned_qr');
          if (qr) {
            setScannedQr(qr);
            setShowForm(true);
            await AsyncStorage.removeItem('last_scanned_qr');
          }
        } catch (_) {}
      };
      readScanned();
    }, [])
  );

  const handleAdd = useCallback(
    async (entry: Parameters<typeof addProduct>[0]) => {
      await addProduct(entry);
      setShowForm(false);
      setScannedQr(null);
    },
    [addProduct]
  );

  const productMetricRows = useMemo(
    () => [{ key: 'lines', label: t('producer.products.deviceLinesMetric'), value: String(products.length) }],
    [t, products.length],
  );

  const refreshList = useCallback(async () => {
    await load({ silent: true });
  }, [load]);

  const openScanner = () => {
    setScannedQr(null);
    router.push({ pathname: '../scanner', params: { returnTo: 'products' } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('producer.dashboard.myProducts')}</Text>
        <Text style={styles.subtitle}>{t('producer.dashboard.myProductsDesc')}</Text>
      </View>

      <View style={styles.metricsWrap}>
        <HubSummaryMetrics title={t('producer.hubs.metrics.summaryTitle')} rows={productMetricRows} />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.bigButton} onPress={openScanner}>
          <QrCode size={28} color={theme.colors.text.inverse} strokeWidth={1.5} />
          <Text style={styles.bigButtonText}>{t('producer.dashboard.scanQr')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bigButton, styles.bigButtonSecondary]}
          onPress={() => { setScannedQr(null); setShowForm(true); }}
        >
          <Plus size={28} color={theme.colors.primary} strokeWidth={1.5} />
          <Text style={styles.bigButtonTextSecondary}>{t('producer.dashboard.manualEntry')}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <ProductEntryForm
            onSubmit={handleAdd}
            onCancel={() => { setShowForm(false); setScannedQr(null); }}
            initialQrCode={scannedQr || ''}
            initialSource={scannedQr ? 'qr' : 'manual'}
          />
        </View>
      )}

      <View style={styles.listHeader}>
        <Package size={20} color={theme.colors.text.secondary} strokeWidth={1} />
        <Text style={styles.listTitle}>{t('producer.products.enteredListTitle')}</Text>
      </View>
      <ProductList
        products={products}
        loading={loading}
        listRefreshing={listRefreshing}
        onRefresh={refreshList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.md },
  metricsWrap: { paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.sm },
  title: { ...theme.typography.h3, color: theme.colors.text.primary },
  subtitle: { ...theme.typography.bodySmall, color: theme.colors.text.secondary, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.md },
  bigButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    minHeight: 56,
  },
  bigButtonSecondary: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.primary },
  bigButtonText: { fontSize: 18, fontWeight: '600', color: theme.colors.text.inverse },
  bigButtonTextSecondary: { fontSize: 18, fontWeight: '600', color: theme.colors.primary },
  formCard: { marginHorizontal: theme.spacing.md, marginBottom: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, borderWidth: 0.5, borderColor: theme.colors.border },
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: theme.spacing.md, marginBottom: 8 },
  listTitle: { ...theme.typography.body, fontWeight: '600', color: theme.colors.text.primary },
});
