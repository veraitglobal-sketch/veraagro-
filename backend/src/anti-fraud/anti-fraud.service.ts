import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Anti-Fraud Service
 * 
 * Prevents farmer fraud attempts:
 * - Blocks gallery uploads (camera-only)
 * - Detects manual time changes on device
 * - Validates GPS coordinates
 * - Tracks device integrity
 */
@Injectable()
export class AntiFraudService {
  private readonly maxTimeOffset: number;

  constructor(private configService: ConfigService) {
    this.maxTimeOffset = parseInt(
      this.configService.get<string>('MAX_TIME_OFFSET', '300'),
    );
  }

  /**
   * Validate device timestamp against server time
   * Detects if farmer manually changed device time
   */
  validateTimestamp(deviceTimestamp: Date, networkTimestamp: Date): {
    isValid: boolean;
    timeOffset: number;
    error?: string;
  } {
    const timeOffset = Math.abs(
      (deviceTimestamp.getTime() - networkTimestamp.getTime()) / 1000,
    );

    if (timeOffset > this.maxTimeOffset) {
      return {
        isValid: false,
        timeOffset,
        error: `Device time mismatch detected. Time offset: ${timeOffset}s (max allowed: ${this.maxTimeOffset}s). Possible manual time manipulation.`,
      };
    }

    return {
      isValid: true,
      timeOffset,
    };
  }

  /**
   * Validate GPS coordinates
   * Ensures coordinates are within valid ranges
   */
  validateGPS(latitude: number, longitude: number): {
    isValid: boolean;
    error?: string;
  } {
    if (latitude < -90 || latitude > 90) {
      return {
        isValid: false,
        error: `Invalid latitude: ${latitude}. Must be between -90 and 90.`,
      };
    }

    if (longitude < -180 || longitude > 180) {
      return {
        isValid: false,
        error: `Invalid longitude: ${longitude}. Must be between -180 and 180.`,
      };
    }

    // Check if coordinates are (0, 0) - likely invalid/missing GPS
    if (latitude === 0 && longitude === 0) {
      return {
        isValid: false,
        error: 'GPS coordinates appear to be missing or invalid (0, 0)',
      };
    }

    return { isValid: true };
  }

  /**
   * Validate image metadata
   * Ensures image has required anti-fraud metadata
   */
  validateImageMetadata(metadata: {
    gpsLatitude: number;
    gpsLongitude: number;
    deviceTimestamp: Date;
    deviceId: string;
    imageHash?: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate GPS
    const gpsValidation = this.validateGPS(metadata.gpsLatitude, metadata.gpsLongitude);
    if (!gpsValidation.isValid) {
      errors.push(gpsValidation.error);
    }

    // Validate device ID
    if (!metadata.deviceId || metadata.deviceId.trim().length === 0) {
      errors.push('Device ID is required');
    }

    // Validate timestamp
    const timestampValidation = this.validateTimestamp(
      metadata.deviceTimestamp,
      new Date(),
    );
    if (!timestampValidation.isValid) {
      errors.push(timestampValidation.error);
    }

    // Validate image hash (if provided)
    if (metadata.imageHash && metadata.imageHash.length !== 64) {
      errors.push('Invalid image hash format (must be SHA-256: 64 hex characters)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if image source is valid (camera vs gallery)
   * This should be enforced on mobile app side, but we validate here too
   */
  validateImageSource(imageMetadata: any): { isValid: boolean; error?: string } {
    // Check for gallery-related metadata that shouldn't exist
    if (imageMetadata.source === 'gallery' || imageMetadata.fromGallery === true) {
      return {
        isValid: false,
        error: 'Gallery uploads are not allowed. Only camera captures are permitted.',
      };
    }

    // Ensure camera metadata exists
    if (!imageMetadata.cameraCapture && !imageMetadata.exif) {
      return {
        isValid: false,
        error: 'Image must be captured directly from camera with GPS metadata',
      };
    }

    return { isValid: true };
  }

  /**
   * Comprehensive fraud check for growth log submission
   */
  async validateGrowthLogSubmission(data: {
    gpsLatitude: number;
    gpsLongitude: number;
    deviceTimestamp: Date;
    deviceId: string;
    imageHash: string;
    imageMetadata?: any;
  }): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate GPS
    const gpsValidation = this.validateGPS(data.gpsLatitude, data.gpsLongitude);
    if (!gpsValidation.isValid) {
      errors.push(gpsValidation.error);
    }

    // Validate timestamp
    const timestampValidation = this.validateTimestamp(data.deviceTimestamp, new Date());
    if (!timestampValidation.isValid) {
      errors.push(timestampValidation.error);
    }

    // Validate device ID
    if (!data.deviceId || data.deviceId.trim().length === 0) {
      errors.push('Device ID is required for fraud prevention');
    }

    // Validate image hash
    if (!data.imageHash || data.imageHash.length !== 64) {
      errors.push('Invalid image hash (must be SHA-256)');
    }

    // Validate image source (if metadata provided)
    if (data.imageMetadata) {
      const sourceValidation = this.validateImageSource(data.imageMetadata);
      if (!sourceValidation.isValid) {
        errors.push(sourceValidation.error);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
