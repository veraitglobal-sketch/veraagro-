import * as crypto from 'crypto';

/**
 * Cryptographic utilities for Bio Vera
 * Ensures data integrity and immutability
 */

export class CryptoUtil {
  /**
   * Generate SHA-256 hash for image file
   */
  static hashImage(imageBuffer: Buffer): string {
    return crypto.createHash('sha256').update(imageBuffer).digest('hex');
  }

  /**
   * Generate SHA-256 hash for GrowthLog data
   * Creates immutable proof linking: userId + estateId + parcelId + imageHash + GPS + timestamp
   */
  static hashGrowthLog(data: {
    userId: string;
    estateId: string;
    parcelId: string | null;
    imageHash: string;
    gpsLatitude: number;
    gpsLongitude: number;
    networkTimestamp: Date;
  }): string {
    const dataString = JSON.stringify({
      userId: data.userId,
      estateId: data.estateId,
      parcelId: data.parcelId || '',
      imageHash: data.imageHash,
      gpsLatitude: data.gpsLatitude,
      gpsLongitude: data.gpsLongitude,
      networkTimestamp: data.networkTimestamp.toISOString(),
    });

    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Generate SHA-256 hash for Digital Passport
   */
  static hashPassport(exportData: object): string {
    const dataString = JSON.stringify(exportData);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Verify hash integrity
   */
  static verifyHash(data: object, expectedHash: string): boolean {
    const dataString = JSON.stringify(data);
    const computedHash = crypto.createHash('sha256').update(dataString).digest('hex');
    return computedHash === expectedHash;
  }
}
