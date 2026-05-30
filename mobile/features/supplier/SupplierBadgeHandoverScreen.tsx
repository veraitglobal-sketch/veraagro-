import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanLine, Package } from 'lucide-react-native';
import { packageBadgesAPI } from '../../lib/api/batches';
import { apiErrorMessage } from '../../lib/api-error';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';
import { theme } from '../../lib/theme';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';

type Mode = 'receive' | 'sell';

type StockRow = {
  serial: string;
  type: string;
  childCount: number;
  batchId: string | null;
  createdAt: string;
};

export default function SupplierBadgeHandoverScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const [mode, setMode] = useState<Mode>('receive');
  const [serial, setSerial] = useState('');
  const [growerQr, setGrowerQr] = useState('');
  const [loading, setLoading] = useState(false);
  const [stock, setStock] = useState<StockRow[]>([]);
  const [stockLoading, setStockLoading] = useState(true);

  const loadStock = useCallback(async () => {
    setStockLoading(true);
    try {
      const rows = await packageBadgesAPI.listSupplierStock();
      setStock(rows as StockRow[]);
    } catch {
      setStock([]);
    } finally {
      setStockLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadStock();
      void (async () => {
        const badge = await AsyncStorage.getItem('last_supplier_badge_serial');
        const grower = await AsyncStorage.getItem('last_supplier_grower_qr');
        if (badge) {
          setSerial(badge);
          await AsyncStorage.removeItem('last_supplier_badge_serial');
        }
        if (grower) {
          setGrowerQr(grower);
          await AsyncStorage.removeItem('last_supplier_grower_qr');
        }
      })();
    }, [loadStock]),
  );

  const openScanner = (scanTarget: 'badge' | 'grower') => {
    router.push({
      pathname: '/(supplier)/scanner',
      params: { returnTo: 'supplier-badge', scanTarget },
    } as any);
  };

  const submitReceive = async () => {
    const rootSerial = serial.trim();
    if (!rootSerial) {
      Alert.alert(t('error'), t('supplier.badges.serialRequired'));
      return;
    }
    setLoading(true);
    try {
      const result = await packageBadgesAPI.supplierReceiveFromFactory({ rootSerial });
      const root = result?.root?.serial ?? rootSerial;
      const childCount = Array.isArray(result?.children) ? result.children.length : 0;
      Alert.alert(
        t('supplier.badges.receiveSuccessTitle'),
        t('supplier.badges.receiveSuccessBody', { serial: root, count: childCount }),
      );
      setSerial('');
      await loadStock();
    } catch (e) {
      Alert.alert(t('error'), apiErrorMessage(e, t('supplier.loadFailed')));
    } finally {
      setLoading(false);
    }
  };

  const submitSell = async () => {
    const rootSerial = serial.trim();
    const farmerQrCode = growerQr.trim();
    if (!rootSerial || !farmerQrCode) {
      Alert.alert(t('error'), t('supplier.badges.sellFieldsRequired'));
      return;
    }
    setLoading(true);
    try {
      const result = await packageBadgesAPI.supplierTransferToGrower({ rootSerial, farmerQrCode });
      Alert.alert(
        t('supplier.badges.sellSuccessTitle'),
        t('supplier.badges.sellSuccessBody', {
          serial: result?.rootSerial ?? rootSerial,
          grower: result?.growerName ?? farmerQrCode,
        }),
      );
      setSerial('');
      setGrowerQr('');
      await loadStock();
    } catch (e) {
      Alert.alert(t('error'), apiErrorMessage(e, t('supplier.loadFailed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.lead, { marginTop: p.headerTop }]}>{t('supplier.badges.screenLead')}</Text>

      <View style={styles.modeRow}>
        {(['receive', 'sell'] as Mode[]).map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => setMode(m)}
            style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
            accessibilityRole="button"
          >
            <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
              {m === 'receive' ? t('supplier.badges.modeReceive') : t('supplier.badges.modeSell')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[enterpriseUi.inAppPanel, styles.panel]}>
        <Text style={enterpriseUi.navRowTitle}>
          {mode === 'receive' ? t('supplier.badges.receiveTitle') : t('supplier.badges.sellTitle')}
        </Text>
        <Text style={styles.hint}>
          {mode === 'receive' ? t('supplier.badges.receiveHint') : t('supplier.badges.sellHint')}
        </Text>

        <Text style={styles.label}>{t('supplier.badges.masterSerial')}</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={serial}
            onChangeText={setSerial}
            placeholder={t('supplier.badges.serialPlaceholder')}
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.input}
          />
          <TouchableOpacity
            onPress={() => openScanner('badge')}
            style={styles.scanBtn}
            accessibilityRole="button"
            accessibilityLabel={t('producer.scanner.scanBarcode')}
          >
            <ScanLine size={20} color={enterpriseColors.primary} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {mode === 'sell' ? (
          <>
            <Text style={[styles.label, { marginTop: 14 }]}>{t('supplier.badges.growerQr')}</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={growerQr}
                onChangeText={setGrowerQr}
                placeholder={t('supplier.badges.growerQrPlaceholder')}
                autoCapitalize="characters"
                autoCorrect={false}
                style={styles.input}
              />
              <TouchableOpacity
                onPress={() => openScanner('grower')}
                style={styles.scanBtn}
                accessibilityRole="button"
              >
                <ScanLine size={20} color={enterpriseColors.primary} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        <TouchableOpacity
          onPress={mode === 'receive' ? submitReceive : submitSell}
          disabled={loading}
          style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>
              {mode === 'receive' ? t('supplier.badges.confirmReceive') : t('supplier.badges.confirmSell')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={[enterpriseUi.inAppPanel, styles.panel]}>
        <View style={styles.stockHeader}>
          <Package size={18} color={enterpriseColors.primary} strokeWidth={1.5} />
          <Text style={enterpriseUi.navRowTitle}>{t('supplier.badges.stockTitle')}</Text>
        </View>
        {stockLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 12 }} />
        ) : stock.length === 0 ? (
          <Text style={styles.empty}>{t('supplier.badges.stockEmpty')}</Text>
        ) : (
          stock.slice(0, 20).map((row) => (
            <TouchableOpacity
              key={row.serial}
              onPress={() => setSerial(row.serial)}
              style={styles.stockRow}
              accessibilityRole="button"
            >
              <Text style={styles.stockSerial}>{row.serial}</Text>
              <Text style={styles.stockMeta}>
                {t('supplier.badges.stockMeta', { type: row.type, count: row.childCount })}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  modeBtnActive: {
    borderColor: enterpriseColors.primary,
    backgroundColor: '#EEF4EC',
  },
  modeBtnText: {
    fontSize: 15,
    color: theme.colors.text.secondary,
  },
  modeBtnTextActive: {
    color: enterpriseColors.primary,
    fontWeight: '500',
  },
  panel: {
    padding: 16,
    marginBottom: 16,
  },
  hint: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 6,
    marginBottom: 14,
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  scanBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  primaryBtn: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: enterpriseColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  stockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  empty: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 8,
  },
  stockRow: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
  },
  stockSerial: {
    fontSize: 15,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  stockMeta: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
});
