import { Controller, Get, HttpException, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { BioVeraFreshService } from './biovera-fresh.service';

@Controller('biovera-fresh')
export class BioVeraFreshController {
  constructor(private readonly bioVeraFreshService: BioVeraFreshService) {}

  /** English prospect PDF only (same as other Bio Vera prospect downloads). */
  @Get('prospect/download')
  async downloadProspect(@Res() res: Response) {
    try {
      const pdfBuffer = await this.bioVeraFreshService.generateProspectPDF();
      const filename = 'bio-vera-fresh-prospect.pdf';
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('BioVera Fresh prospect PDF error:', error);
      throw new HttpException('Failed to generate BioVera Fresh prospect PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
