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
import * as Location from 'expo-location';
import { ArrowLeft, MapPin, Truck } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { batchesAPI, missionsAPI, harvestAnnouncementsAPI } from '../../lib/api';
import { normalizeHarvestParcelId } from '../../features/grower/harvest/useHarvestData';
import { apiErrorMessage, axiosResponseStatus } from '../../lib/api-error';
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

const HEADER_ACTION_ROW = 48;

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
      const status = axiosResponseStatus(e);
      const raw = apiErrorMessage(e, '').trim();
      /** Backend body is often useful (compliance text, migrations notice); discard only empty/generic 5xx. */
      const looksLikeGenericBackend =
        !raw ||
        /^internal\s+server\s*error$/i.test(raw) ||
        /^something\s+went\s+wrong$/i.test(raw) ||
        raw === 'Error';
      const isBareInfrastructure =
        (status === 500 || status === 502 || status === 503) && looksLikeGenericBackend && raw.length <= 140;
      const msg = isBareInfrastructure
        ? t('producer.missionsCreate.serverError')
        : raw || apiErrorMessage(e, t('producer.missionsCreate.alerts.createErrorFallback'));
      Alert.alert(t('producer.missionsCreate.alerts.cannotStart'), msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (initialBatchesLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          paddingTop: p.headerTop,
          paddingBottom: theme.spacing.md,
          paddingLeft: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(0,0,0,0.08)',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: theme.spacing.md, minWidth: 44, minHeight: 44, justifyContent: 'center' }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 20,
            fontWeight: '600',
            color: theme.colors.text.primary,
            flex: 1,
            letterSpacing: 0.2,
          }}
        >
          {t('producer.missionsCreate.title')}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? p.headerTop + HEADER_ACTION_ROW : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: theme.spacing.md,
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
            paddingBottom:
              Math.max(p.bottomInset, theme.spacing.xl) + keyboardPad + 24,
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
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            borderWidth: 0.5,
            borderColor: 'rgba(0,0,0,0.06)',
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
          }}
        >
          <Text style={{ fontSize: 16, color: theme.colors.text.secondary, lineHeight: 24, marginBottom: theme.spacing.sm }}>
            {t('producer.missionsCreate.intro')}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: theme.colors.background,
            borderRadius: theme.borderRadius.md,
            borderWidth: 0.5,
            borderColor: `${theme.colors.primary}30`,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 10 }}>
            {t('producer.missionsCreate.workflowTitle')}
          </Text>
          <Text style={{ fontSize: 15, color: theme.colors.text.secondary, lineHeight: 22, marginBottom: 8 }}>
            {t('producer.missionsCreate.workflowStep1')}
          </Text>
          <Text style={{ fontSize: 15, color: theme.colors.text.secondary, lineHeight: 22, marginBottom: 8 }}>
            {t('producer.missionsCreate.workflowStep2')}
          </Text>
          <Text style={{ fontSize: 15, color: theme.colors.text.secondary, lineHeight: 22 }}>
            {t('producer.missionsCreate.workflowStep3')}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.04)',
            borderRadius: theme.borderRadius.md,
            borderWidth: 0.5,
            borderColor: 'rgba(15, 23, 42, 0.12)',
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 8 }}>
            {t('producer.missionsCreate.multiFarmTitle')}
          </Text>
          <Text style={{ fontSize: 15, color: theme.colors.text.secondary, lineHeight: 22 }}>
            {t('producer.missionsCreate.multiFarmBody')}
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
            <Text style={{ fontSize: 14, color: theme.colors.text.tertiary, textTransform: 'uppercase', fontWeight: '600', letterSpacing: 0.6 }}>
              {t('producer.missionsCreate.batchLabel')}
            </Text>
            {batches.map((b) => {
              const selected = batchId === b.id;
              return (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => setBatchId(b.id)}
                  activeOpacity={0.7}
                  style={{
                    padding: theme.spacing.md,
                    borderRadius: theme.borderRadius.md,
                    borderWidth: 1,
                    borderColor: selected ? theme.colors.primary : 'rgba(0,0,0,0.08)',
                    backgroundColor: selected ? `${theme.colors.primary}12` : theme.colors.background,
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

        <View style={{ marginBottom: theme.spacing.md }}>
          <TouchableOpacity
            onPress={getCurrentLocation}
            disabled={locLoading}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              minHeight: 48,
              paddingVertical: 12,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              backgroundColor: `${theme.colors.primary}15`,
            }}
          >
            {locLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 8 }} />
            ) : (
              <MapPin size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
            )}
            <Text style={{ fontSize: 16, color: theme.colors.primary, fontWeight: '600' }}>
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

        <Text style={{ fontSize: 15, color: theme.colors.text.tertiary, marginBottom: 4 }}>
          {t('producer.missionsCreate.latitude')}
        </Text>
        <TextInput
          value={pickupLat}
          onChangeText={setPickupLat}
          placeholder={t('producer.missionsCreate.latPlaceholder')}
          keyboardType="decimal-pad"
          style={{
            borderWidth: 0.5,
            borderColor: 'rgba(0,0,0,0.12)',
            borderRadius: theme.borderRadius.md,
            padding: 14,
            fontSize: 17,
            marginBottom: theme.spacing.md,
            color: theme.colors.text.primary,
          }}
        />
        <Text style={{ fontSize: 15, color: theme.colors.text.tertiary, marginBottom: 4 }}>
          {t('producer.missionsCreate.longitude')}
        </Text>
        <TextInput
          value={pickupLng}
          onChangeText={setPickupLng}
          placeholder={t('producer.missionsCreate.lngPlaceholder')}
          keyboardType="decimal-pad"
          style={{
            borderWidth: 0.5,
            borderColor: 'rgba(0,0,0,0.12)',
            borderRadius: theme.borderRadius.md,
            padding: 14,
            fontSize: 17,
            marginBottom: theme.spacing.md,
            color: theme.colors.text.primary,
          }}
        />
        <Text style={{ fontSize: 15, color: theme.colors.text.tertiary, marginBottom: 4 }}>
          {t('producer.missionsCreate.pickupAddress')}
        </Text>
        <TextInput
          value={pickupAddress}
          onChangeText={setPickupAddress}
          onFocus={scrollToBottomIfNeeded}
          placeholder={t('producer.missionsCreate.pickupAddressPlaceholder')}
          multiline
          style={{
            borderWidth: 0.5,
            borderColor: 'rgba(0,0,0,0.12)',
            borderRadius: theme.borderRadius.md,
            padding: 14,
            fontSize: 17,
            minHeight: 80,
            textAlignVertical: 'top',
            marginBottom: theme.spacing.lg,
            color: theme.colors.text.primary,
          }}
        />

        <View
          style={{
            marginBottom: theme.spacing.lg,
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            borderWidth: 1,
            borderColor: 'rgba(45, 90, 39, 0.25)',
            backgroundColor: 'rgba(247, 250, 246, 0.95)',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary }}>
            {t('producer.missionsCreate.opsRouteBoxTitle')}
          </Text>
          <Text style={{ fontSize: 15, color: theme.colors.text.secondary, marginTop: 8, lineHeight: 22 }}>
            {t('producer.missionsCreate.opsRouteBoxBody')}
          </Text>
        </View>

        <TouchableOpacity
          onPress={submit}
          disabled={submitting || batches.length === 0}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.md,
            paddingVertical: 17,
            opacity: submitting || batches.length === 0 ? 0.5 : 1,
            minHeight: 54,
          }}
        >
          {submitting ? (
            <ActivityIndicator color={theme.colors.text.inverse} />
          ) : (
            <>
              <Truck size={22} color={theme.colors.text.inverse} strokeWidth={1.75} />
              <Text style={{ fontSize: 17, fontWeight: '600', color: theme.colors.text.inverse }}>
                {t('producer.missionsCreate.title')}
              </Text>
            </>
          )}
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
