import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { FarmerProfileService } from './farmer-profile.service';

@Controller('estate-profile')
export class EstateProfileController {
  constructor(private readonly farmerProfileService: FarmerProfileService) {}

  /**
   * Get estate passport by QR code (public). Same shape as farmer passport – one template.
   * GET /estate-profile/qr/:qrCode
   */
  @Get('qr/:qrCode')
  async getEstatePassportByQrCode(@Param('qrCode') qrCode: string) {
    return this.farmerProfileService.getEstatePassportByQrCode(qrCode);
  }

  /**
   * Get estate QR code image (PNG).
   * GET /estate-profile/qr/:qrCode/image
   */
  @Get('qr/:qrCode/image')
  async getEstateQrCodeImage(@Param('qrCode') qrCode: string, @Res() res: Response) {
    try {
      const qrCodeDataUrl = await this.farmerProfileService.generateEstateQrCodeImage(qrCode);
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      res.setHeader('Content-Type', 'image/png');
      res.send(imageBuffer);
    } catch {
      res.status(404).json({ message: 'Estate QR code not found' });
    }
  }
}
