import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SmartLockService } from './smart-lock.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('smart-lock')
@UseGuards(JwtAuthGuard)
export class SmartLockController {
  constructor(private readonly smartLockService: SmartLockService) {}

  @Post('scan')
  async scanSeed(
    @Body() body: {
      inputSerialNumber: string;
      gpsLatitude: number;
      gpsLongitude: number;
      parcelId?: string;
      deviceId?: string;
    },
    @Request() req: any,
  ) {
    if (body.parcelId?.trim()) {
      return this.smartLockService.ensureSeedLinkedToParcel({
        inputSerialNumber: body.inputSerialNumber,
        userId: req.user.id,
        parcelId: body.parcelId.trim(),
        gpsLatitude: body.gpsLatitude,
        gpsLongitude: body.gpsLongitude,
        deviceId: body.deviceId,
      });
    }
    return this.smartLockService.validateAndLinkSeed(
      body.inputSerialNumber,
      req.user.id,
      body.gpsLatitude,
      body.gpsLongitude,
      undefined,
      body.deviceId,
    );
  }

  @Get('parcel/:parcelId/status')
  async getParcelStatus(@Param('parcelId') parcelId: string, @Request() req: any) {
    return this.smartLockService.getParcelStatus(parcelId, req.user.id);
  }
}
