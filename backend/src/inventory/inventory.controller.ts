import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('available')
  // Public endpoint - no authentication required for landing page
  async getAvailableProducts(
    @Query('city') city: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    const location = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined;
    return this.inventoryService.getAvailableProducts(city, location);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async addInventory(@Body() body: any) {
    return this.inventoryService.addInventory(body);
  }
}
