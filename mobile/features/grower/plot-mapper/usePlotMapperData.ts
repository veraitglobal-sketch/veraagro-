import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { plotMapperAPI } from '../../../lib/api';
import type { Zone, Partition } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

export function usePlotMapperData(parcelId: string | undefined) {
  const { t } = useTranslation();
  const router = useRouter();
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [zones, setZones] = useState<Zone[]>([]);
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [partitionMode, setPartitionMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const calculateArea = (l: number, w: number) => l * w;

  useEffect(() => {
    if (parcelId) loadBlueprint();
  }, [parcelId]);

  useEffect(() => {
    if (length && width && partitions.length > 0) {
      const l = parseFloat(length);
      const w = parseFloat(width);
      if (!isNaN(l) && !isNaN(w) && l > 0 && w > 0) generateZones();
    } else if (partitions.length === 0 && length && width) {
      const l = parseFloat(length);
      const w = parseFloat(width);
      if (!isNaN(l) && !isNaN(w) && l > 0 && w > 0) {
        const totalArea = calculateArea(l, w);
        setZones([
          {
            id: 'zone-1',
            name: 'ZONA A',
            coordinates: { x1: 0, y1: 0, x2: CANVAS_WIDTH, y2: CANVAS_HEIGHT },
            area: Math.round(totalArea),
          },
        ]);
      }
    }
  }, [length, width, partitions.length]);

  const loadBlueprint = async () => {
    if (!parcelId) return;
    setLoading(true);
    try {
      const blueprint = await plotMapperAPI.getByParcel(parcelId);
      if (blueprint) {
        setLength(blueprint.length.toString());
        setWidth(blueprint.width.toString());
        setZones((blueprint.blueprintData.zones || []) as Zone[]);
        setPartitions(blueprint.blueprintData.partitions || []);
      }
    } catch (e) {
      console.error('Error loading blueprint:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPartition = () => setPartitionMode(true);

  const handleCanvasPress = (event: { nativeEvent: { locationX: number; locationY: number } }) => {
    if (!partitionMode) return;
    const { locationX, locationY } = event.nativeEvent;
    const isHorizontal = locationY < CANVAS_HEIGHT / 2;
    const partition: Partition = {
      id: `partition-${Date.now()}`,
      type: isHorizontal ? 'HORIZONTAL' : 'VERTICAL',
      position: isHorizontal ? locationY : locationX,
    };
    setPartitions((prev) => [...prev, partition]);
    setPartitionMode(false);
  };

  const generateZones = () => {
    if (!length || !width) return;
    const l = parseFloat(length);
    const w = parseFloat(width);
    if (isNaN(l) || isNaN(w)) return;

    const horizontalPartitions = partitions
      .filter((p) => p.type === 'HORIZONTAL')
      .sort((a, b) => a.position - b.position);
    const verticalPartitions = partitions
      .filter((p) => p.type === 'VERTICAL')
      .sort((a, b) => a.position - b.position);

    const rows = horizontalPartitions.length + 1;
    const cols = verticalPartitions.length + 1;
    const totalArea = calculateArea(l, w);
    const zoneCount = rows * cols;
    const zoneArea = totalArea / zoneCount;
    const zoneWidth = CANVAS_WIDTH / cols;
    const zoneHeight = CANVAS_HEIGHT / rows;

    const newZones: Zone[] = [];
    let zoneIndex = 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const zoneName = `ZONA ${String.fromCharCode(64 + zoneIndex)}`;
        const x1 = (col * CANVAS_WIDTH) / cols;
        const y1 = (row * CANVAS_HEIGHT) / rows;
        const x2 = ((col + 1) * CANVAS_WIDTH) / cols;
        const y2 = ((row + 1) * CANVAS_HEIGHT) / rows;
        const existingZone = zones.find(
          (z) => Math.abs(z.coordinates.x1 - x1) < 1 && Math.abs(z.coordinates.y1 - y1) < 1
        );
        newZones.push({
          id: existingZone?.id || `zone-${zoneIndex}`,
          name: existingZone?.name || zoneName,
          coordinates: { x1, y1, x2, y2 },
          area: Math.round(zoneArea),
          cropType: existingZone?.cropType,
          plantingDate: existingZone?.plantingDate,
          status: existingZone?.status,
        });
        zoneIndex++;
      }
    }
    setZones(newZones);
  };

  const handleZonePress = (zone: Zone) => {
    setSelectedZone(zone);
    setShowZoneModal(true);
  };

  const handleSaveZone = (
    zoneCropType: string,
    zonePlantingDate: Date,
    zoneStatus: string,
    onClose: () => void
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
          : z
      )
    );
    setShowZoneModal(false);
    setSelectedZone(null);
    onClose();
  };

  const handleSaveBlueprint = async () => {
    if (!parcelId) {
      Alert.alert(t('error'), t('producer.plotMapper.missingParcelId'));
      return;
    }
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
      Alert.alert(t('alerts.success'), t('producer.plotMapper.planSaved'), [
        { text: t('alerts.ok'), onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      Alert.alert(t('error'), msg || t('producer.plotMapper.savePlanFailed'));
    } finally {
      setSaving(false);
    }
  };

  const totalArea =
    length && width ? calculateArea(parseFloat(length), parseFloat(width)) : 0;

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
    totalArea,
    handleAddPartition,
    handleCanvasPress,
    handleZonePress,
    handleSaveZone,
    handleSaveBlueprint,
  };
}
