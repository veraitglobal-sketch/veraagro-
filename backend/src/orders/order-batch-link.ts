import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const READY_BATCH_STATUSES = ['PACKED', 'QUALITY_VERIFIED'] as const;

export type OrderBatchContext = {
  orderId: string;
  fulfillingEstateId: string;
  catalogProductId: string | null;
  productName: string;
};

/** Resolve internal batch UUID from public code or id. */
export async function resolveBatchRef(prisma: PrismaService, ref: string) {
  const trimmed = ref.trim();
  if (!trimmed) return null;
  return prisma.batches.findFirst({
    where: { OR: [{ id: trimmed }, { batchId: trimmed }] },
    include: {
      estates: { select: { id: true, ownerId: true, name: true } },
      quality_entries: { select: { status: true } },
    },
  });
}

/** Grower must own the fulfilling estate; lot must be ready with quality done. */
export async function assertBatchFitsOrder(
  prisma: PrismaService,
  growerId: string,
  order: OrderBatchContext,
  batchRef: string,
) {
  const batch = await resolveBatchRef(prisma, batchRef);
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
  return batch;
}

export async function listCompatibleBatchesForOrder(
  prisma: PrismaService,
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

  return batches
    .filter((b) => {
      const q = b.quality_entries?.status;
      return q && ['COMPLETED', 'VERIFIED'].includes(q);
    })
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
