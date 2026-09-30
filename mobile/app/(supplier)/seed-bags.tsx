import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { b2bSuppliersAPI } from '../../lib/api';
import { theme } from '../../lib/theme';

type Tab = 'receive' | 'stock' | 'sell';

function parseSerials(raw: string): string[] {
  return raw
    .split(/[\s,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function SupplierSeedBagsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('receive');
  const [refreshing, setRefreshing] = useState(false);
  const [receiveInput, setReceiveInput] = useState('');
  const [receiveLog, setReceiveLog] = useState<Array<{ serial: string; ok: boolean; reason?: string }>>([]);
  const [sellCode, setSellCode] = useState('');
  const [sellSerials, setSellSerials] = useState('');
  const [sellLog, setSellLog] = useState<Array<{ serial: string; ok: boolean; reason?: string }>>([]);
  const [stock, setStock] = useState<Array<{ productName: string; lotNumber: string; count: number }>>([]);
  const [busy, setBusy] = useState(false);

  const loadStock = useCallback(async () => {
    const data = await b2bSuppliersAPI.getMySeedBags('IN_SUPPLIER_STOCK').catch(() => ({ grouped: [] }));
    setStock(data.grouped ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadStock();
    }, [loadStock]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStock();
    setRefreshing(false);
  };

  const doReceive = async () => {
    const serials = parseSerials(receiveInput);
    if (serials.length === 0) return;
    setBusy(true);
    try {
      const res = await b2bSuppliersAPI.receiveSeedBags(serials);
      setReceiveLog(res.results);
      setReceiveInput('');
      await loadStock();
    } finally {
      setBusy(false);
    }
  };

  const doSell = async () => {
    const serials = parseSerials(sellSerials);
    if (serials.length === 0 || !sellCode.trim()) return;
    setBusy(true);
    try {
      const res = await b2bSuppliersAPI.sellSeedBags({
        growerPartnerCode: sellCode.trim().toUpperCase(),
        serials,
      });
      setSellLog(res.results);
      setSellSerials('');
      await loadStock();
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
    >
      <View style={styles.tabs}>
        {(['receive', 'stock', 'sell'] as Tab[]).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
              {t(`supplier.seedBags.${key}`, { defaultValue: key })}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'receive' && (
        <View style={styles.panel}>
          <Text style={styles.hint}>
            {t('supplier.seedBags.receiveHint', { defaultValue: 'Scan or paste serial numbers from shipped bags.' })}
          </Text>
          <TextInput
            multiline
            value={receiveInput}
            onChangeText={setReceiveInput}
            placeholder="BV-26-LOT-000001-XXXX"
            style={styles.inputMono}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.btn} onPress={() => void doReceive()} disabled={busy}>
            <Text style={styles.btnText}>{t('supplier.seedBags.confirmReceive', { defaultValue: 'Confirm receive' })}</Text>
          </TouchableOpacity>
          {receiveLog.map((r) => (
            <Text key={r.serial} style={r.ok ? styles.ok : styles.fail}>
              {r.serial} {r.ok ? '✓' : `— ${r.reason}`}
            </Text>
          ))}
        </View>
      )}

      {tab === 'stock' && (
        <View style={styles.panel}>
          {stock.length === 0 ? (
            <Text style={styles.hint}>{t('supplier.seedBags.emptyStock', { defaultValue: 'No bags in stock.' })}</Text>
          ) : (
            stock.map((g) => (
              <View key={`${g.productName}-${g.lotNumber}`} style={styles.stockRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stockTitle}>{g.productName}</Text>
                  <Text style={styles.hint}>Lot {g.lotNumber}</Text>
                </View>
                <Text style={styles.stockCount}>{g.count}</Text>
              </View>
            ))
          )}
        </View>
      )}

      {tab === 'sell' && (
        <View style={styles.panel}>
          <Text style={styles.label}>{t('supplier.seedBags.growerCode', { defaultValue: 'Grower partner code' })}</Text>
          <TextInput
            value={sellCode}
            onChangeText={(v) => setSellCode(v.toUpperCase())}
            style={styles.input}
            autoCapitalize="characters"
          />
          <Text style={styles.label}>{t('supplier.seedBags.serials', { defaultValue: 'Bag serials' })}</Text>
          <TextInput multiline value={sellSerials} onChangeText={setSellSerials} style={styles.inputMono} />
          <TouchableOpacity style={styles.btn} onPress={() => void doSell()} disabled={busy}>
            <Text style={styles.btnText}>{t('supplier.seedBags.sell', { defaultValue: 'Sell bags' })}</Text>
          </TouchableOpacity>
          {sellLog.map((r) => (
            <Text key={r.serial} style={r.ok ? styles.ok : styles.fail}>
              {r.serial} {r.ok ? '✓' : `— ${r.reason}`}
            </Text>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.scanLink} onPress={() => router.push('/(supplier)/scanner')}>
        <Text style={styles.scanLinkText}>{t('supplier.seedBags.openScanner', { defaultValue: 'Open barcode scanner' })}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: 40 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing.md },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: '#2D5A27', borderColor: '#2D5A27' },
  tabText: { fontSize: 13, color: theme.colors.text.secondary },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  panel: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  hint: { fontSize: 13, color: theme.colors.text.secondary, marginBottom: theme.spacing.sm },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.text.primary, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginTop: 4,
    fontSize: 16,
  },
  inputMono: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    minHeight: 100,
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  btn: {
    marginTop: theme.spacing.md,
    backgroundColor: '#2D5A27',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  ok: { fontSize: 12, color: '#166534', marginTop: 4, fontFamily: 'monospace' },
  fail: { fontSize: 12, color: '#b91c1c', marginTop: 4, fontFamily: 'monospace' },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  stockTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text.primary },
  stockCount: { fontSize: 16, fontWeight: '700', color: '#2D5A27' },
  scanLink: { marginTop: theme.spacing.lg, alignItems: 'center' },
  scanLinkText: { color: '#2D5A27', fontSize: 14, fontWeight: '500' },
});
