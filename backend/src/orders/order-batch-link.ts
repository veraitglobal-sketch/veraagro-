import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const READY_BATCH_STATUSES = ['PACKED', 'QUALITY_VERIFIED'] as const;

export type OrderBatchContext = {
  orderId: string;
  fulfillingEstateId: string;
  catalogProductId: string | null;
  productName: string;
  quantity: number;
  unit: string;
};

/** Resolve internal batch UUID from public code or id. */
export async function resolveBatchRef(prisma: PrismaService | Prisma.TransactionClient, ref: string) {
  const trimmed = ref.trim();
  if (!trimmed) return null;
  return prisma.batches.findFirst({
    where: { OR: [{ id: trimmed }, { batchId: trimmed }] },
    include: {
      estates: { select: { id: true, ownerId: true, name: true } },
      quality_entries: { select: { status: true } },
      harvest_announcement: { select: { sourcePlantingId: true } },
    },
  });
}

/** Grower must own the fulfilling estate; lot must be ready with quality done. */
export async function assertBatchFitsOrder(
  prisma: PrismaService | Prisma.TransactionClient,
  growerId: string,
  order: OrderBatchContext,
  batchRef: string,
  lock = false,
) {
  let batch = await resolveBatchRef(prisma, batchRef);
  if (batch && lock) {
    await prisma.$queryRaw`SELECT id FROM batches WHERE id = ${batch.id} FOR UPDATE`;
    batch = await resolveBatchRef(prisma, batchRef);
  }
  if (!batch) throw new NotFoundException('Lot not found');
  if (batch.estates.ownerId !== growerId) {
    throw new BadRequestException('This lot belongs to another grower.');
  }
  if (order.fulfillingEstateId && batch.estateId !== order.fulfillingEstateId) {
    throw new BadRequestException('Choose a lot from the farm that fulfils this order.');
  }
  if (!READY_BATCH_STATUSES.includes(batch.status as (typeof READY_BATCH_STATUSES)[number])) {
    throw new BadRequestException(
      'Lot must be PACKED or QUALITY_VERIFIED before it can be linked to this order.',
    );
  }
  const qStatus = batch.quality_entries?.status;
  if (!qStatus || !['COMPLETED', 'VERIFIED'].includes(qStatus)) {
    throw new BadRequestException(
      'Complete the quality entry for this lot before packing or transport (Quality entry → verify).',
    );
  }
  if (batch.productName.trim().toLocaleLowerCase() !== order.productName.trim().toLocaleLowerCase() || batch.unit !== order.unit) {
    throw new BadRequestException('Choose a lot with the same product and unit as the order.');
  }
  const product = order.catalogProductId ? await prisma.catalog_products.findUnique({
    where: { id: order.catalogProductId }, select: { sourcePlantingId: true },
  }) : null;
  if (product?.sourcePlantingId && batch.harvest_announcement?.sourcePlantingId !== product.sourcePlantingId && batch.harvestAnnouncementId !== product.sourcePlantingId) {
    throw new BadRequestException('This lot does not originate from the planting sold by this catalogue product.');
  }
  // Count each other order once, whether it is linked through packing or a legacy line.
  const allocations = await prisma.orders.findMany({
    where: { id: { not: order.orderId }, status: { notIn: ['CANCELLED', 'REFUNDED'] },
      OR: [{ packedBatchId: batch.id }, { order_items: { some: { batchId: batch.id } } }] },
    select: { quantity: true },
  });
  const allocated = allocations.reduce((sum, row) => sum + row.quantity, 0);
  if (!Number.isFinite(order.quantity) || order.quantity <= 0 || batch.quantity - allocated + 1e-9 < order.quantity) {
    throw new BadRequestException('The lot has insufficient unallocated quantity for this order.');
  }
  return batch;
}

export async function listCompatibleBatchesForOrder(
  prisma: PrismaService | Prisma.TransactionClient,
  growerId: string,
  orderId: string,
) {
  const order = await prisma.orders.findFirst({
    where: { id: orderId, fulfilling_estate: { ownerId: growerId } },
    select: {
      id: true,
      fulfillingEstateId: true,
      catalogProductId: true,
      productName: true,
      packedBatchId: true,
      quantity: true, unit: true,
    },
  });
  if (!order?.fulfillingEstateId) return [];

  const batches = await prisma.batches.findMany({
    where: {
      estateId: order.fulfillingEstateId,
      status: { in: [...READY_BATCH_STATUSES] },
    },
    include: {
      quality_entries: { select: { status: true } },
    },
    orderBy: { harvestDate: 'desc' },
    take: 50,
  });

  const compatible = [];
  for (const batch of batches) {
    try {
      compatible.push(await assertBatchFitsOrder(prisma, growerId, { ...order, orderId: order.id }, batch.id));
    } catch (e) {
      if (!(e instanceof BadRequestException)) throw e;
    }
  }
  return compatible
    .map((b) => ({
      id: b.id,
      batchId: b.batchId,
      productName: b.productName,
      quantity: b.quantity,
      unit: b.unit,
      status: b.status,
      harvestDate: b.harvestDate,
      selected: b.id === order.packedBatchId,
    }));
}
