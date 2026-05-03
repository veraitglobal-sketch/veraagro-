import type { Partition, Zone } from './types';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants';

export function calculateRectangularArea(l: number, w: number) {
  return l * w;
}

/** Build zones from dimensions + partitions, preserving crop metadata from previous zones when cells match. */
export function computePlotZones(lengthStr: string, widthStr: string, partitions: Partition[], prevZones: Zone[]): Zone[] | null {
  const l = parseFloat(lengthStr);
  const w = parseFloat(widthStr);
  if (isNaN(l) || isNaN(w) || l <= 0 || w <= 0) return null;

  if (partitions.length === 0) {
    const totalArea = calculateRectangularArea(l, w);
    return [
      {
        id: 'zone-1',
        name: 'ZONA A',
        coordinates: { x1: 0, y1: 0, x2: CANVAS_WIDTH, y2: CANVAS_HEIGHT },
        area: Math.round(totalArea),
        cropType: prevZones[0]?.cropType,
        plantingDate: prevZones[0]?.plantingDate,
        status: prevZones[0]?.status,
      },
    ];
  }

  const horizontalPartitions = partitions.filter((p) => p.type === 'HORIZONTAL').sort((a, b) => a.position - b.position);
  const verticalPartitions = partitions.filter((p) => p.type === 'VERTICAL').sort((a, b) => a.position - b.position);
  const rows = horizontalPartitions.length + 1;
  const cols = verticalPartitions.length + 1;
  const totalArea = calculateRectangularArea(l, w);
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
      const existingZone = prevZones.find(
        (z) => Math.abs(z.coordinates.x1 - x1) < 1 && Math.abs(z.coordinates.y1 - y1) < 1,
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
  return newZones;
}
