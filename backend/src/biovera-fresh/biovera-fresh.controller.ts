import { Controller, Get, HttpException, HttpStatus, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { BioVeraFreshService } from './biovera-fresh.service';

@Controller('biovera-fresh')
export class BioVeraFreshController {
  constructor(private readonly bioVeraFreshService: BioVeraFreshService) {}

  @Get('prospect/download')
  async downloadProspect(@Query('locale') locale: string | undefined, @Res() res: Response) {
    try {
      const loc = this.bioVeraFreshService.normalizeLocale(locale);
      const pdfBuffer = await this.bioVeraFreshService.generateProspectPDF(loc);
      const filename = loc === 'sr' ? 'bio-vera-fresh-prospect-sr.pdf' : 'bio-vera-fresh-prospect-en.pdf';
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('BioVera Fresh prospect PDF error:', error);
      throw new HttpException('Failed to generate BioVera Fresh prospect PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
