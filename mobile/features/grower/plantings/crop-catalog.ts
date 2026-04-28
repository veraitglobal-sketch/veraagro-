/** Voće / povrće / ostalo — vrednosti za harvest_announcements.cropType (lokalni prikaz). */

export type CropCategoryId = 'fruit' | 'vegetable' | 'other';

export type CropVarietyRow = {
  cropTypeSr: string;
  cropTypeEn: string;
};

export type CropCategoryDef = {
  id: CropCategoryId;
  labelSr: string;
  labelEn: string;
  items: CropVarietyRow[];
};

export const CROP_CATALOG: CropCategoryDef[] = [
  {
    id: 'fruit',
    labelSr: 'Voće',
    labelEn: 'Fruit',
    items: [
      { cropTypeSr: 'Malina', cropTypeEn: 'Raspberry' },
      { cropTypeSr: 'Kupina', cropTypeEn: 'Blackberry' },
      { cropTypeSr: 'Jagoda', cropTypeEn: 'Strawberry' },
      { cropTypeSr: 'Borovnica', cropTypeEn: 'Blueberry' },
      { cropTypeSr: 'Trešnja', cropTypeEn: 'Sweet cherry' },
      { cropTypeSr: 'Višnja', cropTypeEn: 'Sour cherry' },
      { cropTypeSr: 'Jabučasta', cropTypeEn: 'Quince' },
      { cropTypeSr: 'Šljiva', cropTypeEn: 'Plum' },
      { cropTypeSr: 'Breskva', cropTypeEn: 'Peach' },
      { cropTypeSr: 'Kajsija', cropTypeEn: 'Apricot' },
      { cropTypeSr: 'Kruška', cropTypeEn: 'Pear' },
      { cropTypeSr: 'Jabuka', cropTypeEn: 'Apple' },
      { cropTypeSr: 'Grožđe (stono)', cropTypeEn: 'Table grapes' },
      { cropTypeSr: 'Grožđe (vinsko)', cropTypeEn: 'Wine grapes' },
      { cropTypeSr: 'Dunja', cropTypeEn: 'Quince fruit' },
    ],
  },
  {
    id: 'vegetable',
    labelSr: 'Povrće',
    labelEn: 'Vegetables',
    items: [
      { cropTypeSr: 'Paradajz', cropTypeEn: 'Tomato' },
      { cropTypeSr: 'Paprika', cropTypeEn: 'Bell pepper' },
      { cropTypeSr: 'Krastavac', cropTypeEn: 'Cucumber' },
      { cropTypeSr: 'Tikvica', cropTypeEn: 'Zucchini' },
      { cropTypeSr: 'Kupus', cropTypeEn: 'Cabbage' },
      { cropTypeSr: 'Krompir', cropTypeEn: 'Potato' },
      { cropTypeSr: 'Luk', cropTypeEn: 'Onion' },
      { cropTypeSr: 'Šargarepa', cropTypeEn: 'Carrot' },
      { cropTypeSr: 'Cvekla', cropTypeEn: 'Beetroot' },
      { cropTypeSr: 'Pasulj zeleni', cropTypeEn: 'Green beans' },
      { cropTypeSr: 'Grašak', cropTypeEn: 'Peas' },
      { cropTypeSr: 'Kukuruz (sitno zrno)', cropTypeEn: 'Sweet corn' },
      { cropTypeSr: 'Boranija', cropTypeEn: 'Runner beans' },
      { cropTypeSr: 'Prasak / blitva', cropTypeEn: 'Swiss chard' },
      { cropTypeSr: 'Zelje', cropTypeEn: 'Kale / savoy' },
      { cropTypeSr: 'Zelena salata', cropTypeEn: 'Lettuce' },
      { cropTypeSr: 'Spanać', cropTypeEn: 'Spinach' },
    ],
  },
  {
    id: 'other',
    labelSr: 'Žitarice i ostalo',
    labelEn: 'Grains & other',
    items: [
      { cropTypeSr: 'Soja', cropTypeEn: 'Soybean' },
      { cropTypeSr: 'Suncokret', cropTypeEn: 'Sunflower' },
      { cropTypeSr: 'Pšenica', cropTypeEn: 'Wheat' },
      { cropTypeSr: 'Kukuruz (zrno)', cropTypeEn: 'Maize' },
      { cropTypeSr: 'Ječam', cropTypeEn: 'Barley' },
      { cropTypeSr: 'Zob', cropTypeEn: 'Oats' },
      { cropTypeSr: 'Uljana repica', cropTypeEn: 'Rapeseed' },
      { cropTypeSr: 'Lucerka', cropTypeEn: 'Alfalfa' },
    ],
  },
];

export function cropTypeForLocale(row: CropVarietyRow, langIsSr: boolean): string {
  return langIsSr ? row.cropTypeSr : row.cropTypeEn;
}

/** 1 ar ≈ 100 m² — uobičajeno kod nas za prikaz (prosta konverzija). */
export function m2ToAra(m2: number): number {
  return m2 / 100;
}

export function formatArea(m2: number, _langIsSr: boolean): string {
  const ara = m2ToAra(m2);
  return `${Math.round(m2)} m² (${ara.toFixed(2)} ara)`;
}
