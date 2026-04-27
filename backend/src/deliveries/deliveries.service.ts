import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getPickupEstate, getFarmerOwnerUserId } from '../orders/order-fulfillment.util';
import { PaymentsService } from '../payments/payments.service';
import { WaybillsService } from '../waybills/waybills.service';
import { InvoicesService } from '../invoices/invoices.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';

/**
 * Deliveries Service
 * Handles delivery lifecycle and Digital Handshake (QR confirmation)
 */
@Injectable()
export class DeliveriesService {
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
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        estates: true,
        fulfilling_estate: true,
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'PAID') {
      throw new BadRequestException('Order must be paid before assigning delivery');
    }

    const pickup = getPickupEstate(order);
    if (!pickup) {
      throw new BadRequestException(
        'Cannot assign delivery: in admin, link the fulfilling estate to this order, or the buyer may not be tied to a real estate (legacy record).',
      );
    }

    // Generate unique QR code for delivery confirmation
    const deliveryQRCode = this.generateDeliveryQRCode(orderId);

    // Create delivery
    const delivery = await this.prisma.deliveries.create({
      data: {
        id: crypto.randomUUID(),
        deliveryNumber: `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        orderId,
        driverId,
        pickupLocation: pickup.polygonCoordinates,
        pickupAddress: `Estate: ${pickup.name}`,
        deliveryLocation: order.deliveryAddress,
        deliveryAddress: JSON.stringify(order.deliveryAddress),
        status: 'ASSIGNED',
        deliveryQRCode,
        assignedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Generate waybill automatically
    await this.waybillsService.generateWaybill(delivery.id);

    // Generate invoice automatically
    await this.invoicesService.generateInvoice(orderId, delivery.id);

    // Notify driver
    await this.notificationsService.create({
      userId: driverId,
      type: 'ACTION_REQUIRED',
      title: 'New run assigned',
      message: `New delivery: ${order.orderNumber}. Van arriving in ~20 minutes.`,
      actionUrl: `/deliveries/${delivery.id}`,
    });

    // Notify farmer
    await this.notificationsService.create({
      userId: pickup.ownerId,
      type: 'REMINDER',
      title: 'Van on the way',
      message: `Driver ${driverId} will arrive in ~20 minutes to pick up the load.`,
      actionUrl: `/orders/${orderId}`,
    });

    // Update order status
    await this.prisma.orders.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
    });

    return delivery;
  }

  /**
   * Mark delivery as picked up
   */
  async markPickedUp(deliveryId: string, driverId: string) {
    const delivery = await this.prisma.deliveries.findUnique({
      where: { id: deliveryId },
      include: { orders: { include: { estates: true } } },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.driverId !== driverId) {
      throw new BadRequestException('Access denied');
    }

    if (delivery.status !== 'ASSIGNED') {
      throw new BadRequestException('Delivery must be assigned first');
    }

    // Update delivery
    const updated = await this.prisma.deliveries.update({
      where: { id: deliveryId },
      data: {
        status: 'PICKED_UP',
        pickedUpAt: new Date(),
        pickupSignature: crypto.randomBytes(16).toString('hex'), // Digital signature
      },
    });

    // Update order
    await this.prisma.orders.update({
      where: { id: delivery.orderId },
      data: { status: 'PICKED_UP' },
    });

    // Notify buyer
    await this.notificationsService.create({
      userId: delivery.orders.buyerId,
      type: 'SYSTEM',
      title: 'Order picked up',
      message: `Your Bio Vera order is packed and in transit.`,
      actionUrl: `/orders/${delivery.orderId}`,
    });

    return updated;
  }

  /**
   * Mark delivery as in transit
   */
  async markInTransit(deliveryId: string, driverId: string) {
    const delivery = await this.prisma.deliveries.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery || delivery.driverId !== driverId) {
      throw new BadRequestException('Access denied');
    }

    return this.prisma.deliveries.update({
      where: { id: deliveryId },
      data: {
        status: 'IN_TRANSIT',
        inTransitAt: new Date(),
      },
    });
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

    if (delivery.status === 'CONFIRMED' || delivery.status === 'COMPLETED') {
      throw new BadRequestException('Delivery already confirmed');
    }

    // Update delivery
    const now = new Date();
    await this.prisma.deliveries.update({
      where: { id: delivery.id },
      data: {
        status: 'CONFIRMED',
        deliveredAt: now,
        confirmedAt: now,
        qrScannedAt: now,
        deliverySignature: crypto.randomBytes(16).toString('hex'),
      },
    });

    // Update order
    await this.prisma.orders.update({
      where: { id: delivery.orderId },
      data: { status: 'DELIVERED' },
    });

    // Release escrow payment automatically
    await this.paymentsService.releaseEscrowPayment(delivery.orderId);

    const farmerUid = getFarmerOwnerUserId(delivery.orders);
    if (farmerUid) {
      await this.notificationsService.create({
        userId: farmerUid,
        type: 'SYSTEM',
        title: 'Delivery confirmed',
        message: `Payment released for order ${delivery.orders.orderNumber}.`,
      });
    }

    await this.notificationsService.create({
      userId: delivery.driverId,
      type: 'SYSTEM',
      title: 'Delivery completed',
      message: `Payment released for delivery ${delivery.deliveryNumber}.`,
    });

    return {
      message: 'Delivery confirmed. Payment released.',
      delivery,
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
        waybills: {
          select: {
            id: true,
            waybillNumber: true,
            pdfUrl: true,
            generatedAt: true,
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
}
