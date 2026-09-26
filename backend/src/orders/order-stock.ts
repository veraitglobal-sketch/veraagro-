import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

export const stockSummarySelect = { id: true, inventoryId: true, status: true, quantity: true, unit: true, reservedAt: true, issuedAt: true, releasedAt: true } as const;
const stockTime = (old: Date) => new Date(Math.max(Date.now(), old.getTime() + 1));
async function audit(tx: Prisma.TransactionClient, orderId: string, actor: string, action: string, inventoryId: string, quantity: number) {
  await tx.audit_trails.create({ data: { id: randomUUID(), eventType: 'STATUS_CHANGE', entityType: 'OrderStock', entityId: orderId,
    performedByUserId: actor, newValue: { action, inventoryId, quantity } } });
}

/** Lock order before stock throughout reservation, cancellation and dispatch. */
export async function reserveOrderStock(tx: Prisma.TransactionClient, orderId: string, inventoryId: string, actor: string) {
  await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
  const order = await tx.orders.findUnique({ where: { id: orderId }, include: { stockReservation: true, order_items: { include: { batches: true } } } });
  if (!order) throw new NotFoundException('Order not found');
  if (order.stockReservation) {
    if (order.stockReservation.inventoryId !== inventoryId || order.stockReservation.status === 'RELEASED') throw new ConflictException('Order already has a different or released stock allocation');
    return order.stockReservation;
  }
  if (!['PENDING', 'APPROVED', 'PAID', 'CONFIRMED'].includes(order.status)) throw new BadRequestException('Stock can only be allocated before departure');
  if (order.order_items.length > 1) throw new BadRequestException('Multi-line legacy orders require an explicit stock allocation review');
  await tx.$queryRaw`SELECT id FROM inventory WHERE id = ${inventoryId} FOR UPDATE`;
  const stock = await tx.inventory.findUnique({ where: { id: inventoryId } });
  if (!stock || stock.productName !== order.productName || stock.unit !== order.unit || order.fulfillingEstateId && order.fulfillingEstateId !== stock.estateId) {
    throw new BadRequestException('Select the same product, unit and fulfilling farm');
  }
  const item = order.order_items[0];
  if (item && (item.productName !== order.productName || !new Prisma.Decimal(item.quantity).equals(order.quantity))) throw new BadRequestException('Legacy order item differs from the order; review its allocation');
  if (item?.batches && (item.batches.inventoryId !== inventoryId || item.batches.estateId !== stock.estateId)) {
    throw new BadRequestException('The selected lot must be linked to this stock before allocation');
  }
  if (stock.status !== 'AVAILABLE' || stock.expiresAt && stock.expiresAt <= new Date() || new Prisma.Decimal(stock.quantity).lt(order.quantity)) {
    throw new ConflictException('Insufficient available, unexpired stock. Refresh the catalogue.');
  }
  const remaining = new Prisma.Decimal(stock.quantity).minus(order.quantity).toNumber();
  await tx.inventory.update({ where: { id: inventoryId }, data: { quantity: remaining, status: remaining === 0 ? 'RESERVED' : 'AVAILABLE', updatedAt: stockTime(stock.updatedAt) } });
  if (item) await tx.order_items.update({ where: { id: item.id }, data: { inventoryId } });
  else await tx.order_items.create({ data: { id: randomUUID(), orderId, inventoryId, productName: order.productName, quantity: order.quantity, unitPrice: order.unitPrice } });
  await tx.orders.update({ where: { id: orderId }, data: { fulfillingEstateId: stock.estateId, updatedAt: new Date() } });
  const reservation = await tx.order_stock_reservations.create({ data: { orderId, inventoryId, quantity: order.quantity, unit: order.unit, reservedBy: actor } });
  await audit(tx, orderId, actor, 'RESERVE', inventoryId, order.quantity);
  return reservation;
}

/** Caller holds the order lock. Does not debit free quantity a second time. */
export async function requireOrderStock(tx: Prisma.TransactionClient, orderId: string) {
  const reservation = await tx.order_stock_reservations.findUnique({ where: { orderId }, include: { inventory: true, order: { select: { fulfillingEstateId: true } } } });
  if (!reservation || reservation.status === 'RELEASED') throw new BadRequestException('Operations must reserve specific stock before approval, payment or dispatch');
  if (reservation.inventory.estateId !== reservation.order.fulfillingEstateId) throw new ConflictException('Fulfilling farm differs from reserved stock');
  if (reservation.status === 'RESERVED' && (reservation.inventory.expiresAt && reservation.inventory.expiresAt <= new Date() || !['AVAILABLE', 'RESERVED'].includes(reservation.inventory.status))) {
    throw new BadRequestException('Reserved stock is expired or unavailable; operations must review the order');
  }
  return reservation;
}
export async function issueOrderStock(tx: Prisma.TransactionClient, orderId: string, actor: string) {
  const reservation = await requireOrderStock(tx, orderId);
  if (reservation.status === 'ISSUED') return reservation;
  // Serializes with physical recounts and other writes to this stock.
  await tx.$queryRaw`SELECT id FROM inventory WHERE id = ${reservation.inventoryId} FOR UPDATE`;
  const current = await requireOrderStock(tx, orderId);
  const result = await tx.order_stock_reservations.update({ where: { id: reservation.id }, data: { status: 'ISSUED', issuedAt: new Date() } });
  await tx.inventory.update({ where: { id: reservation.inventoryId }, data: { updatedAt: stockTime(current.inventory.updatedAt) } });
  await audit(tx, orderId, actor, 'ISSUE', reservation.inventoryId, reservation.quantity);
  return result;
}
export async function releaseOrderStock(tx: Prisma.TransactionClient, orderId: string, actor: string) {
  const reservation = await tx.order_stock_reservations.findUnique({ where: { orderId } });
  if (!reservation || reservation.status === 'RELEASED') return;
  if (reservation.status === 'ISSUED') throw new BadRequestException('Dispatched goods must use the return workflow');
  await tx.$queryRaw`SELECT id FROM inventory WHERE id = ${reservation.inventoryId} FOR UPDATE`;
  const stock = await tx.inventory.findUniqueOrThrow({ where: { id: reservation.inventoryId } });
  await tx.inventory.update({ where: { id: stock.id }, data: { quantity: new Prisma.Decimal(stock.quantity).plus(reservation.quantity).toNumber(),
    status: stock.expiresAt && stock.expiresAt <= new Date() ? 'EXPIRED' : stock.status === 'RESERVED' ? 'AVAILABLE' : stock.status,
    updatedAt: stockTime(stock.updatedAt) } });
  await tx.order_stock_reservations.update({ where: { id: reservation.id }, data: { status: 'RELEASED', releasedAt: new Date() } });
  await audit(tx, orderId, actor, 'RELEASE', stock.id, reservation.quantity);
}
