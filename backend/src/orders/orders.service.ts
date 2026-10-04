import { reserveCatalogStock, releaseCatalogStock } from '../catalog/catalog-stock';
import { reserveOrderStock, releaseOrderStock, requireOrderStock, stockSummarySelect } from './order-stock';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ensureVeraPlatformEstateId, isSystemEstateId } from './order-fulfillment.util';
import { InvoicesService } from '../invoices/invoices.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { resolveOrderPrice } from './order-pricing';
import { enrichOrdersWithCatalogReserve } from './order-catalog-enrich';
import { assertBatchFitsOrder, listCompatibleBatchesForOrder } from './order-batch-link';
import { isFullyPacked } from '../../../shared/validation/order-packing';

/** Statuses in which a grower may record packing (matches GET /orders/grower?queue=prepare). */
export const GROWER_PACKABLE_ORDER_STATUSES: OrderStatus[] = ['PAID', 'CONFIRMED'];
/** Allowed deviation of the packed net weight from packs × pack size. */
export const PACKED_WEIGHT_TOLERANCE = 0.05;

function orderPackLine(order: {
  packCount?: number | null;
  packLabel?: string | null;
}): string {
  if (order.packCount && order.packLabel) return `${order.packCount} × ${order.packLabel}`;
  return '';
}

