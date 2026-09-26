import { issueOrderStock, requireOrderStock } from '../orders/order-stock';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, MissionStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const states: Partial<Record<MissionStatus, 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT'>> = {
  ASSIGNED: 'ASSIGNED', ACCEPTED: 'ASSIGNED', IN_PROGRESS: 'ASSIGNED', READY_FOR_LOADING: 'ASSIGNED',
  PICKED_UP: 'PICKED_UP', IN_TRANSIT: 'IN_TRANSIT',
};

/** Dispatch explicitly selects an order: never infer the buyer from the newest mission/lot. */
export async function linkMissionDelivery(db: PrismaService, actor: string, missionId: string, orderId: string) {
  return db.$transaction(async (tx) => {
    // All linkage/lifecycle operations lock the mission before the order.
    await tx.$queryRaw`SELECT id FROM missions WHERE id = ${missionId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
    const mission = await tx.missions.findUnique({ where: { id: missionId }, include: { batches: true } });
    const order = await tx.orders.findUnique({ where: { id: orderId }, include: { estates: true, fulfilling_estate: true, payments: true, order_items: true } });
    if (!mission || !order) throw new NotFoundException('Mission or order not found');
    const existing = await tx.deliveries.findUnique({ where: { orderId } });
    if (existing?.missionId === missionId && mission.orderId === orderId) return existing;
    if (mission.orderId && mission.orderId !== orderId) throw new ConflictException('Mission belongs to another order');
    if (existing?.missionId) throw new ConflictException('Order already has a linked delivery');
    if (await tx.missions.findFirst({ where: { orderId, id: { not: missionId }, status: { not: 'CANCELLED' } } })) {
      throw new ConflictException('Another mission already fulfills this order. Resolve that assignment first.');
    }
    const status = states[mission.status];
    if (!status || !mission.logisticsPartnerId) throw new BadRequestException('Assign logistics to an active mission first');
    const orderRank = { PAID: 0, CONFIRMED: 1, PICKED_UP: 2, IN_TRANSIT: 3 };
    const targetRank = { ASSIGNED: 1, PICKED_UP: 2, IN_TRANSIT: 3 };
    if ((orderRank[order.status] || 0) > targetRank[status]) throw new ConflictException('Order is further along than this mission');
    const carrier = await tx.users.findUnique({ where: { id: mission.logisticsPartnerId }, select: { status: true } });
    if (carrier?.status !== 'ACTIVE') throw new BadRequestException('Assigned logistics account is not active');
    if (!['PAID', 'CONFIRMED', 'PICKED_UP', 'IN_TRANSIT'].includes(order.status) || order.payments?.status !== 'IN_ESCROW') {
      throw new BadRequestException('Order must be paid and held in escrow, before receipt');
    }
    const estate = order.fulfilling_estate || order.estates;
    if (!estate || estate.ownerId !== mission.growerId || (mission.batches && mission.batches.estateId !== estate.id)) {
      throw new BadRequestException('Mission and order must belong to the same fulfilling farm');
    }
    if (order.order_items.some((item) => item.batchId && item.batchId !== mission.batchId)) {
      throw new BadRequestException('Order contains a different lot; this link supports one mission and lot per delivery');
    }
    if (existing && (existing.driverId !== mission.logisticsPartnerId || existing.status !== status)) {
      throw new ConflictException('Existing delivery driver/status differs from the mission; resolve it before linking');
    }
    await requireOrderStock(tx, orderId);
    if (status !== 'ASSIGNED') await issueOrderStock(tx, orderId, actor);
    const now = new Date();
    const id = randomUUID();
    const delivery = existing
      ? await tx.deliveries.update({ where: { id: existing.id }, data: { missionId, updatedAt: now } })
      : await tx.deliveries.create({ data: {
        id, missionId, orderId, driverId: mission.logisticsPartnerId, deliveryNumber: `DEL-${id}`, deliveryQRCode: `DELIVERY-${randomUUID()}`,
        status, pickupLocation: mission.pickupLocation, pickupAddress: mission.pickupAddress,
        deliveryLocation: order.deliveryAddress, deliveryAddress: JSON.stringify(order.deliveryAddress),
        assignedAt: mission.assignedAt || now, pickedUpAt: mission.pickedUpAt,
        inTransitAt: status === 'IN_TRANSIT' ? now : null, updatedAt: now,
      } });
    const address = order.deliveryAddress as Record<string, unknown>;
    const destination = typeof address === 'object' && address ? Object.values(address).filter((v) => typeof v === 'string').join(', ') : String(address);
    await tx.missions.update({ where: { id: missionId }, data: { orderId, destinationAddress: destination,
      destinationCity: typeof address?.city === 'string' ? address.city : null,
      optimalRoute: Prisma.DbNull, updatedAt: now } });
    await tx.orders.update({ where: { id: orderId }, data: { status: status === 'ASSIGNED' ? 'CONFIRMED' : status, updatedAt: now } });
    await tx.audit_trails.create({ data: { id: randomUUID(), eventType: 'STATUS_CHANGE', entityType: 'Delivery', entityId: delivery.id,
      performedByUserId: actor, newValue: { action: 'LINK_MISSION', missionId, orderId, driverId: delivery.driverId } } });
    return delivery;
  });
}

/** Called inside the mission transition transaction; arrival is not buyer acceptance. */
export async function syncMissionDelivery(tx: Prisma.TransactionClient, mission: { id: string; orderId: string | null; logisticsPartnerId: string | null }, step: string, at: Date) {
  if (!mission.orderId) return;
  const delivery = await tx.deliveries.findUnique({ where: { missionId: mission.id } });
  if (!delivery || delivery.orderId !== mission.orderId || delivery.driverId !== mission.logisticsPartnerId) {
    throw new BadRequestException('Operations must link this mission to its buyer delivery before departure');
  }
  await tx.$queryRaw`SELECT id FROM orders WHERE id = ${mission.orderId} FOR UPDATE`;
  const order = await tx.orders.findUniqueOrThrow({ where: { id: mission.orderId } });
  if (['CANCELLED', 'REFUNDED'].includes(order.status)) throw new BadRequestException('Order is cancelled or refunded');
  if (['DELIVERED', 'COMPLETED'].includes(order.status)) return;
  if (step === 'DEPART_FARM') await issueOrderStock(tx, order.id, mission.logisticsPartnerId!);
  else {
    const reservation = await tx.order_stock_reservations.findUnique({ where: { orderId: order.id } });
    if (reservation && reservation.status !== 'ISSUED') throw new BadRequestException('Record stock issue at departure first');
  }
  const target = step === 'DEPART_FARM' ? 'PICKED_UP' : 'IN_TRANSIT';
  const ranks = { ASSIGNED: 1, PICKED_UP: 2, IN_TRANSIT: 3, DELIVERED: 4, CONFIRMED: 5, COMPLETED: 6 };
  if ((ranks[delivery.status] || 0) < ranks[target]) {
    await tx.deliveries.update({ where: { id: delivery.id }, data: { status: target, updatedAt: at,
      ...(target === 'PICKED_UP' ? { pickedUpAt: at } : { inTransitAt: at }) } });
  }
  await tx.orders.update({ where: { id: order.id }, data: { status: target, updatedAt: at } });
}
