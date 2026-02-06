import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { MaterialControlService } from './material-control.service';
import { PurchaseMaterialDto, VerifyStickerRollDto, UploadCompliancePhotosDto, UpdateBioVeraStandardDto } from './dto/material-control.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('material-control')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaterialControlController {
  constructor(private readonly materialControlService: MaterialControlService) {}

  @Get('standard')
  @Roles('GROWER', 'LOGISTICS_PARTNER', 'COORDINATOR', 'SUPER_ADMIN')
  async getBioVeraStandard() {
    return this.materialControlService.getBioVeraStandard();
  }

  @Get('material-types')
  @Roles('GROWER', 'SUPER_ADMIN')
  async getMaterialTypeEnums() {
    return this.materialControlService.getMaterialTypeEnums();
  }

  @Put('standard')
  @Roles('SUPER_ADMIN')
  async updateBioVeraStandard(
    @Body() dto: UpdateBioVeraStandardDto,
    @GetUser() user: any,
  ) {
    return this.materialControlService.updateBioVeraStandard(user.id, dto);
  }

  @Get('balance')
  @Roles('GROWER')
  async getFarmerMaterialBalance(@GetUser() user: any) {
    return this.materialControlService.getFarmerMaterialBalance(user.id);
  }

  @Post('purchase')
  @Roles('GROWER')
  async purchaseMaterials(
    @Body() dto: PurchaseMaterialDto,
    @GetUser() user: any,
  ) {
    return this.materialControlService.purchaseMaterials(user.id, dto);
  }

  @Post('verify-sticker')
  @Roles('GROWER')
  async verifyStickerRoll(
    @Body() dto: VerifyStickerRollDto,
    @GetUser() user: any,
  ) {
    return this.materialControlService.verifyStickerRoll(user.id, dto);
  }

  @Post('compliance-photos')
  @Roles('GROWER')
  async uploadCompliancePhotos(
    @Body() dto: UploadCompliancePhotosDto,
    @GetUser() user: any,
  ) {
    return this.materialControlService.uploadCompliancePhotos(user.id, dto);
  }

  @Get('validate-batch/:batchId')
  @Roles('GROWER')
  async validateBatchForShipment(
    @Param('batchId') batchId: string,
    @GetUser() user: any,
  ) {
    return this.materialControlService.validateBatchForShipment(batchId, user.id);
  }

  @Get('material-costs/:batchId')
  @Roles('GROWER', 'COORDINATOR', 'SUPER_ADMIN')
  async calculateMaterialCosts(@Param('batchId') batchId: string) {
    return this.materialControlService.calculateMaterialCosts(batchId);
  }

  @Post('deduct-materials/:batchId')
  @Roles('GROWER', 'COORDINATOR')
  async deductMaterialsOnShipment(
    @Param('batchId') batchId: string,
    @GetUser() user: any,
  ) {
    return this.materialControlService.deductMaterialsOnShipment(batchId, user.id);
  }
}
