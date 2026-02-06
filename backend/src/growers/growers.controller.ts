import { Controller, Get, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { GrowersService } from './growers.service';

@Controller('growers')
export class GrowersController {
  constructor(private readonly growersService: GrowersService) {}

  @Get('prospect/download')
  async downloadProspect(@Res() res: Response) {
    try {
      const pdfBuffer = await this.growersService.generateProspectPDF();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="bio-vera-grower-prospect.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating prospect PDF:', error);
      throw new HttpException('Failed to generate prospect PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
