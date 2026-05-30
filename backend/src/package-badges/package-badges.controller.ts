import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PackageBadgesService } from './package-badges.service';
import {
  CreatePrintOrderDto,
  PreviewPrintOrderDto,
  RegisterPackageBadgesDto,
  ReceiveFromFactoryDto,
  ReceiveReturnFromGrowerDto,
  ReturnBadgesToSupplierDto,
  TransferBadgesToGrowerDto,
} from './dto/package-badges.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('package-badges')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PackageBadgesController {
  constructor(private readonly service: PackageBadgesService) {}

  @Post('register')
  @Roles(
    'FARMER',
    'GROWER',
    'PARTNER',
    'MATERIAL_SUPPLIER',
    'LOGISTICS_PARTNER',
    'ADMIN',
    'SUPER_ADMIN',
  )
  async register(@Body() dto: RegisterPackageBadgesDto, @GetUser() user: { id: string }) {
    return this.service.register(user.id, dto);
  }

  @Get('scan/:serial')
  @Roles(
    'FARMER',
    'GROWER',
    'PARTNER',
    'MATERIAL_SUPPLIER',
    'LOGISTICS_PARTNER',
    'BUYER',
    'DRIVER',
    'ADMIN',
    'SUPER_ADMIN',
  )
  async scan(@Param('serial') serial: string, @GetUser() user: { id: string }) {
    return this.service.scanTree(serial, user.id);
  }

  @Post('print-orders/preview')
  @Roles('FARMER', 'GROWER', 'PARTNER', 'MATERIAL_SUPPLIER', 'ADMIN', 'SUPER_ADMIN')
  async previewPrintOrder(@Body() dto: PreviewPrintOrderDto, @GetUser() user: { id: string }) {
    return this.service.previewPrintOrder(user.id, dto);
  }

  @Post('print-orders')
  @Roles('FARMER', 'GROWER', 'PARTNER', 'MATERIAL_SUPPLIER', 'ADMIN', 'SUPER_ADMIN')
  async createPrintOrder(@Body() dto: CreatePrintOrderDto, @GetUser() user: { id: string }) {
    return this.service.createPrintOrder(user.id, dto);
  }

  @Get('print-orders/mine')
  @Roles('FARMER', 'GROWER', 'PARTNER', 'MATERIAL_SUPPLIER', 'ADMIN', 'SUPER_ADMIN')
  async listMyPrintOrders(@GetUser() user: { id: string }) {
    return this.service.listMyPrintOrders(user.id);
  }

  @Patch('print-orders/:id/sent')
  @Roles('FARMER', 'GROWER', 'PARTNER', 'MATERIAL_SUPPLIER', 'ADMIN', 'SUPER_ADMIN')
  async markPrintOrderSent(@Param('id') id: string, @GetUser() user: { id: string }) {
    return this.service.markPrintOrderSent(user.id, id);
  }

  @Post('return-to-supplier')
  @Roles('FARMER', 'GROWER', 'PARTNER', 'ADMIN', 'SUPER_ADMIN')
  async returnToSupplier(@Body() dto: ReturnBadgesToSupplierDto, @GetUser() user: { id: string }) {
    return this.service.returnTreeToSupplier(user.id, dto);
  }

  @Post('supplier/receive-from-factory')
  @Roles('MATERIAL_SUPPLIER', 'ADMIN', 'SUPER_ADMIN')
  async receiveFromFactory(@Body() dto: ReceiveFromFactoryDto, @GetUser() user: { id: string }) {
    return this.service.supplierReceiveFromFactory(user.id, dto);
  }

  @Get('supplier/stock')
  @Roles('MATERIAL_SUPPLIER', 'ADMIN', 'SUPER_ADMIN')
  async listSupplierStock(@GetUser() user: { id: string }) {
    return this.service.listSupplierStock(user.id);
  }

  @Get('mine/packages')
  @Roles('FARMER', 'GROWER', 'PARTNER', 'ADMIN', 'SUPER_ADMIN')
  async listMyPackages(@GetUser() user: { id: string }) {
    return this.service.listGrowerPackages(user.id);
  }

  @Post('supplier/receive-from-grower')
  @Roles('MATERIAL_SUPPLIER', 'ADMIN', 'SUPER_ADMIN')
  async receiveFromGrower(@Body() dto: ReceiveReturnFromGrowerDto, @GetUser() user: { id: string }) {
    return this.service.supplierReceiveReturnFromGrower(user.id, dto);
  }

  @Post('supplier/transfer-to-grower')
  @Roles('MATERIAL_SUPPLIER', 'ADMIN', 'SUPER_ADMIN')
  async supplierTransferToGrower(@Body() dto: TransferBadgesToGrowerDto, @GetUser() user: { id: string }) {
    return this.service.supplierTransferTreeToGrower(user.id, dto);
  }
}
