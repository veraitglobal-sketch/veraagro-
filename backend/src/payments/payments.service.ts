import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { ConfigService } from '@nestjs/config';
import { getFarmerOwnerUserId } from '../orders/order-fulfillment.util';

/**
 * Payments Service
 * Handles Escrow logic and Split-Payment distribution
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  private readonly farmerPercentage: number;
  private readonly driverPercentage: number;
  private readonly platformFeePercentage: number;
  /** When set, escrow release credits this user's wallet with `platformFee` (PLATFORM_FEE tx). */
  private readonly platformWalletUserId: string | undefined;

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
    const pw = this.configService.get<string>('PLATFORM_WALLET_USER_ID')?.trim();
    this.platformWalletUserId = pw || undefined;
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
    const splitSum =
      this.farmerPercentage + this.driverPercentage + this.platformFeePercentage;
    if (Math.abs(splitSum - 100) > 0.02) {
      throw new BadRequestException(
        `PAYMENT_FARMER_PERCENTAGE + PAYMENT_DRIVER_PERCENTAGE + PAYMENT_PLATFORM_FEE must equal 100 (currently ${splitSum})`,
      );
    }

    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: { 
        users: true,
        estates: true,
        fulfilling_estate: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const farmerUserId = getFarmerOwnerUserId(order);
    if (!farmerUserId) {
      throw new BadRequestException('Cannot resolve farmer user to credit for this order');
    }

    // Calculate split amounts
    const farmerAmount = (totalAmount * this.farmerPercentage) / 100;
    const driverAmount = (totalAmount * this.driverPercentage) / 100;
    const platformFee = (totalAmount * this.platformFeePercentage) / 100;

    const splitDetails = {
      farmer: {
        userId: farmerUserId,
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
            digital_handovers: true,
          },
        },
        missions: {
          include: {
            temperature_logs: { orderBy: { timestamp: 'asc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
        estates: {
          include: {
            users: true,
          },
        },
        fulfilling_estate: true,
      },
    });

    const payment = order?.payments ?? null;
    const delivery = order?.deliveries ?? null;

    if (!order || !payment) {
      throw new NotFoundException('Order or payment not found');
    }

    if (payment.status === 'RELEASED') {
      return {
        message: 'Payment already released',
        farmerAmount: payment.farmerAmount,
        driverAmount: payment.driverAmount,
        platformFee: payment.platformFee,
      };
    }

    if (payment.status !== 'IN_ESCROW') {
      throw new BadRequestException(
        `Payment cannot be released from status ${payment.status}`,
      );
    }

    if (!delivery) {
      throw new BadRequestException('Delivery is required before releasing payment');
    }

    const terminalDeliveryStatuses = ['CONFIRMED', 'COMPLETED', 'DELIVERED'] as const;
    if (!terminalDeliveryStatuses.includes(delivery.status as (typeof terminalDeliveryStatuses)[number])) {
      throw new BadRequestException(
        `Delivery must be CONFIRMED, COMPLETED, or DELIVERED before releasing payment (currently ${delivery.status})`,
      );
    }

    const dh = delivery.digital_handovers;
    if (delivery.status === 'DELIVERED') {
      const handoverOk =
        dh?.status === 'COMPLETED' && !!(dh.signature?.trim() || dh.completedBy);
      if (!handoverOk) {
        throw new BadRequestException(
          'Completed digital handover with store signature (or completedBy) is required before payment release',
        );
      }
    }

    const missions = order.missions ?? [];
    const missionForColdChain =
      missions.find((m) => (m.temperature_logs?.length ?? 0) > 0) ?? missions[0];
    const temperatureLogs = missionForColdChain?.temperature_logs ?? [];

    const buyerQrConfirmed =
      (delivery.status === 'CONFIRMED' || delivery.status === 'COMPLETED') &&
      !!(delivery.deliverySignature?.trim() || delivery.confirmedAt);

    const hasColdChain =
      temperatureLogs.length > 0 ||
      (dh?.status === 'COMPLETED' &&
        dh.temperature != null &&
        Number.isFinite(dh.temperature));

    if (!hasColdChain && !buyerQrConfirmed) {
      throw new BadRequestException(
        'Temperature monitoring is required: add mission temperature logs or complete handover with a temperature reading — unless the buyer has confirmed delivery (QR scan)',
      );
    }

    if (
      hasColdChain &&
      temperatureLogs.length >= 2 &&
      missionForColdChain?.pickedUpAt &&
      missionForColdChain?.completedAt
    ) {
      const tripDuration =
        missionForColdChain.completedAt.getTime() -
        missionForColdChain.pickedUpAt.getTime();
      if (tripDuration > 0) {
        const logDuration =
          temperatureLogs[temperatureLogs.length - 1].timestamp.getTime() -
          temperatureLogs[0].timestamp.getTime();
        if (logDuration < tripDuration * 0.8) {
          throw new BadRequestException(
            'Temperature log does not cover entire trip. Verification failed.',
          );
        }
      }
    }

    const now = new Date();
    const splitDetails = payment.splitDetails as {
      farmer?: { releasedAt?: string | null };
      driver?: { releasedAt?: string | null; userId?: string | null };
      /** @deprecated legacy key — same shape as driver */
      users?: { releasedAt?: string | null; userId?: string | null };
      platform?: { releasedAt?: string | null };
    };

    if (splitDetails.farmer) {
      splitDetails.farmer.releasedAt = now.toISOString();
    }
    const driverSlot = splitDetails.driver ?? splitDetails.users;
    if (driverSlot) {
      driverSlot.releasedAt = now.toISOString();
      driverSlot.userId = delivery.driverId ?? null;
    }
    if (splitDetails.platform) {
      splitDetails.platform.releasedAt = now.toISOString();
    }

    const farmerOwnerId = getFarmerOwnerUserId(order);
    if (!farmerOwnerId) {
      throw new BadRequestException('Cannot resolve farmer user for wallet credit');
    }

    return this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.payments.updateMany({
        where: { id: payment.id, status: 'IN_ESCROW' },
        data: {
          status: 'RELEASED',
          splitDetails,
          releasedAt: now,
          escrowReleaseDate: now,
        },
      });

      if (updateResult.count === 0) {
        const fresh = await tx.payments.findUnique({
          where: { id: payment.id },
        });
        if (fresh?.status === 'RELEASED') {
          return {
            message: 'Payment already released',
            farmerAmount: fresh.farmerAmount,
            driverAmount: fresh.driverAmount,
            platformFee: fresh.platformFee,
          };
        }
        throw new BadRequestException(
          `Payment cannot be released from status ${fresh?.status ?? 'unknown'}`,
        );
      }

      await this.walletsService.creditWalletTx(
        tx,
        farmerOwnerId,
        payment.farmerAmount,
        'EARNED',
        orderId,
        delivery.id,
        `Payment from order ${order.orderNumber}`,
      );

      if (delivery.driverId) {
        await this.walletsService.creditWalletTx(
          tx,
          delivery.driverId,
          payment.driverAmount,
          'EARNED',
          orderId,
          delivery.id,
          `Delivery payment from order ${order.orderNumber}`,
        );
      }

      if (
        payment.platformFee > 0 &&
        this.platformWalletUserId &&
        Number.isFinite(payment.platformFee)
      ) {
        await this.walletsService.creditWalletTx(
          tx,
          this.platformWalletUserId,
          payment.platformFee,
          'PLATFORM_FEE',
          orderId,
          delivery.id,
          `Platform fee from order ${order.orderNumber}`,
        );
      } else if (payment.platformFee > 0 && !this.platformWalletUserId) {
        this.logger.warn(
          `PLATFORM_WALLET_USER_ID is unset: platformFee ${payment.platformFee} EUR for order ${order.orderNumber} was not wallet-credited (farmer/driver still credited).`,
        );
      }

      await tx.orders.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          completedAt: now,
          updatedAt: now,
        },
      });

      return {
        message: 'Payment released and distributed',
        farmerAmount: payment.farmerAmount,
        driverAmount: payment.driverAmount,
        platformFee: payment.platformFee,
      };
    });
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
