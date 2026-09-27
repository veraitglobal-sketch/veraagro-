import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { normalizeBatchReference } from '../../lib/batch-workflow';
import { useWorkflowBatchSelection } from '../../hooks/useWorkflowBatchSelection';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { getCurrentGrowerPosition } from '../../lib/grower-permissions';
import { MapPin, CheckCircle2, ChevronRight, Truck, ArrowRight } from 'lucide-react-native';
import { enterpriseColors } from '../../lib/enterprise-ui';
import { growerUi } from '../../lib/grower-ui';
import { EnterpriseNotice } from '../../components/enterprise/EnterpriseNotice';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { GrowerStackHeader } from '../../components/grower/GrowerStackHeader';
import {
  batchesAPI,
  missionsAPI,
  materialControlAPI,
  type ComplianceBatchStatus,
} from '../../lib/api';
import { apiErrorMessage, axiosErrorSupportHint, axiosIsAbortOrTimeout, axiosResponseStatus, isGenericInfrastructureMessage, isLikelyNetworkError } from '../../lib/api-error';
import { getBatchStatusLabel } from '../../features/grower/batches/batch-status-i18n';

type BatchRow = {
  id: string;
  batchId?: string;
  parcelId?: string | null;
  productName?: string;
  quantity?: number;
  unit?: string;
  status?: string;
};

function readyForTransport(b: BatchRow) {
  return b?.status === 'PACKED' || b?.status === 'QUALITY_VERIFIED';
}

