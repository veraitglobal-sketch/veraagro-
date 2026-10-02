import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { assertBatchFitsOrder } from '../orders/order-batch-link';
import { PrismaService } from '../prisma/prisma.service';

const include = {
  users_missions_growerIdTousers: true,
  users_missions_logisticsPartnerIdTousers: true,
  vehicles: true, batches: true, harvest_announcement: true,
  orders: { select: { id: true, orderNumber: true, productName: true, quantity: true, unit: true } },
} as const;

/** Both harvest auto-creation and grower retries use the same transaction and locks. */
export async function saveWorkflowMission(prisma: PrismaService, data: Prisma.missionsUncheckedCreateInput) {
  return prisma.$transaction(async (tx) => {
    const keys = [data.harvestAnnouncementId && `plan:${data.harvestAnnouncementId}`,
      data.batchId && `batch:${data.batchId}`, data.orderId && `order:${data.orderId}`].filter(Boolean).sort() as string[];
    for (const key of keys) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`mission-workflow:${key}`}, 0))`;
    }
    // Cancelled runs are history only — a lot/plan may get a fresh request after operations cancels one.
    const candidates = await tx.missions.findMany({
      where: { status: { not: 'CANCELLED' }, OR: [
        ...(data.harvestAnnouncementId ? [{ harvestAnnouncementId: data.harvestAnnouncementId }] : []),
        ...(data.batchId ? [{ batchId: data.batchId }] : []),
        ...(data.orderId ? [{ orderId: data.orderId }] : []),
      ] }, orderBy: { createdAt: 'desc' },
    });
    // Legacy duplicates need an explicit operational decision, never another silent duplicate.
    if (candidates.length > 1) throw new ConflictException('Multiple missions already exist for this lot/plan. Open Missions and contact operations.');
    if (candidates.length) {
      await tx.$queryRaw`SELECT id FROM missions WHERE id = ${candidates[0].id} FOR UPDATE`;
    }
    if (data.orderId) {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${data.orderId} FOR UPDATE`;
      const order = await tx.orders.findUnique({ where: { id: data.orderId }, include: { payments: true } });
      if (!order || !['PAID', 'CONFIRMED'].includes(order.status) || order.payments?.status !== 'IN_ESCROW') {
        throw new BadRequestException('Transport requires a paid order with funds held in escrow.');
      }
      if (!order.packCount || (order.packedPackCount ?? 0) < order.packCount || !order.packedBatchId || order.packedBatchId !== data.batchId) {
        throw new BadRequestException('Complete packing and use the lot recorded on this order.');
      }
      await assertBatchFitsOrder(tx, data.growerId, { ...order, orderId: order.id }, data.batchId, true);
    }
    if (candidates.length) {
      const found = candidates[0];
      const existing = await tx.missions.findUniqueOrThrow({ where: { id: found.id }, include });
      if (existing.growerId !== data.growerId) throw new ForbiddenException('Mission belongs to another grower');
      if (data.batchId && existing.batchId && existing.batchId !== data.batchId) {
        throw new ConflictException('This harvest mission already carries another lot. Open the existing mission; a separate load requires operations.');
      }
      if (data.harvestAnnouncementId && existing.harvestAnnouncementId && existing.harvestAnnouncementId !== data.harvestAnnouncementId) {
        throw new ConflictException('The lot already has a mission for a different harvest plan.');
      }
      if (data.orderId && existing.orderId && existing.orderId !== data.orderId) {
        throw new ConflictException('This mission is already linked to another order.');
      }
      const attachOrder = !!data.orderId && !existing.orderId;
      if (attachOrder && !['AWAITING_APPROVAL', 'PENDING'].includes(existing.status)) {
        throw new ConflictException('Operations must review an already dispatched mission before linking a buyer order.');
      }
      if ((data.batchId && !existing.batchId) || attachOrder) {
        if (!['AWAITING_APPROVAL', 'PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'READY_FOR_LOADING'].includes(existing.status)) {
          throw new ConflictException('A lot cannot be attached after pickup or cancellation. Open the existing mission and contact operations.');
        }
        const mission = await tx.missions.update({ where: { id: existing.id },
          data: {
            batchId: data.batchId,
            ...(attachOrder ? { orderId: data.orderId, destinationAddress: data.destinationAddress,
              destinationCity: data.destinationCity, loadInstructions: data.loadInstructions } : {}),
            pickupLocation: data.pickupLocation,
            pickupAddress: data.pickupAddress,
            // The grower has now supplied the actual pickup point. Do not keep a route
            // calculated from the plan's approximate farm centroid, or overwrite dispatch.
            optimalRoute: { waypoints: [data.pickupLocation], distance: null, duration: null,
              estimatedArrival: null, destination: { address: attachOrder ? data.destinationAddress : existing.destinationAddress, city: attachOrder ? data.destinationCity : existing.destinationCity } } as Prisma.InputJsonValue,
            updatedAt: new Date(),
          }, include });
        return { mission, created: false, attached: true };
      }
      return { mission: existing, created: false, attached: false };
    }
    if (data.harvestAnnouncementId) {
      // Older cancelled runs may still hold the (unique) plan link — free it for the new request.
      await tx.missions.updateMany({
        where: { harvestAnnouncementId: data.harvestAnnouncementId, status: 'CANCELLED' },
        data: { harvestAnnouncementId: null },
      });
    }
    return { mission: await tx.missions.create({ data, include }), created: true, attached: false };
  });
}
