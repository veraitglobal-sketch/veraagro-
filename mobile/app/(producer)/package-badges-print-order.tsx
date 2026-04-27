import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Factory } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../lib/theme';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { packageBadgesAPI } from '../../lib/api';

type OrderRow = { id: string; status: string; parentCount: number; childrenPerParent: number; serialPrefix: string };

export default function PackageBadgesPrintOrderScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = useBioVeraScreenPadding();
  const [parentCount, setParentCount] = useState('1');
  const [childrenPer, setChildrenPer] = useState('0');
  const [prefix, setPrefix] = useState('PLT');
  const [notes, setNotes] = useState('');
  const [previewJson, setPreviewJson] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [returnRoot, setReturnRoot] = useState('');
  const [returnSupp, setReturnSupp] = useState('');

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const data = await packageBadgesAPI.listMyPrintOrders();
      setOrders(Array.isArray(data) ? (data as OrderRow[]) : []);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const onPreview = async () => {
    setPreviewLoading(true);
    try {
      const pc = parseInt(parentCount, 10) || 1;
      const cp = parseInt(childrenPer, 10) || 0;
      const r = await packageBadgesAPI.previewPrintOrder({
        parentCount: pc,
        childrenPerParent: cp,
        serialPrefix: prefix || undefined,
      });
      setPreviewJson(JSON.stringify(r, null, 2));
    } catch (e: unknown) {
      Alert.alert('', t('producer.packageBadges.printErr'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const onSave = async () => {
    setSaveLoading(true);
    try {
      const pc = parseInt(parentCount, 10) || 1;
      const cp = parseInt(childrenPer, 10) || 0;
      await packageBadgesAPI.createPrintOrder({
        parentCount: pc,
        childrenPerParent: cp,
        serialPrefix: prefix || undefined,
        notesToPrinter: notes || undefined,
      });
      setPreviewJson(null);
      await loadOrders();
      Alert.alert('', t('producer.packageBadges.printSaved'));
    } catch (e: unknown) {
      Alert.alert('', t('producer.packageBadges.printErr'));
    } finally {
      setSaveLoading(false);
    }
  };

  const onReturn = async () => {
    if (!returnRoot.trim() || !returnSupp.trim()) {
      Alert.alert('', t('producer.packageBadges.returnFill'));
      return;
    }
    setReturnLoading(true);
    try {
      await packageBadgesAPI.returnTreeToSupplier({
        rootSerial: returnRoot.trim(),
        supplierUserId: returnSupp.trim(),
      });
      setReturnRoot('');
      setReturnSupp('');
      Alert.alert('', t('producer.packageBadges.returnOk'));
    } catch (e: unknown) {
      Alert.alert('', t('producer.packageBadges.printErr'));
    } finally {
      setReturnLoading(false);
    }
  };

  const busy = previewLoading || saveLoading || returnLoading;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={[styles.top, { paddingTop: insets.top + 8, paddingLeft: p.screenPaddingLeft, paddingRight: p.screenPaddingRight }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <ChevronLeft size={22} color={theme.colors.text.primary} />
          <Text style={{ color: theme.colors.text.secondary, fontSize: 14 }}>{t('common.back')}</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Factory size={22} color={theme.colors.primary} />
          <Text style={{ fontSize: 20, fontWeight: '600', color: theme.colors.text.primary, flex: 1 }} numberOfLines={2}>
            {t('producer.packageBadges.printScreenTitle')}
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: theme.colors.text.secondary, marginTop: 6, lineHeight: 20 }}>
          {t('producer.packageBadges.printScreenSub')}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: p.screenPaddingLeft,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 24),
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>{t('producer.packageBadges.printParentN')}</Text>
        <TextInput
          value={parentCount}
          onChangeText={setParentCount}
          keyboardType="number-pad"
          style={styles.inp}
        />
        <Text style={[styles.label, { marginTop: 12 }]}>{t('producer.packageBadges.printChildN')}</Text>
        <TextInput
          value={childrenPer}
          onChangeText={setChildrenPer}
          keyboardType="number-pad"
          style={styles.inp}
        />
        <Text style={[styles.label, { marginTop: 12 }]}>{t('producer.packageBadges.printPrefix')}</Text>
        <TextInput value={prefix} onChangeText={(s) => setPrefix(s.toUpperCase())} style={styles.inp} />
        <Text style={[styles.label, { marginTop: 12 }]}>{t('producer.packageBadges.printNotes')}</Text>
        <TextInput value={notes} onChangeText={setNotes} multiline style={[styles.inp, { minHeight: 70 }]} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <TouchableOpacity
            onPress={onPreview}
            disabled={busy}
            style={[styles.btnSec, { flex: 1, minHeight: 44, justifyContent: 'center' }]}
          >
            {previewLoading ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <Text style={styles.btnSecT}>{t('producer.packageBadges.printPreview')}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSave}
            disabled={busy}
            style={[styles.btnPri, { flex: 1 }]}
          >
            {saveLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPriT}>{t('producer.packageBadges.printSave')}</Text>}
          </TouchableOpacity>
        </View>
        {previewJson && (
          <Text selectable style={styles.pre}>
            {previewJson}
          </Text>
        )}

        <Text style={[styles.h2, { marginTop: 24 }]}>{t('producer.packageBadges.printList')}</Text>
        {ordersLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 8 }} />
        ) : orders.length === 0 ? (
          <Text style={styles.muted}>{t('producer.packageBadges.printListEmpty')}</Text>
        ) : (
          orders.map((o) => (
            <View key={o.id} style={styles.card}>
              <Text style={styles.cardT}>
                {o.status} · {o.parentCount}×{o.childrenPerParent} {o.serialPrefix}
              </Text>
              {o.status === 'DRAFT' && (
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      await packageBadgesAPI.markPrintOrderSent(o.id);
                      void loadOrders();
                    } catch {
                      Alert.alert('', t('producer.packageBadges.printErr'));
                    }
                  }}
                >
                  <Text style={styles.link}>{t('producer.packageBadges.printMarkSent')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        <Text style={[styles.h2, { marginTop: 24 }]}>{t('producer.packageBadges.returnTitle')}</Text>
        <Text style={styles.muted}>{t('producer.packageBadges.returnSub')}</Text>
        <Text style={[styles.label, { marginTop: 8 }]}>{t('producer.packageBadges.returnRoot')}</Text>
        <TextInput value={returnRoot} onChangeText={setReturnRoot} style={styles.inp} />
        <Text style={styles.label}>{t('producer.packageBadges.returnSupp')}</Text>
        <TextInput value={returnSupp} onChangeText={setReturnSupp} style={styles.inp} autoCapitalize="none" />
        <TouchableOpacity
          onPress={onReturn}
          disabled={busy}
          style={[styles.btnAmber, { marginTop: 10, minHeight: 44, justifyContent: 'center' }]}
        >
          {returnLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnAmberT}>{t('producer.packageBadges.returnCta')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 4 },
  muted: { fontSize: 12, color: theme.colors.text.secondary, lineHeight: 18 },
  h2: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary },
  inp: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 10,
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  pre: { marginTop: 10, fontSize: 10, fontFamily: 'monospace', color: theme.colors.text.secondary, backgroundColor: theme.colors.surface, padding: 8, borderRadius: 8 },
  btnSec: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: 12, alignItems: 'center' },
  btnSecT: { fontSize: 14, fontWeight: '600', color: theme.colors.text.primary },
  btnPri: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, padding: 12, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  btnPriT: { color: '#fff', fontSize: 14, fontWeight: '600' },
  card: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 10, marginTop: 8 },
  cardT: { fontSize: 13, color: theme.colors.text.primary },
  link: { marginTop: 6, color: theme.colors.primary, fontWeight: '600', fontSize: 13 },
  btnAmber: { backgroundColor: '#b45309', borderRadius: theme.borderRadius.md, padding: 12, alignItems: 'center' },
  btnAmberT: { color: '#fff', fontWeight: '600' },
});
