import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { BlockchainService, ChainEventType } from '../blockchain/blockchain.service';
import { BatchesService } from '../batches/batches.service';
import { InitiateHandoverDto, CompleteHandoverDto, DisputeHandoverDto, HandoverStatus, QualityStatus } from './dto/digital-handover.dto';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Digital Handover Service
 * Handles handover process between driver and store manager
 */
@Injectable()
export class DigitalHandoverService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
    private blockchainService: BlockchainService,
    private batchesService: BatchesService,
  ) {}

  /**
   * Driver initiates handover by scanning QR code
   */
  async initiateHandover(driverId: string, dto: InitiateHandoverDto) {
    // Verify delivery exists and driver is assigned
    const delivery = await this.prisma.deliveries.findUnique({
      where: { id: dto.deliveryId },
      include: {
        orders: {
          include: {
            estates: true,
            users: true,
          },
        },
        users: true,
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.driverId !== driverId) {
      throw new BadRequestException('You are not assigned to this delivery');
    }

    if (delivery.status !== 'IN_TRANSIT') {
      throw new BadRequestException('Delivery must be in transit to initiate handover');
    }

    // Verify QR code matches (in production, validate against store QR codes)
    // For now, we'll accept any QR code that starts with "STORE-"
    if (!dto.qrCode.startsWith('STORE-')) {
      throw new BadRequestException('Invalid store QR code');
    }

    // Create handover record
    const handover = await this.prisma.digital_handovers.create({
      data: {
        deliveryId: dto.deliveryId,
        driverId,
        storeQrCode: dto.qrCode,
        status: HandoverStatus.INITIATED,
        initiatedAt: new Date(),
      },
      include: {
        deliveries: {
          include: {
            orders: true,
          },
        },
      },
    });

    // Notify store manager (in production, find manager by store QR code)
    // For now, we'll notify admin
    await this.notificationsService.create({
      userId: delivery.orders.buyerId, // Store manager ID (in production, get from store)
      type: 'ACTION_REQUIRED',
      title: 'Handover Initiated',
      message: `Driver ${delivery.users.firstName} ${delivery.users.lastName} has arrived. Please complete quality audit.`,
      actionUrl: `/handover/${handover.id}`,
    });

    // Real-time notification
    try {
      await this.notificationsGateway.sendNotificationToUser(
        delivery.orders.buyerId,
        {
          type: 'ACTION_REQUIRED',
          title: 'Handover Initiated',
          message: `Driver has arrived. Please complete quality audit.`,
          actionUrl: `/handover/${handover.id}`,
          handoverId: handover.id,
        },
      );
    } catch (error) {
      console.error('Error sending real-time notification:', error);
    }

    return handover;
  }

  /**
   * Store manager completes handover with quality check
   */
  async completeHandover(managerId: string, dto: CompleteHandoverDto) {
    const handover = await this.prisma.digital_handovers.findUnique({
      where: { id: dto.handoverId },
      include: {
        deliveries: {
          include: {
            orders: {
              include: {
                estates: true,
                users: true,
              },
            },
            users: true,
          },
        },
      },
    });

    if (!handover) {
      throw new NotFoundException('Handover not found');
    }

    if (handover.status !== HandoverStatus.INITIATED && handover.status !== HandoverStatus.IN_PROGRESS) {
      throw new BadRequestException('Handover already completed or disputed');
    }

    // Validate photos (must have 2)
    if (dto.qualityCheck.photoUrls.length < 2) {
      throw new BadRequestException('At least 2 photos are required');
    }

    // Update handover
    const updated = await this.prisma.digital_handovers.update({
      where: { id: dto.handoverId },
      data: {
        status: dto.qualityCheck.visualCheck === QualityStatus.DAMAGED 
          ? HandoverStatus.DISPUTED 
          : HandoverStatus.COMPLETED,
        qualityStatus: dto.qualityCheck.visualCheck,
        temperature: dto.qualityCheck.temperature,
        photoUrls: dto.qualityCheck.photoUrls,
        signature: dto.qualityCheck.signature,
        notes: dto.qualityCheck.notes,
        completedBy: managerId,
        completedAt: new Date(),
      },
    });

    // If damaged, trigger dispute protocol
    if (dto.qualityCheck.visualCheck === QualityStatus.DAMAGED) {
      await this.triggerDisputeProtocol(handover.id, dto.qualityCheck.notes || 'Quality issue reported');
      return updated;
    }

    // Generate PDF receipt
    const pdfPath = await this.generateDeliveryReceipt(handover.id);

    // Update delivery status
    await this.prisma.deliveries.update({
      where: { id: handover.deliveryId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
      },
    });

    // Update order status
    await this.prisma.orders.update({
      where: { id: handover.deliveries.orderId },
      data: { status: 'DELIVERED' },
    });

    const nowIso = new Date().toISOString();
    const orderItemsWithBatch = await this.prisma.order_items.findMany({
      where: { orderId: handover.deliveries.orderId, batchId: { not: null } },
      include: { batches: { select: { batchId: true } } },
    });
    for (const item of orderItemsWithBatch) {
      if (!item.batches?.batchId) continue;
      const batchIdStr = item.batches.batchId;
      try {
        await this.batchesService.markDelivered(batchIdStr);
      } catch (e) {
        console.warn(`markDelivered failed for batch ${batchIdStr}`, e);
      }
      if (this.blockchainService.isEnabled()) {
        try {
          await this.blockchainService.recordEvent(batchIdStr, ChainEventType.DELIVERY, {
            timestamp: nowIso,
          });
        } catch (e) {
          console.warn(`Blockchain DELIVERY event failed for ${batchIdStr}`, e);
        }
      }
    }

    // Notify admin
    const adminUsers = await this.prisma.users.findMany({
      where: {
        roles: {
          has: 'SUPER_ADMIN',
        },
      },
    });

    const storeName = handover.deliveries.deliveryAddress 
      ? JSON.parse(handover.deliveries.deliveryAddress).city || 'Unknown'
      : 'Unknown';

    for (const admin of adminUsers) {
      await this.notificationsService.create({
        userId: admin.id,
        type: 'SYSTEM',
        title: 'Delivery Completed',
        message: `Delivery for Aldi ${storeName} completed successfully. Quality confirmed.`,
        actionUrl: `/deliveries/${handover.deliveryId}`,
      });

      // Real-time notification
      try {
        await this.notificationsGateway.sendNotificationToUser(admin.id, {
          type: 'SYSTEM',
          title: 'Delivery Completed',
          message: `Delivery for Aldi ${storeName} completed successfully. Quality confirmed.`,
          actionUrl: `/deliveries/${handover.deliveryId}`,
        });
      } catch (error) {
        console.error('Error sending real-time notification:', error);
      }
    }

    // Notify driver
    await this.notificationsService.create({
      userId: handover.driverId,
      type: 'SYSTEM',
      title: 'Handover Completed',
      message: `Handover completed successfully. Delivery receipt generated.`,
      actionUrl: `/deliveries/${handover.deliveryId}`,
    });

    return {
      ...updated,
      pdfPath,
    };
  }

  /**
   * Trigger dispute protocol when quality issue is reported
   */
  private async triggerDisputeProtocol(handoverId: string, reason: string) {
    const handover = await this.prisma.digital_handovers.findUnique({
      where: { id: handoverId },
      include: {
        deliveries: {
          include: {
            orders: true,
          },
        },
      },
    });

    // Create dispute record
    await this.prisma.disputes.create({
      data: {
        handoverId,
        reason,
        status: 'PENDING',
        createdAt: new Date(),
      },
    });

    // Notify all admins
    const adminUsers = await this.prisma.users.findMany({
      where: {
        roles: {
          has: 'SUPER_ADMIN',
        },
      },
    });

    for (const admin of adminUsers) {
      await this.notificationsService.create({
        userId: admin.id,
        type: 'ALERT',
        title: 'Quality Dispute',
        message: `Quality issue reported for delivery ${handover.deliveries.orders.orderNumber}. Immediate action required.`,
        actionUrl: `/disputes/${handoverId}`,
      });

      // Real-time notification
      try {
        await this.notificationsGateway.sendNotificationToUser(admin.id, {
          type: 'ALERT',
          title: 'Quality Dispute',
          message: `Quality issue reported. Immediate action required.`,
          actionUrl: `/disputes/${handoverId}`,
        });
      } catch (error) {
        console.error('Error sending real-time notification:', error);
      }
    }
  }

  /**
   * Generate PDF Delivery Receipt (Lieferschein)
   */
  private async generateDeliveryReceipt(handoverId: string): Promise<string> {
    const handover = await this.prisma.digital_handovers.findUnique({
      where: { id: handoverId },
      include: {
        deliveries: {
          include: {
            orders: {
              include: {
                estates: true,
                users: true,
              },
            },
            users: true,
          },
        },
      },
    });

    if (!handover) {
      throw new NotFoundException('Handover not found');
    }

    const doc = new PDFDocument({ margin: 50 });
    const fileName = `delivery-receipt-${handoverId}-${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', 'receipts', fileName);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('Lieferschein / Delivery Receipt', { align: 'center' });
    doc.moveDown();

    // Delivery Info
    doc.fontSize(12);
    doc.text(`Delivery Number: ${handover.deliveries.deliveryNumber}`);
    doc.text(`Order Number: ${handover.deliveries.orders.orderNumber}`);
    doc.text(`Date: ${new Date().toLocaleDateString('en-US')}`);
    doc.moveDown();

    // Store Info
    doc.text('Store Information:', { underline: true });
    const deliveryAddress = handover.deliveries.deliveryAddress 
      ? JSON.parse(handover.deliveries.deliveryAddress)
      : {};
    doc.text(`Store: ${deliveryAddress.name || 'N/A'}`);
    doc.text(`Address: ${deliveryAddress.street || ''}, ${deliveryAddress.city || ''}`);
    doc.moveDown();

    // Quality Check
    doc.text('Quality Check:', { underline: true });
    doc.text(`Visual Check: ${handover.qualityStatus}`);
    doc.text(`Temperature: ${handover.temperature}°C`);
    doc.text(`Completed by: ${handover.completedBy}`);
    doc.text(`Completed at: ${handover.completedAt?.toLocaleString('en-US')}`);
    doc.moveDown();

    // Driver Info
    doc.text('Driver Information:', { underline: true });
    doc.text(`Name: ${handover.deliveries.users.firstName} ${handover.deliveries.users.lastName}`);
    doc.text(`Vehicle: N/A`); // Vehicle info not directly linked to driver
    doc.moveDown();

    // Signature
    if (handover.signature) {
      doc.text('Digital Signature:', { underline: true });
      doc.text('✓ Signed', { indent: 20 });
    }

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  /**
   * Get handover by ID
   */
  async getHandover(handoverId: string) {
    return this.prisma.digital_handovers.findUnique({
      where: { id: handoverId },
      include: {
        deliveries: {
          include: {
            orders: true,
            users: true,
          },
        },
      },
    });
  }
}
