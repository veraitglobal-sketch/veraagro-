import type { PlotBlueprintZone, PlotBlueprintPartition } from '../../../lib/api';

export type Zone = PlotBlueprintZone & {
  status?: 'PREPARING_SOIL' | 'YOUNG_SEEDLING' | 'IN_FULL_PRODUCTION' | 'HARVESTING' | 'FALLOW';
};

export type Partition = PlotBlueprintPartition;
