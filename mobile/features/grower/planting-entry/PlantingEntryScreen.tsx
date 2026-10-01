import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Check, ScanLine, X } from 'lucide-react-native';
import { EnterpriseButton, EnterprisePanel, EnterpriseTextField, EnterpriseTextArea } from '../../../design-system';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { GrowerSelectField } from '../../../components/grower/GrowerSelectField';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { seedsAPI, estatesAPI, parcelsAPI, harvestAnnouncementsAPI, fieldEntriesAPI } from '../../../lib/api';
import { apiErrorMessage, isLikelyNetworkError } from '../../../lib/api-error';
import { isDeviceOnline } from '../../../lib/network-utils';
import { offlineStorage } from '../../../lib/offline-storage';
import { pickFromCamera } from '../../../lib/camera-picker';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { formatSeedProductName } from '../../../lib/format-seed-product-name';
import type { Estate, Parcel } from '../../../lib/api/types';

type BagLine = {
  serial: string;
  quantityKg: number;
  maxKg: number;
  product: string;
  variety?: string | null;
  lot: string;
  seedCropYear: number;
  producer: string;
  ok: boolean;
  error?: string;
};

export default function PlantingEntryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const params = useLocalSearchParams<{ serial?: string }>();
  const [bags, setBags] = useState<BagLine[]>([]);
  const [estates, setEstates] = useState<Estate[]>([]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [plans, setPlans] = useState<{ id: string; label: string }[]>([]);
  const [farmId, setFarmId] = useState('');
  const [parcelId, setParcelId] = useState('');
  const [plantingId, setPlantingId] = useState('');
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10));
  const [areaHa, setAreaHa] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savedSummary, setSavedSummary] = useState<string | null>(null);
  const [offlineQueued, setOfflineQueued] = useState(false);
  const [manualSerial, setManualSerial] = useState('');
  const [addingManual, setAddingManual] = useState(false);

  const validBags = useMemo(() => bags.filter((b) => b.ok), [bags]);
  const rejectedBags = useMemo(() => bags.filter((b) => !b.ok), [bags]);
  const totalKg = useMemo(() => validBags.reduce((s, b) => s + b.quantityKg, 0), [validBags]);

  const loadLocation = useCallback(async (): Promise<{ lat: number; lng: number; accuracy?: number } | null> => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy ?? undefined };
      setLocation(loc);
      return loc;
    } catch {
      return null;
    } finally {
      setLocating(false);
    }
  }, []);

  const removeBag = useCallback((serial: string) => {
    setBags((prev) => prev.filter((b) => b.serial !== serial));
  }, []);

  const addBagFromSerial = useCallback(
    async (raw: string) => {
      const serial = raw.trim();
      if (!serial || bags.some((b) => b.serial === serial)) return;
      try {
        const result = await seedsAPI.validate(serial);
        const origin = result?.origin as BagLine | undefined;
        if (!result?.origin) throw new Error(t('seedScan.notGenuine'));
        const seed = result.seed as { quantity?: number; quantityRemaining?: number | null; status?: string };
        const maxKg =
          seed.status === 'PARTIALLY_USED'
            ? seed.quantityRemaining ?? 0
            : seed.quantity ?? 5;
        setBags((prev) => [
          ...prev,
          {
            serial: result.seed?.serialNumber || serial,
            quantityKg: maxKg,
            maxKg,
            product: (result.origin as { product: string }).product,
            variety: (result.origin as { variety?: string }).variety,
            lot: (result.origin as { lot: string }).lot,
            seedCropYear: (result.origin as { seedCropYear: number }).seedCropYear,
            producer: (result.origin as { producer: { name: string } }).producer.name,
            ok: true,
          },
        ]);
      } catch (e: unknown) {
        if (isLikelyNetworkError(e)) {
          Alert.alert(t('error'), t('plantingEntry.offlineScanHint'));
          return;
        }
        setBags((prev) => [
          ...prev,
          {
            serial,
            quantityKg: 0,
            maxKg: 0,
            product: '',
            lot: '',
            seedCropYear: 0,
            producer: '',
            ok: false,
            error: apiErrorMessage(e, t('seedScan.notGenuine')),
          },
        ]);
      }
    },
    [bags, t],
  );

  useEffect(() => {
    void loadLocation();
    void (async () => {
      const list = await estatesAPI.getAll();
      const arr = Array.isArray(list) ? list : [];
      setEstates(arr);
      if (arr[0]) setFarmId(arr[0].id);
    })();
  }, [loadLocation]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const qr = await AsyncStorage.getItem('last_scanned_qr');
        const serial = typeof params.serial === 'string' ? params.serial : qr;
        if (serial) {
          await addBagFromSerial(serial);
          await AsyncStorage.removeItem('last_scanned_qr');
        }
      })();
    }, [params.serial, addBagFromSerial]),
  );

  useEffect(() => {
    if (!farmId) return;
    void (async () => {
      const pl = await parcelsAPI.getByEstate(farmId);
      const approved = (Array.isArray(pl) ? pl : []).filter((x) => x.approvedAt);
      setParcels(approved);
      if (approved.length === 1) {
        setParcelId(approved[0].id);
        setAreaHa(String(approved[0].calculatedArea ? (approved[0].calculatedArea / 10000).toFixed(2) : ''));
      }
    })();
  }, [farmId]);

  useEffect(() => {
    if (!parcelId) {
      setPlans([]);
      return;
    }
    void (async () => {
      const all = await harvestAnnouncementsAPI.getMy();
      const crop = validBags[0]?.product?.toLowerCase() ?? '';
      const plantingPlans = (Array.isArray(all) ? all : [])
        .filter((p: { parcelId?: string; announcementType?: string; cropType?: string }) => {
          if (p.parcelId !== parcelId || p.announcementType !== 'PLANTING') return false;
          if (!crop) return true;
          const ct = String(p.cropType).toLowerCase();
          const productWords = crop.split(/\s+/).filter((w) => w.length > 3);
          return productWords.some((w) => ct.includes(w)) || ct.includes(crop.slice(0, 5));
        })
        .map((p: { id: string; cropType: string; estimatedDate?: string }) => ({
          id: p.id,
          label: `${p.cropType}${p.estimatedDate ? ` · ${p.estimatedDate.slice(0, 10)}` : ''}`,
        }));
      setPlans(plantingPlans);
      if (plantingPlans.length === 1) setPlantingId(plantingPlans[0].id);
    })();
  }, [parcelId, validBags]);

  const scanAnother = () => router.push('/scan-qr');

  const save = async () => {
    if (!validBags.length) {
      Alert.alert(t('error'), t('plantingEntry.fixBagsFirst'));
      return;
    }
    if (rejectedBags.length) {
      Alert.alert(t('error'), t('plantingEntry.removeRejectedBags'));
      return;
    }
    if (!farmId || !parcelId) {
      Alert.alert(t('error'), t('plantingEntry.parcelRequired'));
      return;
    }

    let loc = location;
    if (!loc) {
      loc = await loadLocation();
    }
    if (!loc) {
      Alert.alert(t('error'), t('plantingEntry.gpsRequired'));
      return;
    }

    setBusy(true);
    const clientReference = `plant-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const payload = {
      type: 'SETVA',
      farmId,
      clientReference,
      seedSerialNumber: validBags[0].serial,
      data: {
        date: new Date(occurredAt).toISOString(),
        parcelId,
        plantingId: plantingId || undefined,
        materialName: formatSeedProductName(validBags[0].product, validBags[0].variety),
        materialQuantity: totalKg,
        materialUnit: 'kg',
        areaHa: areaHa ? parseFloat(areaHa) : undefined,
        notes: notes.trim() || undefined,
        photos: photoUri ? [photoUri] : [],
        bags: validBags.map((b) => ({ serial: b.serial, quantityKg: b.quantityKg })),
        lot: validBags[0]?.lot,
        seedCropYear: validBags[0]?.seedCropYear,
        producer: validBags[0]?.producer,
        variety: validBags[0]?.variety,
        location: loc,
      },
    };
    try {
      const online = await isDeviceOnline();
      if (!online) {
        await offlineStorage.savePendingPlantingEntry({ id: clientReference, payload, timestamp: new Date().toISOString() });
        setOfflineQueued(true);
        setSavedSummary(t('plantingEntry.offlineSaved'));
        return;
      }
      await fieldEntriesAPI.create(payload);
      const farmName = estates.find((e) => e.id === farmId)?.name ?? '';
      setSavedSummary(
        t('plantingEntry.summary', {
          count: validBags.length,
          kg: totalKg,
          product: formatSeedProductName(validBags[0].product, validBags[0].variety),
          variety: '',
          lot: validBags[0].lot,
          farm: farmName,
          area: areaHa ? ` · ${areaHa} ha` : '',
        }),
      );
    } catch (e: unknown) {
      if (isLikelyNetworkError(e)) {
        await offlineStorage.savePendingPlantingEntry({ id: clientReference, payload, timestamp: new Date().toISOString() });
        setOfflineQueued(true);
        setSavedSummary(t('plantingEntry.offlineSaved'));
      } else {
        Alert.alert(t('error'), apiErrorMessage(e, t('plantingEntry.saveFailed')));
      }
    } finally {
      setBusy(false);
    }
  };

  const selectedFarm = estates.find((e) => e.id === farmId);
  const parcelOptions = parcels.map((p) => ({
    id: p.id,
    label: selectedFarm?.name ? `${selectedFarm.name} — ${p.cropType}` : p.cropType,
  }));

  const saveBlockedReason = rejectedBags.length
    ? t('plantingEntry.removeRejectedInline')
    : !validBags.length
      ? t('plantingEntry.addBagFirst')
      : null;

  return (
    <SafeAreaView style={growerUi.canvas} edges={['bottom']}>
      <GrowerStackHeader title={t('plantingEntry.title')} subtitle={t('plantingEntry.subtitle')} onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[growerUi.scrollContent, { paddingBottom: p.bottomInset + 24 }]}>
          {savedSummary ? (
            <EnterprisePanel>
              <Text style={styles.summary}>{savedSummary}</Text>
              {offlineQueued ? <Text style={styles.hint}>{t('plantingEntry.willSync')}</Text> : null}
              <EnterpriseButton
                label={t('plantingEntry.openFieldDiary')}
                onPress={() =>
                  router.push({
                    pathname: '/(producer)/(tabs)/field-log',
                    params: { view: 'history' },
                  } as never)
                }
                fullWidth
              />
              <EnterpriseButton variant="secondary" label={t('common.back')} onPress={() => router.back()} fullWidth />
            </EnterprisePanel>
          ) : (
            <>
              <EnterprisePanel>
                <Text style={styles.section}>{t('plantingEntry.bagsTitle')}</Text>
                {bags.map((b) => (
                  <View key={b.serial} style={[styles.bagRow, !b.ok && styles.bagRowRejected]}>
                    <Pressable
                      onPress={() => removeBag(b.serial)}
                      accessibilityLabel={t('plantingEntry.removeBag')}
                      style={styles.removeBtn}
                      hitSlop={8}
                    >
                      <X size={18} color={b.ok ? enterpriseColors.gray600 : '#b91c1c'} />
                    </Pressable>
                    {b.ok ? <Check size={18} color={enterpriseColors.primary} /> : null}
                    <View style={styles.bagBody}>
                      {b.ok ? (
                        <>
                          <Text style={styles.bagTitle}>{formatSeedProductName(b.product, b.variety)}</Text>
                          <Text style={styles.bagMeta}>{t('plantingEntry.lotLine', { lot: b.lot, year: b.seedCropYear, producer: b.producer })}</Text>
                          <EnterpriseTextField
                            label={t('plantingEntry.quantityKg')}
                            value={String(b.quantityKg)}
                            onChangeText={(v) => {
                              const n = parseFloat(v.replace(',', '.'));
                              setBags((prev) => prev.map((x) => x.serial === b.serial ? { ...x, quantityKg: Math.min(b.maxKg, Math.max(0, n || 0)) } : x));
                            }}
                            keyboardType="decimal-pad"
                            size="farmer"
                          />
                        </>
                      ) : (
                        <>
                          <Text style={styles.bagRejectedSerial}>{b.serial}</Text>
                          <Text style={styles.bagError}>{b.error}</Text>
                        </>
                      )}
                    </View>
                  </View>
                ))}
                <EnterpriseButton variant="secondary" label={t('plantingEntry.scanAnother')} onPress={scanAnother} icon={<ScanLine size={18} color={enterpriseColors.primary} />} fullWidth />
                <View style={styles.manualRow}>
                  <EnterpriseTextField
                    label={t('plantingEntry.manualSerial')}
                    value={manualSerial}
                    onChangeText={setManualSerial}
                    placeholder="BV-26-NS2604-000001-AAAA"
                    autoCapitalize="characters"
                    size="farmer"
                  />
                  <EnterpriseButton
                    variant="secondary"
                    label={t('plantingEntry.addManual')}
                    loading={addingManual}
                    onPress={async () => {
                      if (!manualSerial.trim()) return;
                      setAddingManual(true);
                      try {
                        await addBagFromSerial(manualSerial.trim());
                        setManualSerial('');
                      } finally {
                        setAddingManual(false);
                      }
                    }}
                    fullWidth
                  />
                </View>
              </EnterprisePanel>

              <EnterprisePanel>
                <GrowerSelectField
                  label={t('plantingEntry.parcel')}
                  valueId={parcelId}
                  options={parcelOptions}
                  onSelect={setParcelId}
                  placeholder={t('plantingEntry.selectParcel')}
                />
                {plans.length > 0 ? (
                  <GrowerSelectField
                    label={t('plantingEntry.plantingPlan')}
                    valueId={plantingId}
                    options={plans}
                    onSelect={setPlantingId}
                    placeholder={t('plantingEntry.optionalPlan')}
                  />
                ) : null}
                <EnterpriseTextField label={t('plantingEntry.date')} value={occurredAt} onChangeText={setOccurredAt} size="farmer" />
                <EnterpriseTextField label={t('plantingEntry.areaHa')} value={areaHa} onChangeText={setAreaHa} keyboardType="decimal-pad" size="farmer" />
                <EnterpriseTextArea label={t('plantingEntry.notes')} value={notes} onChangeText={setNotes} />
                <EnterpriseButton variant="ghost" label={t('plantingEntry.addPhoto')} onPress={async () => {
                  const asset = await pickFromCamera({ t, quality: 0.72 });
                  if (asset?.uri) setPhotoUri(asset.uri);
                }} fullWidth />
              </EnterprisePanel>

              {saveBlockedReason ? <Text style={styles.inlineBlock}>{saveBlockedReason}</Text> : null}
              <EnterpriseButton
                label={locating ? t('plantingEntry.gettingLocation') : t('plantingEntry.save')}
                onPress={() => void save()}
                loading={busy || locating}
                disabled={!!saveBlockedReason}
                fullWidth
                size="large"
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { fontSize: 16, fontWeight: '600', color: enterpriseColors.gray900, marginBottom: 12 },
  bagRow: { flexDirection: 'row', gap: 10, marginBottom: 16, alignItems: 'flex-start' },
  bagRowRejected: { backgroundColor: '#fef2f2', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#fecaca' },
  removeBtn: { paddingTop: 2 },
  bagBody: { flex: 1 },
  bagTitle: { fontSize: 15, fontWeight: '600', color: enterpriseColors.gray900 },
  bagMeta: { fontSize: 13, color: enterpriseColors.gray600, marginBottom: 8 },
  bagRejectedSerial: { fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: enterpriseColors.gray900 },
  bagError: { color: '#b91c1c', fontSize: 13, marginTop: 4 },
  summary: { fontSize: 16, color: enterpriseColors.gray900, marginBottom: 12, lineHeight: 22 },
  hint: { fontSize: 13, color: enterpriseColors.gray600, marginBottom: 12 },
  manualRow: { marginTop: 16, gap: 8 },
  inlineBlock: { color: '#b91c1c', fontSize: 13, marginBottom: 8, paddingHorizontal: 4 },
});
