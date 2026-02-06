import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { StandardEngineService } from './standard-engine.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('standard-engine')
export class StandardEngineController {
  constructor(private standardEngineService: StandardEngineService) {}

  /**
   * Check if batch meets all German Standard requirements
   */
  @Get('check/:batchId')
  @UseGuards(JwtAuthGuard)
  async checkLoadingApproval(
    @Param('batchId') batchId: string,
    @Request() req: any,
  ) {
    return this.standardEngineService.checkLoadingApproval(
      batchId,
      req.user.id,
    );
  }

  /**
   * Approve batch for loading (only if all checks pass)
   */
  @Post('approve/:batchId')
  @UseGuards(JwtAuthGuard)
  async approveForLoading(
    @Param('batchId') batchId: string,
    @Request() req: any,
  ) {
    return this.standardEngineService.approveForLoading(batchId, req.user.id);
  }
}
