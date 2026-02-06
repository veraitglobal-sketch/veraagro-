import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { ConfigService } from '@nestjs/config';

/**
 * Payments Service
 * Handles Escrow logic and Split-Payment distribution
 */
@Injectable()
export class PaymentsService {
  private readonly farmerPercentage: number;
  private readonly driverPercentage: number;
  private readonly platformFeePercentage: number;

  constructor(
    private prisma: PrismaService,
    private walletsService: WalletsService,
    private configService: ConfigService,
  ) {
    // Configurable split percentages (can be moved to env)
    this.farmerPercentage = parseFloat(
      this.configService.get<string>('PAYMENT_FARMER_PERCENTAGE', '70'),
    );
    this.driverPercentage = parseFloat(
      this.configService.get<string>('PAYMENT_DRIVER_PERCENTAGE', '20'),
    );
    this.platformFeePercentage = parseFloat(
      this.configService.get<string>('PAYMENT_PLATFORM_FEE', '10'),
    );
  }

  /**
   * Create escrow payment
   * Money is locked until delivery is confirmed
   */
  async createEscrowPayment(
    orderId: string,
    totalAmount: number,
    paymentData: {
      paymentMethod: string;
      transactionId?: string;
    },
  ) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: { 
        users: true,
        estates: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Calculate split amounts
    const farmerAmount = (totalAmount * this.farmerPercentage) / 100;
    const driverAmount = (totalAmount * this.driverPercentage) / 100;
    const platformFee = (totalAmount * this.platformFeePercentage) / 100;

    const splitDetails = {
      farmer: {
        userId: order.estates.ownerId,
        amount: farmerAmount,
        percentage: this.farmerPercentage,
        releasedAt: null,
      },
      driver: {
        userId: null, // Will be set when delivery is assigned
        amount: driverAmount,
        percentage: this.driverPercentage,
        releasedAt: null,
      },
      platform: {
        amount: platformFee,
        percentage: this.platformFeePercentage,
        releasedAt: null,
      },
    };

    // Create payment in escrow
    const payment = await this.prisma.payments.create({
      data: {
        id: crypto.randomUUID(),
        orderId,
        totalAmount,
        farmerAmount,
        driverAmount,
        platformFee,
        status: 'IN_ESCROW',
        paymentMethod: paymentData.paymentMethod,
        transactionId: paymentData.transactionId,
        splitDetails,
        updatedAt: new Date(),
      },
    });

    return payment;
  }

  /**
   * Release escrow payment after delivery confirmation
   * Automatically splits money to farmer, driver, and platform
   * Requires: Store Manager signature + Temperature log verification
   */
  async releaseEscrowPayment(orderId: string) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        payments: true,
        deliveries: {
          include: {
            users: true,
            // mission: { // Not in schema
            //   include: {
            //     digitalSignatures: true,
            //     temperatureLogs: true,
            //   },
            // },
          },
        },
        estates: {
          include: {
            users: true,
          },
        },
      },
    });

    const payment = (order as any).payment;
    const delivery = (order as any).delivery;
    
    if (!order || !payment) {
      throw new NotFoundException('Order or payment not found');
    }

    if (payment.status !== 'IN_ESCROW') {
      throw new BadRequestException('Payment is not in escrow');
    }

    if (delivery?.status !== 'CONFIRMED') {
      throw new BadRequestException('Delivery must be confirmed before releasing payment');
    }

    // Financial Escrow Control: Check Store Manager signature
    const storeManagerSignature = delivery?.mission?.digitalSignatures?.find(
      (s: any) => s.signatureType === 'STORE_MANAGER',
    );
    if (!storeManagerSignature) {
      throw new BadRequestException('Store Manager digital signature required before payment release');
    }

    // Financial Escrow Control: Check temperature log verification
    const temperatureLogs = delivery?.mission?.temperature_logs || [];
    if (temperatureLogs.length === 0) {
      throw new BadRequestException('Temperature log must be uploaded and verified before payment release');
    }

    // Verify temperature log is complete (covers entire trip)
    const mission = delivery?.mission;
    if (mission && mission.pickedUpAt && (mission as any).deliveredAt) {
      const tripDuration = (mission as any).deliveredAt.getTime() - mission.pickedUpAt.getTime();
      const logDuration = temperatureLogs.length > 0
        ? temperatureLogs[temperatureLogs.length - 1].timestamp.getTime() - temperatureLogs[0].timestamp.getTime()
        : 0;
      
      // Log should cover at least 80% of trip duration
      if (logDuration < tripDuration * 0.8) {
        throw new BadRequestException('Temperature log does not cover entire trip. Verification failed.');
      }
    }

    const now = new Date();
    const splitDetails = payment.splitDetails as any;

    // Update split details with release times
    splitDetails.farmer.releasedAt = now.toISOString();
    splitDetails.users.releasedAt = now.toISOString();
    splitDetails.users.userId = delivery?.driverId;
    splitDetails.platform.releasedAt = now.toISOString();

    // Update payment status
    await this.prisma.payments.update({
      where: { id: payment.id },
      data: {
        status: 'RELEASED',
        splitDetails,
        releasedAt: now,
        escrowReleaseDate: now,
      },
    });

    // Credit wallets
    // Farmer wallet
    const estate = (order as any).estate;
    await this.walletsService.creditWallet(
      estate?.ownerId,
      payment.farmerAmount,
      'EARNED',
      orderId,
      `Payment from order ${order.orderNumber}`,
    );

    // Driver wallet
    if (delivery?.driverId) {
      await this.walletsService.creditWallet(
        delivery.driverId,
        payment.driverAmount,
        'EARNED',
        orderId,
        `Delivery payment from order ${order.orderNumber}`,
      );
    }

    // Update order status
    await this.prisma.orders.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        completedAt: now,
      },
    });

    return {
      message: 'Payment released and distributed',
      farmerAmount: payment.farmerAmount,
      driverAmount: payment.driverAmount,
      platformFee: payment.platformFee,
    };
  }

  /**
   * Get payment details
   */
  async getPayment(orderId: string) {
    const payment = await this.prisma.payments.findUnique({
      where: { orderId },
      include: {
        orders: {
          include: {
            estates: true,
            deliveries: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }
}
