import { BadRequestException, ConflictException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { sumAvailableKg } from '../catalog/catalog-stock';
import { computeMaxPacks } from '../catalog/catalog.util';
import { CreateOrderDto } from './dto/create-order.dto';

const EXCLUDED_ORDER_STATUSES: OrderStatus[] = ['CANCELLED', 'REFUNDED'];

export function currentMarketPriceWhere(now = new Date()): Prisma.market_pricesWhereInput {
  return { isActive: true, effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] };
}

export type CatalogPackPriceResult = {
  unitPrice: number;
  totalAmount: number;
  estateId?: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  catalogProductId: string;
  packOptionId: string;
  packLabel: string;
  packSizeKg: number;
  packCount: number;
  isCatalog: true;
};

/** Planned-supply catalogue order with fixed pack pricing. */
export async function resolveCatalogPackPrice(
  prisma: PrismaService | Prisma.TransactionClient,
  data: CreateOrderDto,
): Promise<CatalogPackPriceResult> {
  if (!data.packOptionId || !data.packCount) {
    throw new BadRequestException('packOptionId and packCount are required for catalogue orders');
  }
  const optionRows = await prisma.$queryRaw<Array<{ option_id: string }>>`
    SELECT o.id AS option_id
    FROM catalog_pack_options o
    INNER JOIN catalog_products p ON p.id = o."productId"
    WHERE o.id = ${data.packOptionId}
    FOR UPDATE OF p
  `;
  if (!optionRows.length) throw new BadRequestException('Pack option not found');

  const option = await prisma.catalog_pack_options.findUnique({
    where: { id: data.packOptionId },
    include: { product: true },
  });
  if (!option || !option.isActive) throw new BadRequestException('Pack option is not available');
  const product = option.product;
  if (product.status !== 'PUBLISHED') throw new BadRequestException('Product is no longer available');
  const now = new Date();
  if (product.availableFrom && product.availableFrom > now) {
    throw new BadRequestException('Product is not yet available');
  }
  if (product.availableUntil && product.availableUntil < now) {
    throw new BadRequestException('Product is no longer available');
  }

  const availableKg = await sumAvailableKg(prisma, product.id);
  const kg = new Prisma.Decimal(option.packSizeKg).mul(data.packCount).toNumber();
  if (kg > availableKg + 1e-9) {
    const maxPacks = computeMaxPacks(availableKg, option.packSizeKg);
    throw new BadRequestException(
      `Only ${availableKg} kg left — max ${maxPacks} packs of ${option.label}`,
    );
  }

  const unitPrice = new Prisma.Decimal(option.pricePerPack).div(option.packSizeKg).toDecimalPlaces(4).toNumber();
  const totalAmount = new Prisma.Decimal(option.pricePerPack).mul(data.packCount).toDecimalPlaces(2).toNumber();
  if (data.unitPrice !== unitPrice) {
    throw new ConflictException('Product price has changed. Refresh the catalogue before ordering.');
  }
  if (data.productName !== product.name || data.unit !== 'kg') {
    throw new BadRequestException('Product name or unit does not match the catalogue');
  }
  if (Math.abs(data.quantity - kg) > 1e-6) {
    throw new BadRequestException('Quantity does not match pack count');
  }

  return {
    unitPrice,
    totalAmount,
    estateId: product.estateId ?? undefined,
    productId: product.id,
    productName: product.name,
    quantity: kg,
    unit: 'kg',
    catalogProductId: product.id,
    packOptionId: option.id,
    packLabel: option.label,
    packSizeKg: option.packSizeKg,
    packCount: data.packCount,
    isCatalog: true,
  };
}

