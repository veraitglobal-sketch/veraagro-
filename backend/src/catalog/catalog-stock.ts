import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CatalogStockMovementType, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

export async function lockCatalogProduct(
  tx: Prisma.TransactionClient,
  productId: string,
): Promise<void> {
  await tx.$queryRaw`SELECT id FROM catalog_products WHERE id = ${productId} FOR UPDATE`;
}

export async function sumAvailableKg(
  tx: Prisma.TransactionClient,
  productId: string,
): Promise<number> {
  const agg = await tx.catalog_stock_movements.aggregate({
    where: { productId },
    _sum: { quantityKg: true },
  });
  return Math.max(0, agg._sum.quantityKg ?? 0);
}

/** Net kilos reserved in live orders (−ORDER_RESERVE + ORDER_RELEASE). */
export async function sumSoldKg(
  tx: Prisma.TransactionClient,
  productId: string,
): Promise<number> {
  const rows = await tx.catalog_stock_movements.groupBy({
    by: ['type'],
    where: {
      productId,
      type: { in: ['ORDER_RESERVE', 'ORDER_RELEASE'] },
    },
    _sum: { quantityKg: true },
  });
  let net = 0;
  for (const row of rows) {
    net += row._sum.quantityKg ?? 0;
  }
  return Math.max(0, -net);
}

export async function reserveCatalogStock(
  tx: Prisma.TransactionClient,
  productId: string,
  orderId: string,
  quantityKg: number,
  actorId: string,
): Promise<void> {
  await lockCatalogProduct(tx, productId);
  const available = await sumAvailableKg(tx, productId);
  if (quantityKg > available + 1e-9) {
    throw new BadRequestException(`Only ${available} kg left on offer`);
  }
  try {
    await tx.catalog_stock_movements.create({
      data: {
        id: randomUUID(),
        productId,
        type: 'ORDER_RESERVE',
        quantityKg: -quantityKg,
        orderId,
        actorId,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new ConflictException('Order stock already reserved');
    }
    throw e;
  }
}

export async function releaseCatalogStock(
  tx: Prisma.TransactionClient,
  orderId: string,
  actorId: string,
  reason?: string,
): Promise<boolean> {
  const order = await tx.orders.findUnique({
    where: { id: orderId },
    select: { catalogProductId: true, status: true },
  });
  if (!order?.catalogProductId) return false;
  if (['PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(order.status)) {
    throw new BadRequestException('Cannot release catalogue stock after dispatch');
  }
  const reserve = await tx.catalog_stock_movements.findFirst({
    where: { orderId, type: 'ORDER_RESERVE' },
  });
  if (!reserve) return false;
  const existingRelease = await tx.catalog_stock_movements.findFirst({
    where: { orderId, type: 'ORDER_RELEASE' },
  });
  if (existingRelease) return false;
  await lockCatalogProduct(tx, reserve.productId);
  await tx.catalog_stock_movements.create({
    data: {
      id: randomUUID(),
      productId: reserve.productId,
      type: 'ORDER_RELEASE',
      quantityKg: -reserve.quantityKg,
      orderId,
      actorId,
      reason: reason?.trim() || null,
    },
  });
  return true;
}

export async function hasCatalogReserve(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<boolean> {
  const reserve = await tx.catalog_stock_movements.findFirst({
    where: { orderId, type: 'ORDER_RESERVE' },
  });
  if (!reserve) return false;
  const release = await tx.catalog_stock_movements.findFirst({
    where: { orderId, type: 'ORDER_RELEASE' },
  });
  return !release;
}

export async function adminAdjustCatalogStock(
  tx: Prisma.TransactionClient,
  productId: string,
  type: 'ADMIN_ADD' | 'ADMIN_REMOVE',
  quantityKg: number,
  actorId: string,
  reason?: string,
  batchId?: string,
): Promise<{ availableKg: number }> {
  if (!Number.isFinite(quantityKg) || quantityKg <= 0) {
    throw new BadRequestException('quantityKg must be positive');
  }
  if (type === 'ADMIN_REMOVE' && !reason?.trim()) {
    throw new BadRequestException('A reason is required when removing stock');
  }
  const product = await tx.catalog_products.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundException('Catalog product not found');
  await lockCatalogProduct(tx, productId);
  const signed = type === 'ADMIN_ADD' ? quantityKg : -quantityKg;
  if (type === 'ADMIN_REMOVE') {
    const available = await sumAvailableKg(tx, productId);
    if (quantityKg > available + 1e-9) {
      throw new BadRequestException(`Cannot remove ${quantityKg} kg — only ${available} kg on offer`);
    }
  }
  await tx.catalog_stock_movements.create({
    data: {
      id: randomUUID(),
      productId,
      type: type as CatalogStockMovementType,
      quantityKg: signed,
      reason: reason?.trim() || null,
      batchId: batchId || null,
      actorId,
    },
  });
  return { availableKg: await sumAvailableKg(tx, productId) };
}
