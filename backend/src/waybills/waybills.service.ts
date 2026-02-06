import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoUtil } from '../common/utils/crypto.util';

/**
 * Waybills Service
 * Automatic generation of digital waybills (tovarni listovi)
 */
@Injectable()
export class WaybillsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate waybill PDF automatically when delivery is assigned
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
        owner: delivery.orders?.estates?.users ? `${delivery.orders.estates.users.firstName} ${delivery.orders.estates.users.lastName}` : 'N/A',
      },
      buyer: {
        name: delivery.orders?.users ? `${delivery.orders.users.firstName} ${delivery.orders.users.lastName}` : 'N/A',
        phone: delivery.orders?.users?.phone,
      },
    };

    // Generate PDF (mock - in production, use PDF library like pdfkit)
    const pdfUrl = `/waybills/${waybillNumber}.pdf`; // TODO: Generate actual PDF
    const pdfHash = CryptoUtil.hashPassport(waybillData);

    // Create waybill record
    const waybill = await this.prisma.waybills.create({
      data: {
        id: crypto.randomUUID(),
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
}