/** Resolve the same inventory / batch / market identifiers exposed by the catalogue. */
export async function resolveOrderPrice(prisma: PrismaService | Prisma.TransactionClient, data: CreateOrderDto) {
  if (data.packOptionId) {
    return resolveCatalogPackPrice(prisma, data);
  }
  const now = new Date();
  let productId = data.productId;
  if (!productId) {
    // Old mobile clients have no catalogue ID. Resolve only an unambiguous
    // server-side record; their price never becomes the source of truth.
    const estateId = data.estateId && data.estateId !== 'unknown' && !/^estate-\d+$/.test(data.estateId)
      ? data.estateId : undefined;
    const identity = { productName: data.productName, unit: data.unit, ...(estateId ? { estateId } : {}) };
    const stocks = await prisma.inventory.findMany({
      where: { ...identity, status: 'AVAILABLE', OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      select: { id: true }, take: 2,
    });
    if (stocks.length > 1) throw new BadRequestException('Select a specific product from the current catalogue');
    productId = stocks[0]?.id;
    if (!productId) {
      const batches = await prisma.batches.findMany({
        where: { ...identity, status: { in: ['PACKED', 'IN_TRANSIT', 'IN_HUB', 'QUALITY_VERIFIED'] } },
        select: { id: true }, take: 2,
      });
      if (batches.length > 1) throw new BadRequestException('Select a specific product from the current catalogue');
      productId = batches[0]?.id;
    }
    if (!productId && !estateId && data.unit === 'kg') {
      const market = await prisma.market_prices.findFirst({
        where: { cropType: data.productName, ...currentMarketPriceWhere(now) },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      });
      if (market) productId = `market-${market.id}`;
    }
    if (!productId) throw new BadRequestException('Product is no longer available');
  }
  let inventoryId: string | undefined, batchId: string | undefined;
  let product: { productName: string; unit: string; unitPrice: number; quantity: number | null; estateId?: string };
  if (productId.startsWith('market-')) {
    const market = await prisma.market_prices.findFirst({ where: { id: productId.slice(7), ...currentMarketPriceWhere(now) } });
    if (!market) throw new BadRequestException('Product is no longer available');
    product = { productName: market.cropType, unit: 'kg', unitPrice: market.sellPrice || market.buyPrice, quantity: null };
  } else {
    const stock = await prisma.inventory.findUnique({ where: { id: productId } });
    if (stock) {
      if (stock.status !== 'AVAILABLE' || (stock.expiresAt && stock.expiresAt <= now)) {
        throw new BadRequestException('Product is no longer available');
      }
      product = stock;
      inventoryId = stock.id;
    } else {
      const batch = await prisma.batches.findUnique({ where: { id: productId } });
      if (!batch || !['PACKED', 'IN_TRANSIT', 'IN_HUB', 'QUALITY_VERIFIED'].includes(batch.status)) {
        throw new BadRequestException('Product is no longer available');
      }
      product = { ...batch, unitPrice: 0 };
      batchId = batch.id;
      inventoryId = batch.inventoryId || undefined;
    }
  }
  const market = await prisma.market_prices.findFirst({
    where: { cropType: product.productName, ...currentMarketPriceWhere(now) },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
  const unitPrice = (market && (market.sellPrice || market.buyPrice)) || product.unitPrice;
  if (data.productName !== product.productName || data.unit !== product.unit) {
    throw new BadRequestException('Product name or unit does not match the catalogue');
  }
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    throw new BadRequestException('Product has no valid sale price');
  }
  if (data.unitPrice !== unitPrice) {
    throw new ConflictException('Product price has changed. Refresh the catalogue before ordering.');
  }
  if (!Number.isFinite(data.quantity) || data.quantity <= 0 || (product.quantity !== null && data.quantity > product.quantity)) {
    throw new BadRequestException('Invalid quantity or insufficient available stock');
  }
  const amount = new Prisma.Decimal(unitPrice).mul(data.quantity).toDecimalPlaces(2);
  if (amount.lte(0) || amount.mul(100).gt(Number.MAX_SAFE_INTEGER)) {
    throw new BadRequestException('Order total is outside the supported range');
  }
  return { unitPrice, totalAmount: amount.toNumber(), estateId: product.estateId, productId, inventoryId, batchId };
}
