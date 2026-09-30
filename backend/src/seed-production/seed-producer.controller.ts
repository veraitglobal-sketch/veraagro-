import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { saveDurableDocument } from '../common/durable-document';
import { SeedProductionService } from './seed-production.service';
import { ConfirmProductionDto } from './dto/confirm-production.dto';

@Controller('seed-producer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SEED_PRODUCER')
export class SeedProducerController {
  constructor(private service: SeedProductionService) {}

  @Get('me')
  me(@Request() req: { user: { id: string } }) {
    return this.service.getProducerMe(req.user.id);
  }

  @Get('runs')
  listRuns(@Request() req: { user: { id: string } }) {
    return this.service.listProducerRuns(req.user.id);
  }

  @Get('runs/:id')
  getRun(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.service.getProducerRun(req.user.id, id);
  }

  @Get('runs/:id/labels.csv')
  @Header('Content-Type', 'text/csv')
  async labelsCsv(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { csv, filename } = await this.service.getProducerLabelsCsv(req.user.id, id);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return csv;
  }

  @Get('runs/:id/labels.pdf')
  async labelsPdf(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Query('format') format: 'sheet' | 'roll' = 'sheet',
    @Res({ passthrough: true }) res: Response,
  ) {
    const fmt = format === 'roll' ? 'roll' : 'sheet';
    const { pdf, filename } = await this.service.getProducerLabelsPdf(req.user.id, id, fmt);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(pdf);
  }

  @Post('runs/:id/confirm-production')
  confirm(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() body: ConfirmProductionDto,
  ) {
    return this.service.confirmProductionAsProducer(req.user.id, id, body);
  }

  @Post('runs/:id/certificates')
  @UseInterceptors(FileInterceptor('file'))
  uploadCertificate(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname?: string; size: number },
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (file.size > 10 * 1024 * 1024) throw new BadRequestException('File must be 10 MB or less');
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Certificate must be PDF or JPG');
    }
    const url = saveDurableDocument(file, 'seed-certificates');
    return this.service.appendProducerCertificate(req.user.id, id, url);
  }
}
