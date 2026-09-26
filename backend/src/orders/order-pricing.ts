import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

export function currentMarketPriceWhere(now = new Date()): Prisma.market_pricesWhereInput {
  return { isActive: true, effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] };
}

/** Resolve the same inventory / batch / market identifiers exposed by the catalogue. */
export async function resolveOrderPrice(prisma: PrismaService | Prisma.TransactionClient, data: CreateOrderDto) {
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
