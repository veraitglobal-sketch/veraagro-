import { compressImage } from '@/lib/image-compression';

export async function readReturnImages(files: FileList | null, maximum: number): Promise<string[]> {
  if (!files || files.length < 1 || files.length > maximum) throw new Error('PHOTO_COUNT');
  return Promise.all(Array.from(files).map(async (file) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10_000_000) throw new Error('PHOTO_SIZE_OR_TYPE');
    const compressed = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, maxSizeMB: 1.5, quality: 0.8, useWebWorker: true });
    return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = reject; reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(compressed); });
  }));
}
