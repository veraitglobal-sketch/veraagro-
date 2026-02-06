import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { RoutingService } from './routing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('routing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  @Post('determine')
  @Roles('SUPER_ADMIN', 'COORDINATOR', 'SYSTEM')
  async determineRoute(@Body() body: {
    batchId: string;
    destinationCountry: string;
    orderQuantity: number;
    orderUrgency: 'high' | 'medium' | 'low';
  }) {
    return this.routingService.determineRoute(
      body.batchId,
      body.destinationCountry,
      body.orderQuantity,
      body.orderUrgency,
    );
  }
}
