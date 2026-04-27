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
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { ArrowLeft, MapPin, Truck } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { batchesAPI, missionsAPI } from '../../lib/api';

type BatchRow = { id: string; batchId?: string; productName?: string; quantity?: number; unit?: string; status?: string };

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
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [locLoading, setLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locationHint, setLocationHint] = useState<string | null>(null);
  const [batchId, setBatchId] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLat, setPickupLat] = useState('');
  const [pickupLng, setPickupLng] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [loadInstructions, setLoadInstructions] = useState('');

  const loadBatches = useCallback(async () => {
    setBatchesLoading(true);
    try {
      const all = await batchesAPI.getAll();
      const arr = Array.isArray(all) ? all : [];
      setBatches(arr.filter(readyForTransport) as BatchRow[]);
    } catch {
      setBatches([]);
    } finally {
      setBatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBatches();
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
    if (!destinationCity.trim()) {
      Alert.alert(
        t('producer.missionsCreate.alerts.destinationTitle'),
        t('producer.missionsCreate.alerts.destinationCityBody'),
      );
      return;
    }
    if (!destinationAddress.trim() || destinationAddress.trim().length < 5) {
      Alert.alert(
        t('producer.missionsCreate.alerts.destinationTitle'),
        t('producer.missionsCreate.alerts.destinationAddressBody'),
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
      await missionsAPI.create({
        batchId,
        pickupLocation: { lat, lng, address: pickupAddress },
        pickupAddress: pickupAddress.trim(),
        destinationCity: destinationCity.trim(),
        destinationAddress: destinationAddress.trim(),
        loadInstructions: loadInstructions.trim() || undefined,
      });
      Alert.alert(t('producer.missionsCreate.successTitle'), t('producer.missionsCreate.successBody'), [
        { text: t('producer.missionsCreate.ok'), onPress: () => router.replace('/(producer)/missions') },
      ]);
    } catch (e: any) {
      const raw = e?.response?.data?.message;
      const msg =
        Array.isArray(raw) ? raw.join(' ') : (raw as string) || e?.message || t('producer.missionsCreate.alerts.createErrorFallback');
      Alert.alert(t('producer.missionsCreate.alerts.cannotStart'), msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (batchesLoading) {
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
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: theme.spacing.md }} activeOpacity={0.7}>
          <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '300',
            color: theme.colors.text.primary,
            flex: 1,
            letterSpacing: 0.5,
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
          <Text style={{ fontSize: 12, color: theme.colors.text.secondary, lineHeight: 18, marginBottom: theme.spacing.sm }}>
            {t('producer.missionsCreate.intro')}
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
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 6 }}>
            {t('producer.missionsCreate.multiFarmTitle')}
          </Text>
          <Text style={{ fontSize: 12, color: theme.colors.text.secondary, lineHeight: 18 }}>
            {t('producer.missionsCreate.multiFarmBody')}
          </Text>
        </View>

        {batches.length === 0 ? (
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{ fontSize: 14, color: theme.colors.text.secondary, lineHeight: 20 }}>
              {t('producer.missionsCreate.noBatchesBody')}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(producer)/batches')}
              style={{ marginTop: theme.spacing.md }}
            >
              <Text style={{ fontSize: 14, color: theme.colors.primary, fontWeight: '600' }}>
                {t('producer.missionsCreate.openBatchesCta')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginBottom: theme.spacing.lg, gap: theme.spacing.xs }}>
            <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, textTransform: 'uppercase' }}>
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
                  <Text style={{ fontSize: 14, color: theme.colors.text.primary, fontWeight: '500' }}>
                    {b.productName || t('producer.missionsCreate.productFallback')} — {b.batchId || b.id.slice(0, 8)}…
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.colors.text.secondary, marginTop: 4 }}>
                    {b.quantity} {b.unit} · {b.status}
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
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              backgroundColor: `${theme.colors.primary}15`,
            }}
          >
            {locLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 8 }} />
            ) : (
              <MapPin size={18} color={theme.colors.primary} style={{ marginRight: 8 }} />
            )}
            <Text style={{ fontSize: 14, color: theme.colors.primary, fontWeight: '500' }}>
              {t('producer.missionsCreate.useMyLocation')}
            </Text>
          </TouchableOpacity>
          {locationHint ? (
            <Text style={{ fontSize: 12, color: theme.colors.text.secondary, marginTop: theme.spacing.xs }}>{locationHint}</Text>
          ) : null}
        </View>

        <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, marginBottom: 4 }}>
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
            padding: 12,
            fontSize: 15,
            marginBottom: theme.spacing.md,
            color: theme.colors.text.primary,
          }}
        />
        <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, marginBottom: 4 }}>
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
            padding: 12,
            fontSize: 15,
            marginBottom: theme.spacing.md,
            color: theme.colors.text.primary,
          }}
        />
        <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, marginBottom: 4 }}>
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
            padding: 12,
            fontSize: 15,
            minHeight: 80,
            textAlignVertical: 'top',
            marginBottom: theme.spacing.lg,
            color: theme.colors.text.primary,
          }}
        />

        <Text
          style={{
            fontSize: 12,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.sm,
            lineHeight: 18,
          }}
        >
          {t('producer.missionsCreate.whereItGoes')}
        </Text>
        <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, marginBottom: 4 }}>
          {t('producer.missionsCreate.destinationCity')}
        </Text>
        <TextInput
          value={destinationCity}
          onChangeText={setDestinationCity}
          onFocus={scrollToBottomIfNeeded}
          placeholder={t('producer.missionsCreate.destinationCityPlaceholder')}
          style={{
            borderWidth: 0.5,
            borderColor: 'rgba(0,0,0,0.12)',
            borderRadius: theme.borderRadius.md,
            padding: 12,
            fontSize: 15,
            marginBottom: theme.spacing.md,
            color: theme.colors.text.primary,
          }}
        />
        <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, marginBottom: 4 }}>
          {t('producer.missionsCreate.fullDelivery')}
        </Text>
        <TextInput
          value={destinationAddress}
          onChangeText={setDestinationAddress}
          onFocus={scrollToBottomIfNeeded}
          placeholder={t('producer.missionsCreate.fullDeliveryPlaceholder')}
          multiline
          style={{
            borderWidth: 0.5,
            borderColor: 'rgba(0,0,0,0.12)',
            borderRadius: theme.borderRadius.md,
            padding: 12,
            fontSize: 15,
            minHeight: 72,
            textAlignVertical: 'top',
            marginBottom: theme.spacing.md,
            color: theme.colors.text.primary,
          }}
        />
        <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, marginBottom: 4 }}>
          {t('producer.missionsCreate.loadingNotes')}
        </Text>
        <TextInput
          value={loadInstructions}
          onChangeText={setLoadInstructions}
          onFocus={scrollToBottomIfNeeded}
          placeholder={t('producer.missionsCreate.loadingNotesPlaceholder')}
          multiline
          style={{
            borderWidth: 0.5,
            borderColor: 'rgba(0,0,0,0.12)',
            borderRadius: theme.borderRadius.md,
            padding: 12,
            fontSize: 15,
            minHeight: 56,
            textAlignVertical: 'top',
            marginBottom: theme.spacing.lg,
            color: theme.colors.text.primary,
          }}
        />

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
            paddingVertical: 14,
            opacity: submitting || batches.length === 0 ? 0.5 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color={theme.colors.text.inverse} />
          ) : (
            <>
              <Truck size={20} color={theme.colors.text.inverse} strokeWidth={1.5} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.inverse }}>
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
