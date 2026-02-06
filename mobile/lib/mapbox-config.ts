// Mapbox Configuration
// Get your token from: https://account.mapbox.com/access-tokens/

export const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoidmVyYWl0IiwiYSI6ImNtaWo4cXRnczBia3YzZnM0Nnlsb25uMngifQ.YwD1woPnulCSNxG2wtrfkA';

if (!MAPBOX_ACCESS_TOKEN) {
  console.warn('⚠️ Mapbox access token not found. Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in .env');
}
