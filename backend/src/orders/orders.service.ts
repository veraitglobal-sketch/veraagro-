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
import { InvoicesService } from '../invoices/invoices.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
    private invoicesService: InvoicesService,
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
        ? `Ops: requested estate/parcel: ${ref.name} (${ref.id}).`
        : `Ops: request references estate ${data.estateId} (not found in system).`;
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
   * Use after APPROVED, when the buyer’s wire is reconciled. Idempotent: fails if a payment already exists.
   */
  async confirmBankPaymentByAdmin(
    orderId: string,
    body?: { transactionId?: string },
  ) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== 'APPROVED') {
      throw new BadRequestException(
        `Bank transfer can only be confirmed when the order is APPROVED (current: ${order.status})`,
      );
    }
    if (order.payments) {
      throw new BadRequestException(
        'A payment is already registered for this order. Use the existing payment record.',
      );
    }
    const tx = body?.transactionId?.trim() || undefined;
    await this.paymentsService.createEscrowPayment(orderId, order.totalAmount, {
      paymentMethod: 'BANK_TRANSFER',
      transactionId: tx,
    });
    await this.prisma.orders.update({
      where: { id: orderId },
      data: { status: 'PAID', updatedAt: new Date() },
    });
    try {
      await this.invoicesService.generateInvoice(orderId);
    } catch (e: unknown) {
      const detail = e instanceof Error ? e.message : String(e);
      this.logger.error(`generateInvoice after bank payment failed for ${orderId}: ${detail}`);
    }
    const withRelations = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
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

    try {
      await this.invoicesService.generateInvoice(orderId);
    } catch (e: unknown) {
      const detail = e instanceof Error ? e.message : String(e);
      this.logger.error(`generateInvoice after buyer payment failed for ${orderId}: ${detail}`);
    }

    return payment;
  }
}
