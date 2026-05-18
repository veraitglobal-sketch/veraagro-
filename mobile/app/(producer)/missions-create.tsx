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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { MapPin } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import { enterpriseColors } from '../../lib/enterprise-ui';
import { growerUi } from '../../lib/grower-ui';
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

  const photoTypeLabel = useCallback(
    (code: string) => t(`producer.compliance.batchForm.photoTypes.${code}.label`, { defaultValue: code }),
    [t],
  );

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

  if (initialBatchesLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: enterpriseColors.canvas, justifyContent: 'center' }}
        edges={['top', 'left', 'right']}
      >
        <ActivityIndicator size="large" color={enterpriseColors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={growerUi.canvas} edges={['left', 'right', 'bottom']}>
      <GrowerStackHeader
        title={t('navigation.requestTransport')}
        subtitle={t('producer.missionsCreate.intro')}
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
            paddingBottom: theme.spacing.lg + keyboardPad,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={listRefreshing}
              onRefresh={() => void loadBatches('refresh')}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >
        <View style={growerUi.formPanel}>
          <Text style={growerUi.sectionLabel}>{t('producer.missionsCreate.workflowTitle')}</Text>
          <Text style={{ fontSize: 15, color: enterpriseColors.gray600, lineHeight: 22, marginTop: 8 }}>
            {t('producer.missionsCreate.workflowStep1')}
          </Text>
          <Text style={{ fontSize: 15, color: enterpriseColors.gray600, lineHeight: 22, marginTop: 8 }}>
            {t('producer.missionsCreate.workflowStep2')}
          </Text>
          <Text style={{ fontSize: 15, color: enterpriseColors.gray600, lineHeight: 22, marginTop: 8 }}>
            {t('producer.missionsCreate.workflowStep3')}
          </Text>
        </View>

        {batches.length === 0 ? (
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{ fontSize: 16, color: theme.colors.text.secondary, lineHeight: 24 }}>
              {t('producer.missionsCreate.noBatchesBody')}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(producer)/batch-new')}
              style={{ marginTop: theme.spacing.md, minHeight: 48, justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 16, color: theme.colors.primary, fontWeight: '600' }}>
                {t('producer.missionsCreate.openBatchesCta')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginBottom: theme.spacing.lg, gap: theme.spacing.xs }}>
            <Text style={growerUi.formLabel}>{t('producer.missionsCreate.batchLabel')}</Text>
            {batches.map((b) => {
              const selected = batchId === b.id;
              return (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => setBatchId(b.id)}
                  activeOpacity={0.7}
                  style={{
                    padding: theme.spacing.md,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: selected ? enterpriseColors.primary : enterpriseColors.gray200,
                    backgroundColor: selected ? enterpriseColors.primaryTint : enterpriseColors.white,
                  }}
                >
                  <Text style={{ fontSize: 17, color: theme.colors.text.primary, fontWeight: '600' }}>
                    {b.productName || t('producer.missionsCreate.productFallback')} — {b.batchId || b.id.slice(0, 8)}…
                  </Text>
                  <Text style={{ fontSize: 15, color: theme.colors.text.secondary, marginTop: 6 }}>
                    {b.quantity} {b.unit} · {getBatchStatusLabel(t, b.status)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {batches.length > 0 && batchId ? (
          <View style={{ marginBottom: theme.spacing.md }}>
            {packagingComplianceLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={{ fontSize: 15, color: theme.colors.text.secondary }}>
                  {t('producer.missionsCreate.packagingComplianceChecking')}
                </Text>
              </View>
            ) : packagingCompliance && !packagingCompliance.complete ? (
              <View
                style={{
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.md,
                  borderWidth: 1,
                  borderColor: 'rgba(245, 158, 11, 0.5)',
                  backgroundColor: 'rgba(251, 191, 36, 0.12)',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 8 }}>
                  {t('producer.missionsCreate.packagingComplianceTitle')}
                </Text>
                <Text style={{ fontSize: 15, color: theme.colors.text.secondary, lineHeight: 22, marginBottom: theme.spacing.sm }}>
                  {t('producer.missionsCreate.packagingComplianceWhy')}
                </Text>
                {packagingCompliance.missingPhotoTypes.length > 0 ? (
                  <Text style={{ fontSize: 14, color: theme.colors.text.primary, marginBottom: 6, lineHeight: 20 }}>
                    <Text style={{ fontWeight: '600' }}>{t('producer.missionsCreate.packagingComplianceMissingPhotos')} </Text>
                    {packagingCompliance.missingPhotoTypes.map((c) => photoTypeLabel(c)).join(' · ')}
                  </Text>
                ) : null}
                {!packagingCompliance.stickerRollId ? (
                  <Text style={{ fontSize: 14, color: theme.colors.text.primary, marginBottom: theme.spacing.sm, lineHeight: 20 }}>
                    {t('producer.missionsCreate.packagingComplianceMissingSticker')}
                  </Text>
                ) : null}
                <TouchableOpacity
                  onPress={() => router.push('/(producer)/compliance-photos')}
                  style={{
                    marginTop: theme.spacing.sm,
                    alignSelf: 'flex-start',
                    paddingVertical: 12,
                    paddingHorizontal: theme.spacing.md,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: theme.colors.primary,
                    minHeight: 48,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.inverse }}>
                    {t('producer.missionsCreate.openPackagingCompliance')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : packagingCompliance?.complete ? (
              <Text style={{ fontSize: 15, color: theme.colors.success, fontWeight: '500' }}>
                {t('producer.missionsCreate.packagingComplianceOk')}
              </Text>
            ) : (
              <Text style={{ fontSize: 13, color: theme.colors.text.tertiary, lineHeight: 18 }}>
                {t('producer.missionsCreate.packagingComplianceUnchecked')}
              </Text>
            )}
          </View>
        ) : null}

        <View style={{ marginBottom: theme.spacing.md }}>
          <TouchableOpacity
            onPress={getCurrentLocation}
            disabled={locLoading}
            activeOpacity={0.7}
            style={{
              alignSelf: 'flex-start',
              minHeight: 48,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: enterpriseColors.primary,
              backgroundColor: enterpriseColors.white,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {locLoading ? (
              <ActivityIndicator size="small" color={enterpriseColors.primary} style={{ marginRight: 8 }} />
            ) : (
              <MapPin size={18} color={enterpriseColors.primary} style={{ marginRight: 8 }} strokeWidth={1.5} />
            )}
            <Text style={{ fontSize: 15, color: enterpriseColors.primary, fontWeight: '600' }}>
              {t('producer.missionsCreate.useMyLocation')}
            </Text>
          </TouchableOpacity>
          {locationHint ? (
            <Text style={{ fontSize: 15, color: theme.colors.text.secondary, marginTop: theme.spacing.sm, lineHeight: 22 }}>{locationHint}</Text>
          ) : null}
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.text.secondary,
              marginTop: theme.spacing.sm,
              lineHeight: 20,
              opacity: 0.95,
            }}
          >
            {t('producer.missionsCreate.pickupCoordsFreedomNote')}
          </Text>
        </View>

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
        <Text style={growerUi.formLabel}>{t('producer.missionsCreate.pickupAddress')}</Text>
        <TextInput
          value={pickupAddress}
          onChangeText={setPickupAddress}
          onFocus={scrollToBottomIfNeeded}
          placeholder={t('producer.missionsCreate.pickupAddressPlaceholder')}
          placeholderTextColor={enterpriseColors.gray600}
          multiline
          style={[growerUi.formInput, { minHeight: 88, textAlignVertical: 'top' }]}
        />

        <View style={growerUi.formPanel}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: enterpriseColors.gray900 }}>
            {t('producer.missionsCreate.opsRouteBoxTitle')}
          </Text>
          <Text style={{ fontSize: 15, color: enterpriseColors.gray600, marginTop: 8, lineHeight: 22 }}>
            {t('producer.missionsCreate.opsRouteBoxBody')}
          </Text>
        </View>

        </ScrollView>
        <View
          style={{
            paddingTop: theme.spacing.md,
            paddingBottom: Math.max(p.bottomInset, theme.spacing.md),
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
            borderTopWidth: 0.5,
            borderTopColor: enterpriseColors.gray200,
            backgroundColor: enterpriseColors.white,
          }}
        >
          <TouchableOpacity
            onPress={submit}
            disabled={submitting || batches.length === 0 || packagingComplianceLoading || packagingBlocksTransport}
            activeOpacity={0.88}
            style={[
              growerUi.btnPrimary,
              {
                opacity:
                  submitting || batches.length === 0 || packagingComplianceLoading || packagingBlocksTransport
                    ? 0.5
                    : 1,
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={enterpriseColors.white} />
            ) : (
              <Text style={growerUi.btnPrimaryText}>{t('producer.missionsCreate.submitCta')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
