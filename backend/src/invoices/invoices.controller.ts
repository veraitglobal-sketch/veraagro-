import { Controller, Get, Param, Query, UseGuards, Request, Post, Body, StreamableFile, Header } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('BUYER', 'ADMIN', 'SUPER_ADMIN')
  async getAllInvoices(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const buyerId = req.user.roles?.includes('BUYER') ? req.user.id : undefined;
    return this.invoicesService.findAll({ buyerId, status, startDate, endDate });
  }

  @Get('order/:orderId')
  async getInvoice(@Param('orderId') orderId: string) {
    return this.invoicesService.getInvoice(orderId);
  }

  @Get(':id/download')
  @UseGuards(RolesGuard)
  @Roles('BUYER', 'ADMIN', 'SUPER_ADMIN')
  @Header('Content-Type', 'application/pdf')
  async downloadInvoice(@Param('id') id: string, @Request() req: any) {
    const buyerId = req.user.roles?.includes('BUYER') ? req.user.id : undefined;
    const { buffer, filename } = await this.invoicesService.getInvoicePdfDownload(id, buyerId);
    return new StreamableFile(buffer, { type: 'application/pdf', disposition: `attachment; filename="${filename}"` });
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('BUYER', 'ADMIN', 'SUPER_ADMIN')
  async getInvoiceById(@Param('id') id: string, @Request() req: any) {
    const buyerId = req.user.roles?.includes('BUYER') ? req.user.id : undefined;
    return this.invoicesService.findOne(id, buyerId);
  }

  @Post(':id/send-email')
  @UseGuards(RolesGuard)
  @Roles('BUYER', 'ADMIN', 'SUPER_ADMIN')
  async sendInvoiceEmail(
    @Param('id') id: string,
    @Body() body: { email?: string },
    @Request() req: any,
  ) {
    const buyerId = req.user.roles?.includes('BUYER') ? req.user.id : undefined;
    return this.invoicesService.sendInvoiceEmail(id, buyerId, body.email);
  }
}
