import { Controller, Get, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get('prospect/download')
  async downloadProspect(@Res() res: Response) {
    try {
      const pdfBuffer = await this.suppliersService.generateProspectPDF();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="bio-vera-supplier-prospect.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating prospect PDF:', error);
      throw new HttpException('Failed to generate prospect PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
