// ============================================================
// Bio Vera - Blockchain Controller (NestJS)
// Fajl: src/blockchain/blockchain.controller.ts
// ============================================================

import {
  Controller, Post, Get, Body, Param, HttpCode, HttpStatus
} from '@nestjs/common';
import { BlockchainService, ChainEventType } from './blockchain.service';

// ─── DTOs ─────────────────────────────────────────────────────

class RegisterBatchDto {
  batchId: string;
  estateId: string;
  harvestDate: string;   // ISO format: "2026-06-15"
  productType: string;
}

class RecordEventDto {
  eventType: 'HARVEST' | 'PACKAGING' | 'HANDOVER' | 'DELIVERY' | 'CERTIFICATION';
  timestamp: string;     // ISO format
  locationCode?: string;
}

class VerifyBatchDto {
  estateId: string;
  harvestDate: string;
  productType: string;
}

// ─── Controller ───────────────────────────────────────────────

@Controller('api/blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  /**
   * POST /api/blockchain/batches
   * Register a new batch on blockchain
   * Called by: Farmer mobile app when creating a new harvest batch
   */
  @Post('batches')
  @HttpCode(HttpStatus.CREATED)
  async registerBatch(@Body() dto: RegisterBatchDto) {
    const result = await this.blockchainService.registerBatch(dto);
    return {
      success: true,
      data: result,
      message: `Batch ${dto.batchId} successfully registered on blockchain`,
    };
  }

  /**
   * POST /api/blockchain/batches/:batchId/events
   * Record a supply chain event
   * Called by: Backend when farmer/driver scans QR at each checkpoint
   */
  @Post('batches/:batchId/events')
  @HttpCode(HttpStatus.CREATED)
  async recordEvent(
    @Param('batchId') batchId: string,
    @Body() dto: RecordEventDto,
  ) {
    const eventType = ChainEventType[dto.eventType];
    const result = await this.blockchainService.recordEvent(batchId, eventType, {
      timestamp: dto.timestamp,
      locationCode: dto.locationCode,
    });

    return {
      success: true,
      data: result,
      message: `Event ${dto.eventType} recorded for batch ${batchId}`,
    };
  }

  /**
   * POST /api/blockchain/batches/:batchId/verify
   * Verify batch authenticity
   * Called by: QR code scan verification page
   */
  @Post('batches/:batchId/verify')
  async verifyBatch(
    @Param('batchId') batchId: string,
    @Body() dto: VerifyBatchDto,
  ) {
    const result = await this.blockchainService.verifyBatch(batchId, dto);
    return {
      success: true,
      data: result,
      verified: result.isVerified,
    };
  }

  /**
   * GET /api/blockchain/batches/:batchId/journey
   * Get full product journey from blockchain
   * Called by: Digital passport / product page
   */
  @Get('batches/:batchId/journey')
  async getBatchJourney(@Param('batchId') batchId: string) {
    const result = await this.blockchainService.getBatchJourney(batchId);
    return {
      success: true,
      data: result,
    };
  }
}
