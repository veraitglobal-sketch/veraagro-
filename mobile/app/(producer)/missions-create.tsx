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
  Keyboard,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { MapPin } from 'lucide-react-native';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';
import { growerUi } from '../../lib/grower-ui';
import { EnterpriseNotice } from '../../components/enterprise/EnterpriseNotice';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { GrowerStackHeader } from '../../components/grower/GrowerStackHeader';
import {
  batchesAPI,
  missionsAPI,
  harvestAnnouncementsAPI,
  materialControlAPI,
  type ComplianceBatchStatus,
} from '../../lib/api';
import { normalizeHarvestParcelId } from '../../features/grower/harvest/useHarvestData';
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

async function pickHarvestAnnouncementIdForParcel(
  parcelId: string | null | undefined,
): Promise<string | undefined> {
  const pid = parcelId ? normalizeHarvestParcelId(parcelId, null) : '';
  if (!pid) return undefined;
  try {
    const raw = await harvestAnnouncementsAPI.getMy();
    const arr = Array.isArray(raw) ? raw : [];
    type Ann = {
      id: string;
      status?: string;
      createdAt?: string;
      announcementType?: string;
      parcelId?: string;
      parcel?: { id?: string } | null;
    };
    const harvests: Ann[] = arr
      .filter((a: Ann) => String(a.announcementType ?? '').toUpperCase() === 'HARVEST')
      .filter(
        (a: Ann) =>
          normalizeHarvestParcelId(a.parcelId, a.parcel ?? null) === pid &&
          typeof a.id === 'string' &&
          !String(a.id).startsWith('local:'),
      );
    const rank = (s: string) => {
      const u = String(s || '').toUpperCase();
      if (u === 'CONFIRMED') return 0;
      if (u === 'APPROVED') return 1;
      return 2;
    };
    harvests.sort((a, b) => {
      const rd = rank(String(a.status ?? '')) - rank(String(b.status ?? ''));
      if (rd !== 0) return rd;
      const ta = new Date(String(a.createdAt || 0)).getTime();
      const tb = new Date(String(b.createdAt || 0)).getTime();
      return tb - ta;
    });
    const id = harvests[0]?.id;
    return typeof id === 'string' ? id : undefined;
  } catch {
    return undefined;
  }
}

function readyForTransport(b: BatchRow) {
  return b?.status === 'PACKED' || b?.status === 'QUALITY_VERIFIED';
}

