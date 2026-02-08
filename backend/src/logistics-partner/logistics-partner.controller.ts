import { Controller, Get, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { LogisticsPartnerService } from './logistics-partner.service';

@Controller('logistics-partner')
export class LogisticsPartnerController {
  constructor(private readonly logisticsPartnerService: LogisticsPartnerService) {}

  @Get('prospect/download')
  async downloadProspect(@Res() res: Response) {
    try {
      const pdfBuffer = await this.logisticsPartnerService.generateProspectPDF();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="bio-vera-logistics-partner-prospect.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating prospect PDF:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw new HttpException(
        `Failed to generate prospect PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('transport-operations-guide/download')
  async downloadTransportOperationsGuide(@Res() res: Response) {
    try {
      const pdfBuffer = await this.logisticsPartnerService.generateTransportOperationsGuidePDF();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="bio-vera-transport-operations-guide.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating transport operations guide PDF:', error);
      throw new HttpException('Failed to generate transport operations guide PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('cold-chain-protocol/download')
  async downloadColdChainProtocol(@Res() res: Response) {
    try {
      const pdfBuffer = await this.logisticsPartnerService.generateColdChainProtocolPDF();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="bio-vera-cold-chain-protocol.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating cold chain protocol PDF:', error);
      throw new HttpException('Failed to generate cold chain protocol PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('mobile-app-guide/download')
  async downloadMobileAppGuide(@Res() res: Response) {
    try {
      const pdfBuffer = await this.logisticsPartnerService.generateMobileAppGuidePDF();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="bio-vera-mobile-app-guide-logistics.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating mobile app guide PDF:', error);
      throw new HttpException('Failed to generate mobile app guide PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('payment-process-guide/download')
  async downloadPaymentProcessGuide(@Res() res: Response) {
    try {
      const pdfBuffer = await this.logisticsPartnerService.generatePaymentProcessGuidePDF();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="bio-vera-payment-process-guide-logistics.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating payment process guide PDF:', error);
      throw new HttpException('Failed to generate payment process guide PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('gps-tracking-standards/download')
  async downloadGPSTrackingStandards(@Res() res: Response) {
    try {
      const pdfBuffer = await this.logisticsPartnerService.generateGPSTrackingStandardsPDF();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="bio-vera-gps-tracking-standards.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating GPS tracking standards PDF:', error);
      throw new HttpException('Failed to generate GPS tracking standards PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
