import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { VeraInsightsService } from './vera-insights.service';
import { CreateVeraInsightDto, UpdateVeraInsightDto } from './dto/vera-insight.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('vera-insights')
export class VeraInsightsController {
  constructor(private readonly insightsService: VeraInsightsService) {}

  /**
   * GET /vera-insights
   * Public endpoint - get all active insights for farmers
   */
  @Get()
  async getActiveInsights() {
    return this.insightsService.getActiveInsights();
  }

  /**
   * GET /vera-insights/all
   * Admin endpoint - get all insights (including inactive)
   */
  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getAllInsights() {
    return this.insightsService.getAllInsights();
  }

  /**
   * GET /vera-insights/:id
   * Get insight by ID
   */
  @Get(':id')
  async getInsightById(@Param('id') id: string) {
    return this.insightsService.getInsightById(id);
  }

  /**
   * POST /vera-insights
   * Create new insight (Admin only)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async createInsight(
    @GetUser() user: { id: string },
    @Body() dto: CreateVeraInsightDto,
  ) {
    return this.insightsService.createInsight(user.id, dto);
  }

  /**
   * PUT /vera-insights/:id
   * Update insight (Admin only)
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async updateInsight(
    @Param('id') id: string,
    @GetUser() user: { id: string },
    @Body() dto: UpdateVeraInsightDto,
  ) {
    return this.insightsService.updateInsight(id, user.id, dto);
  }

  /**
   * DELETE /vera-insights/:id
   * Delete insight (Admin only)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async deleteInsight(@Param('id') id: string) {
    return this.insightsService.deleteInsight(id);
  }
}
