import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { BatchesService } from './batches.service';
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
