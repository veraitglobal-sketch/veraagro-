import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CatalogService } from './catalog.service';
import { CreateCatalogProductDto } from './dto/create-catalog-product.dto';
import { UpdateCatalogProductDto } from './dto/update-catalog-product.dto';
import { CreatePackOptionDto } from './dto/create-pack-option.dto';
import { UpdatePackOptionDto } from './dto/update-pack-option.dto';
import { AdjustCatalogStockDto } from './dto/adjust-stock.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  @Get('products')
  listPublic() {
    return this.catalogService.listPublicProducts();
  }

  @Get('products/:id')
  getPublic(@Param('id') id: string) {
    return this.catalogService.getPublicProduct(id);
  }

  @Get('admin/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  listAdmin() {
    return this.catalogService.listAdminProducts();
  }

  @Get('admin/products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  getAdmin(@Param('id') id: string) {
    return this.catalogService.getAdminProduct(id);
  }

  @Post('admin/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  create(@Body() body: CreateCatalogProductDto, @Request() req: { user: { id: string } }) {
    return this.catalogService.createProduct(body, req.user.id);
  }

  @Patch('admin/products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  update(
    @Param('id') id: string,
    @Body() body: UpdateCatalogProductDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.catalogService.updateProduct(id, body, req.user.id);
  }

  @Post('admin/products/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  publish(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.catalogService.publishProduct(id, req.user.id);
  }

  @Post('admin/products/:id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  archive(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.catalogService.archiveProduct(id, req.user.id);
  }

  @Post('admin/products/:id/pack-options')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  addPackOption(
    @Param('id') id: string,
    @Body() body: CreatePackOptionDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.catalogService.addPackOption(id, body, req.user.id);
  }

  @Patch('admin/pack-options/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  updatePackOption(
    @Param('id') id: string,
    @Body() body: UpdatePackOptionDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.catalogService.updatePackOption(id, body, req.user.id);
  }

  @Get('admin/supply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  supply() {
    return this.catalogService.getSupplyOverview();
  }

  @Post('admin/products/:id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  adjustStock(
    @Param('id') id: string,
    @Body() body: AdjustCatalogStockDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.catalogService.adjustStock(id, body, req.user.id);
  }

  @Get('admin/products/:id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  stockHistory(@Param('id') id: string) {
    return this.catalogService.getStockHistory(id);
  }
}
