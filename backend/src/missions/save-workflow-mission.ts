import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const include = {
  users_missions_growerIdTousers: true,
  users_missions_logisticsPartnerIdTousers: true,
  vehicles: true, batches: true, harvest_announcement: true,
} as const;

/** Both harvest auto-creation and grower retries use the same transaction and locks. */
export async function saveWorkflowMission(prisma: PrismaService, data: Prisma.missionsUncheckedCreateInput) {
  return prisma.$transaction(async (tx) => {
    const keys = [data.harvestAnnouncementId && `plan:${data.harvestAnnouncementId}`,
      data.batchId && `batch:${data.batchId}`].filter(Boolean).sort() as string[];
    for (const key of keys) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`mission-workflow:${key}`}, 0))`;
    }
    // Cancelled runs are history only — a lot/plan may get a fresh request after operations cancels one.
    const candidates = await tx.missions.findMany({
      where: { status: { not: 'CANCELLED' }, OR: [
        ...(data.harvestAnnouncementId ? [{ harvestAnnouncementId: data.harvestAnnouncementId }] : []),
        ...(data.batchId ? [{ batchId: data.batchId }] : []),
      ] }, orderBy: { createdAt: 'desc' },
    });
    // Legacy duplicates need an explicit operational decision, never another silent duplicate.
    if (candidates.length > 1) throw new ConflictException('Multiple missions already exist for this lot/plan. Open Missions and contact operations.');
    if (candidates.length) {
      const found = candidates[0];
      await tx.$queryRaw`SELECT id FROM missions WHERE id = ${found.id} FOR UPDATE`;
      const existing = await tx.missions.findUniqueOrThrow({ where: { id: found.id }, include });
      if (existing.growerId !== data.growerId) throw new ForbiddenException('Mission belongs to another grower');
      if (data.batchId && existing.batchId && existing.batchId !== data.batchId) {
        throw new ConflictException('This harvest mission already carries another lot. Open the existing mission; a separate load requires operations.');
      }
      if (data.harvestAnnouncementId && existing.harvestAnnouncementId && existing.harvestAnnouncementId !== data.harvestAnnouncementId) {
        throw new ConflictException('The lot already has a mission for a different harvest plan.');
      }
      if (data.batchId && !existing.batchId) {
        if (!['AWAITING_APPROVAL', 'PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'READY_FOR_LOADING'].includes(existing.status)) {
          throw new ConflictException('A lot cannot be attached after pickup or cancellation. Open the existing mission and contact operations.');
        }
        const mission = await tx.missions.update({ where: { id: existing.id },
          data: {
            batchId: data.batchId,
            pickupLocation: data.pickupLocation,
            pickupAddress: data.pickupAddress,
            // The grower has now supplied the actual pickup point. Do not keep a route
            // calculated from the plan's approximate farm centroid, or overwrite dispatch.
            optimalRoute: { waypoints: [data.pickupLocation], distance: null, duration: null,
              estimatedArrival: null, destination: { address: existing.destinationAddress, city: existing.destinationCity } } as Prisma.InputJsonValue,
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
