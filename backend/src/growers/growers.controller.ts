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

  @Get('packaging-guidelines/download')
  async downloadPackagingGuidelines(@Res() res: Response) {
    try {
      const pdfBuffer = await this.growersService.generatePackagingGuidelinesPDF();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="bio-vera-packaging-guidelines.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating packaging guidelines PDF:', error);
      throw new HttpException('Failed to generate packaging guidelines PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('field-management-guide/download')
  async downloadFieldManagementGuide(@Res() res: Response) {
    try {
      const pdfBuffer = await this.growersService.generateFieldManagementGuidePDF();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="bio-vera-field-management-guide.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating field management guide PDF:', error);
      throw new HttpException('Failed to generate field management guide PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('protocol/download')
  async downloadProtocol(@Res() res: Response) {
    try {
      const pdfBuffer = await this.growersService.generateProtocolPDF();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="bio-vera-protocol.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating protocol PDF:', error);
      throw new HttpException('Failed to generate protocol PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('certification-requirements/download')
  async downloadCertificationRequirements(@Res() res: Response) {
    try {
      const pdfBuffer = await this.growersService.generateCertificationRequirementsPDF();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="bio-vera-certification-requirements.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating certification requirements PDF:', error);
      throw new HttpException('Failed to generate certification requirements PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('mobile-app-guide/download')
  downloadMobileAppGuide(@Res() res: Response) {
    res.redirect(
      302,
      'https://www.biovera.app/docs/grower-app-guide/biovera-grower-app-guide.sr.pdf',
    );
  }

  @Get('payment-process-guide/download')
  async downloadPaymentProcessGuide(@Res() res: Response) {
    try {
      const pdfBuffer = await this.growersService.generatePaymentProcessGuidePDF();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="bio-vera-payment-process-guide.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating payment process guide PDF:', error);
      throw new HttpException('Failed to generate payment process guide PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('quality-standards/download')
  async downloadQualityStandards(@Res() res: Response) {
    try {
      const pdfBuffer = await this.growersService.generateQualityStandardsPDF();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="bio-vera-quality-standards.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating quality standards PDF:', error);
      throw new HttpException('Failed to generate quality standards PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
