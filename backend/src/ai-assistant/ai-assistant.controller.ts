import { Controller, Post, Body, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('ai-assistant')
export class AiAssistantController {
  constructor(private aiAssistantService: AiAssistantService) {}

  /**
   * Handle AI query
   * POST /ai-assistant/query
   */
  @Post('query')
  async handleQuery(
    @Body() dto: { 
      query: string; 
      language?: string; 
      sessionId?: string;
    },
    @Req() req: any,
  ) {
    const userInfo = {
      ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    };

    return this.aiAssistantService.handleQuery(
      dto.query,
      dto.language,
      dto.sessionId,
      userInfo,
    );
  }

  /**
   * Submit contact request
   * POST /ai-assistant/contact
   */
  @Post('contact')
  async submitContact(@Body() dto: {
    sessionId: string;
    name: string;
    email: string;
    phone?: string;
    message?: string;
    consentGiven: boolean;
  }) {
    return this.aiAssistantService.submitContactRequest(dto);
  }

  /**
   * Get all conversations (Admin only)
   * GET /ai-assistant/conversations
   */
  @Get('conversations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getConversations(@Query('page') page: string, @Query('limit') limit: string) {
    return this.aiAssistantService.getAllConversations(
      parseInt(page) || 1,
      parseInt(limit) || 20,
    );
  }

  /**
   * Get contact requests (Admin only)
   * GET /ai-assistant/contact-requests
   */
  @Get('contact-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getContactRequests(@Query('page') page: string, @Query('limit') limit: string) {
    return this.aiAssistantService.getContactRequests(
      parseInt(page) || 1,
      parseInt(limit) || 20,
    );
  }

  /**
   * Health check
   * GET /ai-assistant/health
   */
  @Get('health')
  health() {
    return { status: 'ok', service: 'ai-assistant' };
  }
}
