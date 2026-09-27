import { useLocalSearchParams, useRouter } from 'expo-router';
import { useWorkflowBatchSelection } from '../../hooks/useWorkflowBatchSelection';
import { batchWorkflowHref } from '../../lib/batch-workflow';
import { EnterpriseButton } from '../../design-system/EnterpriseButton';
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { GrowerStackHeader } from '../../components/grower/GrowerStackHeader';
import { EnterpriseScreen } from '../../components/enterprise/EnterpriseScreen';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';
import { growerUi } from '../../lib/grower-ui';
import { complianceStyles } from '../../lib/compliance-ui';
import { batchesAPI, packageBadgesAPI, type PackageBadgeType } from '../../lib/api';
import { API_URL } from '../../lib/api-url';
import { FormKeyboardWrap } from '../../components/FormKeyboardWrap';

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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={enterpriseUi.inAppSectionLabel}>{children}</Text>;
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <Text style={[enterpriseUi.inAppLead, styles.hint]}>{children}</Text>;
}

function PickerPanel({
  children,
  maxHeight = 200,
}: {
  children: React.ReactNode;
  maxHeight?: number;
}) {
  return (
    <View style={[complianceStyles.pickerPanel, { maxHeight }]}>
      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </View>
  );
}

export default function PackageBadgesScreen() {
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();
  const router = useRouter();
  const params = useLocalSearchParams<{ batchId?: string }>();
  const submitLock = useRef(false);
  const [batchLoadError, setBatchLoadError] = useState(false);

  const [batches, setBatches] = useState<{ id: string; batchId: string; productName?: string }[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [parentSerial, setParentSerial] = useState('');
  const [badgeType, setBadgeType] = useState<ParentType>('PALLET_MASTER');
  const [childrenRaw, setChildrenRaw] = useState('');
  const { selectedBatchId: batchInternalId, setSelectedBatchId: setBatchInternalId, missingRequestedBatch } = useWorkflowBatchSelection(batches, false);
  const [submitting, setSubmitting] = useState(false);
  const [openBatchPicker, setOpenBatchPicker] = useState(false);
  const [printOrders, setPrintOrders] = useState<{ id: string; status: string }[]>([]);
  const [printOrdersLoading, setPrintOrdersLoading] = useState(true);
  const [selectedPrintOrderId, setSelectedPrintOrderId] = useState<string | null>(null);
  const [openPrintPicker, setOpenPrintPicker] = useState(false);
  const [listRefreshing, setListRefreshing] = useState(false);

  const loadBatches = useCallback(async () => {
    setBatchesLoading(true);
    setBatchLoadError(false);
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
      setBatchLoadError(true);
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

  const onListRefresh = useCallback(async () => {
    setListRefreshing(true);
    try {
      await Promise.all([loadBatches(), loadPrintOrders()]);
    } finally {
      setListRefreshing(false);
    }
  }, [loadBatches, loadPrintOrders]);

  const selectedBatchLabel = batchInternalId
    ? (() => {
        const b = batches.find((x) => x.id === batchInternalId);
        return b ? `${b.batchId}${b.productName ? ` — ${b.productName}` : ''}` : '';
      })()
    : null;

  const onSubmit = async () => {
    if (submitLock.current) return;
    if (batchesLoading || missingRequestedBatch || (params.batchId && !batchInternalId)) {
      Alert.alert(t('error'), t('batchWorkflow.unavailable'));
      return;
    }
    const parent = parentSerial.trim();
    if (!parent) {
      Alert.alert('', t('producer.packageBadges.errParent'));
      return;
    }
    submitLock.current = true;
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
        ...(batchInternalId ? [{ text: t('batchWorkflow.compliance'), onPress: () => router.push(batchWorkflowHref('compliance', batchInternalId)) }] : []),
        { text: t('common.ok') },
      ]);
      setParentSerial('');
      setChildrenRaw('');
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
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  return (
    <FormKeyboardWrap style={{ flex: 1 }}>
    <EnterpriseScreen
      refreshing={listRefreshing}
      onRefresh={onListRefresh}
      contentPaddingBottom={Math.max(p.bottomInset, 24) + 16}
      header={
        <GrowerStackHeader
          title={t('producer.packageBadges.title')}
          subtitle={t('producer.packageBadges.subtitle')}
        />
      }
    >
      <View style={growerUi.scrollContent}>
        {batchLoadError || missingRequestedBatch ? <>
          <Text style={enterpriseUi.navRowSubtitle}>{t('batchWorkflow.unavailable')}</Text>
          <EnterpriseButton label={t('common.tryAgain')} onPress={() => void loadBatches()} />
        </> : null}
        <Text style={[enterpriseUi.inAppLead, styles.footerNote]}>
          {t('producer.packageBadges.printOrderFooterNote')}
        </Text>

        <View style={enterpriseUi.authPanel} pointerEvents={submitting ? 'none' : 'auto'}>
          <FieldLabel>{t('producer.packageBadges.parentLabel')}</FieldLabel>
          <FieldHint>{t('producer.packageBadges.parentHint')}</FieldHint>
          <TextInput
            editable={!submitting}
            value={parentSerial}
            onChangeText={setParentSerial}
            placeholder={t('producer.packageBadges.parentPh')}
            placeholderTextColor={enterpriseColors.gray600}
            autoCapitalize="characters"
            style={growerUi.formInput}
          />

          <FieldLabel>{t('producer.packageBadges.typeLabel')}</FieldLabel>
          <View style={styles.typeRow}>
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
                  disabled={submitting}
                  onPress={() => setBadgeType(v)}
                  style={[growerUi.filterChip, styles.typeChip, on && growerUi.filterChipOn]}
                >
                  <Text style={[growerUi.filterChipText, on && growerUi.filterChipTextOn]}>{t(key)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <FieldLabel>{t('producer.packageBadges.linkPrintOrder')}</FieldLabel>
          <FieldHint>{t('producer.packageBadges.linkPrintHint')}</FieldHint>
          <TouchableOpacity
            onPress={() => {
              setOpenPrintPicker((o) => !o);
              setOpenBatchPicker(false);
            }}
            style={[enterpriseUi.inAppPanel, styles.pickerTrigger]}
          >
            <Text
              style={
                selectedPrintOrderId ? enterpriseUi.navRowTitle : enterpriseUi.navRowSubtitle
              }
              numberOfLines={1}
            >
              {printOrdersLoading
                ? t('producer.packageBadges.linkPrintOrderLoading')
                : selectedPrintOrderId
                  ? `${printOrders.find((x) => x.id === selectedPrintOrderId)?.status ?? ''} · ${selectedPrintOrderId.slice(0, 8)}`
                  : '—'}
            </Text>
          </TouchableOpacity>
          {openPrintPicker && !printOrdersLoading ? (
            <PickerPanel maxHeight={160}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedPrintOrderId(null);
                  setOpenPrintPicker(false);
                }}
                style={complianceStyles.pickerRow}
              >
                <Text style={enterpriseUi.navRowSubtitle}>—</Text>
              </TouchableOpacity>
              {printOrders.map((o) => (
                <TouchableOpacity
                  key={o.id}
                  onPress={() => {
                    setSelectedPrintOrderId(o.id);
                    setOpenPrintPicker(false);
                  }}
                  style={complianceStyles.pickerRow}
                >
                  <Text style={enterpriseUi.navRowTitle}>
                    {o.status} · {o.id.slice(0, 8)}…
                  </Text>
                </TouchableOpacity>
              ))}
            </PickerPanel>
          ) : null}

          <FieldLabel>{t('producer.packageBadges.childrenLabel')}</FieldLabel>
          <FieldHint>{t('producer.packageBadges.childrenHint')}</FieldHint>
          <TextInput
            editable={!submitting}
            value={childrenRaw}
            onChangeText={setChildrenRaw}
            placeholder={t('producer.packageBadges.childrenPh')}
            placeholderTextColor={enterpriseColors.gray600}
            multiline
            style={[growerUi.formInput, styles.multiline]}
          />

          <FieldLabel>{t('producer.packageBadges.batchLabel')}</FieldLabel>
          <TouchableOpacity
            onPress={() => {
              setOpenBatchPicker((o) => !o);
              setOpenPrintPicker(false);
            }}
            style={[enterpriseUi.inAppPanel, styles.pickerTrigger]}
          >
            <Text
              style={selectedBatchLabel ? enterpriseUi.navRowTitle : enterpriseUi.navRowSubtitle}
              numberOfLines={1}
            >
              {batchesLoading
                ? t('producer.packageBadges.loadingBatches')
                : selectedBatchLabel || t('producer.packageBadges.batchNone')}
            </Text>
          </TouchableOpacity>
          {openBatchPicker && !batchesLoading ? (
            <PickerPanel>
              <TouchableOpacity
                disabled={Boolean(params.batchId)}
                onPress={() => {
                  setBatchInternalId('');
                  setOpenBatchPicker(false);
                }}
                style={complianceStyles.pickerRow}
              >
                <Text style={enterpriseUi.navRowSubtitle}>{t('producer.packageBadges.batchNone')}</Text>
              </TouchableOpacity>
              {batches.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => {
                    setBatchInternalId(b.id);
                    setOpenBatchPicker(false);
                  }}
                  style={complianceStyles.pickerRow}
                >
                  <Text style={enterpriseUi.navRowTitle}>{b.batchId}</Text>
                  {b.productName ? (
                    <Text style={[enterpriseUi.navRowSubtitle, { marginTop: 2 }]}>{b.productName}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </PickerPanel>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={onSubmit}
          disabled={submitting || batchesLoading || missingRequestedBatch || Boolean(params.batchId && !batchInternalId)}
          activeOpacity={0.88}
          style={[enterpriseUi.authBtnPrimary, submitting && styles.btnDisabled]}
        >
          {submitting ? (
            <ActivityIndicator color={enterpriseColors.white} />
          ) : (
            <Text style={enterpriseUi.authBtnPrimaryText}>{t('producer.packageBadges.submit')}</Text>
          )}
        </TouchableOpacity>

        <Text style={[enterpriseUi.navRowSubtitle, styles.qrHint]}>{t('producer.packageBadges.qrHint')}</Text>
      </View>
    </EnterpriseScreen>
    </FormKeyboardWrap>
  );
}

const styles = StyleSheet.create({
  footerNote: {
    marginBottom: 12,
    fontSize: 14,
  },
  hint: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 15,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  typeChip: {
    paddingHorizontal: 16,
  },
  pickerTrigger: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
    justifyContent: 'center',
    marginBottom: 4,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  btnDisabled: {
    opacity: 0.55,
  },
  qrHint: {
    marginTop: 16,
    lineHeight: 20,
    textAlign: 'center',
  },
});
