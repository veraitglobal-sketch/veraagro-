import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageUploadInterceptor } from '../field-entries/image-upload.interceptor';
import { B2bSuppliersService } from './b2b-suppliers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import {
  AdminCreateSupplierStoreDto,
  CreateB2bSupplierProfileDto,
  CreateDirectOrderDto,
  CreateThreadDto,
  PostMessageDto,
  UpdateOrderStatusDto,
  CreateCatalogItemDto,
  RegisterSupplierMaterialBarcodeDto,
  UpdateB2bSupplierStoreDto,
  UpdateCatalogItemDto,
  UpdateSupplierMaterialBarcodeDto,
} from './dto/b2b-suppliers.dto';

@Controller('b2b-suppliers')
export class B2bSuppliersController {
  constructor(private readonly svc: B2bSuppliersService) {}

  @Get('public/map')
  getPublicMap() {
    return this.svc.getPublicMapPins();
  }

  /** No auth — grower app / field scanner: verify supplier-registered material unit */
  @Get('public/material-barcodes/lookup')
  publicMaterialBarcode(@Query('code') code: string) {
    return this.svc.publicLookupMaterialBarcode(code);
  }

  @Get('public/:userId')
  getPublicOne(@Param('userId') userId: string) {
    return this.svc.getPublicSupplier(userId);
  }

  @Get('my/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MATERIAL_SUPPLIER')
  getMyProfile(@GetUser() u: { id: string }) {
    return this.svc.getMyProfile(u.id);
  }

  @Post('my/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MATERIAL_SUPPLIER')
  upsertMyProfile(@GetUser() u: { id: string }, @Body() dto: CreateB2bSupplierProfileDto) {
    return this.svc.upsertMyProfile(u.id, dto);
  }

  @Patch('my/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MATERIAL_SUPPLIER')
  patchMyStore(@GetUser() u: { id: string }, @Body() dto: UpdateB2bSupplierStoreDto) {
    return this.svc.updateMyStoreSettings(u.id, dto);
  }

  @Get('my/material-barcodes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MATERIAL_SUPPLIER')
  listMyMaterialBarcodes(
    @GetUser() u: { id: string },
    @Query('status') status?: string,
  ) {
    return this.svc.listMyMaterialBarcodes(u.id, status);
  }

  @Post('my/material-barcodes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MATERIAL_SUPPLIER')
  registerMaterialBarcode(
    @GetUser() u: { id: string },
    @Body() dto: RegisterSupplierMaterialBarcodeDto,
  ) {
    return this.svc.registerMaterialBarcode(u.id, dto);
  }

  @Patch('my/material-barcodes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MATERIAL_SUPPLIER')
  updateMaterialBarcode(
    @GetUser() u: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateSupplierMaterialBarcodeDto,
  ) {
    return this.svc.updateMaterialBarcode(u.id, id, dto);
  }

  @Get('my/catalog')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MATERIAL_SUPPLIER')
  listMyCatalog(@GetUser() u: { id: string }) {
    return this.svc.listMyCatalog(u.id);
  }

  @Post('my/catalog')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MATERIAL_SUPPLIER')
  createCatalogItem(@GetUser() u: { id: string }, @Body() dto: CreateCatalogItemDto) {
    return this.svc.createCatalogItem(u.id, dto);
  }

  @Patch('my/catalog/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MATERIAL_SUPPLIER')
  updateCatalogItem(
    @GetUser() u: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateCatalogItemDto,
  ) {
    return this.svc.updateCatalogItem(u.id, id, dto);
  }

  @Delete('my/catalog/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MATERIAL_SUPPLIER')
  deleteCatalogItem(@GetUser() u: { id: string }, @Param('id') id: string) {
    return this.svc.deleteCatalogItem(u.id, id);
  }

  @Post('my/catalog/:id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MATERIAL_SUPPLIER')
  @UseInterceptors(FileInterceptor('image'), ImageUploadInterceptor)
  uploadCatalogItemImage(
    @GetUser() u: { id: string },
    @Param('id') id: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number },
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }
    return this.svc.uploadCatalogItemImage(u.id, id, file);
  }

  @Delete('my/catalog/:id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MATERIAL_SUPPLIER')
  deleteCatalogItemImage(@GetUser() u: { id: string }, @Param('id') id: string) {
    return this.svc.deleteCatalogItemImage(u.id, id);
  }

  @Post('admin/create-store')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  adminCreateStore(@GetUser() u: { id: string }, @Body() dto: AdminCreateSupplierStoreDto) {
    return this.svc.adminCreateSupplierStore(u.id, dto);
  }

  @Post('admin/approve/:supplierUserId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  approve(
    @GetUser() u: { id: string },
    @Param('supplierUserId') supplierUserId: string,
  ) {
    return this.svc.approveMap(u.id, supplierUserId);
  }

  @Get('admin/network-overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  adminNetworkOverview() {
    return this.svc.adminGetNetworkOverview();
  }

  @Post('threads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GROWER', 'FARMER', 'PARTNER', 'SUPER_ADMIN', 'ADMIN')
  createThread(@GetUser() u: { id: string }, @Body() dto: CreateThreadDto) {
    return this.svc.getOrCreateThread(u.id, dto.supplierUserId);
  }

  @Get('threads/mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GROWER', 'FARMER', 'PARTNER', 'SUPER_ADMIN', 'ADMIN')
  myThreadsAsFarmer(@GetUser() u: { id: string }) {
    return this.svc.listMyThreadsAsFarmer(u.id);
  }

  @Get('threads/mine-as-supplier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MATERIAL_SUPPLIER')
  myThreadsAsSupplier(@GetUser() u: { id: string }) {
    return this.svc.listMyThreadsAsSupplier(u.id);
  }

  @Get('threads/:threadId/messages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GROWER', 'FARMER', 'PARTNER', 'MATERIAL_SUPPLIER', 'SUPER_ADMIN', 'ADMIN')
  messages(
    @GetUser() u: { id: string },
    @Param('threadId') threadId: string,
  ) {
    return this.svc.listMessages(u.id, threadId);
  }

  @Post('threads/:threadId/messages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GROWER', 'FARMER', 'PARTNER', 'MATERIAL_SUPPLIER', 'SUPER_ADMIN', 'ADMIN')
  postMessage(
    @GetUser() u: { id: string },
    @Param('threadId') threadId: string,
    @Body() dto: PostMessageDto,
  ) {
    return this.svc.postMessage(u.id, threadId, dto.body);
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GROWER', 'FARMER', 'PARTNER', 'SUPER_ADMIN', 'ADMIN')
  createOrder(@GetUser() u: { id: string }, @Body() dto: CreateDirectOrderDto) {
    return this.svc.createDirectOrder(u.id, {
      supplierUserId: dto.supplierUserId,
      items: dto.items,
      note: dto.note,
      threadId: dto.threadId,
    });
  }

  @Get('orders/mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GROWER', 'FARMER', 'PARTNER', 'SUPER_ADMIN', 'ADMIN')
  myOrdersFarmer(@GetUser() u: { id: string }) {
    return this.svc.listOrdersForFarmer(u.id);
  }

  @Get('orders/incoming')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MATERIAL_SUPPLIER')
  incomingOrders(@GetUser() u: { id: string }) {
    return this.svc.listOrdersForSupplier(u.id);
  }

  @Patch('orders/:orderId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MATERIAL_SUPPLIER')
  patchOrder(
    @GetUser() u: { id: string },
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.svc.updateOrderStatus(u.id, orderId, dto.status, dto.noteFromSupplier);
  }
}
