import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
  ) {}

  async create(buyerId: string, data: {
    estateId: string;
    parcelId?: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    deliveryAddress: any;
    deliveryNotes?: string;
  }) {
    // Verify estate exists
    const estate = await this.prisma.estates.findUnique({
      where: { id: data.estateId },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    // Generate order number
    const orderNumber = `BIOVERA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const totalAmount = data.quantity * data.unitPrice;

    // Create order
    const order = await this.prisma.orders.create({
      data: {
        id: crypto.randomUUID(),
        orderNumber,
        buyerId,
        estateId: data.estateId,
        parcelId: data.parcelId,
        productName: data.productName,
        quantity: data.quantity,
        unit: data.unit,
        unitPrice: data.unitPrice,
        totalAmount,
        deliveryAddress: data.deliveryAddress,
        deliveryNotes: data.deliveryNotes,
        status: 'PENDING',
        updatedAt: new Date(),
      },
    });

    return order;
  }

  async findAllByBuyer(buyerId: string) {
    return this.prisma.orders.findMany({
      where: { buyerId },
      include: {
        estates: true,
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

  async findOne(orderId: string, userId: string) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        estates: true,
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

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order cannot be paid');
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
