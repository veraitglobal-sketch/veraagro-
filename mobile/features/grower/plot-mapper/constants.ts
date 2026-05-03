export const CANVAS_WIDTH = 300;
export const CANVAS_HEIGHT = 200;

/** Logical px — below this, gesture counts as tap (single vertical slice at finger). */
export const MIN_PARTITION_GESTURE_DRAG = 14;

export const CROP_TYPES = ['Apple', 'Raspberry', 'Blueberry', 'Blackberry', 'Plum', 'Pear', 'Cherry'];

export const CROP_STATUSES = [
  { value: 'PREPARING_SOIL', label: 'Preparing soil' },
  { value: 'YOUNG_SEEDLING', label: 'Young seedling' },
  { value: 'IN_FULL_PRODUCTION', label: 'In full production' },
  { value: 'HARVESTING', label: 'Harvest' },
  { value: 'FALLOW', label: 'Fallow' },
] as const;
