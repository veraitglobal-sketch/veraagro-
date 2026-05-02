import { compressImage } from './image-compression';
import api from './api';

/**
 * Image Upload Utility
 * PERFORMANCE: Compress images client-side before upload
 */

export interface UploadOptions {
  endpoint: string;
  fieldName?: string;
  maxSizeMB?: number;
  compress?: boolean;
}

/**
 * Upload image with automatic compression
 * 
 * @param file Image file
 * @param options Upload options
 * @returns Upload response
 */
export async function uploadImage(
  file: File,
  options: UploadOptions,
): Promise<any> {
  const { endpoint, fieldName = 'image', maxSizeMB = 2, compress = true } = options;

  try {
    // Step 1: Compress image if enabled
    let fileToUpload = file;
    if (compress) {
      fileToUpload = await compressImage(file, {
        maxSizeMB,
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.8,
      });
    }

    // Step 2: Create FormData
    const formData = new FormData();
    formData.append(fieldName, fileToUpload);

    // Step 3: Upload to server
    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error: unknown) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Upload multiple images with compression
 * 
 * @param files Array of image files
 * @param options Upload options
 * @returns Array of upload responses
 */
export async function uploadImages(
  files: File[],
  options: UploadOptions,
): Promise<any[]> {
  // Upload in parallel for better performance
  const uploadPromises = files.map((file) => uploadImage(file, options));
  return Promise.all(uploadPromises);
}
