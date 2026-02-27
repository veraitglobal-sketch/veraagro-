// ============================================================
// Bio Vera - Blockchain Controller (NestJS)
// ============================================================

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { BlockchainService, ChainEventType } from './blockchain.service';

class RegisterBatchDto {
  batchId: string;
  estateId: string;
  harvestDate: string;
  productType: string;
}

class RecordEventDto {
  eventType: 'HARVEST' | 'PACKAGING' | 'HANDOVER' | 'DELIVERY' | 'CERTIFICATION';
  timestamp: string;
  locationCode?: string;
}

class VerifyBatchDto {
  estateId: string;
  harvestDate: string;
  productType: string;
}

@Controller('api/blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  private ensureEnabled() {
    if (!this.blockchainService.isEnabled()) {
      throw new ServiceUnavailableException({
        success: false,
        message: 'Blockchain verification is not configured',
        code: 'BLOCKCHAIN_NOT_CONFIGURED',
      });
    }
  }

  @Post('batches')
  @HttpCode(HttpStatus.CREATED)
  async registerBatch(@Body() dto: RegisterBatchDto) {
    this.ensureEnabled();
    const result = await this.blockchainService.registerBatch(dto);
    return {
      success: true,
      data: result,
      message: `Batch ${dto.batchId} successfully registered on blockchain`,
    };
  }

  @Post('batches/:batchId/events')
  @HttpCode(HttpStatus.CREATED)
  async recordEvent(
    @Param('batchId') batchId: string,
    @Body() dto: RecordEventDto,
  ) {
    this.ensureEnabled();
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

  @Post('batches/:batchId/verify')
  async verifyBatch(
    @Param('batchId') batchId: string,
    @Body() dto: VerifyBatchDto,
  ) {
    this.ensureEnabled();
    const result = await this.blockchainService.verifyBatch(batchId, dto);
    return {
      success: true,
      data: result,
      verified: result.isVerified,
    };
  }

  @Get('batches/:batchId/journey')
  async getBatchJourney(@Param('batchId') batchId: string) {
    this.ensureEnabled();
    const result = await this.blockchainService.getBatchJourney(batchId);
    return {
      success: true,
      data: result,
    };
  }

  @Get('status')
  async status() {
    return {
      success: true,
      enabled: this.blockchainService.isEnabled(),
    };
  }
}
