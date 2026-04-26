import * as Crypto from 'expo-crypto';

function arrayBufferToHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** SHA-256 hex (64 chars), matching backend growth log expectations. */
export async function sha256HexFromImageUri(photoUri: string): Promise<string> {
  const res = await fetch(photoUri);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes);
  return arrayBufferToHex(digest);
}
