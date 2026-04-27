import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';

/** JPEG data URL for API bodies that expect the same format as the web `readAsDataURL` upload. */
export async function imageUriToJpegDataUrl(uri: string): Promise<string> {
  const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
  return `data:image/jpeg;base64,${base64}`;
}

const MAX_COMPLIANCE_BYTES = 10 * 1024 * 1024;

export function assertDataUrlWithinSize(dataUrl: string, maxBytes = MAX_COMPLIANCE_BYTES): void {
  const approx = Math.floor((dataUrl.length * 3) / 4);
  if (approx > maxBytes) {
    throw new Error('PHOTO_TOO_LARGE');
  }
}
