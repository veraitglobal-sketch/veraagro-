import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { estatesAPI, harvestAnnouncementsAPI, parcelsAPI } from '../../../lib/api';
import { verifyGPS } from '../../../lib/integrity-guard';

export const CROP_TYPES = ['Raspberry', 'Pepper', 'Tomato', 'Cucumber', 'Lettuce', 'Other'];

type ParcelOption = { id: string; label: string };

export function useHarvestData() {
  const { t } = useTranslation();
  const [approvedParcels, setApprovedParcels] = useState<ParcelOption[]>([]);
  const [parcelsLoading, setParcelsLoading] = useState(true);
  const [parcelId, setParcelId] = useState('');

  const [cropType, setCropType] = useState('');
  const [estimatedQuantity, setEstimatedQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [harvestDate, setHarvestDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [plannedLoadDate, setPlannedLoadDate] = useState(''); // YYYY-MM-DD, optional
  const [loadQuantity, setLoadQuantity] = useState('');
  const [marketChannel, setMarketChannel] = useState<'INDUSTRIAL' | 'RETAIL' | 'MIXED' | ''>('');
  const [qualityGrade, setQualityGrade] = useState('');
  const [sortingSpec, setSortingSpec] = useState('');
  const [growerNotes, setGrowerNotes] = useState('');

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsWarning, setGpsWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [estate, setEstate] = useState<{
    polygonCoordinates?: Array<{ lat: number; lng: number }>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setParcelsLoading(true);
        const list = await estatesAPI.getAll();
        const out: ParcelOption[] = [];
        for (const e of Array.isArray(list) ? list : []) {
          const ps = await parcelsAPI.getByEstate(e.id);
          for (const p of ps || []) {
            if (p.approvedAt) {
              out.push({ id: p.id, label: `${e.name} — ${p.cropType || 'Parcel'}` });
            }
          }
        }
        if (cancelled) return;
        setApprovedParcels(out);
        if (out.length === 1) setParcelId(out[0].id);
        if (list?.length === 1) {
          setEstate({ polygonCoordinates: list[0].polygonCoordinates as any });
        } else {
          setEstate(null);
        }
      } catch (e) {
        console.error(e);
        setApprovedParcels([]);
      } finally {
        if (!cancelled) setParcelsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!parcelId) return;
    (async () => {
      try {
        const list = await estatesAPI.getAll();
        for (const e of list || []) {
          const ps = await parcelsAPI.getByEstate(e.id);
          if (ps?.some((p) => p.id === parcelId)) {
            setEstate({ polygonCoordinates: e.polygonCoordinates as any });
            return;
          }
        }
      } catch {
        // ignore
      }
    })();
  }, [parcelId]);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') Alert.alert(t('producer.estates.permissionsTitle'), t('producer.estates.locationPermissionRequired'));
    });
  }, [t]);

  const getCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const userLocation = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setLocation(userLocation);
      if (estate?.polygonCoordinates) {
        const isValid = verifyGPS(userLocation, { polygonCoordinates: estate.polygonCoordinates as any });
        setGpsWarning(!isValid);
      } else {
        setGpsWarning(false);
      }
    } catch (error) {
      Alert.alert(t('error'), t('producer.harvest.locationFailed'));
    } finally {
      setLoading(false);
    }
  }, [estate, t]);

  const handleSubmit = useCallback(async () => {
    if (!parcelId) {
      Alert.alert(t('error'), t('producer.harvest.selectParcel'));
      return;
    }
    if (!cropType.trim()) {
      Alert.alert(t('error'), t('producer.harvest.enterCropType'));
      return;
    }
    if (!estimatedQuantity || parseFloat(estimatedQuantity) <= 0) {
      Alert.alert(t('error'), t('producer.harvest.enterQuantity'));
      return;
    }

    const buildNotes = () => {
      const parts: string[] = [];
      if (growerNotes.trim()) parts.push(growerNotes.trim());
      if (location) parts.push(`GPS: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`);
      return parts.length ? parts.join(' | ') : undefined;
    };

    const estQty = parseFloat(estimatedQuantity);
    const loadKg = loadQuantity.trim() ? parseFloat(loadQuantity) : estQty;

    const estimatedDateIso = `${harvestDate}T12:00:00.000Z`;

    let plannedLoadingStart: string | undefined;
    let plannedLoadingEnd: string | undefined;
    if (plannedLoadDate.trim()) {
      plannedLoadingStart = `${plannedLoadDate}T05:00:00.000Z`;
      plannedLoadingEnd = `${plannedLoadDate}T19:00:00.000Z`;
    }

    const run = async () => {
      try {
        setLoading(true);
        await harvestAnnouncementsAPI.create({
          parcelId,
          announcementType: 'HARVEST',
          cropType: cropType.trim(),
          estimatedDate: estimatedDateIso,
          estimatedQuantity: estQty,
          plannedLoadingStart,
          plannedLoadingEnd,
          loadQuantityKg: !Number.isNaN(loadKg) && loadKg > 0 ? loadKg : estQty,
          marketChannel: marketChannel || undefined,
          qualityGrade: qualityGrade.trim() || undefined,
          sortingSpec: sortingSpec.trim() || undefined,
          notes: buildNotes(),
        });
        Alert.alert(t('alerts.success'), t('producer.harvest.planSent'));
        setCropType('');
        setEstimatedQuantity('');
        setLoadQuantity('');
        setPlannedLoadDate('');
        setMarketChannel('');
        setQualityGrade('');
        setSortingSpec('');
        setGrowerNotes('');
        setLocation(null);
        setGpsWarning(false);
      } catch (e: any) {
        const raw = e?.response?.data?.message || e?.message || t('producer.harvest.saveFailed');
        const msg = Array.isArray(raw) ? raw.join(' ') : String(raw);
        Alert.alert(t('error'), msg);
      } finally {
        setLoading(false);
      }
    };

    if (gpsWarning) {
      Alert.alert(t('alerts.warning'), t('producer.harvest.notOnParcel'), [
        { text: t('producer.harvest.cancel'), style: 'cancel' },
        { text: t('producer.harvest.continue'), onPress: run },
      ]);
      return;
    }
    await run();
  }, [
    parcelId,
    cropType,
    estimatedQuantity,
    harvestDate,
    plannedLoadDate,
    loadQuantity,
    marketChannel,
    qualityGrade,
    sortingSpec,
    growerNotes,
    location,
    gpsWarning,
    t,
  ]);

  return {
    approvedParcels,
    parcelsLoading,
    parcelId,
    setParcelId,
    cropType,
    setCropType,
    estimatedQuantity,
    setEstimatedQuantity,
    unit,
    setUnit,
    harvestDate,
    setHarvestDate,
    plannedLoadDate,
    setPlannedLoadDate,
    loadQuantity,
    setLoadQuantity,
    marketChannel,
    setMarketChannel,
    qualityGrade,
    setQualityGrade,
    sortingSpec,
    setSortingSpec,
    growerNotes,
    setGrowerNotes,
    location,
    gpsWarning,
    loading,
    getCurrentLocation,
    handleSubmit,
  };
}
