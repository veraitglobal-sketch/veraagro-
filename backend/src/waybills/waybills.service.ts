import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { buildWaybillPdf } from '../common/pdf/simple-documents-pdf';

/**
 * Waybills Service
 * Automatic generation of digital waybills (tovarni listovi)
 */
@Injectable()
export class WaybillsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate waybill PDF when delivery is assigned (real PDF via pdfkit, hash = SHA-256 of bytes).
   */
  async generateWaybill(deliveryId: string) {
    const delivery = await this.prisma.deliveries.findUnique({
      where: { id: deliveryId },
      include: {
        orders: {
          include: {
            estates: {
              include: {
                users: true,
              },
            },
            users: true,
          },
        },
        users: true,
      },
    });

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    // Generate waybill number
    const waybillNumber = `WB-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Prepare waybill data
    const waybillData = {
      waybillNumber,
      deliveryNumber: delivery.deliveryNumber,
      orderNumber: delivery.orders.orderNumber,
      date: new Date().toISOString(),
      pickup: {
        location: delivery.pickupAddress,
        coordinates: delivery.pickupLocation,
      },
      delivery: {
        location: delivery.deliveryAddress,
        coordinates: delivery.deliveryLocation,
      },
      driver: {
        id: delivery.users?.id,
        name: delivery.users ? `${delivery.users.firstName} ${delivery.users.lastName}` : 'N/A',
        phone: delivery.users?.phone,
      },
      product: {
        name: delivery.orders?.productName,
        quantity: delivery.orders?.quantity,
        unit: delivery.orders?.unit,
      },
      estate: {
        name: delivery.orders?.estates?.name,
        owner: delivery.orders?.estates?.users
          ? `${delivery.orders.estates.users.firstName} ${delivery.orders.estates.users.lastName}`
          : 'N/A',
      },
      buyer: {
        name: delivery.orders?.users ? `${delivery.orders.users.firstName} ${delivery.orders.users.lastName}` : 'N/A',
        phone: delivery.orders?.users?.phone,
      },
    };

    const id = crypto.randomUUID();
    const pdfBuffer = await buildWaybillPdf(waybillData);
    const pdfHash = createHash('sha256').update(pdfBuffer).digest('hex');
    const pdfUrl = `/waybills/document/${id}/pdf`;

    // Create waybill record
    const waybill = await this.prisma.waybills.create({
      data: {
        id,
        waybillNumber,
        deliveryId,
        pdfUrl,
        pdfHash,
        generatedData: waybillData,
      },
    });

    return waybill;
  }

  async getWaybill(deliveryId: string) {
    return this.prisma.waybills.findUnique({
      where: { deliveryId },
    });
  }

  /**
   * PDF bytes for a waybill. Caller must have checked access.
   */
  async getWaybillPdfBuffer(waybillId: string) {
    const waybill = await this.prisma.waybills.findUnique({
      where: { id: waybillId },
    });
    if (!waybill || !waybill.generatedData) {
      throw new NotFoundException('Waybill not found');
    }
    return buildWaybillPdf(waybill.generatedData as Record<string, unknown>);
  }

  async assertUserCanReadWaybill(waybillId: string, user: { id: string; roles?: string[] }) {
    const waybill = await this.prisma.waybills.findUnique({
      where: { id: waybillId },
      include: {
        deliveries: {
          include: {
            orders: {
              include: { estates: true },
            },
          },
        },
      },
    });
    if (!waybill) {
      throw new NotFoundException('Waybill not found');
    }
    const roles = user.roles || [];
    if (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) {
      return;
    }
    const order = waybill.deliveries?.orders;
    if (!order) {
      throw new ForbiddenException('Access denied');
    }
    if (order.buyerId === user.id) return;
    if (order.estates?.ownerId === user.id) return;
    if (waybill.deliveries.driverId === user.id) return;
    throw new ForbiddenException('Access denied');
  }
}
