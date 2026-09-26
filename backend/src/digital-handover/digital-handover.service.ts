import { durableImage } from '../common/durable-image';
import { Injectable, ConflictException, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
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
    const created = await this.prisma.digital_handovers.createMany({
      data: [{ deliveryId: dto.deliveryId, driverId, storeQrCode: dto.qrCode,
        status: HandoverStatus.INITIATED, initiatedAt: new Date() }],
      skipDuplicates: true,
    });
    const handover = await this.prisma.digital_handovers.findUniqueOrThrow({ where: { deliveryId: dto.deliveryId } });
    if (!created.count) return handover;

    // Notify store manager (in production, find manager by store QR code)
    // For now, we'll notify admin
    await this.notificationsService.create({
      userId: delivery.orders.buyerId, // Store manager ID (in production, get from store)
      type: 'ACTION_REQUIRED',
      title: 'Handover Initiated',
      message: `Driver ${delivery.users.firstName} ${delivery.users.lastName} has arrived. Please complete quality audit.`,
      actionUrl: `/buyer-portal/handover/${handover.id}`,
    }).catch((error) => console.error('Handover notification failed', error));

    // Real-time notification
    try {
      await this.notificationsGateway.sendNotificationToUser(
        delivery.orders.buyerId,
        {
          type: 'ACTION_REQUIRED',
          title: 'Handover Initiated',
          message: `Driver has arrived. Please complete quality audit.`,
          actionUrl: `/buyer-portal/handover/${handover.id}`,
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
  async completeHandover(managerId: string, dto: CompleteHandoverDto, callerRoles?: string[]) {
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

    const roles = callerRoles ?? [];
    const elevated = roles.includes('SUPER_ADMIN') || roles.includes('ADMIN');
    const linkedBuyerId = handover.deliveries.orders.buyerId;
    if (!elevated && linkedBuyerId !== managerId) {
      throw new ForbiddenException(
        'Samo Bio Vera buyer nalog vezan za ovu porudžbinu može da završi primopredaju.',
      );
    }

    if ((dto.revision ?? 0) !== handover.revision) throw new ConflictException('Handover changed. Reload before submitting evidence.');
    if (handover.status === 'COMPLETED' || handover.status === 'DISPUTED') return this.getHandover(handover.id, managerId, roles);
    if (!Array.isArray(dto.qualityCheck.photoUrls) || dto.qualityCheck.photoUrls.length < 2 || dto.qualityCheck.photoUrls.length > 6) {
      throw new BadRequestException('Between 2 and 6 photos are required');
    }
    const photos = await Promise.all(dto.qualityCheck.photoUrls.map((photo) => durableImage(photo)));
    const signature = dto.qualityCheck.signature ? await durableImage(dto.qualityCheck.signature, true) : null;
    if (dto.qualityCheck.visualCheck === QualityStatus.FRESH && !signature) {
      throw new BadRequestException('Recipient digital signature is required');
    }
    const outcome = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM digital_handovers WHERE id = ${handover.id} FOR UPDATE`;
      const current = await tx.digital_handovers.findUniqueOrThrow({ where: { id: handover.id } });
      if ((dto.revision ?? 0) !== current.revision) throw new ConflictException('Handover changed. Reload before submitting evidence.');
      if (current.status === 'COMPLETED' || current.status === 'DISPUTED') return { updated: current, changed: false };
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${handover.deliveries.orderId} FOR UPDATE`;
      const delivery = await tx.deliveries.findUniqueOrThrow({ where: { id: handover.deliveryId } });
      if (delivery.status !== 'IN_TRANSIT') throw new BadRequestException('Delivery must be in transit for handover');
      const damaged = dto.qualityCheck.visualCheck === QualityStatus.DAMAGED;
      const updated = await tx.digital_handovers.update({ where: { id: handover.id }, data: {
        status: damaged ? 'DISPUTED' : 'COMPLETED', qualityStatus: dto.qualityCheck.visualCheck,
        temperature: dto.qualityCheck.temperature, photoUrls: photos, signature,
        notes: dto.qualityCheck.notes, completedBy: managerId, completedAt: new Date(),
      } });
      if (damaged) {
        await tx.disputes.create({ data: { handoverId: handover.id, reason: dto.qualityCheck.notes || 'Quality issue reported',
          evidencePhotos: photos, status: 'PENDING' } });
      } else {
        await tx.deliveries.update({ where: { id: handover.deliveryId }, data: { status: 'DELIVERED', deliveredAt: new Date() } });
        await tx.orders.update({ where: { id: handover.deliveries.orderId }, data: { status: 'DELIVERED' } });
      }
      return { updated, changed: true };
    });
    const { updated } = outcome;
    if (!outcome.changed) return updated;
    if (updated.status === 'DISPUTED') {
      await this.triggerDisputeProtocol(handover.id, dto.qualityCheck.notes || 'Quality issue reported').catch((error) => console.error('Dispute notification failed', error));
      return updated;
    }
    // Optional receipt generation must not turn a committed handover into a failed request.
    const pdfPath = await this.generateDeliveryReceipt(handover.id).catch((error) => {
      console.error('Receipt generation failed', error);
      return undefined;
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
      ? (() => { try { return JSON.parse(handover.deliveries.deliveryAddress).city || 'Unknown'; } catch { return 'Unknown'; } })()
      : 'Unknown';

    for (const admin of adminUsers) {
      await this.notificationsService.create({
        userId: admin.id,
        type: 'SYSTEM',
        title: 'Delivery Completed',
        message: `Delivery for ${storeName} completed successfully. Quality confirmed.`,
        actionUrl: `/deliveries/${handover.deliveryId}`,
      }).catch((error) => console.error('Delivery notification failed', error));

      // Real-time notification
      try {
        await this.notificationsGateway.sendNotificationToUser(admin.id, {
          type: 'SYSTEM',
          title: 'Delivery Completed',
          message: `Delivery for ${storeName} completed successfully. Quality confirmed.`,
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
      message: `Handover completed successfully. Evidence saved.`,
      actionUrl: `/deliveries/${handover.deliveryId}`,
    }).catch((error) => console.error('Driver notification failed', error));

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
        actionUrl: '/admin/delivery-issues',
      });

      // Real-time notification
      try {
        await this.notificationsGateway.sendNotificationToUser(admin.id, {
          type: 'ALERT',
          title: 'Quality Dispute',
          message: `Quality issue reported. Immediate action required.`,
          actionUrl: '/admin/delivery-issues',
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
  async getHandover(handoverId: string, userId: string, roles: string[] = []) {
    const handover = await this.prisma.digital_handovers.findUnique({
      where: { id: handoverId },
      include: { deliveries: { select: { id: true, orderId: true, deliveryNumber: true, status: true,
        orders: { select: { buyerId: true, orderNumber: true } } } },
        disputes: { select: { id: true, status: true, reason: true, resolution: true, resolvedAt: true } } },
    });
    if (!handover) throw new NotFoundException('Handover not found');
    if (!roles.some((r) => r === 'ADMIN' || r === 'SUPER_ADMIN') &&
        handover.driverId !== userId && handover.deliveries.orders.buyerId !== userId) {
      throw new ForbiddenException('You do not have access to this handover');
    }
    return handover;
  }
}
