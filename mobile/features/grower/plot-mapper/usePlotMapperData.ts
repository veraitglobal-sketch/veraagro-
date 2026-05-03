import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { plotMapperAPI } from '../../../lib/api';
import type { Zone, Partition } from './types';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants';
import { computePlotZones } from './computeZones';

function zonesEqual(a: Zone[], b: Zone[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((z, i) => {
    const o = b[i];
    return (
      z.id === o.id &&
      z.area === o.area &&
      z.coordinates.x1 === o.coordinates.x1 &&
      z.coordinates.y1 === o.coordinates.y1 &&
      z.coordinates.x2 === o.coordinates.x2 &&
      z.coordinates.y2 === o.coordinates.y2 &&
      z.cropType === o.cropType &&
      z.plantingDate === o.plantingDate &&
      z.status === o.status &&
      z.name === o.name
    );
  });
}

export function usePlotMapperData(parcelId: string) {
  const { t } = useTranslation();
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [zones, setZones] = useState<Zone[]>([]);
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [partitionMode, setPartitionMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /** Debounce dimension typing so we do not recompute zones on every keystroke. */
  const [debouncedLength, setDebouncedLength] = useState('');
  const [debouncedWidth, setDebouncedWidth] = useState('');

  useEffect(() => {
    const h = setTimeout(() => {
      setDebouncedLength(length);
      setDebouncedWidth(width);
    }, 400);
    return () => clearTimeout(h);
  }, [length, width]);

  const partitionsKey = useMemo(() => JSON.stringify(partitions.map((p) => [p.id, p.type, p.position])), [partitions]);

  const loadBlueprint = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      try {
        const blueprint = await plotMapperAPI.getByParcel(parcelId);
        if (blueprint) {
          const len = blueprint.length.toString();
          const wid = blueprint.width.toString();
          setLength(len);
          setWidth(wid);
          setDebouncedLength(len);
          setDebouncedWidth(wid);
          setZones((blueprint.blueprintData.zones || []) as Zone[]);
          setPartitions(blueprint.blueprintData.partitions || []);
        }
      } catch (e) {
        console.error('Error loading blueprint:', e);
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [parcelId],
  );

  useEffect(() => {
    void loadBlueprint();
  }, [parcelId, loadBlueprint]);

  /** Partitions changed — recompute immediately with current dimensions (not debounced). */
  useEffect(() => {
    setZones((prev) => {
      const next = computePlotZones(length, width, partitions, prev);
      if (!next || zonesEqual(prev, next)) return prev;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- layout only when partition list changes; length/width read from latest render
  }, [partitionsKey]);

  /** User paused typing dimensions — recompute without hammering on every keystroke. */
  useEffect(() => {
    setZones((prev) => {
      const next = computePlotZones(debouncedLength, debouncedWidth, partitions, prev);
      if (!next || zonesEqual(prev, next)) return prev;
      return next;
    });
  }, [debouncedLength, debouncedWidth]);

  const handleAddPartition = () => setPartitionMode(true);

  const handlePartitionGestureEnd = useCallback(
    ({ type, position }: Pick<Partition, 'type' | 'position'>) => {
      if (!partitionMode) return;
      const capped =
        type === 'VERTICAL'
          ? Math.max(1, Math.min(CANVAS_WIDTH - 1, position))
          : Math.max(1, Math.min(CANVAS_HEIGHT - 1, position));
      const partition: Partition = {
        id: `partition-${Date.now()}`,
        type,
        position: capped,
      };
      setPartitions((prev) => [...prev, partition]);
      setPartitionMode(false);
    },
    [partitionMode],
  );

  const handleZonePress = (zone: Zone) => {
    setSelectedZone(zone);
    setShowZoneModal(true);
  };

  const handleSaveZone = (
    zoneCropType: string,
    zonePlantingDate: Date,
    zoneStatus: string,
    onClose: () => void,
  ) => {
    if (!selectedZone) return;
    setZones((prev) =>
      prev.map((z) =>
        z.id === selectedZone.id
          ? {
              ...z,
              cropType: zoneCropType,
              plantingDate: zonePlantingDate.toISOString(),
              status: zoneStatus as Zone['status'],
            }
          : z,
      ),
    );
    setShowZoneModal(false);
    setSelectedZone(null);
    onClose();
  };

  const handleSaveBlueprint = async () => {
    if (!length || !width) {
      Alert.alert(t('producer.plotMapper.required'), t('producer.plotMapper.enterLengthWidth'));
      return;
    }
    const l = parseFloat(length);
    const w = parseFloat(width);
    if (isNaN(l) || isNaN(w) || l <= 0 || w <= 0) {
      Alert.alert(t('producer.plotMapper.invalid'), t('producer.plotMapper.enterValidDimensions'));
      return;
    }

    setSaving(true);
    try {
      await plotMapperAPI.save({
        parcelId,
        length: l,
        width: w,
        blueprintData: { zones, partitions },
      });
      Alert.alert(t('alerts.success'), t('producer.plotMapper.planSaved'));
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      Alert.alert(t('error'), msg || t('producer.plotMapper.savePlanFailed'));
    } finally {
      setSaving(false);
    }
  };

  const totalArea =
    length && width ? parseFloat(length) * parseFloat(width) : 0;

  return {
    length,
    setLength,
    width,
    setWidth,
    zones,
    partitions,
    selectedZone,
    showZoneModal,
    setShowZoneModal,
    setSelectedZone,
    partitionMode,
    loading,
    saving,
    totalArea: Number.isFinite(totalArea) ? totalArea : 0,
    handleAddPartition,
    handlePartitionGestureEnd,
    handleZonePress,
    handleSaveZone,
    handleSaveBlueprint,
    loadBlueprint,
  };
}
