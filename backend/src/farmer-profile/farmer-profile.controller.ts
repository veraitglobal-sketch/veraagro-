import { Controller, Get, Put, Post, Body, Param, UseGuards, Res, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FarmerProfileService } from './farmer-profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ImageUploadInterceptor } from '../field-entries/image-upload.interceptor';

@Controller('farmer-profile')
export class FarmerProfileController {
  constructor(private readonly farmerProfileService: FarmerProfileService) {}

  /**
   * Get farmer profile by QR code (public endpoint)
   * Used when scanning QR code on product box
   * GET /farmer-profile/qr/:qrCode
   */
  @Get('qr/:qrCode')
  async getFarmerProfileByQrCode(@Param('qrCode') qrCode: string) {
    return this.farmerProfileService.getFarmerProfileByQrCode(qrCode);
  }

  /**
   * Get farmer QR code image
   * GET /farmer-profile/qr/:qrCode/image
   */
  @Get('qr/:qrCode/image')
  async getFarmerQrCodeImage(@Param('qrCode') qrCode: string, @Res() res: Response) {
    try {
      const qrCodeDataUrl = await this.farmerProfileService.generateFarmerQrCodeImage(qrCode);
      // Extract base64 data
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      res.setHeader('Content-Type', 'image/png');
      res.send(imageBuffer);
    } catch (error) {
      res.status(404).json({ message: 'QR code not found' });
    }
  }

  /**
   * Get own farmer profile (authenticated)
   * GET /farmer-profile/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyFarmerProfile(@GetUser() user: any) {
    return this.farmerProfileService.getFarmerProfileByUserId(user.id);
  }

  /**
   * Update farmer profile (authenticated)
   * PUT /farmer-profile/me
   */
  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateMyFarmerProfile(
    @GetUser() user: any,
    @Body() data: {
      farmerPhoto?: string;
      farmerBio?: string;
      yearsOfExperience?: number;
      generation?: string;
    },
  ) {
    return this.farmerProfileService.updateFarmerProfile(user.id, data);
  }

  /**
   * Upload farmer photo (authenticated)
   * POST /farmer-profile/me/photo
   */
  @Post('me/photo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo'), ImageUploadInterceptor)
  async uploadFarmerPhoto(
    @GetUser() user: any,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No photo file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit.');
    }

    // Convert buffer to base64
    const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    // Update farmer profile with photo
    return this.farmerProfileService.updateFarmerProfile(user.id, {
      farmerPhoto: base64Image,
    });
  }
}
