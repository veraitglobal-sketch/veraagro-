import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { GrowerPortalService } from './grower-portal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import {
  IngestMobileCertificatePhotoDto,
  IngestMobileCostDto,
  IngestMobileProductDto,
} from './dto/mobile-ingest.dto';

@Controller('grower-portal')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GROWER', 'FARMER')
export class GrowerPortalController {
  constructor(private readonly growerPortalService: GrowerPortalService) {}

  @Get('required-certifications')
  getRequiredCertifications() {
    return this.growerPortalService.getRequiredCertifications();
  }

  /** Mobile offline queue: product draft */
  @Post('products')
  async ingestProduct(@GetUser() user: { id: string }, @Body() dto: IngestMobileProductDto) {
    return this.growerPortalService.ingestMobileProduct(user.id, dto);
  }

  /** Mobile offline queue: cost line */
  @Post('costs')
  async ingestCost(@GetUser() user: { id: string }, @Body() dto: IngestMobileCostDto) {
    return this.growerPortalService.ingestMobileCost(user.id, dto);
  }

  /** Mobile cost calculator: list ingested cost lines for this grower */
  @Get('costs')
  async listCosts(@GetUser() user: { id: string }) {
    return this.growerPortalService.listMobileCosts(user.id);
  }

  /** Mobile offline queue: certificate photo metadata (full binary upload to follow) */
  @Post('certificate-photos')
  async ingestCertificatePhoto(
    @GetUser() user: { id: string },
    @Body() dto: IngestMobileCertificatePhotoDto,
  ) {
    return this.growerPortalService.ingestMobileCertificatePhoto(user.id, dto);
  }

  @Get('mission-tracker')
  async getMissionTracker(
    @GetUser() user: { id?: string } | undefined,
    @Query('batchId') batchId?: string,
  ) {
    const id = user?.id;
    if (!id) {
      throw new UnauthorizedException();
    }
    return this.growerPortalService.getMissionTracker(id, batchId);
  }

  @Get('journey-map/:missionId')
  async getJourneyMap(
    @Param('missionId') missionId: string,
    @GetUser() user: any,
  ) {
    return this.growerPortalService.getJourneyMap(missionId, user.id);
  }

  @Get('consumer-feedback/:batchId')
  async getConsumerFeedback(
    @Param('batchId') batchId: string,
    @GetUser() user: any,
  ) {
    return this.growerPortalService.getConsumerFeedback(batchId, user.id);
  }

  @Get('financial-status/:batchId')
  async getFinancialStatus(
    @Param('batchId') batchId: string,
    @GetUser() user: any,
  ) {
    return this.growerPortalService.getFinancialStatus(batchId, user.id);
  }
}
