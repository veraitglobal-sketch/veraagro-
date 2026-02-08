import imageCompression from 'browser-image-compression';

/**
 * Image Compression Utility
 * PERFORMANCE: Compress images client-side before upload to save bandwidth
 * 
 * Optimizations:
 * - Max width: 1920px (matches server-side resize)
 * - Max size: 2MB (after compression)
 * - Quality: 0.8 (80% quality for good balance)
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  maxSizeMB?: number;
  quality?: number;
  useWebWorker?: boolean;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920, // Match server-side resize
  maxHeight: 1920,
  maxSizeMB: 2, // 2MB max file size
  quality: 0.8, // 80% quality (good balance)
  useWebWorker: true, // Use web worker for better performance
};

/**
 * Compress image before upload
 * 
 * @param file Original image file
 * @param options Compression options
 * @returns Compressed image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {},
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Check if file is already small enough
    if (file.size <= (opts.maxSizeMB || 2) * 1024 * 1024) {
      // File is already small, but still resize if needed
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: opts.maxWidth || 1920,
        useWebWorker: opts.useWebWorker,
      });

      return compressed;
    }

    // Compress image
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: opts.maxWidth || 1920,
      maxSizeMB: opts.maxSizeMB || 2,
      useWebWorker: opts.useWebWorker,
      fileType: file.type, // Preserve original file type
    });

    // Log compression stats
    const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const compressedSizeMB = (compressed.size / (1024 * 1024)).toFixed(2);
    const savings = ((1 - compressed.size / file.size) * 100).toFixed(1);

    console.log(
      `Image compressed: ${originalSizeMB}MB → ${compressedSizeMB}MB (${savings}% savings)`,
    );

    return compressed;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original file if compression fails
    return file;
  }
}

/**
 * Compress multiple images
 * 
 * @param files Array of image files
 * @param options Compression options
 * @returns Array of compressed files
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {},
): Promise<File[]> {
  // Compress in parallel for better performance
  const compressedFiles = await Promise.all(
    files.map((file) => compressImage(file, options)),
  );

  return compressedFiles;
}

/**
 * Get image dimensions
 * 
 * @param file Image file
 * @returns Image dimensions {width, height}
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Get GPS location from device
 * 
 * @returns GPS coordinates {lat, lng}
 */
export function getGPSLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Get device fingerprint for security
 * 
 * @returns Device fingerprint string
 */
export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'server-side';
  }

  // Create a fingerprint from available device/browser information
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('Device fingerprint', 2, 2);
  const canvasFingerprint = canvas.toDataURL();

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvasFingerprint.substring(0, 50), // First 50 chars of canvas fingerprint
  ].join('|');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}