/** Grower-safe payment summary — no buyer payment records or invoice details. */
export function growerPaymentSummaryFromOrder(order: {
  status: OrderStatus;
  payments?: { status: string } | null;
}): 'AWAITING_PAYMENT' | 'PAID_IN_ESCROW' | 'SETTLED' | 'REFUNDED' | 'CANCELLED' | 'UNKNOWN' {
  // Delivery and money release are separate workflows. Only the payment record
  // proves escrow/release; an order status alone must never imply settlement.
  if (order.payments?.status === 'REFUNDED') return 'REFUNDED';
  if (order.payments?.status === 'RELEASED') return 'SETTLED';
  if (order.payments?.status === 'IN_ESCROW') return 'PAID_IN_ESCROW';
  if (order.status === 'CANCELLED') return 'CANCELLED';
  if (order.payments?.status === 'PENDING' || ['PENDING', 'APPROVED'].includes(order.status)) {
    return 'AWAITING_PAYMENT';
  }
  return 'UNKNOWN';
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  /**
   * Buyer-safe logistics timeline: built from the latest mission linked to the order (cold chain)
   * and/or the delivery record (last-mile driver). No farm destination or internal instructions.
   */
  private async buildBuyerShipmentTracking(
    orderId: string,
    orderCreatedAt: Date,
  ): Promise<{
    missionNumber: string | null;
    missionStatus: string | null;
    events: Array<{ code: string; at: string }>;
  }> {
    const events: Array<{ code: string; at: string }> = [];
    const add = (code: string, d: Date | null | undefined) => {
      if (!d || !(d instanceof Date) || Number.isNaN(d.getTime())) return;
      const iso = d.toISOString();
      events.push({ code, at: iso });
    };

    try {
      const orderMeta = await this.prisma.orders.findUnique({
        where: { id: orderId },
        select: {
          packedAt: true,
          payments: { select: { createdAt: true, status: true } },
        },
      });
      const linkedDelivery = await this.prisma.deliveries.findUnique({ where: { orderId }, select: { missionId: true } });
      const [mission, delivery] = await Promise.all([
        this.prisma.missions.findFirst({
          where: linkedDelivery?.missionId ? { id: linkedDelivery.missionId } : { orderId },
          orderBy: { createdAt: 'desc' },
          include: {
            logistics_handovers: { select: { timestamp: true } },
            border_wait_times: {
              orderBy: { borderArrivalTime: 'asc' },
              select: {
                borderName: true,
                borderArrivalTime: true,
                borderExitTime: true,
              },
            },
          },
        }),
        this.prisma.deliveries.findUnique({ where: { orderId } }),
      ]);

      if (mission?.status && mission.status !== 'CANCELLED') {
        add('LINE_OPENED', mission.requestedAt);
        add('LINEHAUL_ASSIGNED', mission.assignedAt ?? undefined);
        add('LINEHAUL_ACCEPTED', mission.acceptedAt ?? undefined);

        const handoverTs = mission.logistics_handovers?.timestamp;
        add('LOADING_QUALITY_CHECK_COMPLETE', handoverTs ?? undefined);

        add('DEPARTED_FARM', mission.pickedUpAt ?? undefined);

        for (const bt of mission.border_wait_times ?? []) {
          add('BORDER_STOP_ARRIVAL', bt.borderArrivalTime ?? undefined);
          add('BORDER_STOP_DEPARTURE', bt.borderExitTime ?? undefined);
        }

        add('LINEHAUL_FINISHED', mission.completedAt ?? undefined);
      }

      if (delivery) {
        add('DELIVERY_BOOKED', delivery.createdAt ?? undefined);
        add('LAST_MILE_DISPATCHED', delivery.assignedAt ?? undefined);
        add('SHIPMENT_COLLECTED', delivery.pickedUpAt ?? undefined);
        add('SHIPMENT_ENTRY_TRANSIT_LINE', delivery.inTransitAt ?? undefined);
        add('SHIPMENT_DROP_OFF_CONFIRMED', delivery.deliveredAt ?? undefined);
        add(
          'SHIPMENT_BUYER_RECEIPT_CONFIRMED',
          delivery.buyerPickupConfirmedAt ?? delivery.confirmedAt ?? undefined,
        );
      }

      add('ORDER_RECORDED', orderCreatedAt);
      if (
        orderMeta?.payments &&
        ['IN_ESCROW', 'RELEASED'].includes(orderMeta.payments.status)
      ) {
        add('PAYMENT_RECEIVED', orderMeta.payments.createdAt ?? undefined);
      }
      add('ORDER_PACKED', orderMeta?.packedAt ?? undefined);

      const seen = new Set<string>();
      const dedup = events.filter((e) => {
        const k = `${e.code}|${e.at}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      dedup.sort((a, b) => a.at.localeCompare(b.at));
      const missionNumber =
        mission && mission.status !== 'CANCELLED' && typeof mission.missionNumber === 'string' && mission.missionNumber.trim().length > 0
          ? mission.missionNumber.trim()
          : null;
      const missionStatus =
        mission && mission.status !== 'CANCELLED' ? mission.status : null;
      return {
        missionNumber,
        missionStatus,
        events: dedup,
      };
    } catch (e) {
      this.logger.warn(
        `buildBuyerShipmentTracking failed for order ${orderId}: ${e instanceof Error ? e.message : String(e)}`,
      );
      return { missionNumber: null, missionStatus: null, events: [] };
    }
  }

  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
    private invoicesService: InvoicesService,
  ) {}

  async create(buyerId: string, data: CreateOrderDto) {
    // Canonical field order: JSON object property order must not change request identity.
    const requestHash = data.clientRequestId ? crypto.createHash('sha256').update(JSON.stringify({
      productId: data.productId ?? null, estateId: data.estateId ?? null, productName: data.productName,
      quantity: data.quantity, unit: data.unit, unitPrice: data.unitPrice,
      packOptionId: data.packOptionId ?? null, packCount: data.packCount ?? null,
      deliveryAddress: { street: data.deliveryAddress.street, city: data.deliveryAddress.city,
        postalCode: data.deliveryAddress.postalCode ?? null, country: data.deliveryAddress.country },
      deliveryNotes: data.deliveryNotes ?? null,
    })).digest('hex') : null;
    const platformEstateId = await ensureVeraPlatformEstateId(this.prisma);
    const result = await this.prisma.$transaction(async (tx) => {
      if (data.clientRequestId) {
        // Lock even when no order exists yet. Collision only serializes unrelated requests.
        const lockKey = JSON.stringify(['order-checkout', buyerId, data.clientRequestId]);
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`;
        const existing = await tx.orders.findUnique({ where: { buyerId_clientRequestId: { buyerId, clientRequestId: data.clientRequestId } }, include: { stockReservation: { select: stockSummarySelect } } });
        if (existing) {
          if (existing.requestHash !== requestHash) throw new ConflictException({ code: 'ORDER_REQUEST_MISMATCH', message: 'This checkout attempt already created an order with different details. Recover that order before placing another.' });
          return { order: existing, replay: true };
        }
      }
      const priced = await resolveOrderPrice(tx, data);
      const isCatalog = 'isCatalog' in priced && priced.isCatalog === true;
      const orderId = crypto.randomUUID();
      await tx.orders.create({ data: { id: orderId,
        orderNumber: `BIOVERA-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        buyerId, clientRequestId: data.clientRequestId, requestHash, estateId: platformEstateId,
        fulfillingEstateId: priced.estateId || null,
        sourceCatalogId: priced.productId,
        catalogProductId: isCatalog ? priced.catalogProductId : null,
        packOptionId: isCatalog ? priced.packOptionId : null,
        packLabel: isCatalog ? priced.packLabel : null,
        packSizeKg: isCatalog ? priced.packSizeKg : null,
        packCount: isCatalog ? priced.packCount : null,
        productName: isCatalog ? priced.productName : data.productName,
        quantity: isCatalog ? priced.quantity : data.quantity,
        unit: isCatalog ? priced.unit : data.unit,
        unitPrice: priced.unitPrice, totalAmount: priced.totalAmount, deliveryAddress: { ...data.deliveryAddress },
        deliveryNotes: data.deliveryNotes, status: 'PENDING', updatedAt: new Date(),
        order_items: { create: { id: crypto.randomUUID(), productName: isCatalog ? priced.productName : data.productName,
          quantity: isCatalog ? priced.quantity : data.quantity,
          unitPrice: priced.unitPrice, batchId: !isCatalog && 'batchId' in priced ? priced.batchId : undefined } },
      } });
      if (isCatalog) {
        await reserveCatalogStock(tx, priced.catalogProductId, orderId, priced.quantity, buyerId);
      } else if ('inventoryId' in priced && priced.inventoryId) {
        await reserveOrderStock(tx, orderId, priced.inventoryId, buyerId);
      }
      return { order: await tx.orders.findUniqueOrThrow({ where: { id: orderId }, include: { stockReservation: { select: stockSummarySelect } } }), replay: false };
    });
    const { order } = result;
    if (result.replay) return { ...order, checkoutReplay: true };
    const orderNumber = order.orderNumber, totalAmount = order.totalAmount, deliveryNotes = order.deliveryNotes;

    const buyer = await this.prisma.users.findUnique({
      where: { id: buyerId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        partnerCode: true,
      },
    });
    const buyerLabel =
      [buyer?.firstName, buyer?.lastName].filter(Boolean).join(' ').trim() ||
      buyer?.email ||
      'Buyer';
    const estateName = 'Vera (fulfilling estate assigned in ops)';

    void this.emailService
      .sendNewOrderAdminNotification({
        orderNumber: order.orderNumber,
        productName: data.productName,
        quantity: data.quantity,
        unit: data.unit,
        unitPrice: data.unitPrice,
        totalAmount,
        buyerName: buyerLabel,
        buyerEmail: buyer?.email,
        estateName,
        isPreOrder: false,
        extraNotes: deliveryNotes,
      })
      .catch((e) =>
        this.logger.error(`sendNewOrderAdminNotification failed: ${e}`),
      );

    const catalogPack =
      order.packCount && order.packLabel
        ? `${order.packCount} × ${order.packLabel} ${order.productName} (${order.quantity} kg) — €${totalAmount.toFixed(2)}`
        : null;
    void this.notificationsService
      .notifyAdminsForNewOrder({
        orderNumber: order.orderNumber,
        productName: catalogPack ?? data.productName,
        totalAmount,
        buyerLabel,
        estateLabel: estateName,
        isPreOrder: false,
        isCatalogOrder: !!order.catalogProductId,
      })
      .catch((e) =>
        this.logger.error(`notifyAdminsForNewOrder failed: ${e}`),
      );

    return order;
  }

  /**
   * Admin: assign the physical farm that will fulfill the order (pickup, farmer payout, notifications).
   */
  async updateFulfillmentByAdmin(orderId: string, fulfillingEstateId: string | null) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
      const order = await tx.orders.findUnique({ where: { id: orderId }, include: { stockReservation: { include: { inventory: true } } } });
      if (!order) throw new NotFoundException('Order not found');
      if (['CANCELLED', 'REFUNDED'].includes(order.status)) throw new BadRequestException('Closed orders cannot change farm');
      if (order.stockReservation && fulfillingEstateId !== order.stockReservation.inventory.estateId) throw new BadRequestException('The fulfilling farm must match the reserved stock');
      if (fulfillingEstateId) {
        if (isSystemEstateId(fulfillingEstateId)) throw new BadRequestException('Choose a real fulfilling farm');
        if (!await tx.estates.findUnique({ where: { id: fulfillingEstateId } })) throw new NotFoundException('Estate not found');
      }
      return tx.orders.update({ where: { id: orderId }, data: { fulfillingEstateId, updatedAt: new Date() },
        include: { fulfilling_estate: { select: { id: true, name: true } }, estates: { select: { id: true, name: true } } } });
    });
  }

  async stockOptions(orderId: string) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        stockReservation: { select: stockSummarySelect },
        order_items: true,
        catalogProduct: { select: { estateId: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    const batchId = order.order_items.find(i => i.batchId)?.batchId;
    const estateFilter =
      order.fulfillingEstateId ??
      order.catalogProduct?.estateId ??
      undefined;
    const candidates = !order.stockReservation && ['PENDING', 'APPROVED', 'PAID', 'CONFIRMED'].includes(order.status)
      ? await this.prisma.inventory.findMany({ where: { productName: order.productName, unit: order.unit,
          ...(estateFilter ? { estateId: estateFilter } : {}), ...(batchId ? { batches: { some: { id: batchId } } } : {}),
          status: 'AVAILABLE', quantity: { gte: order.quantity }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, take: 200,
          select: { id: true, quantity: true, unit: true, expiresAt: true, estates: { select: { name: true } }, hubs: { select: { name: true, city: true } } } }) : [];
    return { orderId, reservation: order.stockReservation, quantity: order.quantity, unit: order.unit, candidates };
  }
  async reserveStock(orderId: string, inventoryId: string, actor: string) {
    return this.prisma.$transaction(tx => reserveOrderStock(tx, orderId, inventoryId, actor));
  }
  async reopenForDispatch(orderId: string, actor: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
      const order = await tx.orders.findUnique({ where: { id: orderId }, include: { payments: true, deliveries: true, stockReservation: true } });
      if (!order) throw new NotFoundException('Order not found');
      if (!['PICKED_UP', 'IN_TRANSIT'].includes(order.status)) throw new BadRequestException('Only picked-up / in-transit orders can be reopened');
      if (order.deliveries) throw new BadRequestException('This order has a delivery; use the delivery workflow instead');
      if (order.stockReservation?.status === 'ISSUED') throw new BadRequestException('Stock was already issued for this order');
      if (order.payments?.status !== 'IN_ESCROW') throw new BadRequestException('Payment must be held in escrow');
      const updated = await tx.orders.update({ where: { id: orderId }, data: { status: 'PAID', updatedAt: new Date() } });
      await tx.audit_trails.create({ data: { id: crypto.randomUUID(), eventType: 'STATUS_CHANGE', entityType: 'Order', entityId: orderId,
        performedByUserId: actor, oldValue: { status: order.status }, newValue: { status: 'PAID', action: 'REOPEN_DISPATCH_NO_DELIVERY' } } });
      return updated;
    });
  }

  private async cancelTx(tx: import('@prisma/client').Prisma.TransactionClient, orderId: string, actor: string, reason?: string) {
    const order = await tx.orders.findUnique({ where: { id: orderId }, include: { payments: true, deliveries: true } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'CANCELLED') return order;
    if (!['PENDING', 'APPROVED'].includes(order.status) || order.payments || order.deliveries) throw new BadRequestException('Only unpaid, undispatched orders can be cancelled here. Paid orders require finance review.');
    await releaseOrderStock(tx, orderId, actor);
    await releaseCatalogStock(tx, orderId, actor, reason);
    return tx.orders.update({ where: { id: orderId }, data: { status: 'CANCELLED', updatedAt: new Date(), rejectionReason: reason?.trim() || order.rejectionReason } });
  }
  async cancelByBuyer(orderId: string, buyerId: string) {
    return this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
      const order = await tx.orders.findUnique({ where: { id: orderId } });
      if (!order || order.buyerId !== buyerId) throw new NotFoundException('Order not found');
      return this.cancelTx(tx, orderId, buyerId);
    });
  }

  async findByCheckoutRequest(clientRequestId: string, buyerId: string) {
    const order = await this.prisma.orders.findUnique({ where: { buyerId_clientRequestId: { buyerId, clientRequestId } }, include: { stockReservation: { select: stockSummarySelect } } });
    if (!order) throw new NotFoundException('Order not found');
    return { ...order, checkoutReplay: true };
  }

  async findAllByBuyer(buyerId: string) {
    const rows = await this.prisma.orders.findMany({
      where: { buyerId },
      include: {
        stockReservation: { select: stockSummarySelect },
        catalogProduct: { select: { id: true, name: true } },
        estates: true,
        fulfilling_estate: true,
        payments: true,
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            pdfUrl: true,
            generatedAt: true,
          },
        },
        deliveries: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return enrichOrdersWithCatalogReserve(this.prisma, rows);
  }

  /**
   * Grower view: orders fulfilled from estates this user owns. Buyer identity stays private
   * (city only) — the grower needs volumes, status and delivery progress, not contact data.
   */
  async findAllForGrower(growerId: string, queue?: string) {
    const prepareQueue = queue?.trim().toLowerCase() === 'prepare';
    const rows = await this.prisma.orders.findMany({
      where: {
        fulfilling_estate: { ownerId: growerId },
        ...(prepareQueue
          ? {
              catalogProductId: { not: null },
              status: { in: GROWER_PACKABLE_ORDER_STATUSES },
            }
          : {}),
      },
      select: {
        id: true,
        orderNumber: true,
        productName: true,
        quantity: true,
        unit: true,
        unitPrice: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        deliveryAddress: true,
        deliveryNotes: true,
        packLabel: true,
        packSizeKg: true,
        packCount: true,
        packedPackCount: true,
        packedKg: true,
        packedAt: true,
        packedBatchId: true,
        catalogProductId: true,
        catalogProduct: { select: { id: true, name: true } },
        fulfilling_estate: { select: { id: true, name: true } },
        packed_batch: {
          select: { id: true, batchId: true, productName: true, status: true },
        },
        deliveries: { select: { id: true, status: true, deliveryNumber: true } },
        missions: {
          where: { status: { not: 'CANCELLED' } },
          select: { id: true, status: true, missionNumber: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(({ deliveryAddress, ...row }) => {
      const packLine = orderPackLine(row);
      const requiredPacks = row.packCount ?? 0;
      const packedPacks = row.packedPackCount ?? 0;
      let nextAction:
        | 'PREPARE_AND_PACK'
        | 'SELECT_LOT'
        | 'REQUEST_PICKUP'
        | 'AWAITING_PICKUP'
        | 'IN_FULFILLMENT' = 'IN_FULFILLMENT';
      if (prepareQueue || row.catalogProductId) {
        if (requiredPacks > 0 && packedPacks < requiredPacks) nextAction = 'PREPARE_AND_PACK';
        else if (!row.packedBatchId) nextAction = 'SELECT_LOT';
        else if (!row.missions?.length) nextAction = 'REQUEST_PICKUP';
        else nextAction = 'AWAITING_PICKUP';
      }
      return {
        ...row,
        packLine,
        nextAction,
        deliveryCity:
          deliveryAddress && typeof deliveryAddress === 'object' && !Array.isArray(deliveryAddress)
            ? String((deliveryAddress as Record<string, unknown>).city ?? '')
            : '',
      };
    });
  }

  async listCompatibleBatches(growerId: string, orderId: string) {
    return listCompatibleBatchesForOrder(this.prisma, growerId, orderId);
  }

  async recordGrowerPacking(
    growerId: string,
    orderId: string,
    body: {
      packedPackCount: number;
      packedKg?: number;
      batchId?: string;
      declaredShelfLifeHours?: number;
      declaredExpiresAt?: string;
      packagingType?: string;
    },
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
      const packedPackCount = Math.floor(Number(body.packedPackCount));
      if (!Number.isFinite(packedPackCount) || packedPackCount < 1) {
        throw new BadRequestException('packedPackCount must be at least 1');
      }
      const order = await tx.orders.findFirst({
        where: { id: orderId, fulfilling_estate: { ownerId: growerId } },
        include: {
          missions: {
            where: { status: { not: 'CANCELLED' } },
            select: { status: true },
          },
        },
      });
      // Explicit fields used below (findFirst returns full row)
      if (!order) throw new NotFoundException('Order not found');
      if (!order.catalogProductId) {
        throw new BadRequestException('Packing records apply to catalogue orders only');
      }
      // Same set as the "orders to prepare" queue: nothing is packed before payment is confirmed.
      if (!GROWER_PACKABLE_ORDER_STATUSES.includes(order.status)) {
        throw new BadRequestException(
          order.status === 'PENDING' || order.status === 'APPROVED'
            ? 'This order is not paid yet — prepare it after payment is confirmed.'
            : `Packing can no longer be changed for an order with status ${order.status}.`,
        );
      }
      const departed = order.missions.some((m) =>
        ['PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(m.status),
      );
      if (departed) {
        throw new BadRequestException('The goods have already left the farm — packing can no longer be changed.');
      }
      if (order.packCount != null && packedPackCount > order.packCount) {
        throw new BadRequestException(
          `Packed quantity exceeds ordered packs (${order.packCount} max)`,
        );
      }
      const expectedKg = order.packSizeKg != null ? packedPackCount * order.packSizeKg : null;
      let packedKg: number | null = expectedKg;
      if (body.packedKg != null) {
        packedKg = Number(body.packedKg);
        if (
          expectedKg != null &&
          Math.abs(packedKg - expectedKg) > expectedKg * PACKED_WEIGHT_TOLERANCE + 1e-9
        ) {
          throw new BadRequestException(
            `Packed weight must be within ±5 % of ${expectedKg} kg (${packedPackCount} × ${order.packSizeKg} kg).`,
          );
        }
      }
      let packedBatchId = order.packedBatchId;
      const batchRef = body.batchId?.trim() || packedBatchId;
      if (batchRef) {
        const batch = await assertBatchFitsOrder(tx, growerId, {
          orderId: order.id,
          fulfillingEstateId: order.fulfillingEstateId!,
          catalogProductId: order.catalogProductId,
          productName: order.productName,
          quantity: order.quantity, unit: order.unit,
        }, batchRef, true);
        packedBatchId = batch.id;
      } else if (!packedBatchId && order.catalogProductId) {
        throw new BadRequestException(
          'Select the lot (batch) you packed for this order. Create a lot and complete quality entry first if needed.',
        );
      }

      const packNow = order.packedAt ?? new Date();
      const declaredHours =
        body.declaredShelfLifeHours != null && Number.isFinite(Number(body.declaredShelfLifeHours))
          ? Math.floor(Number(body.declaredShelfLifeHours))
          : order.declaredShelfLifeHours;
      const declaredExpires =
        body.declaredExpiresAt != null
          ? new Date(body.declaredExpiresAt)
          : declaredHours != null && !order.declaredExpiresAt
            ? new Date(packNow.getTime() + declaredHours * 3600_000)
            : order.declaredExpiresAt;
      const packagingType =
        body.packagingType?.trim() || order.packagingType || order.packLabel || null;
      if (declaredHours != null && (!Number.isInteger(declaredHours) || declaredHours <= 0)) {
        throw new BadRequestException('Declared shelf life must be a positive number of hours');
      }
      if (declaredExpires && (!Number.isFinite(declaredExpires.getTime()) || declaredExpires <= packNow)) {
        throw new BadRequestException('Declared expiry must follow packing');
      }
      if (order.packedAt && (
        (body.declaredShelfLifeHours != null && Number(body.declaredShelfLifeHours) !== order.declaredShelfLifeHours) ||
        (body.declaredExpiresAt != null && new Date(body.declaredExpiresAt).getTime() !== order.declaredExpiresAt?.getTime()) ||
        (body.packagingType != null && packagingType !== (order.packagingType || order.packLabel || null))
      )) throw new BadRequestException('The recorded packaging declaration cannot be changed');

      const updated = await tx.orders.update({
        where: { id: orderId },
        data: {
          packedPackCount,
          packedKg: packedKg ?? undefined,
          packedAt: packNow,
          packedBatchId: packedBatchId ?? undefined,
          packedByUserId: growerId,
          packagingType,
          declaredShelfLifeHours: declaredHours ?? undefined,
          declaredExpiresAt: declaredExpires ?? undefined,
          updatedAt: new Date(),
        },
      });

      if (packedBatchId) {
        const existingBatch = await tx.batches.findUniqueOrThrow({ where: { id: packedBatchId } });
        const product = !existingBatch.passportProductSnapshot
          ? await tx.catalog_products.findUnique({ where: { id: order.catalogProductId } }) : null;
        await tx.batches.update({
          where: { id: packedBatchId },
          data: {
            actualPackDate: existingBatch.actualPackDate ?? packNow,
            ...(product ? { passportProductSnapshot: {
              catalogProductId: product.id, name: product.name, variety: product.variety,
              description: product.description, storageConditions: product.storageConditions,
              imageUrl: product.imageUrl, capturedAt: packNow.toISOString(),
            } } : {}),
            packedByUserId: growerId,
            catalogProductId: order.catalogProductId ?? undefined,
            updatedAt: new Date(),
          },
        });
      }

      let notification = null;
      if (isFullyPacked(updated) && order.buyerId && !order.buyerPackedNotifiedAt) {
        notification = await this.notificationsService.createLocalized({
          userId: order.buyerId, type: 'SYSTEM', templateKey: 'buyer.orderPacked',
          templateParams: { orderNumber: order.orderNumber,
            packLine: orderPackLine(updated) || `${updated.packedPackCount ?? packedPackCount} × ${order.packLabel ?? order.unit}` },
          actionUrl: '/buyer-portal/orders',
        }, tx);
        await tx.orders.update({ where: { id: orderId }, data: { buyerPackedNotifiedAt: new Date() } });
      }
      return { updated, notification };
    });
    if (result.notification) await this.notificationsService.pushCreatedNotification(result.notification);
    return result.updated;
  }

  // Admin methods
  async findAll(filters?: { status?: string; buyerId?: string; estateId?: string }) {
    const where: any = {};
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.buyerId) {
      where.buyerId = filters.buyerId;
    }
    
    if (filters?.estateId) {
      where.estateId = filters.estateId;
    }

    const rows = await this.prisma.orders.findMany({
      where,
      include: {
        stockReservation: { select: stockSummarySelect },
        catalogProduct: { select: { id: true, name: true } },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            partnerCode: true,
          },
        },
        estates: {
          select: {
            id: true,
            name: true,
          },
        },
        fulfilling_estate: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: true,
        deliveries: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        missions: {
          select: {
            id: true,
            missionNumber: true,
            status: true,
            growerId: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return enrichOrdersWithCatalogReserve(this.prisma, rows);
  }

  /**
   * Admin / accounting: money visible on the bank account → record escrow + mark order PAID (for planning delivery).
   * Use after APPROVED, when the buyer’s wire is reconciled. Retries with the same
   * bank reference return the existing record; a different payment conflicts.
   */
  async confirmBankPaymentByAdmin(
    orderId: string,
    body?: { transactionId?: string },
  ) {
    const reference = body?.transactionId?.trim() || undefined;
    const created = await this.prisma.$transaction(async (tx) => {
      // Serialize confirmations of the same order, including concurrent retries.
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
      const order = await tx.orders.findUnique({ where: { id: orderId }, include: { payments: true } });
      if (!order) throw new NotFoundException('Order not found');
      if (order.payments) {
        if (
          !['CANCELLED', 'REFUNDED'].includes(order.status) &&
          ['IN_ESCROW', 'RELEASED'].includes(order.payments.status) &&
          order.payments.paymentMethod === 'BANK_TRANSFER' &&
          (order.payments.transactionId || undefined) === reference
        ) return false;
        throw new ConflictException('A different payment is already registered for this order');
      }
      if (order.status !== 'APPROVED') {
        throw new BadRequestException(`Bank transfer can only be confirmed when the order is APPROVED (current: ${order.status})`);
      }
      await requireOrderStock(tx, orderId);
      await this.paymentsService.createEscrowPayment(orderId, order.totalAmount, {
        paymentMethod: 'BANK_TRANSFER', transactionId: reference,
      }, tx);
      await tx.orders.update({ where: { id: orderId }, data: { status: 'PAID', updatedAt: new Date() } });
      return true;
    });
    if (created) {
      try {
        await this.invoicesService.generateInvoice(orderId);
      } catch (e: unknown) {
        const detail = e instanceof Error ? e.message : String(e);
        this.logger.error(`generateInvoice after bank payment failed for ${orderId}: ${detail}`);
      }
      try {
        const paidOrder = await this.prisma.orders.findUnique({
          where: { id: orderId },
          select: {
            orderNumber: true,
            productName: true,
            packCount: true,
            packLabel: true,
            quantity: true,
            unit: true,
            buyerId: true,
            fulfilling_estate: { select: { ownerId: true } },
          },
        });
        const packLine = paidOrder
          ? orderPackLine(paidOrder) || `${paidOrder.quantity} ${paidOrder.unit}`
          : '';
        if (paidOrder?.buyerId) {
          await this.notificationsService.createLocalized({
            userId: paidOrder.buyerId,
            type: 'SYSTEM',
            templateKey: 'buyer.paymentReceived',
            templateParams: { orderNumber: paidOrder.orderNumber, packLine },
            actionUrl: '/buyer-portal/orders',
          });
        }
        const growerId = paidOrder?.fulfilling_estate?.ownerId;
        if (growerId) {
          await this.notificationsService.createLocalized({
            userId: growerId,
            type: 'ACTION_REQUIRED',
            templateKey: 'grower.orderToPrepare',
            templateParams: {
              orderNumber: paidOrder?.orderNumber ?? orderId,
              packLine,
              productName: paidOrder?.productName ?? '',
            },
            actionUrl: '/grower/orders',
          });
        }
      } catch (e) {
        this.logger.warn(
          `Payment confirmation notifications failed for ${orderId}: ${e instanceof Error ? e.message : e}`,
        );
      }
    }
    const withRelations = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        stockReservation: { select: stockSummarySelect },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            partnerCode: true,
            email: true,
          },
        },
        estates: { select: { id: true, name: true } },
        fulfilling_estate: { select: { id: true, name: true } },
        payments: true,
        invoices: true,
        deliveries: {
          include: {
            users: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });
    if (!withRelations) {
      throw new NotFoundException('Order not found');
    }
    return withRelations;
  }

  /**
   * Admin: accept a placed order (PENDING → APPROVED). Buyer can pay only after this.
   */
  async approveOrderByAdmin(orderId: string) {
    const updated = await this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
      const order = await tx.orders.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundException('Order not found');
      if (order.status === 'APPROVED') return order;
      if (order.status !== 'PENDING') throw new BadRequestException(`Order can only be approved from PENDING (current: ${order.status})`);
      await requireOrderStock(tx, orderId);
      return tx.orders.update({ where: { id: orderId }, data: { status: 'APPROVED', updatedAt: new Date() } });
    });
    void this.notificationsService
      .create({
        userId: updated.buyerId,
        type: 'ACTION_REQUIRED',
        title: 'Order accepted',
        message: `${updated.orderNumber} was accepted. Pay by bank transfer using the payment instructions in your order.`,
        actionUrl: `/buyer-portal/orders`,
      })
      .catch((e) => this.logger.error(`buyer accept notification failed: ${e}`));
    return updated;
  }

  async rejectOrderByAdmin(orderId: string, reason: string, actorId: string) {
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
      const order = await tx.orders.findUnique({ where: { id: orderId }, include: { payments: true, deliveries: true } });
      if (!order) throw new NotFoundException('Order not found');
      if (order.status === 'CANCELLED') return order;
      if (!['PENDING', 'APPROVED'].includes(order.status) || order.payments || order.deliveries) {
        throw new BadRequestException('Only unpaid, undispatched orders can be rejected');
      }
      await releaseOrderStock(tx, orderId, actorId);
      await releaseCatalogStock(tx, orderId, actorId, reason);
      return tx.orders.update({
        where: { id: orderId },
        data: { status: 'CANCELLED', rejectionReason: reason.trim(), updatedAt: new Date() },
      });
    });
    void this.notificationsService
      .create({
        userId: updated.buyerId,
        type: 'ALERT',
        title: 'Order rejected',
        message: `${updated.orderNumber} was rejected: ${reason.trim()}`,
        actionUrl: `/buyer-portal/orders`,
      })
      .catch((e) => this.logger.error(`buyer reject notification failed: ${e}`));
    return updated;
  }

  /**
   * Admin: retain the status endpoint for approval and unpaid cancellation only.
   */
  async updateStatusByAdmin(orderId: string, status: string, actor: string) {
    if (typeof status !== 'string' || !status.trim()) {
      throw new BadRequestException('status is required');
    }
    const next = status.trim() as OrderStatus;
    if (!Object.values(OrderStatus).includes(next)) {
      throw new BadRequestException(
        `Invalid status. Use one of: ${Object.values(OrderStatus).join(', ')}`,
      );
    }
    if (next === 'APPROVED') return this.approveOrderByAdmin(orderId);
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
      const order = await tx.orders.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundException('Order not found');
      if (next === 'CANCELLED') return this.cancelTx(tx, orderId, actor);
      if (next === order.status) return order;
      throw new BadRequestException('Use approval, bank confirmation, dispatch, receipt or refund workflows to change this status');
    });
  }

  async findOne(orderId: string, userId: string) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        stockReservation: { select: stockSummarySelect },
        catalogProduct: { select: { id: true, name: true } },
        estates: true,
        fulfilling_estate: true,
        parcels: true,
        payments: true,
        deliveries: {
          include: {
            users: true,
            waybills: true,
          },
        },
        invoices: true,
        ratings: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access: the buyer, or the grower whose estate fulfils the order.
    const isGrowerOwner = order.fulfilling_estate?.ownerId === userId;
    if (order.buyerId !== userId && !isGrowerOwner) {
      throw new BadRequestException('Access denied');
    }
    if (isGrowerOwner && order.buyerId !== userId) {
      // Growers see fulfilment data, not the buyer's payment/invoice records.
      const { payments: _p, invoices: _i, ratings: _r, ...rest } = order;
      return {
        ...rest,
        payments: [],
        invoices: [],
        ratings: [],
        growerPaymentSummary: growerPaymentSummaryFromOrder(order),
      };
    }

    const shipmentTracking = await this.buildBuyerShipmentTracking(order.id, order.createdAt);

    const [enriched] = await enrichOrdersWithCatalogReserve(this.prisma, [order]);
    return { ...enriched, shipmentTracking };
  }

  async initiatePayment(_orderId: string, _buyerId: string, _paymentData: {
    paymentMethod: string;
    transactionId?: string;
  }) {
    // Keep the legacy route explicit for old clients, but never accept a client
    // supplied transaction ID as proof that funds have arrived.
    throw new ForbiddenException(
      'Payments are confirmed by Vera after the bank transfer is received. A buyer cannot confirm payment.',
    );
  }
}
