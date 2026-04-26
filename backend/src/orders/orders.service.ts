import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ensureVeraPlatformEstateId, isSystemEstateId } from './order-fulfillment.util';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
  ) {}

  async create(buyerId: string, data: {
    /** Buyer/intent: farm or product origin (optional). Line seller FK is always the Vera platform estate. */
    estateId?: string;
    parcelId?: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    deliveryAddress: any;
    deliveryNotes?: string;
  }) {
    const platformEstateId = await ensureVeraPlatformEstateId(this.prisma);

    let deliveryNotes = data.deliveryNotes;
    if (data.estateId) {
      const ref = await this.prisma.estates.findUnique({
        where: { id: data.estateId },
        select: { id: true, name: true },
      });
      const line = ref
        ? `Operativa: traženo gazdinstvo/parcela: ${ref.name} (${ref.id}).`
        : `Operativa: referenca u zahtevu: ${data.estateId} (nije pronađena u sistemu).`;
      deliveryNotes = [line, data.deliveryNotes].filter(Boolean).join(' ');
    }

    // `parcelId` must belong to `orders.estateId`; line seller is platform, so do not wire buyer parcel here.
    const parcelId: string | undefined = undefined;

    // Generate order number
    const orderNumber = `BIOVERA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const totalAmount = data.quantity * data.unitPrice;

    // Create order (seller = Vera; fulfilling farm is set later in admin)
    const order = await this.prisma.orders.create({
      data: {
        id: crypto.randomUUID(),
        orderNumber,
        buyerId,
        estateId: platformEstateId,
        fulfillingEstateId: null,
        parcelId,
        productName: data.productName,
        quantity: data.quantity,
        unit: data.unit,
        unitPrice: data.unitPrice,
        totalAmount,
        deliveryAddress: data.deliveryAddress,
        deliveryNotes,
        status: 'PENDING',
        updatedAt: new Date(),
      },
    });

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
    const estateName = 'Vera (dodela gazdinstva u operativi)';

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
    const order = await this.prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (fulfillingEstateId) {
      if (isSystemEstateId(fulfillingEstateId)) {
        throw new BadRequestException(
          'Fulfilling estate must be a real farm, not a system / platform record.',
        );
      }
      const e = await this.prisma.estates.findUnique({
        where: { id: fulfillingEstateId },
        select: { id: true },
      });
      if (!e) {
        throw new NotFoundException('Estate not found');
      }
    }
    return this.prisma.orders.update({
      where: { id: orderId },
      data: {
        fulfillingEstateId: fulfillingEstateId ?? null,
        updatedAt: new Date(),
      },
      include: {
        fulfilling_estate: { select: { id: true, name: true } },
        estates: { select: { id: true, name: true } },
      },
    });
  }

  async findAllByBuyer(buyerId: string) {
    return this.prisma.orders.findMany({
      where: { buyerId },
      include: {
        estates: true,
        fulfilling_estate: true,
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Admin: accept a placed order (PENDING → APPROVED). Buyer can pay only after this.
   */
  async approveOrderByAdmin(orderId: string) {
    const order = await this.prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        `Order can only be approved from PENDING (current: ${order.status})`,
      );
    }
    return this.prisma.orders.update({
      where: { id: orderId },
      data: { status: 'APPROVED', updatedAt: new Date() },
      include: {
        users: { select: { id: true, email: true, firstName: true, lastName: true } },
        estates: { select: { id: true, name: true } },
        fulfilling_estate: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Admin: set order status (manual override, e.g. PENDING → CONFIRMED, or CANCELLED).
   */
  async updateStatusByAdmin(orderId: string, status: string) {
    if (typeof status !== 'string' || !status.trim()) {
      throw new BadRequestException('status is required');
    }
    const next = status.trim() as OrderStatus;
    if (!Object.values(OrderStatus).includes(next)) {
      throw new BadRequestException(
        `Invalid status. Use one of: ${Object.values(OrderStatus).join(', ')}`,
      );
    }
    const order = await this.prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return this.prisma.orders.update({
      where: { id: orderId },
      data: {
        status: next,
        updatedAt: new Date(),
        completedAt:
          next === 'COMPLETED' ? new Date() : next === 'CANCELLED' || next === 'REFUNDED' ? null : order.completedAt,
      },
    });
  }

  async findOne(orderId: string, userId: string) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
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

    return order;
  }

  async initiatePayment(orderId: string, buyerId: string, paymentData: {
    paymentMethod: string;
    transactionId?: string;
  }) {
    const order = await this.findOne(orderId, buyerId);

    if (order.status !== 'APPROVED') {
      throw new BadRequestException(
        order.status === 'PENDING'
          ? 'Vera has not yet accepted this order. You can pay after we confirm (status will change to “approved”).'
          : 'This order cannot be paid in its current state.',
      );
    }

    // Create payment in escrow
    const payment = await this.paymentsService.createEscrowPayment(
      orderId,
      order.totalAmount,
      paymentData,
    );

    // Update order status
    await this.prisma.orders.update({
      where: { id: orderId },
      data: { status: 'PAID' },
    });

    return payment;
  }
}
