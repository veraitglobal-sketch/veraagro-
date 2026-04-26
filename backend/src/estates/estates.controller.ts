import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { EstatesService } from './estates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('estates')
export class EstatesController {
  constructor(private estatesService: EstatesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: { name: string; polygonCoordinates: any }, @Request() req: any) {
    return this.estatesService.create(req.user.id, body);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() req: any) {
    return this.estatesService.findAllByUser(req.user.id);
  }

  @Get('public/all')
  async findAllPublic() {
    return this.estatesService.findAllPublic();
  }

  /**
   * Admin: Get all pending estates (must be before :id)
   */
  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getPendingEstates() {
    return this.estatesService.getPendingEstates();
  }

  /**
   * Lightweight GPS boundary for mobile cache / sync (owner only)
   */
  @Get(':id/boundary')
  @UseGuards(JwtAuthGuard)
  async getBoundary(@Param('id') id: string, @Request() req: any) {
    return this.estatesService.getBoundaryForSync(id, req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.estatesService.findOne(id, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() body: { name?: string; polygonCoordinates?: any }, @Request() req: any) {
    return this.estatesService.update(id, req.user.id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Request() req: any) {
    const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPER_ADMIN');
    return this.estatesService.delete(id, req.user.id, isAdmin);
  }

  @Post(':id/start-certification')
  @UseGuards(JwtAuthGuard)
  async startCertification(@Param('id') id: string, @Request() req: any) {
    return this.estatesService.startCertification(id, req.user.id);
  }

  /**
   * Admin: Approve estate
   */
  @Put(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async approveEstate(@Param('id') id: string) {
    return this.estatesService.approveEstate(id);
  }

  /**
   * Admin: Reject estate
   */
  @Put(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async rejectEstate(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.estatesService.rejectEstate(id, body.reason);
  }
}
