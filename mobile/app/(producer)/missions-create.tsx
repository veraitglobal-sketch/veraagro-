import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
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

export default function MissionsCreateScreen() {
  const router = useRouter();
  const p = useBioVeraScreenPadding();
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

  const getCurrentLocation = async () => {
    setLocationHint(null);
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationHint('Allow location to fill GPS and address, or enter them manually below.');
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
        setLocationHint('GPS saved. If address is empty, type the full farm pickup address.');
      }
    } catch {
      setLocationHint('Could not read GPS. Enter latitude, longitude, and address manually.');
    } finally {
      setLocLoading(false);
    }
  };

  const submit = async () => {
    if (!batchId) {
      Alert.alert('Batch required', 'Choose a batch that is packed and ready for transport.');
      return;
    }
    if (!pickupAddress.trim()) {
      Alert.alert('Address required', 'Enter the pickup address.');
      return;
    }
    if (!destinationCity.trim()) {
      Alert.alert('Destination', 'Enter destination city (for dispatch; same city can go on one truck).');
      return;
    }
    if (!destinationAddress.trim() || destinationAddress.trim().length < 5) {
      Alert.alert('Destination', 'Enter the full delivery address (buyer, hub, dock).');
      return;
    }
    const lat = parseFloat(pickupLat);
    const lng = parseFloat(pickupLng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      Alert.alert('Location required', 'Use “Use my location” or enter latitude and longitude.');
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
      Alert.alert(
        'Transport requested',
        'Your request was sent. Operations will assign a driver; track status under Missions.',
        [
        { text: 'OK', onPress: () => router.replace('/(producer)/missions') },
      ]);
    } catch (e: any) {
      const raw = e?.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join(' ') : (raw as string) || e?.message || 'Could not create mission';
      Alert.alert('Cannot start transport', msg);
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
          Request transport
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: theme.spacing.md,
          paddingLeft: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          paddingBottom: Math.max(p.bottomInset, theme.spacing.xl),
        }}
        keyboardShouldPersistTaps="handled"
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
            Pick a <Text style={{ fontWeight: '600' }}>packed</Text> lot (status PACKED or quality verified), then pickup GPS and
            address. The server checks materials balance and compliance photos — if something is missing, the error will say what.
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
            Two farms, one buyer order (e.g. 800 kg + 200 kg)
          </Text>
          <Text style={{ fontSize: 12, color: theme.colors.text.secondary, lineHeight: 18 }}>
            One trip = one batch. Each grower sends their own request for their lot. Use the same destination city and address;
            in load instructions put the same order reference and “leg 1/2” vs “leg 2/2”. Logistics may assign one truck (two
            stops) or two runs.
          </Text>
        </View>

        {batches.length === 0 ? (
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{ fontSize: 14, color: theme.colors.text.secondary, lineHeight: 20 }}>
              No batch is ready for transport yet. Finish packing, quality, and compliance photos first — then the lot appears
              here.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(producer)/batches')}
              style={{ marginTop: theme.spacing.md }}
            >
              <Text style={{ fontSize: 14, color: theme.colors.primary, fontWeight: '600' }}>Open My batches</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginBottom: theme.spacing.lg, gap: theme.spacing.xs }}>
            <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, textTransform: 'uppercase' }}>Batch</Text>
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
                    {b.productName || 'Product'} — {b.batchId || b.id.slice(0, 8)}…
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
            <Text style={{ fontSize: 14, color: theme.colors.primary, fontWeight: '500' }}>Use my location</Text>
          </TouchableOpacity>
          {locationHint ? (
            <Text style={{ fontSize: 12, color: theme.colors.text.secondary, marginTop: theme.spacing.xs }}>{locationHint}</Text>
          ) : null}
        </View>

        <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, marginBottom: 4 }}>Latitude</Text>
        <TextInput
          value={pickupLat}
          onChangeText={setPickupLat}
          placeholder="e.g. 44.812"
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
        <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, marginBottom: 4 }}>Longitude</Text>
        <TextInput
          value={pickupLng}
          onChangeText={setPickupLng}
          placeholder="e.g. 20.456"
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
        <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, marginBottom: 4 }}>Pickup address</Text>
        <TextInput
          value={pickupAddress}
          onChangeText={setPickupAddress}
          placeholder="Farm name, street, city"
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
          Where it goes (logistics and drivers need this). Use the same city name on each run you want to combine on
          one truck.
        </Text>
        <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, marginBottom: 4 }}>Destination city *</Text>
        <TextInput
          value={destinationCity}
          onChangeText={setDestinationCity}
          placeholder="e.g. Hamburg"
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
        <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, marginBottom: 4 }}>Full delivery address *</Text>
        <TextInput
          value={destinationAddress}
          onChangeText={setDestinationAddress}
          placeholder="Hub / buyer, street, city"
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
        <Text style={{ fontSize: 12, color: theme.colors.text.tertiary, marginBottom: 4 }}>Loading notes (optional)</Text>
        <TextInput
          value={loadInstructions}
          onChangeText={setLoadInstructions}
          placeholder="Pallets, time window, dock"
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
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.inverse }}>Request transport</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
