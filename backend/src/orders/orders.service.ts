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
      const orderId = crypto.randomUUID();
      await tx.orders.create({ data: { id: orderId,
        orderNumber: `BIOVERA-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        buyerId, clientRequestId: data.clientRequestId, requestHash, estateId: platformEstateId, fulfillingEstateId: priced.estateId || null,
        sourceCatalogId: priced.productId, productName: data.productName, quantity: data.quantity, unit: data.unit,
        unitPrice: priced.unitPrice, totalAmount: priced.totalAmount, deliveryAddress: { ...data.deliveryAddress },
        deliveryNotes: data.deliveryNotes, status: 'PENDING', updatedAt: new Date(),
        order_items: { create: { id: crypto.randomUUID(), productName: data.productName, quantity: data.quantity,
          unitPrice: priced.unitPrice, batchId: priced.batchId } },
      } });
      // Link item.inventoryId only under the stock lock; early FK key-share locks can deadlock concurrent checkouts.
      if (priced.inventoryId) await reserveOrderStock(tx, orderId, priced.inventoryId, buyerId);
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

    void this.notificationsService
      .notifyAdminsForNewOrder({
        orderNumber: order.orderNumber,
        productName: data.productName,
        totalAmount,
        buyerLabel,
        estateLabel: estateName,
        isPreOrder: false,
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
    const order = await this.prisma.orders.findUnique({ where: { id: orderId }, include: { stockReservation: { select: stockSummarySelect }, order_items: true } });
    if (!order) throw new NotFoundException('Order not found');
    const batchId = order.order_items.find(i => i.batchId)?.batchId;
    const candidates = !order.stockReservation && ['PENDING', 'APPROVED', 'PAID', 'CONFIRMED'].includes(order.status)
      ? await this.prisma.inventory.findMany({ where: { productName: order.productName, unit: order.unit,
          ...(order.fulfillingEstateId ? { estateId: order.fulfillingEstateId } : {}), ...(batchId ? { batches: { some: { id: batchId } } } : {}),
          status: 'AVAILABLE', quantity: { gte: order.quantity }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, take: 200,
          select: { id: true, quantity: true, unit: true, expiresAt: true, estates: { select: { name: true } }, hubs: { select: { name: true, city: true } } } }) : [];
    return { orderId, reservation: order.stockReservation, quantity: order.quantity, unit: order.unit, candidates };
  }
  async reserveStock(orderId: string, inventoryId: string, actor: string) {
    return this.prisma.$transaction(tx => reserveOrderStock(tx, orderId, inventoryId, actor));
  }
  private async cancelTx(tx: import('@prisma/client').Prisma.TransactionClient, orderId: string, actor: string) {
    const order = await tx.orders.findUnique({ where: { id: orderId }, include: { payments: true, deliveries: true } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'CANCELLED') return order;
    if (!['PENDING', 'APPROVED'].includes(order.status) || order.payments || order.deliveries) throw new BadRequestException('Only unpaid, undispatched orders can be cancelled here. Paid orders require finance review.');
    await releaseOrderStock(tx, orderId, actor);
    return tx.orders.update({ where: { id: orderId }, data: { status: 'CANCELLED', updatedAt: new Date() } });
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
    return this.prisma.orders.findMany({
      where: { buyerId },
      include: {
        stockReservation: { select: stockSummarySelect },
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

    return this.prisma.orders.findMany({
      where,
      include: {
        stockReservation: { select: stockSummarySelect },
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
    return this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
      const order = await tx.orders.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundException('Order not found');
      if (order.status === 'APPROVED') return order;
      if (order.status !== 'PENDING') throw new BadRequestException(`Order can only be approved from PENDING (current: ${order.status})`);
      await requireOrderStock(tx, orderId);
      return tx.orders.update({ where: { id: orderId }, data: { status: 'APPROVED', updatedAt: new Date() } });
    });
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

    // Check access
    if (order.buyerId !== userId) {
      throw new BadRequestException('Access denied');
    }

    const shipmentTracking = await this.buildBuyerShipmentTracking(order.id, order.createdAt);

    return { ...order, shipmentTracking };
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
