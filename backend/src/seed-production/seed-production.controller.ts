import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { saveDurableDocument } from '../common/durable-document';
import { StoredDocumentsService } from '../stored-documents/stored-documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SeedProductionService } from './seed-production.service';
import { CreateApprovedProductDto } from './dto/create-approved-product.dto';
import { UpdateApprovedProductDto } from './dto/update-approved-product.dto';
import { CreateProducerDto } from './dto/create-producer.dto';
import { UpdateProducerDto } from './dto/update-producer.dto';
import { CreateRunDto } from './dto/create-run.dto';
import { ConfirmProductionDto } from './dto/confirm-production.dto';
import { RecallRunDto } from './dto/recall-run.dto';
import { AssignBagsDto } from './dto/assign-bags.dto';
import { ShipBagsDto } from './dto/ship-bags.dto';
import { PreviewAssignDto } from './dto/preview-assign.dto';
import { InviteProducerDto } from './dto/invite-producer.dto';
import { SeedStatus } from '@prisma/client';
@Controller('seed-production')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class SeedProductionController {
  constructor(
    private service: SeedProductionService,
    private documents: StoredDocumentsService,
  ) {}

  @Get('dashboard')
  dashboard() {
    return this.service.getDashboard();
  }

  @Get('approved-products')
  listProducts() {
    return this.service.listApprovedProducts();
  }

  @Post('approved-products')
  createProduct(@Body() body: CreateApprovedProductDto, @Request() req: { user: { id: string } }) {
    return this.service.createApprovedProduct(body, req.user.id);
  }

  @Patch('approved-products/:id')
  updateProduct(
    @Param('id') id: string,
    @Body() body: UpdateApprovedProductDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.updateApprovedProduct(id, body, req.user.id);
  }

  @Post('approved-products/:id/retire')
  retireProduct(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.service.retireApprovedProduct(id, req.user.id);
  }

  @Get('producers')
  listProducers() {
    return this.service.listProducers();
  }

  @Post('producers')
  createProducer(@Body() body: CreateProducerDto, @Request() req: { user: { id: string } }) {
    return this.service.createProducer(body, req.user.id);
  }

  @Patch('producers/:id')
  updateProducer(
    @Param('id') id: string,
    @Body() body: UpdateProducerDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.updateProducer(id, body, req.user.id);
  }

  @Get('runs')
  listRuns() {
    return this.service.listRuns();
  }

  @Get('runs/:id')
  getRun(@Param('id') id: string) {
    return this.service.getRun(id);
  }

  @Post('runs')
  createRun(@Body() body: CreateRunDto, @Request() req: { user: { id: string } }) {
    return this.service.createRun(body, req.user.id);
  }

  @Post('runs/:id/issue-labels')
  issueLabels(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.service.issueLabels(id, req.user.id);
  }

  @Get('runs/:id/labels.csv')
  @Header('Content-Type', 'text/csv')
  async labelsCsv(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const { csv, filename } = await this.service.getLabelsCsv(id);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return csv;
  }

  @Get('runs/:id/labels.pdf')
  async labelsPdf(
    @Param('id') id: string,
    @Query('format') format: 'sheet' | 'roll' = 'sheet',
    @Res({ passthrough: true }) res: Response,
  ) {
    const fmt = format === 'roll' ? 'roll' : 'sheet';
    const { pdf, filename } = await this.service.getLabelsPdf(id, fmt);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(pdf);
  }

  @Post('runs/:id/confirm-production')
  confirmProduction(
    @Param('id') id: string,
    @Body() body: ConfirmProductionDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.confirmProduction(id, body, req.user.id);
  }

  @Post('runs/:id/release')
  release(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.service.releaseRun(id, req.user.id);
  }

  @Get('runs/:id/recall-preview')
  recallPreview(@Param('id') id: string) {
    return this.service.getRecallPreview(id);
  }

  @Post('runs/:id/recall')
  recall(
    @Param('id') id: string,
    @Body() body: RecallRunDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.recallRun(id, body.reason, req.user.id);
  }

  @Post('runs/:id/assign-preview')
  assignPreview(@Param('id') id: string, @Body() body: PreviewAssignDto) {
    return this.service.previewAssignBags(id, body.serials);
  }

  @Post('upload-certificate')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCertificate(
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname?: string; size: number },
  ) {
    if (!file) throw new BadRequestException('No file provided');
    const url = await saveDurableDocument(this.documents, file);
    return { url };
  }

  @Get('parcels/:parcelId/planted-bags')
  parcelPlantedBags(@Param('parcelId') parcelId: string) {
    return this.service.listPlantedBagsForParcel(parcelId);
  }

  @Post('runs/:id/assign')
  assign(
    @Param('id') id: string,
    @Body() body: AssignBagsDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.assignBags(id, body, req.user.id);
  }

  @Post('runs/:id/ship')
  ship(
    @Param('id') id: string,
    @Body() body: ShipBagsDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.shipBags(id, body, req.user.id);
  }

  @Get('bags/:serial')
  getBag(@Param('serial') serial: string) {
    return this.service.getBagBySerial(serial);
  }

  @Post('producers/:id/invite')
  inviteProducer(
    @Param('id') id: string,
    @Body() body: InviteProducerDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.inviteProducerPortalUser(id, body, req.user.id);
  }

  @Post('producers/:id/unlink-user')
  unlinkProducer(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.service.unlinkProducerPortalUser(id, req.user.id);
  }

  @Get('reports/summary')
  reportsSummary(
    @Query('year') year?: string,
    @Query('productId') productId?: string,
  ) {
    return this.service.getReportsSummary({
      year: year ? parseInt(year, 10) : undefined,
      productId: productId || undefined,
    });
  }

  @Get('reports/bags.csv')
  @Header('Content-Type', 'text/csv')
  async reportsBagsCsv(
    @Query('runId') runId?: string,
    @Query('status') status?: SeedStatus,
    @Query('supplierUserId') supplierUserId?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const csv = await this.service.streamBagsCsv({ runId, status, supplierUserId });
    res?.setHeader('Content-Disposition', 'attachment; filename="seed-bags-register.csv"');
    return csv;
  }

  @Get('reports/recall-impact/:runId')
  recallImpact(@Param('runId') runId: string) {
    return this.service.getRecallImpact(runId);
  }
}
