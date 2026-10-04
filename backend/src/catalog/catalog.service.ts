import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { durableImage } from '../common/durable-image';
import { CreateCatalogProductDto } from './dto/create-catalog-product.dto';
import { UpdateCatalogProductDto } from './dto/update-catalog-product.dto';
import { CreatePackOptionDto } from './dto/create-pack-option.dto';
import { UpdatePackOptionDto } from './dto/update-pack-option.dto';
import { adminAdjustCatalogStock, sumAvailableKg, sumSoldKg } from './catalog-stock';
import { AdjustCatalogStockDto } from './dto/adjust-stock.dto';
import { computeMaxPacks } from './catalog.util';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  private async audit(
    entityId: string,
    actor: string | undefined,
    action: string,
    newValue: Record<string, unknown>,
    oldValue?: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.audit_trails.create({
      data: {
        id: crypto.randomUUID(),
        eventType: 'STATUS_CHANGE',
        entityType: 'CatalogProduct',
        entityId,
        performedByUserId: actor ?? null,
        oldValue: oldValue ? (oldValue as Prisma.InputJsonValue) : undefined,
        newValue: { action, ...newValue } as Prisma.InputJsonValue,
      },
    });
  }

  private async stockMetrics(productId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    const [availableKg, soldKg] = await Promise.all([
      sumAvailableKg(db, productId),
      sumSoldKg(db, productId),
    ]);
    return { availableKg, soldKg };
  }

  private isWithinWindow(
    availableFrom: Date | null,
    availableUntil: Date | null,
    now = new Date(),
  ): boolean {
    if (availableFrom && availableFrom > now) return false;
    if (availableUntil && availableUntil < now) return false;
    return true;
  }

  private enrichPackOptions(
    options: Array<{
      id: string;
      label: string;
      packSizeKg: number;
      pricePerPack: number;
      isActive: boolean;
      sortOrder: number;
    }>,
    availableKg: number,
  ) {
    return options
      .filter((o) => o.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.packSizeKg - b.packSizeKg)
      .map((o) => ({
        ...o,
        pricePerKg: Number((o.pricePerPack / o.packSizeKg).toFixed(4)),
        maxPacks: computeMaxPacks(availableKg, o.packSizeKg),
      }));
  }

  private async mapAdminProduct(
    product: Prisma.catalog_productsGetPayload<{
      include: {
        estate: { select: { id: true; name: true } };
        packOptions: true;
        _count: { select: { orders: true } };
      };
    }>,
  ) {
    const { availableKg, soldKg } = await this.stockMetrics(product.id);
    return {
      ...product,
      availableKg,
      soldKg,
      orderCount: product._count.orders,
      packOptions: product.packOptions
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((o) => ({
          ...o,
          pricePerKg: Number((o.pricePerPack / o.packSizeKg).toFixed(4)),
          maxPacks: computeMaxPacks(availableKg, o.packSizeKg),
        })),
    };
  }

  async listAdminProducts() {
    const rows = await this.prisma.catalog_products.findMany({
      include: {
        estate: { select: { id: true, name: true } },
        packOptions: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { orders: true } },
      },
      orderBy: [{ updatedAt: 'desc' }],
    });
    return Promise.all(rows.map((p) => this.mapAdminProduct(p)));
  }

  async getAdminProduct(id: string) {
    const product = await this.prisma.catalog_products.findUnique({
      where: { id },
      include: {
        estate: { select: { id: true, name: true } },
        packOptions: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { orders: true } },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: {
            users: { select: { id: true, firstName: true, lastName: true, partnerCode: true } },
          },
        },
      },
    });
    if (!product) throw new NotFoundException('Catalog product not found');
    const { availableKg, soldKg } = await this.stockMetrics(product.id);
    return {
      ...product,
      availableKg,
      soldKg,
      orderCount: product._count.orders,
      packOptions: product.packOptions.map((o) => ({
        ...o,
        pricePerKg: Number((o.pricePerPack / o.packSizeKg).toFixed(4)),
        maxPacks: computeMaxPacks(availableKg, o.packSizeKg),
      })),
      orders: product.orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        buyer: o.users,
        packLabel: o.packLabel,
        packCount: o.packCount,
        packSizeKg: o.packSizeKg,
        quantity: o.quantity,
        totalAmount: o.totalAmount,
        status: o.status,
        createdAt: o.createdAt,
      })),
    };
  }

  async createProduct(dto: CreateCatalogProductDto, actorId?: string) {
    let imageUrl = dto.imageUrl;
    if (imageUrl?.startsWith('data:image/')) {
      imageUrl = await durableImage(imageUrl);
    }
    const product = await this.prisma.catalog_products.create({
      data: {
        name: dto.name.trim(),
        variety: dto.variety?.trim() || null,
        category: dto.category?.trim() || null,
        description: dto.description?.trim() || null,
        storageConditions: dto.storageConditions?.trim() || null,
        imageUrl: imageUrl || null,
        estateId: dto.estateId || null,
        sourcePlantingId: dto.sourcePlantingId || null,
        plannedQuantityKg: dto.plannedQuantityKg,
        availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : null,
        availableUntil: dto.availableUntil ? new Date(dto.availableUntil) : null,
        status: 'DRAFT',
        createdBy: actorId ?? null,
      },
      include: {
        estate: { select: { id: true, name: true } },
        packOptions: true,
        _count: { select: { orders: true } },
      },
    });
    await this.audit(product.id, actorId, 'CREATE', { name: product.name, status: product.status });
    return this.mapAdminProduct(product);
  }

  async updateProduct(id: string, dto: UpdateCatalogProductDto, actorId?: string) {
    const existing = await this.prisma.catalog_products.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Catalog product not found');
    let imageUrl = dto.imageUrl;
    if (imageUrl?.startsWith('data:image/')) {
      imageUrl = await durableImage(imageUrl);
    }
    const product = await this.prisma.catalog_products.update({
      where: { id },
      data: {
        ...(dto.name != null ? { name: dto.name.trim() } : {}),
        ...(dto.variety !== undefined ? { variety: dto.variety?.trim() || null } : {}),
        ...(dto.category !== undefined ? { category: dto.category?.trim() || null } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.storageConditions !== undefined
          ? { storageConditions: dto.storageConditions?.trim() || null }
          : {}),
        ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}),
        ...(dto.estateId !== undefined ? { estateId: dto.estateId || null } : {}),
        ...(dto.sourcePlantingId !== undefined ? { sourcePlantingId: dto.sourcePlantingId || null } : {}),
        ...(dto.plannedQuantityKg != null ? { plannedQuantityKg: dto.plannedQuantityKg } : {}),
        ...(dto.availableFrom !== undefined
          ? { availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : null }
          : {}),
        ...(dto.availableUntil !== undefined
          ? { availableUntil: dto.availableUntil ? new Date(dto.availableUntil) : null }
          : {}),
        updatedAt: new Date(),
        updatedBy: actorId ?? null,
      },
      include: {
        estate: { select: { id: true, name: true } },
        packOptions: true,
        _count: { select: { orders: true } },
      },
    });
    await this.audit(id, actorId, 'UPDATE', { changes: dto }, { name: existing.name, plannedQuantityKg: existing.plannedQuantityKg });
    return this.mapAdminProduct(product);
  }

  private async assertGrowerOwnsProduct(userId: string, productId: string) {
    const product = await this.prisma.catalog_products.findUnique({
      where: { id: productId },
      include: { estate: { select: { ownerId: true } } },
    });
    if (!product) throw new NotFoundException('Catalog product not found');
    if (!product.estateId || product.estate?.ownerId !== userId) {
      throw new ForbiddenException('You can only manage products on your own farm');
    }
    return product;
  }

  async listGrowerProducts(userId: string) {
    const products = await this.prisma.catalog_products.findMany({
      where: { estate: { ownerId: userId }, status: { not: 'ARCHIVED' } },
      include: {
        estate: { select: { id: true, name: true } },
        source_planting: { select: { id: true, cropType: true, estimatedDate: true } },
        packOptions: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return products;
  }

  async createGrowerProduct(userId: string, dto: CreateCatalogProductDto) {
    if (!dto.estateId) throw new BadRequestException('estateId is required');
    const estate = await this.prisma.estates.findFirst({ where: { id: dto.estateId, ownerId: userId } });
    if (!estate) throw new ForbiddenException('Estate not found or access denied');
    if (dto.sourcePlantingId) {
      const planting = await this.prisma.harvest_announcements.findFirst({
        where: { id: dto.sourcePlantingId, userId, announcementType: 'PLANTING', parcel: { estateId: dto.estateId } },
      });
      if (!planting) throw new BadRequestException('sourcePlantingId must be your planting announcement');
    }
    return this.createProduct({ ...dto, estateId: dto.estateId }, userId);
  }

  async updateGrowerProduct(userId: string, id: string, dto: UpdateCatalogProductDto) {
    await this.assertGrowerOwnsProduct(userId, id);
    if (dto.estateId === null) throw new BadRequestException('Estate is required');
    const product = await this.prisma.catalog_products.findUniqueOrThrow({ where: { id } });
    const estateId = dto.estateId ?? product.estateId;
    if (!estateId || !await this.prisma.estates.findFirst({ where: { id: estateId, ownerId: userId } })) {
      throw new ForbiddenException('Estate not found or access denied');
    }
    const sourcePlantingId = dto.sourcePlantingId === undefined ? product.sourcePlantingId : dto.sourcePlantingId;
    if (sourcePlantingId) {
      const planting = await this.prisma.harvest_announcements.findFirst({
        where: { id: sourcePlantingId, userId, announcementType: 'PLANTING', parcel: { estateId } },
      });
      if (!planting) throw new BadRequestException('sourcePlantingId must be your planting announcement');
    }
    return this.updateProduct(id, dto, userId);
  }

  async getGrowerProduct(userId: string, id: string) {
    await this.assertGrowerOwnsProduct(userId, id);
    return this.getAdminProduct(id);
  }

  async publishProduct(id: string, actorId?: string) {
    const product = await this.prisma.catalog_products.findUnique({
      where: { id },
      include: { packOptions: { where: { isActive: true } } },
    });
    if (!product) throw new NotFoundException('Catalog product not found');
    if (!product.name.trim()) throw new BadRequestException('Product name is required');
    if (product.packOptions.length === 0) {
      throw new BadRequestException('At least one active pack option is required');
    }
    const availableKg = await sumAvailableKg(this.prisma, id);
    if (availableKg <= 0) throw new BadRequestException('Add stock before publishing');
    if (!product.availableUntil || product.availableUntil <= new Date()) {
      throw new BadRequestException('Set an available-until date in the future before publishing');
    }
    const updated = await this.prisma.catalog_products.update({
      where: { id },
      data: { status: 'PUBLISHED', updatedAt: new Date() },
      include: {
        estate: { select: { id: true, name: true } },
        packOptions: true,
        _count: { select: { orders: true } },
      },
    });
    await this.audit(id, actorId, 'PUBLISH', { status: 'PUBLISHED' }, { status: product.status });
    return this.mapAdminProduct(updated);
  }

  async archiveProduct(id: string, actorId?: string) {
    const product = await this.prisma.catalog_products.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Catalog product not found');
    const updated = await this.prisma.catalog_products.update({
      where: { id },
      data: { status: 'ARCHIVED', updatedAt: new Date() },
      include: {
        estate: { select: { id: true, name: true } },
        packOptions: true,
        _count: { select: { orders: true } },
      },
    });
    await this.audit(id, actorId, 'ARCHIVE', { status: 'ARCHIVED' }, { status: product.status });
    return this.mapAdminProduct(updated);
  }

  async addPackOption(productId: string, dto: CreatePackOptionDto, actorId?: string) {
    const product = await this.prisma.catalog_products.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Catalog product not found');
    const option = await this.prisma.catalog_pack_options.create({
      data: {
        productId,
        label: dto.label.trim(),
        packSizeKg: dto.packSizeKg,
        pricePerPack: dto.pricePerPack,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    await this.audit(productId, actorId, 'PACK_OPTION_ADD', { packOptionId: option.id, label: option.label, pricePerPack: option.pricePerPack });
    return option;
  }

  async updatePackOption(id: string, dto: UpdatePackOptionDto, actorId?: string) {
    const existing = await this.prisma.catalog_pack_options.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pack option not found');
    const orderCount = await this.prisma.orders.count({ where: { packOptionId: id } });
    if (orderCount > 0) {
      const allowed = ['isActive', 'sortOrder', 'pricePerPack'] as const;
      const keys = Object.keys(dto).filter((k) => dto[k as keyof UpdatePackOptionDto] !== undefined);
      const disallowed = keys.filter((k) => !allowed.includes(k as typeof allowed[number]));
      if (disallowed.length > 0) {
        throw new BadRequestException(
          'This pack option has orders — only active flag, sort order and price may change',
        );
      }
    }
    const updated = await this.prisma.catalog_pack_options.update({
      where: { id },
      data: {
        ...(dto.label != null ? { label: dto.label.trim() } : {}),
        ...(dto.packSizeKg != null ? { packSizeKg: dto.packSizeKg } : {}),
        ...(dto.pricePerPack != null ? { pricePerPack: dto.pricePerPack } : {}),
        ...(dto.isActive != null ? { isActive: dto.isActive } : {}),
        ...(dto.sortOrder != null ? { sortOrder: dto.sortOrder } : {}),
        updatedAt: new Date(),
      },
    });
    if (dto.pricePerPack != null && dto.pricePerPack !== existing.pricePerPack) {
      await this.audit(
        existing.productId,
        actorId,
        'PACK_PRICE_CHANGE',
        { packOptionId: id, pricePerPack: dto.pricePerPack },
        { pricePerPack: existing.pricePerPack },
      );
    }
    return updated;
  }

  async listPublicProducts() {
    const now = new Date();
    const products = await this.prisma.catalog_products.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        estate: {
          select: {
            id: true,
            name: true,
            users: { select: { productionCountry: true } },
          },
        },
        packOptions: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
    const result = [];
    for (const p of products) {
      if (!this.isWithinWindow(p.availableFrom, p.availableUntil, now)) continue;
      const availableKg = await sumAvailableKg(this.prisma, p.id);
      if (availableKg <= 0) continue;
      const packOptions = this.enrichPackOptions(p.packOptions, availableKg).filter((o) => o.maxPacks > 0);
      if (packOptions.length === 0) continue;
      result.push({
        id: p.id,
        productName: p.name,
        name: p.name,
        category: p.category,
        description: p.description,
        imageUrl: p.imageUrl,
        unit: 'kg',
        quantity: availableKg,
        availableKg,
        plannedQuantityKg: p.plannedQuantityKg,
        availableFrom: p.availableFrom,
        availableUntil: p.availableUntil,
        estate: p.estate
          ? {
              id: p.estate.id,
              name: p.estate.name,
              city: p.estate.users?.productionCountry?.trim() || null,
            }
          : null,
        catalogProduct: true,
        packOptions,
      });
    }
    return result;
  }

  async getPublicProduct(id: string) {
    const now = new Date();
    const p = await this.prisma.catalog_products.findUnique({
      where: { id },
      include: {
        estate: { select: { id: true, name: true } },
        packOptions: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!p || p.status !== 'PUBLISHED') throw new NotFoundException('Product not found');
    if (!this.isWithinWindow(p.availableFrom, p.availableUntil, now)) {
      throw new NotFoundException('Product not available');
    }
    const availableKg = await sumAvailableKg(this.prisma, p.id);
    if (availableKg <= 0) throw new NotFoundException('Product sold out');
    const packOptions = this.enrichPackOptions(p.packOptions, availableKg).filter((o) => o.maxPacks > 0);
    if (packOptions.length === 0) throw new NotFoundException('No pack options available');
    return {
      id: p.id,
      productName: p.name,
      name: p.name,
      category: p.category,
      description: p.description,
      imageUrl: p.imageUrl,
      unit: 'kg',
      quantity: availableKg,
      availableKg,
      plannedQuantityKg: p.plannedQuantityKg,
      availableFrom: p.availableFrom,
      availableUntil: p.availableUntil,
      estate: p.estate,
      catalogProduct: true,
      packOptions,
    };
  }

  async adjustStock(productId: string, dto: AdjustCatalogStockDto, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const result = await adminAdjustCatalogStock(
        tx,
        productId,
        dto.type,
        dto.quantityKg,
        actorId,
        dto.reason,
        dto.batchId,
      );
      await this.audit(productId, actorId, dto.type, {
        quantityKg: dto.quantityKg,
        reason: dto.reason ?? null,
        availableKg: result.availableKg,
      });
      return result;
    });
  }

  async getStockHistory(productId: string) {
    const product = await this.prisma.catalog_products.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Catalog product not found');
    const movements = await this.prisma.catalog_stock_movements.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
    });
    const orderIds = movements.map((m) => m.orderId).filter(Boolean) as string[];
    const orders = orderIds.length
      ? await this.prisma.orders.findMany({
          where: { id: { in: orderIds } },
          select: { id: true, orderNumber: true },
        })
      : [];
    const orderMap = new Map(orders.map((o) => [o.id, o.orderNumber]));
    const batchIds = movements.map((m) => m.batchId).filter(Boolean) as string[];
    const batches = batchIds.length
      ? await this.prisma.batches.findMany({
          where: { id: { in: batchIds } },
          select: { id: true, batchId: true },
        })
      : [];
    const batchMap = new Map(batches.map((b) => [b.id, b.batchId]));
    let balance = 0;
    const history = movements.map((m) => {
      balance += m.quantityKg;
      return {
        id: m.id,
        createdAt: m.createdAt,
        type: m.type,
        quantityKg: m.quantityKg,
        runningBalanceKg: balance,
        orderNumber: m.orderId ? orderMap.get(m.orderId) ?? null : null,
        orderId: m.orderId,
        batchId: m.batchId ? batchMap.get(m.batchId) ?? m.batchId : null,
        reason: m.reason,
        actorId: m.actorId,
      };
    });
    const { availableKg, soldKg } = await this.stockMetrics(productId);
    return {
      productId,
      plannedQuantityKg: product.plannedQuantityKg,
      availableKg,
      soldKg,
      history: history.reverse(),
    };
  }

  async getSupplyOverview() {
    const announcements = await this.prisma.harvest_announcements.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, partnerCode: true } },
        parcel: {
          include: {
            estates: { select: { id: true, name: true } },
          },
        },
        batches: { select: { id: true, batchId: true, status: true, quantity: true } },
        growth_logs: { select: { id: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: [{ estimatedDate: 'asc' }],
    });
    const catalogByPlanting = await this.prisma.catalog_products.findMany({
      where: { sourcePlantingId: { not: null } },
      select: { id: true, sourcePlantingId: true, plannedQuantityKg: true, status: true },
    });
    const plantingCatalogMap = new Map<string, typeof catalogByPlanting>();
    for (const cp of catalogByPlanting) {
      if (!cp.sourcePlantingId) continue;
      const list = plantingCatalogMap.get(cp.sourcePlantingId) ?? [];
      list.push(cp);
      plantingCatalogMap.set(cp.sourcePlantingId, list);
    }

    let totalExpectedKg = 0;
    let totalHarvestedKg = 0;
    let totalInProductsKg = 0;

    const parcelIds = [
      ...new Set(announcements.map((a) => a.parcelId).filter(Boolean)),
    ] as string[];
    const plantedByParcel = new Map<
      string,
      { count: number; lots: string[]; serials: string[] }
    >();
    if (parcelIds.length) {
      const planted = await this.prisma.seeds.findMany({
        where: { plantedParcelId: { in: parcelIds }, productionRunId: { not: null } },
        include: { productionRun: { select: { lotNumber: true } } },
      });
      for (const bag of planted) {
        const pid = bag.plantedParcelId!;
        const row = plantedByParcel.get(pid) ?? { count: 0, lots: [], serials: [] };
        row.count += 1;
        if (bag.productionRun?.lotNumber && !row.lots.includes(bag.productionRun.lotNumber)) {
          row.lots.push(bag.productionRun.lotNumber);
        }
        row.serials.push(bag.serialNumber);
        plantedByParcel.set(pid, row);
      }
    }

    const rows = announcements.map((a) => {
      const expectedKg =
        a.estimatedQuantity ??
        a.loadQuantityKg ??
        (a.announcementType === 'PLANTING' ? a.estimatedQuantity : null) ??
        0;
      const harvestedKg = a.batches.reduce((sum, b) => sum + (b.quantity ?? 0), 0);
      const linkedProducts = plantingCatalogMap.get(a.id) ?? [];
      const inProductsKg = linkedProducts.reduce((sum, cp) => sum + cp.plannedQuantityKg, 0);
      const catalogProductId = linkedProducts[0]?.id ?? null;

      if (a.announcementType === 'PLANTING' || a.announcementType === 'HARVEST') {
        totalExpectedKg += expectedKg ?? 0;
        totalHarvestedKg += harvestedKg;
        totalInProductsKg += inProductsKg;
      }

      const derivedStatus = (() => {
        if (catalogProductId) return 'IN_CATALOGUE';
        if (a.batches.length > 0) {
          const delivered = a.batches.some((b) =>
            ['DELIVERED', 'COMPLETED', 'IN_TRANSIT', 'AT_HUB'].includes(String(b.status)),
          );
          if (delivered || harvestedKg > 0) return 'HARVESTED';
          return 'LOT_CREATED';
        }
        if (harvestedKg > 0) return 'HARVESTED';
        return 'PLANNED';
      })();

      return {
        id: a.id,
        announcementType: a.announcementType,
        cropType: a.cropType,
        plantingDate: a.announcementType === 'PLANTING' ? a.estimatedDate : a.sourcePlantingId ? null : a.estimatedDate,
        expectedHarvestDate: a.estimatedDate,
        expectedKg: expectedKg ?? null,
        harvestedKg,
        inProductsKg,
        unallocatedKg: Math.max(0, (expectedKg ?? 0) - inProductsKg),
        status: a.status,
        derivedStatus,
        marketChannel: a.marketChannel,
        qualityGrade: a.qualityGrade,
        catalogProductId,
        grower: a.user
          ? {
              name: [a.user.firstName, a.user.lastName].filter(Boolean).join(' ').trim(),
              partnerCode: a.user.partnerCode,
            }
          : null,
        farm: a.parcel?.estates
          ? { id: a.parcel.estates.id, name: a.parcel.estates.name }
          : null,
        parcel: a.parcel
          ? {
              id: a.parcel.id,
              name: a.parcel.cropType ?? a.cropType,
              area: a.parcel.calculatedArea,
              crop: a.parcel.cropType ?? a.cropType,
              bioStatus: a.parcel.status,
            }
          : null,
        lots: a.batches.map((b) => ({
          batchId: b.batchId,
          id: b.id,
          status: b.status,
          kg: b.quantity,
        })),
        latestGrowthPhotoAt: a.growth_logs[0]?.createdAt ?? null,
        bioVeraSeed: a.parcelId && plantedByParcel.has(a.parcelId)
          ? {
              bagCount: plantedByParcel.get(a.parcelId)!.count,
              lots: plantedByParcel.get(a.parcelId)!.lots,
              serials: plantedByParcel.get(a.parcelId)!.serials,
            }
          : null,
      };
    });

    return {
      stats: {
        totalExpectedKg,
        totalHarvestedKg,
        totalInProductsKg,
        totalUnallocatedKg: Math.max(0, totalExpectedKg - totalInProductsKg),
      },
      rows,
    };
  }
}
