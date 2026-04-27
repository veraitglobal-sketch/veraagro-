import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, QrCode } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../lib/theme';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { batchesAPI, packageBadgesAPI, type PackageBadgeType } from '../../lib/api';
import { API_URL } from '../../lib/api-url';

type ParentType = Extract<PackageBadgeType, 'PALLET_MASTER' | 'ROLL_LINE'>;

function parseChildSerials(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
}

function publicBadgeUrl(serial: string): string {
  const base = API_URL.replace(/\/$/, '');
  return `${base}/public/badges/${encodeURIComponent(serial)}`;
}

export default function PackageBadgesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = useBioVeraScreenPadding();

  const [batches, setBatches] = useState<{ id: string; batchId: string; productName?: string }[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [parentSerial, setParentSerial] = useState('');
  const [badgeType, setBadgeType] = useState<ParentType>('PALLET_MASTER');
  const [childrenRaw, setChildrenRaw] = useState('');
  const [batchInternalId, setBatchInternalId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [openBatchPicker, setOpenBatchPicker] = useState(false);
  const [printOrders, setPrintOrders] = useState<{ id: string; status: string }[]>([]);
  const [printOrdersLoading, setPrintOrdersLoading] = useState(true);
  const [selectedPrintOrderId, setSelectedPrintOrderId] = useState<string | null>(null);
  const [openPrintPicker, setOpenPrintPicker] = useState(false);

  const loadBatches = useCallback(async () => {
    setBatchesLoading(true);
    try {
      const data = await batchesAPI.getAll();
      const arr = Array.isArray(data) ? data : [];
      setBatches(
        arr.map((b: { id: string; batchId: string; productName?: string }) => ({
          id: b.id,
          batchId: b.batchId,
          productName: b.productName,
        })),
      );
    } catch {
      setBatches([]);
    } finally {
      setBatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  const loadPrintOrders = useCallback(async () => {
    setPrintOrdersLoading(true);
    try {
      const data = await packageBadgesAPI.listMyPrintOrders();
      const arr = Array.isArray(data) ? data : [];
      setPrintOrders(
        arr
          .filter(
            (o: { status?: string }) => o?.status && o.status !== 'COMPLETED' && o.status !== 'CANCELLED',
          )
          .map((o: { id: string; status: string }) => ({ id: o.id, status: o.status })),
      );
    } catch {
      setPrintOrders([]);
    } finally {
      setPrintOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPrintOrders();
  }, [loadPrintOrders]);

  const selectedBatchLabel = batchInternalId
    ? (() => {
        const b = batches.find((x) => x.id === batchInternalId);
        return b ? `${b.batchId}${b.productName ? ` — ${b.productName}` : ''}` : '';
      })()
    : null;

  const onSubmit = async () => {
    const parent = parentSerial.trim();
    if (!parent) {
      Alert.alert('', t('producer.packageBadges.errParent'));
      return;
    }
    setSubmitting(true);
    try {
      const childSerials = parseChildSerials(childrenRaw);
      await packageBadgesAPI.register({
        parentSerial: parent,
        type: badgeType,
        childSerials,
        ...(batchInternalId ? { batchId: batchInternalId } : {}),
        ...(selectedPrintOrderId ? { printOrderId: selectedPrintOrderId } : {}),
      });
      setSelectedPrintOrderId(null);
      void loadPrintOrders();
      const url = publicBadgeUrl(parent);
      Alert.alert(t('producer.packageBadges.successTitle'), t('producer.packageBadges.successBody'), [
        { text: t('producer.packageBadges.shareUrl'), onPress: () => void Share.share({ message: url, title: url }) },
        { text: 'OK' },
      ]);
      setParentSerial('');
      setChildrenRaw('');
      setBatchInternalId(null);
    } catch (e: unknown) {
      const raw =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
          : null;
      const msg = Array.isArray(raw) ? raw.join(' ') : raw;
      Alert.alert(
        t('producer.packageBadges.errTitle'),
        typeof msg === 'string' && msg.trim() ? msg : t('producer.packageBadges.errGeneric'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: theme.spacing.md,
          paddingLeft: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}
          hitSlop={12}
        >
          <ChevronLeft size={22} color={theme.colors.text.primary} strokeWidth={1.5} />
          <Text style={{ fontSize: 14, color: theme.colors.text.secondary }}>{t('common.back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/(producer)/package-badges-print-order')}
          style={{ marginBottom: 10 }}
        >
          <Text style={{ fontSize: 14, color: theme.colors.primary, fontWeight: '600' }}>
            {t('producer.packageBadges.openPrintOrder')} →
          </Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <QrCode size={22} color={theme.colors.primary} strokeWidth={1.75} />
          <Text
            style={{ fontSize: 20, fontWeight: '600', color: theme.colors.text.primary, flex: 1 }}
            numberOfLines={2}
          >
            {t('producer.packageBadges.title')}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 13,
            color: theme.colors.text.secondary,
            marginTop: 6,
            lineHeight: 20,
          }}
        >
          {t('producer.packageBadges.subtitle')}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: p.screenPaddingLeft,
          paddingTop: theme.spacing.md,
          paddingBottom: Math.max(insets.bottom, 24),
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={labelStyle}>{t('producer.packageBadges.parentLabel')}</Text>
        <Text style={hintStyle}>{t('producer.packageBadges.parentHint')}</Text>
        <TextInput
          value={parentSerial}
          onChangeText={setParentSerial}
          placeholder={t('producer.packageBadges.parentPh')}
          placeholderTextColor={theme.colors.text.tertiary}
          autoCapitalize="characters"
          style={inputStyle}
        />

        <Text style={[labelStyle, { marginTop: 16 }]}>{t('producer.packageBadges.typeLabel')}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {(
            [
              ['PALLET_MASTER' as const, 'producer.packageBadges.typePallet'],
              ['ROLL_LINE' as const, 'producer.packageBadges.typeRoll'],
            ] as const
          ).map(([v, key]) => {
            const on = badgeType === v;
            return (
              <TouchableOpacity
                key={v}
                onPress={() => setBadgeType(v)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: theme.borderRadius.md,
                  borderWidth: 1,
                  borderColor: on ? theme.colors.primary : theme.colors.border,
                  backgroundColor: on ? `${theme.colors.primary}12` : theme.colors.surface,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text.primary }}>
                  {t(key)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[labelStyle, { marginTop: 16 }]}>{t('producer.packageBadges.linkPrintOrder')}</Text>
        <Text style={hintStyle}>{t('producer.packageBadges.linkPrintHint')}</Text>
        <TouchableOpacity
          onPress={() => setOpenPrintPicker((o) => !o)}
          style={[inputStyle, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
        >
          <Text
            style={{
              fontSize: 15,
              color: selectedPrintOrderId
                ? theme.colors.text.primary
                : theme.colors.text.tertiary,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {printOrdersLoading
              ? t('producer.packageBadges.linkPrintOrderLoading')
              : selectedPrintOrderId
                ? `${printOrders.find((x) => x.id === selectedPrintOrderId)?.status ?? ''} · ${selectedPrintOrderId.slice(0, 8)}`
                : '—'}
          </Text>
        </TouchableOpacity>
        {openPrintPicker && !printOrdersLoading && (
          <View style={{ maxHeight: 160, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, marginBottom: 12 }}>
            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
              <TouchableOpacity
                onPress={() => {
                  setSelectedPrintOrderId(null);
                  setOpenPrintPicker(false);
                }}
                style={{ padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border }}
              >
                <Text style={{ color: theme.colors.text.secondary }}>—</Text>
              </TouchableOpacity>
              {printOrders.map((o) => (
                <TouchableOpacity
                  key={o.id}
                  onPress={() => {
                    setSelectedPrintOrderId(o.id);
                    setOpenPrintPicker(false);
                  }}
                  style={{ padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border }}
                >
                  <Text style={{ color: theme.colors.text.primary, fontSize: 13 }}>
                    {o.status} · {o.id.slice(0, 8)}…
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={[labelStyle, { marginTop: 20 }]}>{t('producer.packageBadges.childrenLabel')}</Text>
        <Text style={hintStyle}>{t('producer.packageBadges.childrenHint')}</Text>
        <TextInput
          value={childrenRaw}
          onChangeText={setChildrenRaw}
          placeholder={t('producer.packageBadges.childrenPh')}
          placeholderTextColor={theme.colors.text.tertiary}
          multiline
          style={[inputStyle, { minHeight: 100, textAlignVertical: 'top' }]}
        />

        <Text style={[labelStyle, { marginTop: 8 }]}>{t('producer.packageBadges.batchLabel')}</Text>
        <TouchableOpacity
          onPress={() => setOpenBatchPicker((o) => !o)}
          style={[inputStyle, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
        >
          <Text
            style={{
              fontSize: 15,
              color: selectedBatchLabel ? theme.colors.text.primary : theme.colors.text.tertiary,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {batchesLoading
              ? t('producer.packageBadges.loadingBatches')
              : selectedBatchLabel || t('producer.packageBadges.batchNone')}
          </Text>
        </TouchableOpacity>
        {openBatchPicker && !batchesLoading && (
          <View
            style={{
              maxHeight: 200,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.md,
              marginTop: 8,
            }}
          >
            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
              <TouchableOpacity
                onPress={() => {
                  setBatchInternalId(null);
                  setOpenBatchPicker(false);
                }}
                style={{ padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border }}
              >
                <Text style={{ color: theme.colors.text.secondary }}>{t('producer.packageBadges.batchNone')}</Text>
              </TouchableOpacity>
              {batches.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => {
                    setBatchInternalId(b.id);
                    setOpenBatchPicker(false);
                  }}
                  style={{ padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border }}
                >
                  <Text style={{ color: theme.colors.text.primary, fontWeight: '500' }}>{b.batchId}</Text>
                  {b.productName ? (
                    <Text style={{ color: theme.colors.text.secondary, fontSize: 12, marginTop: 2 }}>{b.productName}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity
          onPress={onSubmit}
          disabled={submitting}
          style={{
            marginTop: 24,
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.md,
            paddingVertical: 14,
            alignItems: 'center',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{t('producer.packageBadges.submit')}</Text>
          )}
        </TouchableOpacity>

        <Text
          style={{
            marginTop: 16,
            fontSize: 12,
            color: theme.colors.text.tertiary,
            lineHeight: 18,
          }}
        >
          {t('producer.packageBadges.qrHint')}
        </Text>
      </ScrollView>
    </View>
  );
}

const labelStyle = { fontSize: 13, fontWeight: '600' as const, color: theme.colors.text.primary, marginBottom: 4 };
const hintStyle = { fontSize: 12, color: theme.colors.text.secondary, marginBottom: 8, lineHeight: 18 };
const inputStyle = {
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: theme.borderRadius.md,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 15,
  color: theme.colors.text.primary,
  backgroundColor: theme.colors.surface,
};
