import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { durableImage } from '../common/durable-image';
import { ReturnDispositionDto } from './dto/return-disposition.dto';

export const dispositionSummarySelect = { id: true, revision: true, action: true, quantity: true, unit: true, notes: true, createdAt: true } as const;
const historySelect = { ...dispositionSummarySelect, createdBy: true, inventoryId: true, previousQuantity: true,
  countedQuantity: true, previousInventoryStatus: true, previousExpiresAt: true, restockExpiresAt: true } as const;

@Injectable()
export class ReturnDispositionService {
  constructor(private db: PrismaService) {}

  async details(id: string) {
    const row = await this.db.delivery_returns.findUnique({ where: { id }, include: { delivery: { include: { orders: true } },
      dispositions: { orderBy: { revision: 'desc' }, select: historySelect } } });
    if (!row) throw new NotFoundException('Return not found');
    const order = row.delivery.orders;
    const candidates = row.status === 'RECEIVED' && row.stockStatus === 'QUARANTINED' ? await this.db.inventory.findMany({
      where: { estateId: order.fulfillingEstateId || order.estateId, estates: { ownerId: row.receiverUserId },
        productName: order.productName, unit: order.unit, orderReservations: { none: { status: 'RESERVED' } }, AND: [
          { OR: [{ status: 'AVAILABLE' }, { status: 'RESERVED', quantity: 0 }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        ] }, take: 200, orderBy: { updatedAt: 'desc' },
      select: { id: true, productName: true, unit: true, quantity: true, status: true, updatedAt: true, expiresAt: true,
        estates: { select: { name: true } }, hubs: { select: { name: true, address: true, city: true } } },
    }) : [];
    return { returnId: id, status: row.status, stockStatus: row.stockStatus, revision: row.stockRevision,
      quantity: order.quantity, unit: order.unit, productName: order.productName, history: row.dispositions, candidates };
  }

  async decide(actor: string, id: string, dto: ReturnDispositionDto) {
    if ((dto.action === 'RESTOCK') !== !!dto.stockCount) throw new BadRequestException('A verified stock count is required only for restocking');
    const photos = await Promise.all(dto.photos.map(p => durableImage(p)));
    const count = dto.stockCount;
    const requestHash = createHash('sha256').update(JSON.stringify({ action: dto.action, quantity: dto.quantity, unit: dto.unit,
      notes: dto.notes, photos, stockCount: count ? { inventoryId: count.inventoryId, expectedQuantity: count.expectedQuantity,
        countedQuantity: count.countedQuantity, expectedUpdatedAt: new Date(count.expectedUpdatedAt).toISOString(), expiresAt: new Date(count.expiresAt).toISOString() } : null })).digest('hex');
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM delivery_returns WHERE id = ${id} FOR UPDATE`;
      const row = await tx.delivery_returns.findUnique({ where: { id }, include: { delivery: { include: { orders: true } } } });
      if (!row) throw new NotFoundException('Return not found');
      const existing = await tx.return_dispositions.findUnique({ where: { returnId_revision: { returnId: id, revision: dto.revision } } });
      if (existing) {
        if (existing.requestHash !== requestHash) throw new ConflictException('A different inspection is already recorded for this revision. Refresh the return.');
        return existing;
      }
      if (row.status !== 'RECEIVED') throw new BadRequestException('The returned shipment must be received before inspection');
      if (row.stockRevision !== dto.revision || row.stockStatus !== 'QUARANTINED') throw new ConflictException('This return already has a newer or final stock decision');
      const order = row.delivery.orders;
      if (!new Prisma.Decimal(order.quantity).equals(dto.quantity) || dto.unit !== order.unit) throw new BadRequestException('Inspect the complete returned quantity in its original unit');
      let stockData: { inventoryId: string; previousQuantity: number; countedQuantity: number; previousInventoryStatus: string; previousExpiresAt: Date | null; restockExpiresAt: Date } | undefined;
      if (count) {
        await tx.$queryRaw`SELECT id FROM inventory WHERE id = ${count.inventoryId} FOR UPDATE`;
        const stock = await tx.inventory.findUnique({ where: { id: count.inventoryId }, include: { estates: { select: { ownerId: true } } } });
        if (!stock || stock.estateId !== (order.fulfillingEstateId || order.estateId) || stock.estates.ownerId !== row.receiverUserId || stock.productName !== order.productName || stock.unit !== order.unit) {
          throw new BadRequestException('Select stock belonging to the receiving farm with the same product and unit');
        }
        if (!new Prisma.Decimal(stock.quantity).equals(count.expectedQuantity) || stock.updatedAt.getTime() !== new Date(count.expectedUpdatedAt).getTime()) {
          throw new ConflictException('Stock changed after it was loaded. Refresh and recount before saving.');
        }
        if (await tx.order_stock_reservations.count({ where: { inventoryId: stock.id, status: 'RESERVED' } })) throw new ConflictException('Complete or cancel active stock reservations before a physical recount');
        const expiresAt = new Date(count.expiresAt), now = new Date();
        if (!(stock.status === 'AVAILABLE' || stock.status === 'RESERVED' && stock.quantity === 0) || stock.expiresAt && stock.expiresAt <= now) {
          throw new BadRequestException('Expired, in-transit or allocated stock cannot be reopened by a return count');
        }
        if (expiresAt <= now || stock.expiresAt && expiresAt > stock.expiresAt) throw new BadRequestException('Record a future expiry without extending the existing stock expiry');
        if (count.countedQuantity < dto.quantity) throw new BadRequestException('The total saleable count must include the full returned shipment');
        stockData = { inventoryId: stock.id, previousQuantity: stock.quantity, countedQuantity: count.countedQuantity,
          previousInventoryStatus: stock.status, previousExpiresAt: stock.expiresAt, restockExpiresAt: expiresAt };
        // This is a physical recount, NOT a blind increment. Legacy orders have no stock issue ledger.
        await tx.inventory.update({ where: { id: stock.id }, data: { quantity: count.countedQuantity, status: 'AVAILABLE', expiresAt,
          updatedAt: new Date(Math.max(Date.now(), stock.updatedAt.getTime() + 1)) } });
      }
      const result = await tx.return_dispositions.create({ data: { returnId: id, revision: dto.revision, action: dto.action,
        quantity: dto.quantity, unit: dto.unit, notes: dto.notes, photos, createdBy: actor, requestHash, ...stockData } });
      await tx.delivery_returns.update({ where: { id }, data: { stockRevision: { increment: 1 },
        stockStatus: dto.action === 'RESTOCK' ? 'RESTOCKED' : dto.action === 'WRITE_OFF' ? 'WRITTEN_OFF' : 'QUARANTINED' } });
      await tx.audit_trails.create({ data: { id: randomUUID(), eventType: 'STATUS_CHANGE', entityType: 'ReturnDisposition', entityId: id,
        performedByUserId: actor, newValue: { dispositionId: result.id, action: dto.action, quantity: dto.quantity, unit: dto.unit,
          ...(stockData ? { inventoryId: stockData.inventoryId, previousQuantity: stockData.previousQuantity, countedQuantity: stockData.countedQuantity } : {}) } } });
      return result;
    });
  }
}
