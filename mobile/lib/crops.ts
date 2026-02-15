/**
 * Detailed crop hierarchy for estate/parcel selection
 * Fruits, Vegetables, Grains with subcategories (varieties)
 */
export interface CropVariety {
  id: string;
  name: string;
}

export interface CropCategory {
  id: string;
  name: string;
  varieties: CropVariety[];
}

export const CROP_HIERARCHY: Record<string, CropCategory[]> = {
  fruits: [
    {
      id: 'apple',
      name: 'Apple',
      varieties: [
        { id: 'apple-delicious', name: 'Delicious' },
        { id: 'apple-golden', name: 'Golden Delicious' },
        { id: 'apple-idared', name: 'Idared' },
        { id: 'apple-granny', name: 'Granny Smith' },
        { id: 'apple-fuji', name: 'Fuji' },
        { id: 'apple-jonagold', name: 'Jonagold' },
        { id: 'apple-boskoop', name: 'Boskoop' },
        { id: 'apple-other', name: 'Other' },
      ],
    },
    {
      id: 'raspberry',
      name: 'Raspberry',
      varieties: [
        { id: 'raspberry-tulameen', name: 'Tulameen' },
        { id: 'raspberry-glen-ample', name: 'Glen Ample' },
        { id: 'raspberry-polka', name: 'Polka' },
        { id: 'raspberry-other', name: 'Other' },
      ],
    },
    {
      id: 'blackberry',
      name: 'Blackberry',
      varieties: [
        { id: 'blackberry-loch-ness', name: 'Loch Ness' },
        { id: 'blackberry-thornless', name: 'Thornless' },
        { id: 'blackberry-other', name: 'Other' },
      ],
    },
    {
      id: 'blueberry',
      name: 'Blueberry',
      varieties: [
        { id: 'blueberry-duke', name: 'Duke' },
        { id: 'blueberry-chandler', name: 'Chandler' },
        { id: 'blueberry-other', name: 'Other' },
      ],
    },
    {
      id: 'strawberry',
      name: 'Strawberry',
      varieties: [
        { id: 'strawberry-clery', name: 'Clery' },
        { id: 'strawberry-elsanta', name: 'Elsanta' },
        { id: 'strawberry-marmolada', name: 'Marmolada' },
        { id: 'strawberry-other', name: 'Other' },
      ],
    },
    {
      id: 'plum',
      name: 'Plum',
      varieties: [
        { id: 'plum-stanley', name: 'Stanley' },
        { id: 'plum-cacak', name: 'Čačanska' },
        { id: 'plum-other', name: 'Other' },
      ],
    },
    {
      id: 'pear',
      name: 'Pear',
      varieties: [
        { id: 'pear-williams', name: 'Williams' },
        { id: 'pear-conference', name: 'Conference' },
        { id: 'pear-other', name: 'Other' },
      ],
    },
    {
      id: 'cherry',
      name: 'Cherry',
      varieties: [
        { id: 'cherry-bigarreau', name: 'Bigarreau' },
        { id: 'cherry-sour', name: 'Sour cherry' },
        { id: 'cherry-other', name: 'Other' },
      ],
    },
  ],
  vegetables: [
    {
      id: 'tomato',
      name: 'Tomato',
      varieties: [
        { id: 'tomato-beefsteak', name: 'Beefsteak' },
        { id: 'tomato-cherry', name: 'Cherry' },
        { id: 'tomato-roma', name: 'Roma' },
        { id: 'tomato-other', name: 'Other' },
      ],
    },
    {
      id: 'pepper',
      name: 'Pepper',
      varieties: [
        { id: 'pepper-bell', name: 'Bell pepper' },
        { id: 'pepper-hot', name: 'Hot pepper' },
        { id: 'pepper-other', name: 'Other' },
      ],
    },
    {
      id: 'cucumber',
      name: 'Cucumber',
      varieties: [
        { id: 'cucumber-slicing', name: 'Slicing' },
        { id: 'cucumber-pickling', name: 'Pickling' },
        { id: 'cucumber-other', name: 'Other' },
      ],
    },
    {
      id: 'potato',
      name: 'Potato',
      varieties: [
        { id: 'potato-agria', name: 'Agria' },
        { id: 'potato-desiree', name: 'Désirée' },
        { id: 'potato-other', name: 'Other' },
      ],
    },
    {
      id: 'onion',
      name: 'Onion',
      varieties: [
        { id: 'onion-yellow', name: 'Yellow' },
        { id: 'onion-red', name: 'Red' },
        { id: 'onion-other', name: 'Other' },
      ],
    },
    {
      id: 'carrot',
      name: 'Carrot',
      varieties: [
        { id: 'carrot-nantes', name: 'Nantes' },
        { id: 'carrot-other', name: 'Other' },
      ],
    },
    {
      id: 'cabbage',
      name: 'Cabbage',
      varieties: [
        { id: 'cabbage-white', name: 'White' },
        { id: 'cabbage-red', name: 'Red' },
        { id: 'cabbage-other', name: 'Other' },
      ],
    },
  ],
  grains: [
    {
      id: 'wheat',
      name: 'Wheat',
      varieties: [
        { id: 'wheat-soft', name: 'Soft wheat' },
        { id: 'wheat-durum', name: 'Durum wheat' },
        { id: 'wheat-other', name: 'Other' },
      ],
    },
    {
      id: 'corn',
      name: 'Corn',
      varieties: [
        { id: 'corn-dent', name: 'Dent corn' },
        { id: 'corn-sweet', name: 'Sweet corn' },
        { id: 'corn-other', name: 'Other' },
      ],
    },
    {
      id: 'barley',
      name: 'Barley',
      varieties: [
        { id: 'barley-malting', name: 'Malting' },
        { id: 'barley-feed', name: 'Feed' },
        { id: 'barley-other', name: 'Other' },
      ],
    },
    {
      id: 'oat',
      name: 'Oat',
      varieties: [
        { id: 'oat-common', name: 'Common oat' },
        { id: 'oat-naked', name: 'Naked oat' },
        { id: 'oat-other', name: 'Other' },
      ],
    },
    {
      id: 'rye',
      name: 'Rye',
      varieties: [
        { id: 'rye-winter', name: 'Winter rye' },
        { id: 'rye-spring', name: 'Spring rye' },
        { id: 'rye-other', name: 'Other' },
      ],
    },
    {
      id: 'buckwheat',
      name: 'Buckwheat',
      varieties: [
        { id: 'buckwheat-common', name: 'Common' },
        { id: 'buckwheat-tartary', name: 'Tartary' },
        { id: 'buckwheat-other', name: 'Other' },
      ],
    },
  ],
};

export function getCropDisplayLabel(categoryKey: string, cropId: string, varietyId: string): string {
  const cats = CROP_HIERARCHY[categoryKey];
  if (!cats) return cropId;
  const crop = cats.find((c) => c.id === cropId);
  if (!crop) return cropId;
  const variety = crop.varieties.find((v) => v.id === varietyId);
  return variety ? `${crop.name} – ${variety.name}` : crop.name;
}
