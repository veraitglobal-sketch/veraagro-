import { issueOrderStock, requireOrderStock } from '../orders/order-stock';
import { returnSummarySelect } from './returns.service';
import { linkMissionDelivery } from './mission-delivery';
import { reviewDelivery } from './delivery-review';
import { ReviewDeliveryDto } from './dto/delivery-workflow.dto';
import { durableImage } from '../common/durable-image';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getPickupEstate, getFarmerOwnerUserId } from '../orders/order-fulfillment.util';
import { PaymentsService } from '../payments/payments.service';
import { WaybillsService } from '../waybills/waybills.service';
import { InvoicesService } from '../invoices/invoices.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { receivingCodeFor } from '../digital-handover/receiving-code';

/**
 * Deliveries Service
 * Handles delivery lifecycle and Digital Handshake (QR confirmation)
 */
@Injectable()
export class DeliveriesService {
  private readonly logger = new Logger(DeliveriesService.name);

  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
    private waybillsService: WaybillsService,
    private invoicesService: InvoicesService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Assign delivery to driver
   */
  async assignDelivery(orderId: string, driverId: string) {
    const result = await this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
      const order = await tx.orders.findUnique({ where: { id: orderId }, include: { estates: true, fulfilling_estate: true, payments: true, deliveries: true } });
      if (!order) throw new NotFoundException('Order not found');
      if (order.deliveries) {
        if (order.deliveries.driverId !== driverId || order.deliveries.missionId) throw new BadRequestException('Order already has a different delivery assignment');
        return { delivery: order.deliveries, order, pickup: getPickupEstate(order), created: false };
      }
      if (order.status !== 'PAID' || order.payments?.status !== 'IN_ESCROW') throw new BadRequestException('Order must be paid and held in escrow before assigning delivery');
      await requireOrderStock(tx, orderId);
      const pickup = getPickupEstate(order);
      if (!pickup) throw new BadRequestException('Assign a fulfilling estate first');
      const driver = await tx.users.findUnique({ where: { id: driverId } });
      if (!driver || driver.status !== 'ACTIVE' || !driver.roles.some(role => ['DRIVER', 'LOGISTICS_PARTNER'].includes(role))) throw new BadRequestException('Assign an active logistics account');
      const delivery = await tx.deliveries.create({ data: {
        id: crypto.randomUUID(), deliveryNumber: `DEL-${crypto.randomUUID()}`, orderId, driverId,
        pickupLocation: pickup.polygonCoordinates, pickupAddress: `Estate: ${pickup.name}`,
        deliveryLocation: order.deliveryAddress, deliveryAddress: JSON.stringify(order.deliveryAddress),
        status: 'ASSIGNED', deliveryQRCode: this.generateDeliveryQRCode(orderId), assignedAt: new Date(), updatedAt: new Date(),
      } });
      await tx.orders.update({ where: { id: orderId }, data: { status: 'CONFIRMED', updatedAt: new Date() } });
      return { delivery, order, pickup, created: true };
    });
    // Documents can be retried without duplicating the persisted assignment.
    for (const create of [() => this.waybillsService.generateWaybill(result.delivery.id), () => this.invoicesService.generateInvoice(orderId, result.delivery.id)]) {
      try { await create(); } catch (error) { this.logger.warn(`Delivery document pending: ${error instanceof Error ? error.message : String(error)}`); }
    }
    if (result.created) {
      try {
        await this.notificationsService.create({ userId: driverId, type: 'ACTION_REQUIRED', title: 'New run assigned', message: `New delivery: ${result.order.orderNumber}.`, actionUrl: `/deliveries/${result.delivery.id}` });
        await this.notificationsService.create({ userId: result.pickup.ownerId, type: 'REMINDER', title: 'Van on the way', message: 'A driver has been assigned to collect the load.', actionUrl: `/orders/${orderId}` });
      } catch (error) { this.logger.warn('Delivery assignment notification pending'); }
    }
    return result.delivery;
  }

  async markPickedUp(deliveryId: string, driverId: string) {
    return this.advanceDirectDelivery(deliveryId, driverId, 'PICKED_UP');
  }

  async markInTransit(deliveryId: string, driverId: string) {
    return this.advanceDirectDelivery(deliveryId, driverId, 'IN_TRANSIT');
  }

  private async advanceDirectDelivery(deliveryId: string, driverId: string, target: 'PICKED_UP' | 'IN_TRANSIT') {
    const reference = await this.prisma.deliveries.findUnique({ where: { id: deliveryId } });
    if (!reference || reference.driverId !== driverId) throw new BadRequestException('Access denied');
    const result = await this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${reference.orderId} FOR UPDATE`;
      const delivery = await tx.deliveries.findUniqueOrThrow({ where: { id: deliveryId }, include: { orders: true } });
      if (delivery.driverId !== driverId) throw new BadRequestException('Access denied');
      if (delivery.missionId) throw new BadRequestException('Advance the linked mission to record departure and transit');
      if (['CANCELLED', 'REFUNDED'].includes(delivery.orders.status)) throw new BadRequestException('Order is cancelled or refunded');
      const ranks = { ASSIGNED: 0, PICKED_UP: 1, IN_TRANSIT: 2, DELIVERED: 3, CONFIRMED: 4, COMPLETED: 5 };
      if ((ranks[delivery.status] ?? -1) >= ranks[target]) return { delivery, changed: false };
      if (delivery.status !== (target === 'PICKED_UP' ? 'ASSIGNED' : 'PICKED_UP')) throw new BadRequestException('Complete the preceding delivery step first');
      if (target === 'PICKED_UP') await issueOrderStock(tx, delivery.orderId, driverId);
      else {
        // Historical shipments already on the road have no reservation ledger; never debit them retroactively.
        const reservation = await tx.order_stock_reservations.findUnique({ where: { orderId: delivery.orderId } });
        if (reservation && reservation.status !== 'ISSUED') throw new BadRequestException('Record stock issue at pickup first');
      }
      const updated = await tx.deliveries.update({ where: { id: deliveryId }, data: { status: target, updatedAt: new Date(),
        ...(target === 'PICKED_UP' ? { pickedUpAt: new Date(), pickupSignature: crypto.randomBytes(16).toString('hex') } : { inTransitAt: new Date() }) } });
      await tx.orders.update({ where: { id: delivery.orderId }, data: { status: target, updatedAt: new Date() } });
      return { delivery: { ...updated, orders: delivery.orders }, changed: true };
    });
    if (result.changed && target === 'PICKED_UP') {
      try { await this.notificationsService.create({ userId: result.delivery.orders.buyerId, type: 'SYSTEM', title: 'Order picked up', message: 'Your Bio Vera order has been collected and is on its way.', actionUrl: `/orders/${reference.orderId}` }); }
      catch { this.logger.warn('Pickup notification pending'); }
    }
    const { orders, ...delivery } = result.delivery;
    return delivery;
  }

  /**
   * Digital Handshake: Customer scans QR code to confirm delivery
   * This triggers automatic payment release
   */
  async confirmDelivery(deliveryQRCode: string, buyerId: string) {
    const delivery = await this.prisma.deliveries.findUnique({
      where: { deliveryQRCode },
      include: {
        orders: {
          include: {
            estates: true,
            fulfilling_estate: true,
          },
        },
        users: true,
      },
    });

    if (!delivery) {
      throw new NotFoundException('Invalid QR code');
    }

    if (delivery.orders.buyerId !== buyerId) {
      throw new BadRequestException('This QR code is not for your order');
    }

    // A legacy QR must not bypass the quality/signature gate or reset the receipt clock.
    const handover = await this.prisma.digital_handovers.findUnique({ where: { deliveryId: delivery.id }, select: { id: true } });
    if (handover) return this.confirmBuyerPickup(delivery.id, buyerId);
    if (delivery.missionId) throw new BadRequestException('Complete digital handover before confirming a mission delivery');

    if (delivery.status === 'CONFIRMED' || delivery.status === 'COMPLETED') {
      throw new BadRequestException('Delivery already confirmed');
    }

    if (!['IN_TRANSIT', 'DELIVERED'].includes(delivery.status)) {
      throw new BadRequestException('Delivery must be in transit or delivered before receipt can be confirmed');
    }

    const now = new Date();
    const preservedDockReceiptAt =
      delivery.status === 'DELIVERED' && delivery.deliveredAt ? delivery.deliveredAt : now;

    const prevDelivery = {
      status: delivery.status,
      deliveredAt: delivery.deliveredAt,
      buyerPickupConfirmedAt: delivery.buyerPickupConfirmedAt,
      confirmedAt: delivery.confirmedAt,
      qrScannedAt: delivery.qrScannedAt,
      deliverySignature: delivery.deliverySignature,
    };
    const prevOrderStatus = delivery.orders.status;

    await this.prisma.$transaction(async (tx) => {
      await tx.deliveries.update({
        where: { id: delivery.id },
        data: {
          status: 'CONFIRMED',
          deliveredAt: preservedDockReceiptAt,
          buyerPickupConfirmedAt: now,
          confirmedAt: now,
          qrScannedAt: now,
          deliverySignature:
            delivery.deliverySignature?.trim() || crypto.randomBytes(16).toString('hex'),
        },
      });
      await tx.orders.update({
        where: { id: delivery.orderId },
        data: { status: 'DELIVERED' },
      });
    });

    try {
      await this.paymentsService.releaseEscrowPayment(delivery.orderId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`confirmDelivery escrow failed for delivery ${delivery.id}, rolling back: ${msg}`);
      await this.prisma.$transaction(async (tx) => {
        await tx.deliveries.update({
          where: { id: delivery.id },
          data: {
            status: prevDelivery.status,
            deliveredAt: prevDelivery.deliveredAt,
            buyerPickupConfirmedAt: prevDelivery.buyerPickupConfirmedAt,
            confirmedAt: prevDelivery.confirmedAt,
            qrScannedAt: prevDelivery.qrScannedAt,
            deliverySignature: prevDelivery.deliverySignature,
          },
        });
        await tx.orders.update({
          where: { id: delivery.orderId },
          data: { status: prevOrderStatus },
        });
      });
      if (e instanceof HttpException) {
        throw e;
      }
      throw new BadRequestException(
        'Escrow payout failed. The state was restored — try scanning again or confirm through the portal.',
      );
    }

    const farmerUid = getFarmerOwnerUserId(delivery.orders);
    if (farmerUid) {
      await this.notificationsService.create({
        userId: farmerUid,
        type: 'SYSTEM',
        title: 'Buyer confirmed receipt',
        message: `Payment for order ${delivery.orders.orderNumber} has been released.`,
      });
    }

    await this.notificationsService.create({
      userId: delivery.driverId,
      type: 'SYSTEM',
      title: 'Delivery completed',
      message: `The buyer confirmed receipt of ${delivery.deliveryNumber}.`,
    });

    return {
      message: 'Delivery confirmed. Payment released.',
      delivery,
    };
  }

  /**
   * Buyer confirms physical takeover after warehouse digital handover (`DELIVERED` + completed handover).
   * Starts the 24h buyer issue window (`buyerPickupConfirmedAt`), separate from dock `deliveredAt`.
   * Escrow is released while the delivery is still `DELIVERED` (same gates as payment service), then this
   * confirmation is recorded — so a failed payout does not strand the buyer without a retry path.
   */
  async confirmBuyerPickup(deliveryId: string, buyerId: string) {
    const delivery = await this.prisma.deliveries.findUnique({
      where: { id: deliveryId },
      include: {
        orders: {
          select: {
            buyerId: true,
            orderNumber: true,
            estateId: true,
            fulfillingEstateId: true,
            estates: { select: { ownerId: true } },
            fulfilling_estate: { select: { ownerId: true } },
          },
        },
        digital_handovers: true,
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }
    if (delivery.orders.buyerId !== buyerId) {
      throw new BadRequestException('This delivery is not linked to your buyer account.');
    }
    if (delivery.buyerPickupConfirmedAt) {
      return { message: 'Pickup already confirmed.', delivery };
    }
    if (delivery.status !== 'DELIVERED') {
      throw new BadRequestException(
        'Pickup can only be confirmed after the shipment is marked received at the dock (digital handover completed).',
      );
    }
    const dh = delivery.digital_handovers;
    if (!dh || dh.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Complete store/warehouse digital handover with signature first, then confirm pickup here.',
      );
    }

    await this.paymentsService.releaseEscrowPayment(delivery.orderId);

    const now = new Date();
    const receipt = await this.prisma.deliveries.updateMany({
      where: { id: delivery.id, buyerPickupConfirmedAt: null },
      data: {
        status: 'CONFIRMED',
        buyerPickupConfirmedAt: now,
        confirmedAt: delivery.confirmedAt ?? now,
        qrScannedAt: delivery.qrScannedAt ?? now,
        deliverySignature:
          delivery.deliverySignature?.trim() || crypto.randomBytes(16).toString('hex'),
      },
    });

    const updated = await this.prisma.deliveries.findUniqueOrThrow({ where: { id: delivery.id } });
    if (!receipt.count) return { message: 'Pickup already confirmed.', delivery: updated };

    const farmerUid = getFarmerOwnerUserId(delivery.orders);
    if (farmerUid) {
      await this.notificationsService.create({
        userId: farmerUid,
        type: 'SYSTEM',
        title: 'Buyer confirmed receipt',
        message: `Payment for order ${delivery.orders.orderNumber} has been released.`,
      }).catch((error) => this.logger.warn(`Receipt notification failed: ${error}`));
    }

    await this.notificationsService.create({
      userId: delivery.driverId,
      type: 'SYSTEM',
      title: 'Delivery completed',
      message: `The buyer confirmed receipt of ${delivery.deliveryNumber}.`,
    }).catch((error) => this.logger.warn(`Receipt notification failed: ${error}`));

    await this.notificationsService.create({
      userId: buyerId,
      type: 'SYSTEM',
      title: 'Receipt confirmed',
      message: `Receipt of order ${delivery.orders.orderNumber} is recorded. You can report an issue with photos within 24 hours.`,
      actionUrl: `/buyer-portal/orders/${delivery.orderId}`,
    }).catch((error) => this.logger.warn(`Receipt notification failed: ${error}`));

    return {
      message:
        'Pickup confirmed. Payment released. You can report an issue with photos within 24 hours from this confirmation.',
      delivery: updated,
    };
  }

  /**
   * Get delivery by QR code (for driver/customer scanning)
   */
  async getDeliveryByQR(qrCode: string) {
    return this.prisma.deliveries.findUnique({
      where: { deliveryQRCode: qrCode },
      include: {
        orders: {
          include: {
            estates: true,
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * Generate unique QR code for delivery
   */
  private generateDeliveryQRCode(orderId: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `BIOVERA-DEL-${orderId.substring(0, 8)}-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Get all deliveries for driver
   */
  async getDriverDeliveries(driverId: string) {
    return this.prisma.deliveries.findMany({
      where: { driverId },
      include: {
        orders: {
          include: {
            estates: true,
            users: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all deliveries for buyer
   */
  async getBuyerDeliveries(buyerId: string, status?: string) {
    // First get all orders for this buyer
    const buyerOrders = await this.prisma.orders.findMany({
      where: { buyerId },
      select: { id: true },
    });

    const orderIds = buyerOrders.map((o) => o.id);

    const where: any = {
      orderId: {
        in: orderIds,
      },
    };

    if (status) {
      where.status = status;
    }

    return this.prisma.deliveries.findMany({
      where,
      include: {
        returnCase: { select: returnSummarySelect },
        buyer_delivery_issues: { orderBy: { createdAt: 'desc' }, select: { id: true, description: true, status: true, outcome: true, resolution: true, resolvedAt: true } },
        waybills: {
          select: {
            id: true,
            waybillNumber: true,
            pdfUrl: true,
            generatedAt: true,
          },
        },
        digital_handovers: {
          select: {
            id: true,
            status: true,
            disputes: { orderBy: { createdAt: 'desc' }, select: { id: true, reason: true, status: true, outcome: true, resolution: true, resolvedAt: true } },
          },
        },
        orders: {
          include: {
            estates: {
              include: {
                users: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get delivery by order ID (for buyer)
   */
  /**
   * Buyer's receiving code (+ QR) for a shipment on its way. The carrier scans or types it at the dock
   * to start the digital handover — proof the truck is physically at this buyer.
   */
  async getBuyerReceivingCode(deliveryId: string, buyerId: string) {
    const delivery = await this.prisma.deliveries.findUnique({
      where: { id: deliveryId },
      select: {
        id: true,
        status: true,
        deliveryNumber: true,
        orders: { select: { buyerId: true, orderNumber: true } },
        digital_handovers: { select: { id: true, status: true } },
      },
    });
    if (!delivery || delivery.orders.buyerId !== buyerId) throw new NotFoundException('Delivery not found');
    if (!['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(delivery.status) || delivery.digital_handovers) {
      throw new BadRequestException('Receiving code is only available until the handover has started');
    }
    const code = receivingCodeFor(delivery.id);
    const qrDataUrl = await QRCode.toDataURL(code, { margin: 1, width: 320 });
    return {
      deliveryId: delivery.id,
      deliveryNumber: delivery.deliveryNumber,
      orderNumber: delivery.orders.orderNumber,
      status: delivery.status,
      code,
      qrDataUrl,
    };
  }

  async getBuyerShipment(id: string, buyerId: string) {
    const delivery = await this.prisma.deliveries.findFirst({ where: { id, orders: { buyerId } }, select: { orderId: true } });
    if (!delivery) throw new NotFoundException('Delivery not found');
    return this.getDeliveryByOrder(delivery.orderId, buyerId);
  }

  async getDeliveryByOrder(orderId: string, buyerId: string) {
    // First verify that the order belongs to this buyer
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      select: { buyerId: true },
    });

    if (!order || order.buyerId !== buyerId) {
      throw new NotFoundException('Delivery not found for this order');
    }

    const delivery = await this.prisma.deliveries.findFirst({
      where: {
        orderId,
      },
      include: {
        returnCase: { select: returnSummarySelect },
        buyer_delivery_issues: { orderBy: { createdAt: 'desc' } },
        digital_handovers: {
          select: { id: true, status: true, disputes: { orderBy: { createdAt: 'desc' }, select: { id: true, status: true, reason: true, outcome: true, resolution: true, resolvedAt: true } } },
        },
        orders: {
          include: {
            estates: {
              include: {
                users: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            payments: true,
          },
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found for this order');
    }

    return delivery;
  }

  /**
   * Buyer reports a problem with a received shipment. Requires at least one photo and a description.
   * Accepts only within 24 hours of buyer pickup / takeover confirmation (`buyerPickupConfirmedAt` or legacy QR `confirmedAt`).
   */
  async reportBuyerDeliveryIssue(
    buyerId: string,
    dto: { deliveryId: string; description: string; photosBase64: string[] },
  ) {
    const desc = (dto.description ?? '').trim();
    if (desc.length < 20) {
      throw new BadRequestException('Description must be at least 20 characters.');
    }
    if (desc.length > 8000) {
      throw new BadRequestException('Description is too long.');
    }

    const rawPhotos = Array.isArray(dto.photosBase64)
      ? dto.photosBase64.map((p) => (typeof p === 'string' ? p.trim() : '')).filter(Boolean)
      : [];
    if (rawPhotos.length === 0) {
      throw new BadRequestException('At least one photo of the shipment is required.');
    }
    if (rawPhotos.length > 6) {
      throw new BadRequestException('Maximum 6 photos allowed.');
    }

    const delivery = await this.prisma.deliveries.findUnique({
      where: { id: dto.deliveryId },
      include: {
        orders: { select: { buyerId: true, orderNumber: true } },
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found.');
    }
    if (delivery.orders.buyerId !== buyerId) {
      throw new BadRequestException('This delivery is not linked to your buyer account.');
    }

    const receiptAt = delivery.buyerPickupConfirmedAt ?? delivery.confirmedAt;
    if (!receiptAt) {
      throw new BadRequestException(
        'Confirm takeover in the buyer portal (Deliveries) after receipt at the warehouse — or scan the delivery QR when offered. The 24-hour report window starts only after that confirmation.',
      );
    }

    const windowMs = 24 * 60 * 60 * 1000;
    if (Date.now() - receiptAt.getTime() > windowMs) {
      throw new BadRequestException(
        'The 24-hour reporting window from your pickup/receipt confirmation has expired. Please contact Bio Vera operations.',
      );
    }

    const photoUrls = await Promise.all(rawPhotos.map((photo) => durableImage(photo)));
    const digest = crypto.createHash('sha256').update(JSON.stringify([delivery.id, buyerId, desc, photoUrls])).digest('hex');
    const issueId = `${digest.slice(0, 8)}-${digest.slice(8, 12)}-${digest.slice(12, 16)}-${digest.slice(16, 20)}-${digest.slice(20, 32)}`;
    await this.prisma.buyer_delivery_issues.createMany({
      data: [{ id: issueId, deliveryId: delivery.id, buyerId, description: desc, photoUrls }],
      skipDuplicates: true,
    });
    // The review inbox is queryable even when a push/email service is unavailable.

    this.logger.log(
      `buyer_delivery_issue created id=${issueId} delivery=${delivery.deliveryNumber} order=${delivery.orders.orderNumber} buyer=${buyerId} photos=${photoUrls.length}`,
    );

    return {
      id: issueId,
      message: 'Report received. Our team will review the photos and description.',
    };
  }

  async linkMission(actor: string, missionId: string, orderId: string) {
    const delivery = await linkMissionDelivery(this.prisma, actor, missionId, orderId);
    // The durable link survives optional document generation; repeating the action repairs missing documents.
    try {
      if (!await this.prisma.waybills.findUnique({ where: { deliveryId: delivery.id } })) {
        await this.waybillsService.generateWaybill(delivery.id);
      }
    } catch (e) { this.logger.warn(`Linked delivery waybill pending: ${e}`); }
    try { await this.invoicesService.generateInvoice(orderId, delivery.id); }
    catch (e) { this.logger.warn(`Linked delivery invoice pending: ${e}`); }
    const [waybill, invoice] = await Promise.all([
      this.prisma.waybills.findUnique({ where: { deliveryId: delivery.id }, select: { id: true } }),
      this.prisma.invoices.findUnique({ where: { deliveryId: delivery.id }, select: { id: true } }),
    ]);
    return { ...delivery, documentsReady: !!waybill && !!invoice };
  }

  async review(actor: string, kind: string, id: string, dto: ReviewDeliveryDto) {
    const row = await reviewDelivery(this.prisma, actor, kind, id, dto);
    try {
      const issue = kind === 'issue' ? await this.prisma.buyer_delivery_issues.findUnique({ where: { id }, include: { deliveries: { select: { orderId: true } } } }) : null;
      const dispute = kind === 'dispute' ? await this.prisma.disputes.findUnique({ where: { id }, include: { digital_handovers: { include: { deliveries: { select: { orderId: true, orders: { select: { buyerId: true } } } } } } } }) : null;
      const buyerId = issue?.buyerId || dispute?.digital_handovers.deliveries.orders.buyerId;
      const orderId = issue?.deliveries.orderId || dispute?.digital_handovers.deliveries.orderId;
      if (buyerId) await this.notificationsService.create({ userId: buyerId, type: 'SYSTEM', title: 'Delivery report updated',
        message: dto.action === 'RESOLVE' ? 'The decision and explanation are available on your delivery.' : 'Operations is reviewing your report.',
        actionUrl: `/buyer-portal/orders/${orderId}` }).catch((e) => this.logger.warn(`Review notification failed: ${e}`));
    } catch (e) { this.logger.warn(`Review notification pending: ${e}`); }
    return row;
  }

  async getLinkOptions() {
    const [missions, orders, pendingDocuments] = await Promise.all([
      this.prisma.missions.findMany({ where: { logisticsPartnerId: { not: null }, delivery: null,
        status: { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'READY_FOR_LOADING', 'PICKED_UP', 'IN_TRANSIT'] } }, take: 200, orderBy: { createdAt: 'desc' },
        select: { id: true, missionNumber: true, growerId: true, orderId: true, status: true, pickupAddress: true,
          batches: { select: { batchId: true, productName: true } } } }),
      this.prisma.orders.findMany({ where: { status: { in: ['PAID', 'CONFIRMED', 'PICKED_UP', 'IN_TRANSIT'] }, payments: { status: 'IN_ESCROW' } },
        take: 200, orderBy: { createdAt: 'desc' }, select: { id: true, orderNumber: true, productName: true, quantity: true, unit: true,
          estates: { select: { ownerId: true, name: true } }, fulfilling_estate: { select: { ownerId: true, name: true } } } }),
      this.prisma.deliveries.findMany({ where: { missionId: { not: null }, OR: [{ waybills: null }, { invoices: null }] },
        take: 200, orderBy: { createdAt: 'desc' }, select: { id: true, missionId: true, orderId: true, deliveryNumber: true } }),
    ]);
    return { missions, orders, pendingDocuments };
  }

  async getDeliveryReviewEvidence(kind: string, id: string) {
    const row = kind === 'issue'
      ? await this.prisma.buyer_delivery_issues.findUnique({ where: { id }, select: { id: true, description: true, photoUrls: true, createdAt: true, status: true, resolution: true, outcome: true, resolvedAt: true, resolvedBy: true, revision: true } })
      : kind === 'dispute' ? await this.prisma.disputes.findUnique({ where: { id }, select: { id: true, reason: true, evidencePhotos: true, status: true, createdAt: true, resolution: true, outcome: true, resolvedAt: true, resolvedBy: true, revision: true } }) : null;
    if (!row) throw new NotFoundException('Delivery report not found');
    return row;
  }

  async getDeliveryReviewInbox() {
    const [issues, disputes] = await Promise.all([
      this.prisma.buyer_delivery_issues.findMany({ orderBy: { createdAt: 'desc' }, take: 100,
        select: { id: true, description: true, createdAt: true, deliveryId: true, status: true, resolution: true, outcome: true, resolvedAt: true, resolvedBy: true, revision: true,
          deliveries: { select: { deliveryNumber: true, orderId: true } } } }),
      this.prisma.disputes.findMany({ orderBy: { createdAt: 'desc' }, take: 100,
        select: { id: true, reason: true, status: true, createdAt: true, resolution: true, outcome: true, resolvedAt: true, resolvedBy: true, revision: true,
          digital_handovers: { select: { deliveryId: true, deliveries: { select: { deliveryNumber: true, orderId: true } } } } } }),
    ]);
    return { issues, disputes };
  }
}
