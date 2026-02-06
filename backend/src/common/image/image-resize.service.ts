import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import { Readable } from 'stream';

/**
 * Image Resize Service
 * PERFORMANCE: Automatically resize images on server-side
 * 
 * Optimizations:
 * - Max width: 1920px
 * - Preserve aspect ratio
 * - Optimize file size
 */
@Injectable()
export class ImageResizeService {
  private readonly logger = new Logger(ImageResizeService.name);
  private readonly MAX_WIDTH = 1920;
  private readonly MAX_HEIGHT = 1920;
  private readonly QUALITY = 80; // JPEG quality

  /**
   * Resize image to max 1920px width
   * 
   * @param imageBuffer Original image buffer
   * @param options Resize options
   * @returns Resized image buffer
   */
  async resizeImage(
    imageBuffer: Buffer,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    } = {},
  ): Promise<Buffer> {
    try {
      const maxWidth = options.maxWidth || this.MAX_WIDTH;
      const maxHeight = options.maxHeight || this.MAX_HEIGHT;
      const quality = options.quality || this.QUALITY;

      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();
      const originalWidth = metadata.width || 0;
      const originalHeight = metadata.height || 0;

      // Check if resize is needed
      if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
        this.logger.debug(
          `Image ${originalWidth}x${originalHeight} is already within limits, skipping resize`,
        );
        return imageBuffer;
      }

      // Calculate new dimensions (preserve aspect ratio)
      let newWidth = originalWidth;
      let newHeight = originalHeight;

      if (originalWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = Math.round((originalHeight * maxWidth) / originalWidth);
      }

      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = Math.round((originalWidth * maxHeight) / originalHeight);
      }

      this.logger.log(
        `Resizing image: ${originalWidth}x${originalHeight} → ${newWidth}x${newHeight}`,
      );

      // Resize image
      const resized = await sharp(imageBuffer)
        .resize(newWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality }) // Convert to JPEG for better compression
        .toBuffer();

      // Log size savings
      const originalSizeKB = (imageBuffer.length / 1024).toFixed(2);
      const resizedSizeKB = (resized.length / 1024).toFixed(2);
      const savings = ((1 - resized.length / imageBuffer.length) * 100).toFixed(1);

      this.logger.log(
        `Image resized: ${originalSizeKB}KB → ${resizedSizeKB}KB (${savings}% savings)`,
      );

      return resized;
    } catch (error) {
      this.logger.error('Error resizing image:', error);
      // Return original buffer if resize fails
      return imageBuffer;
    }
  }

  /**
   * Resize image from stream
   * 
   * @param stream Image stream
   * @param options Resize options
   * @returns Resized image buffer
   */
  async resizeImageFromStream(
    stream: Readable,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    } = {},
  ): Promise<Buffer> {
    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return this.resizeImage(buffer, options);
  }

  /**
   * Get image metadata
   * 
   * @param imageBuffer Image buffer
   * @returns Image metadata
   */
  async getImageMetadata(imageBuffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
    const metadata = await sharp(imageBuffer).metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: imageBuffer.length,
    };
  }
}