export default function MissionsCreateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ batchId?: string | string[] }>();
  const requestedBatch = normalizeBatchReference(params.batchId);
  const p = useBioVeraScreenPadding();
  const scrollRef = useRef<ScrollView>(null);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [initialBatchesLoading, setInitialBatchesLoading] = useState(true);
  const [batchLoadError, setBatchLoadError] = useState(false);
  const [listRefreshing, setListRefreshing] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locationHint, setLocationHint] = useState<string | null>(null);
  const [showManualGps, setShowManualGps] = useState(false);
  const { selectedBatch, selectedBatchId: batchId, setSelectedBatchId: setBatchId, missingRequestedBatch } = useWorkflowBatchSelection(batches, false);
  const visibleBatches = requestedBatch ? (selectedBatch ? [selectedBatch] : []) : batches;
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLat, setPickupLat] = useState('');
  const [pickupLng, setPickupLng] = useState('');
  const [packagingCompliance, setPackagingCompliance] = useState<ComplianceBatchStatus | null>(null);
  const [packagingComplianceLoading, setPackagingComplianceLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!batchId) {
        setPackagingCompliance(null);
        return undefined;
      }
      let alive = true;
      setPackagingComplianceLoading(true);
      void (async () => {
        try {
          const s = await materialControlAPI.getComplianceStatus(batchId);
          if (alive) setPackagingCompliance(s);
        } catch {
          if (alive) setPackagingCompliance(null);
        } finally {
          if (alive) setPackagingComplianceLoading(false);
        }
      })();
      return () => {
        alive = false;
      };
    }, [batchId]),
  );

  const packagingBlocksTransport =
    batchId !== '' &&
    !packagingComplianceLoading &&
    packagingCompliance != null &&
    !packagingCompliance.complete;

  const loadBatches = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setListRefreshing(true);
    else setInitialBatchesLoading(true);
    try {
      const all = await batchesAPI.getAll();
      setBatchLoadError(false);
      const arr = Array.isArray(all) ? all : [];
      setBatches(arr.filter(readyForTransport) as BatchRow[]);
    } catch {
      setBatchLoadError(true);
      setBatches([]);
    } finally {
      if (mode === 'refresh') setListRefreshing(false);
      else setInitialBatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBatches('initial');
  }, [loadBatches]);

  const scrollToBottomIfNeeded = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const getCurrentLocation = useCallback(async () => {
    setLocationHint(null);
    setLocLoading(true);
    try {
      const growerPos = await getCurrentGrowerPosition(t, {
        accuracy: Location.Accuracy.Balanced,
      });
      if (!growerPos) {
        setLocationHint(t('producer.missionsCreate.locationHintDenied'));
        setShowManualGps(true);
        return;
      }
      const lat = growerPos.lat;
      const lng = growerPos.lng;
      setPickupLat(String(lat));
      setPickupLng(String(lng));
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });
        if (addresses.length) {
          const a = addresses[0];
          const line = [a.street, a.streetNumber, a.postalCode, a.city, a.region, a.country]
            .filter(Boolean)
            .join(', ');
          if (line) setPickupAddress(line);
        }
      } catch {
        setLocationHint(t('producer.missionsCreate.locationHintGps'));
      }
    } catch {
      setLocationHint(t('producer.missionsCreate.locationHintFailed'));
      setShowManualGps(true);
    } finally {
      setLocLoading(false);
    }
  }, [t]);

  const submit = async () => {
    if (!batchId) {
      Alert.alert(
        t('producer.missionsCreate.alerts.batchRequired'),
        t('producer.missionsCreate.alerts.batchRequiredBody'),
      );
      return;
    }
    if (packagingBlocksTransport) {
      Alert.alert(
        t('producer.missionsCreate.alerts.cannotStart'),
        t('producer.missionsCreate.packagingIncompleteBody'),
      );
      return;
    }
    if (!pickupAddress.trim()) {
      Alert.alert(
        t('producer.missionsCreate.alerts.addressRequired'),
        t('producer.missionsCreate.alerts.addressRequiredBody'),
      );
      return;
    }
    const lat = parseFloat(pickupLat);
    const lng = parseFloat(pickupLng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      Alert.alert(
        t('producer.missionsCreate.alerts.locationTitle'),
        t('producer.missionsCreate.alerts.locationBody'),
      );
      return;
    }

    setSubmitting(true);
    try {
      const mission = await missionsAPI.create({
        batchId,
        pickupLocation: { lat, lng, address: pickupAddress.trim() },
        pickupAddress: pickupAddress.trim(),
      });
      Alert.alert(t('producer.missionsCreate.successTitle'), t('producer.missionsCreate.successBody'), [
        { text: t('producer.missionsCreate.ok'), onPress: () => router.replace(mission?.id ? `/(producer)/mission/${mission.id}` : '/(producer)/missions') },
      ]);
    } catch (e: unknown) {
      if (isLikelyNetworkError(e) || axiosIsAbortOrTimeout(e)) {
        Alert.alert(
          t('producer.missionsCreate.alerts.cannotStart'),
          t('producer.missionsCreate.transportNetworkError'),
        );
        return;
      }
      const status = axiosResponseStatus(e);
      const raw = apiErrorMessage(e, '').trim();
      const supportHint = axiosErrorSupportHint(e);

      const useGenericSerbian =
        (status === 500 || status === 502 || status === 503) && isGenericInfrastructureMessage(raw);

      let msg =
        useGenericSerbian
          ? t('producer.missionsCreate.serverError')
          : raw || apiErrorMessage(e, t('producer.missionsCreate.alerts.createErrorFallback'));

      /** When the API only returns „Internal server error”, still show path/time so support can trace logs */
      if (useGenericSerbian && supportHint) {
        msg = `${msg}\n\n${supportHint}`;
      }

      Alert.alert(t('producer.missionsCreate.alerts.cannotStart'), msg);
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(producer)/missions');
    }
  };

  const hasGps = pickupLat.trim() !== '' && pickupLng.trim() !== '' && !Number.isNaN(parseFloat(pickupLat));

  const submitDisabled = submitting || !batchId || packagingComplianceLoading || packagingBlocksTransport;

  return (
    <View style={growerUi.canvas}>
      <GrowerStackHeader title={t('navigation.requestTransport')} onBack={goBack} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={<RefreshControl refreshing={listRefreshing}
            onRefresh={() => void loadBatches('refresh')} tintColor={enterpriseColors.primary} />}
        >
          {initialBatchesLoading ? <ActivityIndicator style={styles.loading} color={enterpriseColors.primary} />
          : batchLoadError ? <EnterpriseNotice title={t('transportForm.loadFailed')}
              actionLabel={t('harvestWorkflow.reload')} onPress={() => void loadBatches('initial')} />
          : missingRequestedBatch ? <EnterpriseNotice title={t('batchWorkflow.unavailable')} />
          : visibleBatches.length === 0 ? <View style={styles.empty}>
              <Text style={styles.body}>{t('producer.missionsCreate.noBatchesBody')}</Text>
              <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/(producer)/batch-new')} style={styles.textAction}>
                <Text style={styles.link}>{t('producer.missionsCreate.openBatchesCta')}</Text>
                <ChevronRight size={16} color={enterpriseColors.primary} />
              </TouchableOpacity>
            </View>
          : <>
            <Text style={styles.sectionLabel}>{t(requestedBatch ? 'producer.missionsCreate.selectedBatchLabel' : 'transportForm.chooseLot')}</Text>
            <View style={styles.panel}>
              {visibleBatches.map((b, index) => {
                const selected = batchId === b.id;
                return <TouchableOpacity key={b.id}
                  disabled={Boolean(requestedBatch) || submitting}
                  accessibilityRole={requestedBatch ? undefined : 'button'}
                  accessibilityState={{ selected }}
                  onPress={() => setBatchId(b.id)} activeOpacity={0.8}
                  style={[styles.lotRow, index > 0 && styles.divider, selected && !requestedBatch && styles.selectedRow]}>
                  <View style={styles.lotBody}>
                    <Text style={styles.lotCode}>{b.batchId || b.id.slice(0, 8)}</Text>
                    <Text style={styles.product}>{b.productName || t('producer.missionsCreate.productFallback')}</Text>
                    <Text style={styles.meta}>{getBatchStatusLabel(t, b.status)}</Text>
                  </View>
                  <View style={styles.lotQuantity}>
                    <Text style={styles.quantity}>{b.quantity} <Text style={styles.unit}>{b.unit}</Text></Text>
                    {!requestedBatch ? selected
                      ? <CheckCircle2 size={18} color={enterpriseColors.primary} />
                      : <ChevronRight size={18} color={enterpriseColors.gray600} /> : null}
                  </View>
                </TouchableOpacity>;
              })}
              {batchId ? <View style={styles.readiness}>
                {packagingComplianceLoading ? <ActivityIndicator size="small" color={enterpriseColors.primary} />
                  : <View style={[styles.statusDot, packagingCompliance?.complete && styles.statusDotReady]} />}
                <View style={styles.flex}>
                  <Text style={styles.statusText}>{t(packagingComplianceLoading ? 'transportForm.checking'
                    : packagingCompliance?.complete ? 'transportForm.ready'
                    : packagingCompliance ? 'transportForm.incomplete' : 'transportForm.unchecked')}</Text>
                  {packagingCompliance && !packagingCompliance.complete && !packagingComplianceLoading ? (
                    <TouchableOpacity accessibilityRole="button" style={styles.textAction} disabled={submitting}
                      onPress={() => router.push({ pathname: '/(producer)/compliance-photos', params: { batchId } })}>
                      <Text style={styles.link}>{t('transportForm.completeChecks')}</Text>
                      <ChevronRight size={16} color={enterpriseColors.primary} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View> : null}
            </View>
          </>}

          {batchId && !initialBatchesLoading ? <View style={styles.pickupSection}>
            <Text style={styles.sectionLabel}>{t('transportForm.pickup')}</Text>
            <View style={[styles.panel, styles.form]}>
              <Text style={styles.fieldLabel}>{t('transportForm.location')}</Text>
              <TouchableOpacity accessibilityRole="button" onPress={() => void getCurrentLocation()}
                disabled={locLoading || submitting} activeOpacity={0.8} style={styles.gpsButton}>
                {locLoading ? <ActivityIndicator size="small" color={enterpriseColors.primary} />
                  : <MapPin size={19} color={enterpriseColors.primary} strokeWidth={1.7} />}
                <Text style={styles.gpsButtonLabel}>{t(hasGps ? 'transportForm.refreshGps' : 'producer.missionsCreate.useMyLocation')}</Text>
                <ChevronRight size={17} color={enterpriseColors.primary} />
              </TouchableOpacity>
              {hasGps ? <View style={styles.gpsValue}>
                <CheckCircle2 size={14} color={enterpriseColors.primary} />
                <Text style={styles.meta}>{parseFloat(pickupLat).toFixed(5)}, {parseFloat(pickupLng).toFixed(5)}</Text>
              </View> : <Text style={styles.fieldHint}>{t('transportForm.locationHelp')}</Text>}
              {locationHint ? <Text style={styles.fieldHint} accessibilityLiveRegion="polite">{locationHint}</Text> : null}
              <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: showManualGps }}
                disabled={submitting} onPress={() => setShowManualGps(value => !value)} style={styles.manualToggle}>
                <Text style={styles.link}>{t(showManualGps ? 'transportForm.hideCoordinates' : 'producer.missionsCreate.manualGpsToggle')}</Text>
              </TouchableOpacity>
              {showManualGps ? <View style={styles.coordinateRow}>
                <View style={styles.flex}>
                  <Text style={styles.fieldLabel}>{t('producer.missionsCreate.latitude')}</Text>
                  <TextInput value={pickupLat} onChangeText={setPickupLat} editable={!submitting}
                    accessibilityLabel={t('producer.missionsCreate.latitude')} placeholder="44.81250"
                    placeholderTextColor={enterpriseColors.gray600} keyboardType="numbers-and-punctuation" style={styles.input} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.fieldLabel}>{t('producer.missionsCreate.longitude')}</Text>
                  <TextInput value={pickupLng} onChangeText={setPickupLng} editable={!submitting}
                    accessibilityLabel={t('producer.missionsCreate.longitude')} placeholder="20.46120"
                    placeholderTextColor={enterpriseColors.gray600} keyboardType="numbers-and-punctuation" style={styles.input} />
                </View>
              </View> : null}
              <View style={styles.addressField}>
                <Text style={styles.fieldLabel}>{t('producer.missionsCreate.pickupAddress')}</Text>
                <TextInput value={pickupAddress} onChangeText={setPickupAddress} editable={!submitting}
                  accessibilityLabel={t('producer.missionsCreate.pickupAddress')} onFocus={scrollToBottomIfNeeded}
                  placeholder={t('producer.missionsCreate.pickupAddressPlaceholder')}
                  placeholderTextColor={enterpriseColors.gray600} multiline style={[styles.input, styles.addressInput]} />
                <Text style={styles.fieldHint}>{t('transportForm.addressHelp')}</Text>
              </View>
            </View>
            <View style={styles.nextStep}>
              <Truck size={18} color={enterpriseColors.gray600} strokeWidth={1.5} />
              <Text style={[styles.fieldHint, styles.nextStepText]}>{t('transportForm.nextStep')}</Text>
            </View>
          </View> : null}
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(p.bottomInset, 12) }]}>
          {batchId && packagingBlocksTransport && !packagingComplianceLoading ? (
            <TouchableOpacity accessibilityRole="button" style={styles.blockedHint} disabled={submitting}
              onPress={() => router.push({ pathname: '/(producer)/compliance-photos', params: { batchId } })}>
              <Text style={styles.blockedHintText}>{t('transportForm.blockedHint')}</Text>
              <ChevronRight size={15} color={enterpriseColors.primary} />
            </TouchableOpacity>
          ) : !batchId ? (
            <Text style={[styles.blockedHintText, styles.blockedHintCenter]}>{t('transportForm.chooseLot')}</Text>
          ) : null}
          <TouchableOpacity onPress={() => void submit()} accessibilityRole="button"
            accessibilityLabel={t('producer.missionsCreate.submitCta')} disabled={submitDisabled}
            activeOpacity={0.85} style={[styles.submitButton, submitDisabled && styles.disabled]}>
            {submitting ? <ActivityIndicator color={enterpriseColors.white} /> : <>
              <Text style={styles.submitLabel}>{t('producer.missionsCreate.submitCta')}</Text>
              <ArrowRight size={19} color={enterpriseColors.white} />
            </>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 24 },
  loading: { paddingVertical: 48 },
  sectionLabel: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.9, textTransform: 'uppercase', color: '#6B7A67', marginBottom: 8, marginLeft: 4 },
  panel: { backgroundColor: enterpriseColors.white, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(17, 24, 39, 0.08)', borderRadius: 18, overflow: 'hidden', shadowColor: '#1a3328', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  lotRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 12 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: enterpriseColors.border },
  selectedRow: { backgroundColor: 'rgba(45, 90, 39, 0.06)' },
  lotBody: { flex: 1, minWidth: 0, gap: 2 },
  lotCode: { fontSize: 10.5, lineHeight: 15, color: enterpriseColors.gray600, fontFamily: 'Menlo', letterSpacing: -0.2 },
  product: { fontSize: 15, lineHeight: 20, fontWeight: '600', letterSpacing: -0.25, color: enterpriseColors.gray900 },
  meta: { fontSize: 12, lineHeight: 18, color: enterpriseColors.gray600 },
  lotQuantity: { maxWidth: '40%', alignItems: 'flex-end', gap: 6 },
  quantity: { fontSize: 15, lineHeight: 20, fontWeight: '700', letterSpacing: -0.3, fontVariant: ['tabular-nums'], color: enterpriseColors.gray900, textAlign: 'right' },
  unit: { fontSize: 12, fontWeight: '500', color: enterpriseColors.gray600 },
  readiness: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 11, paddingHorizontal: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: enterpriseColors.border },
  statusDot: { height: 6, width: 6, borderRadius: 3, backgroundColor: enterpriseColors.gray600 },
  statusDotReady: { backgroundColor: enterpriseColors.primary },
  statusText: { fontSize: 12, lineHeight: 18, color: enterpriseColors.gray700 },
  pickupSection: { marginTop: 24 },
  form: { padding: 16 },
  fieldLabel: { fontSize: 13, lineHeight: 19, fontWeight: '500', color: enterpriseColors.gray900, marginBottom: 7 },
  gpsButton: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: 'rgba(45, 90, 39, 0.16)', borderRadius: 12, backgroundColor: enterpriseColors.tint },
  gpsButtonLabel: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '500', color: enterpriseColors.primary },
  gpsValue: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9 },
  fieldHint: { fontSize: 12, lineHeight: 18, color: enterpriseColors.gray600, marginTop: 7 },
  manualToggle: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  link: { fontSize: 13, lineHeight: 19, fontWeight: '500', color: enterpriseColors.primary },
  textAction: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 },
  coordinateRow: { flexDirection: 'row', gap: 10, marginTop: 2, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: 'rgba(17, 24, 39, 0.12)', borderRadius: 12, minHeight: 44, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, lineHeight: 21, color: enterpriseColors.gray900, backgroundColor: enterpriseColors.white },
  addressField: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: enterpriseColors.border, paddingTop: 16, marginTop: 2 },
  addressInput: { minHeight: 76, textAlignVertical: 'top' },
  nextStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 16, paddingHorizontal: 2 },
  nextStepText: { flex: 1, marginTop: 0 },
  footer: { paddingTop: 12, paddingHorizontal: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: enterpriseColors.border, backgroundColor: enterpriseColors.canvas },
  submitButton: { minHeight: 50, borderRadius: 14, backgroundColor: enterpriseColors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 16 },
  submitLabel: { fontSize: 15, lineHeight: 22, fontWeight: '600', color: enterpriseColors.white },
  disabled: { opacity: 0.45 },
  blockedHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 10 },
  blockedHintText: { fontSize: 12.5, lineHeight: 17, color: enterpriseColors.gray700, textAlign: 'center' },
  blockedHintCenter: { marginBottom: 10 },
  empty: { paddingVertical: 20 },
  body: { fontSize: 14, lineHeight: 21, color: enterpriseColors.gray700 },
});
