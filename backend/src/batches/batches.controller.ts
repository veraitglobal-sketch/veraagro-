import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Request,
  UseGuards,
  StreamableFile,
} from '@nestjs/common';
import * as fs from 'fs';
import { BatchesService } from './batches.service';
import { PackingFlowBodyDto } from './dto/packing-flow.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('batches')
export class BatchesController {
  constructor(private batchesService: BatchesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createBatch(@Body() body: any, @Request() req: any) {
    return this.batchesService.createBatch({
      ...body,
      harvestedByUserId: req.user.id,
    });
  }

  @Post(':batchId/move-to-hub')
  @UseGuards(JwtAuthGuard)
  async moveToHub(
    @Param('batchId') batchId: string,
    @Body() body: { hubId: string; driverId?: string },
  ) {
    return this.batchesService.moveToHub(batchId, body.hubId, body.driverId);
  }

  @Post(':batchId/report-issue')
  @UseGuards(JwtAuthGuard)
  async reportQualityIssue(
    @Param('batchId') batchId: string,
    @Body() body: { issue: string },
    @Request() req: any,
  ) {
    return this.batchesService.reportQualityIssue(batchId, req.user.id, body.issue);
  }

  @Post(':batchId/packing-flow')
  @UseGuards(JwtAuthGuard)
  async recordPackingFlow(
    @Param('batchId') batchId: string,
    @Body() body: PackingFlowBodyDto,
    @Request() req: any,
  ) {
    return this.batchesService.recordPackingFlowCheck(req.user.id, batchId, body);
  }

  @Get(':batchId/packing-flow/photo/:kind')
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'private, max-age=3600')
  async getPackingFlowPhoto(
    @Param('batchId') batchId: string,
    @Param('kind') kind: string,
    @Request() req: any,
  ) {
    if (kind !== 'crate' && kind !== 'quality') {
      throw new BadRequestException('kind must be crate or quality');
    }
    const { filePath, fileName } = await this.batchesService.getPackingFlowPhotoFile(
      req.user.id,
      batchId,
      kind,
    );
    const buffer = fs.readFileSync(filePath);
    const mime = fileName.toLowerCase().endsWith('png') ? 'image/png' : 'image/jpeg';
    return new StreamableFile(buffer, {
      type: mime,
      disposition: `inline; filename="${fileName}"`,
    });
  }

  @Get(':batchId/traceability')
  async getTraceability(@Param('batchId') batchId: string) {
    return this.batchesService.getBatchTraceability(batchId);
  }

  @Get(':batchId/availability')
  async getAvailability(@Param('batchId') batchId: string) {
    // Public endpoint - no auth required
    return this.batchesService.getBatchAvailability(batchId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllBatches(@Request() req: any) {
    return this.batchesService.getAllBatchesForUser(req.user.id);
  }
}
