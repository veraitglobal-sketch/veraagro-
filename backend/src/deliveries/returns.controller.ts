import { ReturnDispositionService } from './return-disposition.service';
import { ReturnDispositionDto } from './dto/return-disposition.dto';
import { RefundReconciliationService } from './refund-reconciliation.service';
import { ReconcileRefundDto } from './dto/reconcile-refund.dto';
import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReturnsService } from './returns.service';
import { CreateReturnDto, ReturnProofDto, ApproveRefundDto, ConfirmRefundDto } from './dto/return-refund.dto';

@Controller('delivery-returns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReturnsController {
  constructor(private returns: ReturnsService, private reconciliation: RefundReconciliationService, private disposition: ReturnDispositionService) {}
  @Get() list(@Request() req) { return this.returns.list(req.user); }
  @Get(':id/evidence') evidenceForReturn(@Request() req, @Param('id') id: string) { return this.returns.evidence(req.user, id); }
  @Post() @Roles('ADMIN', 'SUPER_ADMIN')
  create(@Request() req, @Body() dto: CreateReturnDto) { return this.returns.create(req.user.id, dto); }
  @Post(':id/collect') collect(@Request() req, @Param('id') id: string, @Body() dto: ReturnProofDto) { return this.returns.recordProof(req.user, id, 'collect', dto); }
  @Post(':id/receive') receive(@Request() req, @Param('id') id: string, @Body() dto: ReturnProofDto) { return this.returns.recordProof(req.user, id, 'receive', dto); }
  @Get(':id/disposition/:decisionId/evidence')
  inspectionEvidence(@Request() req, @Param('id') id: string, @Param('decisionId') decisionId: string) { return this.returns.dispositionEvidence(req.user, id, decisionId); }
  @Get(':id/disposition') @Roles('ADMIN', 'SUPER_ADMIN')
  stockDetails(@Param('id') id: string) { return this.disposition.details(id); }
  @Post(':id/disposition') @Roles('ADMIN', 'SUPER_ADMIN')
  stockDecision(@Request() req, @Param('id') id: string, @Body() dto: ReturnDispositionDto) { return this.disposition.decide(req.user.id, id, dto); }
  @Post(':id/refund') @Roles('ADMIN', 'SUPER_ADMIN')
  approve(@Request() req, @Param('id') id: string, @Body() dto: ApproveRefundDto) { return this.returns.approveRefund(req.user.id, id, dto); }
  @Post('refunds/:id/confirm') @Roles('ADMIN', 'SUPER_ADMIN')
  confirm(@Request() req, @Param('id') id: string, @Body() dto: ConfirmRefundDto) { return this.returns.confirmRefund(req.user.id, id, dto); }
  @Get('refunds/:id/reconciliation') @Roles('ADMIN', 'SUPER_ADMIN')
  reconciliationDetails(@Param('id') id: string) { return this.reconciliation.details(id); }
  @Post('refunds/:id/reconciliation') @Roles('ADMIN', 'SUPER_ADMIN')
  reconcile(@Request() req, @Param('id') id: string, @Body() dto: ReconcileRefundDto) { return this.reconciliation.reconcile(req.user.id, id, dto); }
  @Get('refunds/:id/bank-evidence') @Roles('ADMIN', 'SUPER_ADMIN')
  evidence(@Param('id') id: string) { return this.returns.bankEvidence(id); }
}
