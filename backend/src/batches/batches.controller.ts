import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Request,
  Res,
  UseGuards,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import { BatchesService } from './batches.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { PackingFlowBodyDto } from './dto/packing-flow.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('batches')
export class BatchesController {
  constructor(private batchesService: BatchesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createBatch(@Body() body: CreateBatchDto, @Request() req: any) {
    return this.batchesService.createBatch({
      ...body,
      harvestDate: new Date(body.harvestDate),
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

  @Get(':batchId/passport-completeness')
  @UseGuards(JwtAuthGuard)
  async passportCompleteness(@Param('batchId') batchId: string, @Request() req: { user: { id: string } }) {
    return this.batchesService.getPassportCompleteness(req.user.id, batchId);
  }

  @Get(':batchId/packing-flow/photo/:kind')
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'private, max-age=3600')
  async getPackingFlowPhoto(
    @Param('batchId') batchId: string,
    @Param('kind') kind: string,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (kind !== 'crate' && kind !== 'quality') {
      throw new BadRequestException('kind must be crate or quality');
    }
    const out = await this.batchesService.getPackingFlowPhotoFile(req.user.id, batchId, kind);
    if ('redirectUrl' in out) {
      res.redirect(302, out.redirectUrl);
      return;
    }
    const buffer = fs.readFileSync(out.filePath);
    const mime = out.fileName.toLowerCase().endsWith('png') ? 'image/png' : 'image/jpeg';
    return new StreamableFile(buffer, {
      type: mime,
      disposition: `inline; filename="${out.fileName}"`,
    });
  }

  @Get(':batchId/workflow')
  @UseGuards(JwtAuthGuard)
  async getWorkflow(@Param('batchId') batchId: string, @Request() req: any) {
    return this.batchesService.getBatchWorkflow(req.user.id, batchId);
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
