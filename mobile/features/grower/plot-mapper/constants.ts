export const CANVAS_WIDTH = 300;
export const CANVAS_HEIGHT = 200;

/** Logical px — below this, gesture counts as tap (single vertical slice at finger). */
export const MIN_PARTITION_GESTURE_DRAG = 14;

export const CROP_TYPES = ['Apple', 'Raspberry', 'Blueberry', 'Blackberry', 'Plum', 'Pear', 'Cherry'];

export const CROP_STATUS_VALUES = [
  'PREPARING_SOIL',
  'YOUNG_SEEDLING',
  'IN_FULL_PRODUCTION',
  'HARVESTING',
  'FALLOW',
] as const;

export type CropStatusValue = (typeof CROP_STATUS_VALUES)[number];
