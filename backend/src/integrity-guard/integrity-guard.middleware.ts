import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { IntegrityGuardService } from './integrity-guard.service';

/**
 * Integrity Guard Middleware
 * Validates all inputs before they reach the controller
 * 
 * Usage: Apply to routes that accept barcode inputs
 */
@Injectable()
export class IntegrityGuardMiddleware implements NestMiddleware {
  constructor(private integrityGuard: IntegrityGuardService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Only validate POST/PUT requests with barcode data
    if (req.method === 'POST' || req.method === 'PUT') {
      const body = req.body;

      // Check if request contains barcode data
      if (body.barcode || body.fertilizerBarcode || body.seedSerialNumber) {
        const barcode = body.barcode || body.fertilizerBarcode || body.seedSerialNumber;
        const barcodeType = body.fertilizerBarcode
          ? 'FERTILIZER'
          : body.seedSerialNumber
            ? 'SEED'
            : 'PACKAGING';

        // Validate input
        const validation = await this.integrityGuard.validateInput({
          barcode,
          barcodeType,
          userId: (req as any).user?.id || body.userId,
          farmId: body.farmId || body.estateId,
          entryType: body.type || body.entryType || 'UNKNOWN',
          gpsLatitude: body.data?.location?.lat || body.gpsLatitude,
          gpsLongitude: body.data?.location?.lng || body.gpsLongitude,
        });

        if (!validation.valid) {
          return res.status(403).json({
            error: 'Input validation failed',
            reason: validation.reason,
            alertCreated: validation.alertCreated,
          });
        }
      }
    }

    next();
  }
}
