import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { GeofencingService } from './geofencing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('geofencing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GeofencingController {
  constructor(private readonly geofencingService: GeofencingService) {}

  @Post('verify-delivery')
  async verifyDelivery(
    @Body() body: {
      missionId: string;
      deliveryLocationId: string;
      latitude: number;
      longitude: number;
    },
    @GetUser() user: any,
  ) {
    return this.geofencingService.verifyDelivery(
      body.missionId,
      body.deliveryLocationId,
      user.id,
      body.latitude,
      body.longitude,
    );
  }

  @Post('check-hub-entry')
  async checkHubEntry(
    @Body() body: {
      missionId: string;
      vehicleId: string;
      latitude: number;
      longitude: number;
    },
  ) {
    return this.geofencingService.checkHubEntry(
      body.missionId,
      body.vehicleId,
      body.latitude,
      body.longitude,
    );
  }

  @Post('check-route-deviation')
  async checkRouteDeviation(
    @Body() body: {
      missionId: string;
      latitude: number;
      longitude: number;
      hasTrafficAlert?: boolean;
    },
  ) {
    return this.geofencingService.checkRouteDeviation(
      body.missionId,
      body.latitude,
      body.longitude,
      body.hasTrafficAlert,
    );
  }
}
