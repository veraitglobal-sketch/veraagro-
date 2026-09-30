/** Emoji for a catalogue product from its crop type or name (Serbian / English / German). */
const RULES: Array<[RegExp, string]> = [
  [/malin|raspberr|himbeer/i, '🫐'],
  [/borovnic|blueberr|heidelbeer/i, '🫐'],
  [/jagod|strawberr|erdbeer/i, '🍓'],
  [/jabuk|apple|apfel/i, '🍎'],
  [/kruš|krus|pear|birne/i, '🍐'],
  [/šljiv|sljiv|plum|pflaum/i, '🍑'],
  [/tre[sš]nj|višnj|visnj|cherr|kirsch/i, '🍒'],
  [/breskv|kajsij|peach|apricot|pfirsich|aprikos/i, '🍑'],
  [/grož|groz|grape|traube/i, '🍇'],
  [/paprik|pepper/i, '🌶️'],
  [/paradajz|tomat/i, '🍅'],
  [/krastavac|krastav|cucumber|gurke/i, '🥒'],
  [/krompir|potato|kartoffel/i, '🥔'],
  [/šargarep|sargarep|carrot|karotte/i, '🥕'],
  [/luk|onion|zwiebel/i, '🧅'],
  [/kukuruz|corn|mais/i, '🌽'],
  [/orah|walnut|lješnik|ljesnik|hazelnut|nuss/i, '🌰'],
];

export function productEmoji(product?: {
  productName?: string | null;
  name?: string | null;
  category?: string | null;
  parcel?: { cropType?: string | null } | null;
} | null): string {
  const text = `${product?.parcel?.cropType ?? ''} ${product?.productName ?? product?.name ?? ''} ${product?.category ?? ''}`;
  for (const [re, emoji] of RULES) if (re.test(text)) return emoji;
  return '🌾';
}
