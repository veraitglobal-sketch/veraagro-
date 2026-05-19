import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QrCode, Plus } from 'lucide-react-native';
import { useProductsData } from './useProductsData';
import ProductEntryForm from './ProductEntryForm';
import ProductList from './ProductList';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { HubMetricsStrip } from '../hubs/HubMetricsStrip';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';

export default function ProductsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
        } catch {
          /* ignore */
        }
      };
      void readScanned();
    }, []),
  );

  const handleAdd = useCallback(
    async (entry: Parameters<typeof addProduct>[0]) => {
      await addProduct(entry);
      setShowForm(false);
      setScannedQr(null);
    },
    [addProduct],
  );

  const productMetricRows = useMemo(
    () => [
      {
        key: 'lines',
        type: 'count' as const,
        label: t('producer.products.deviceLinesMetric'),
        count: products.length,
      },
    ],
    [t, products.length],
  );

  const refreshList = useCallback(async () => {
    await load({ silent: true });
  }, [load]);

  const openScanner = () => {
    setScannedQr(null);
    router.push({ pathname: '/(producer)/scanner', params: { returnTo: 'products' } });
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(producer)/(tabs)/supplies');
    }
  };

  const listBottomPad = Math.max(insets.bottom, 12) + 58 + 16;

  const listHeader = (
    <View style={styles.headerBlock}>
      <HubMetricsStrip rows={productMetricRows} />
      <View style={styles.actions}>
        <TouchableOpacity onPress={openScanner} activeOpacity={0.88} style={[enterpriseUi.authBtnPrimary, styles.actionBtn]}>
          <QrCode size={22} color={enterpriseColors.white} strokeWidth={1.5} />
          <Text style={enterpriseUi.authBtnPrimaryText}>{t('producer.dashboard.scanQr')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setScannedQr(null);
            setShowForm(true);
          }}
          activeOpacity={0.88}
          style={[styles.actionBtn, styles.actionBtnOutline]}
        >
          <Plus size={22} color={enterpriseColors.primary} strokeWidth={1.5} />
          <Text style={styles.actionBtnOutlineText}>{t('producer.dashboard.manualEntry')}</Text>
        </TouchableOpacity>
      </View>
      {showForm ? (
        <View style={[enterpriseUi.authPanel, styles.formCard]}>
          <ProductEntryForm
            onSubmit={handleAdd}
            onCancel={() => {
              setShowForm(false);
              setScannedQr(null);
            }}
            initialQrCode={scannedQr || ''}
            initialSource={scannedQr ? 'qr' : 'manual'}
          />
        </View>
      ) : null}
      <Text style={[enterpriseUi.inAppSectionLabel, styles.listTitle]}>
        {t('producer.products.enteredListTitle')}
      </Text>
    </View>
  );

  return (
    <View style={growerUi.canvas}>
      <GrowerStackHeader
        title={t('producer.dashboard.myProducts')}
        subtitle={t('producer.products.screenLeadShort')}
        onBack={goBack}
      />
      <ProductList
        products={products}
        loading={loading}
        listRefreshing={listRefreshing}
        onRefresh={refreshList}
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
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
  },
  actionBtnOutline: {
    backgroundColor: enterpriseColors.white,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    borderRadius: 12,
  },
  actionBtnOutlineText: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.primary,
    letterSpacing: -0.2,
  },
  formCard: {
    marginBottom: 14,
  },
  listTitle: {
    marginTop: 4,
    marginBottom: 10,
  },
});
