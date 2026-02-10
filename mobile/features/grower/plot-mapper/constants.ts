export const CANVAS_WIDTH = 300;
export const CANVAS_HEIGHT = 200;

export const CROP_TYPES = ['Jabuka', 'Malina', 'Borovnica', 'Kupina', 'Šljiva', 'Kruška', 'Trešnja'];

export const CROP_STATUSES = [
  { value: 'PREPARING_SOIL', label: 'Priprema zemljišta' },
  { value: 'YOUNG_SEEDLING', label: 'Mlada sadnica' },
  { value: 'IN_FULL_PRODUCTION', label: 'U punom rodu' },
  { value: 'HARVESTING', label: 'Berba' },
  { value: 'FALLOW', label: 'Ugar' },
] as const;