export default function MissionsCreateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardPad, setKeyboardPad] = useState(0);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [initialBatchesLoading, setInitialBatchesLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locationHint, setLocationHint] = useState<string | null>(null);
  const [showManualGps, setShowManualGps] = useState(false);
  const [batchId, setBatchId] = useState('');
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
      const arr = Array.isArray(all) ? all : [];
      setBatches(arr.filter(readyForTransport) as BatchRow[]);
    } catch {
      setBatches([]);
    } finally {
      if (mode === 'refresh') setListRefreshing(false);
      else setInitialBatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBatches('initial');
  }, [loadBatches]);

  useEffect(() => {
    const onShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardPad(e.endCoordinates?.height ?? 0),
    );
    const onHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardPad(0),
    );
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const scrollToBottomIfNeeded = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const getCurrentLocation = useCallback(async () => {
    setLocationHint(null);
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationHint(t('producer.missionsCreate.locationHintDenied'));
        setShowManualGps(true);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
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
      const picked = batches.find((b) => b.id === batchId);
      const harvestAnnouncementId = await pickHarvestAnnouncementIdForParcel(picked?.parcelId);
      await missionsAPI.create({
        batchId,
        pickupLocation: { lat, lng, address: pickupAddress.trim() },
        pickupAddress: pickupAddress.trim(),
        ...(harvestAnnouncementId ? { harvestAnnouncementId } : {}),
      });
      Alert.alert(t('producer.missionsCreate.successTitle'), t('producer.missionsCreate.successBody'), [
        { text: t('producer.missionsCreate.ok'), onPress: () => router.replace('/(producer)/missions') },
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

  if (initialBatchesLoading) {
    return (
      <View style={growerUi.canvas}>
        <GrowerStackHeader
          title={t('navigation.requestTransport')}
          subtitle={t('producer.missionsCreate.introShort')}
          onBack={goBack}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={enterpriseColors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={growerUi.canvas}>
      <GrowerStackHeader
        title={t('navigation.requestTransport')}
        subtitle={t('producer.missionsCreate.introShort')}
        onBack={goBack}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            ...growerUi.scrollContent,
            paddingTop: 12,
            paddingBottom: 24 + keyboardPad,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={listRefreshing}
              onRefresh={() => void loadBatches('refresh')}
              tintColor={enterpriseColors.primary}
              colors={[enterpriseColors.primary]}
            />
          }
        >
        {batches.length === 0 ? (
          <View style={growerUi.emptyCard}>
            <Text style={enterpriseUi.navRowSubtitle}>{t('producer.missionsCreate.noBatchesBody')}</Text>
            <TouchableOpacity
              onPress={() => router.push('/(producer)/batch-new')}
              style={[enterpriseUi.authBtnPrimary, styles.emptyCta]}
              activeOpacity={0.88}
            >
              <Text style={enterpriseUi.authBtnPrimaryText}>{t('producer.missionsCreate.openBatchesCta')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={enterpriseUi.inAppSectionLabel}>{t('producer.missionsCreate.batchLabel')}</Text>
            {batches.map((b) => {
              const selected = batchId === b.id;
              return (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => setBatchId(b.id)}
                  activeOpacity={0.82}
                  style={[
                    enterpriseUi.inAppPanel,
                    styles.batchRow,
                    selected && styles.batchRowSelected,
                  ]}
                >
                  <Text style={enterpriseUi.navRowTitle}>
                    {b.productName || t('producer.missionsCreate.productFallback')} · {b.batchId || b.id.slice(0, 8)}
                  </Text>
                  <Text style={[enterpriseUi.navRowSubtitle, styles.batchMeta]}>
                    {b.quantity} {b.unit} · {getBatchStatusLabel(t, b.status)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {batches.length > 0 && batchId ? (
          <View style={styles.section}>
            {packagingComplianceLoading ? (
              <View style={styles.inlineStatus}>
                <ActivityIndicator size="small" color={enterpriseColors.primary} />
                <Text style={enterpriseUi.navRowSubtitle}>
                  {t('producer.missionsCreate.packagingComplianceChecking')}
                </Text>
              </View>
            ) : packagingCompliance && !packagingCompliance.complete ? (
              <EnterpriseNotice
                title={t('producer.missionsCreate.packagingComplianceTitle')}
                body={t('producer.missionsCreate.packagingComplianceBodyShort')}
                onPress={() => router.push('/(producer)/compliance-photos')}
                actionLabel={t('producer.missionsCreate.openPackagingCompliance')}
              />
            ) : packagingCompliance?.complete ? (
              <Text style={styles.okLine}>{t('producer.missionsCreate.packagingComplianceOk')}</Text>
            ) : (
              <Text style={enterpriseUi.navRowSubtitle}>
                {t('producer.missionsCreate.packagingComplianceUnchecked')}
              </Text>
            )}
          </View>
        ) : null}

        {batches.length > 0 ? (
          <View style={styles.section}>
            <Text style={enterpriseUi.inAppSectionLabel}>{t('producer.missionsCreate.pickupAddress')}</Text>
            <TouchableOpacity
              onPress={() => void getCurrentLocation()}
              disabled={locLoading}
              activeOpacity={0.88}
              style={[enterpriseUi.authBtnPrimary, styles.locationBtn]}
            >
              {locLoading ? (
                <ActivityIndicator size="small" color={enterpriseColors.white} />
              ) : (
                <>
                  <MapPin size={20} color={enterpriseColors.white} strokeWidth={1.5} />
                  <Text style={enterpriseUi.authBtnPrimaryText}>{t('producer.missionsCreate.useMyLocation')}</Text>
                </>
              )}
            </TouchableOpacity>
            {hasGps ? (
              <Text style={enterpriseUi.navRowSubtitle}>
                {t('producer.missionsCreate.gpsSaved')}: {parseFloat(pickupLat).toFixed(5)}, {parseFloat(pickupLng).toFixed(5)}
              </Text>
            ) : null}
            {locationHint ? <Text style={[enterpriseUi.navRowSubtitle, styles.hint]}>{locationHint}</Text> : null}
            {!showManualGps ? (
              <TouchableOpacity onPress={() => setShowManualGps(true)} activeOpacity={0.72} style={styles.linkBtn}>
                <Text style={styles.linkText}>{t('producer.missionsCreate.manualGpsToggle')}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={growerUi.formLabel}>{t('producer.missionsCreate.latitude')}</Text>
                <TextInput
                  value={pickupLat}
                  onChangeText={setPickupLat}
                  placeholder={t('producer.missionsCreate.latPlaceholder')}
                  placeholderTextColor={enterpriseColors.gray600}
                  keyboardType="decimal-pad"
                  style={growerUi.formInput}
                />
                <Text style={growerUi.formLabel}>{t('producer.missionsCreate.longitude')}</Text>
                <TextInput
                  value={pickupLng}
                  onChangeText={setPickupLng}
                  placeholder={t('producer.missionsCreate.lngPlaceholder')}
                  placeholderTextColor={enterpriseColors.gray600}
                  keyboardType="decimal-pad"
                  style={growerUi.formInput}
                />
              </>
            )}
            <TextInput
              value={pickupAddress}
              onChangeText={setPickupAddress}
              onFocus={scrollToBottomIfNeeded}
              placeholder={t('producer.missionsCreate.pickupAddressPlaceholder')}
              placeholderTextColor={enterpriseColors.gray600}
              multiline
              style={[growerUi.formInput, styles.addressInput]}
            />
          </View>
        ) : null}

        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(p.bottomInset, 16) }]}>
          <TouchableOpacity
            onPress={() => void submit()}
            disabled={submitting || batches.length === 0 || packagingComplianceLoading || packagingBlocksTransport}
            activeOpacity={0.88}
            style={[
              enterpriseUi.authBtnPrimary,
              styles.submitBtn,
              (submitting || batches.length === 0 || packagingComplianceLoading || packagingBlocksTransport) &&
                styles.submitBtnDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={enterpriseColors.white} />
            ) : (
              <Text style={enterpriseUi.authBtnPrimaryText}>{t('producer.missionsCreate.submitCta')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 20,
  },
  batchRow: {
    padding: 16,
    minHeight: 72,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
  },
  batchRowSelected: {
    borderWidth: 1.5,
    borderColor: enterpriseColors.primary,
    backgroundColor: enterpriseColors.primaryTint,
  },
  batchMeta: {
    marginTop: 4,
  },
  emptyCta: {
    marginTop: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  inlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  okLine: {
    fontSize: 15,
    fontWeight: '500',
    color: enterpriseColors.primary,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    marginBottom: 10,
  },
  hint: {
    marginTop: 6,
    marginBottom: 4,
  },
  linkBtn: {
    minHeight: 44,
    justifyContent: 'center',
    marginBottom: 8,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
    color: enterpriseColors.primary,
  },
  addressInput: {
    minHeight: 88,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  footer: {
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
  },
  submitBtn: {
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
});
