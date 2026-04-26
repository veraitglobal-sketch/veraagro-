import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { buildInvoicePdf } from '../common/pdf/simple-documents-pdf';
import { EmailService } from '../email/email.service';

/**
 * Invoices Service
 * Automatic generation of PDF invoices
 */
@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Generate invoice PDF automatically when delivery is assigned
   */
  async generateInvoice(orderId: string, deliveryId?: string) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        estates: true,
        users: true,
        payments: true,
        deliveries: deliveryId
          ? {
              include: {
                users: true,
              },
            }
          : undefined,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Prepare invoice data
    const invoiceData = {
      invoiceNumber,
      orderNumber: order.orderNumber,
      date: new Date().toISOString(),
      buyer: {
        name: `${order.users.firstName} ${order.users.lastName}`,
        email: order.users.email,
        phone: order.users.phone,
        deliveryAddress: order.deliveryAddress,
      },
      items: [
        {
          productName: order.productName,
          quantity: order.quantity,
          unit: order.unit,
          unitPrice: order.unitPrice,
          total: order.totalAmount,
        },
      ],
      subtotal: order.totalAmount,
      tax: 0, // Can be calculated
      total: order.totalAmount,
      payment: {
        method: order.payments?.paymentMethod,
        status: order.payments?.status,
      },
      delivery: order.deliveries
        ? {
            deliveryNumber: order.deliveries.deliveryNumber,
            driver: order.deliveries.users
              ? `${order.deliveries.users.firstName} ${order.deliveries.users.lastName}`
              : null,
          }
        : null,
    };

    const id = crypto.randomUUID();
    const pdfBuffer = await buildInvoicePdf(invoiceData);
    const pdfHash = createHash('sha256').update(pdfBuffer).digest('hex');
    const pdfUrl = `/invoices/${id}/download`;

    // Create invoice record
    const invoice = await this.prisma.invoices.create({
      data: {
        id,
        invoiceNumber,
        orderId,
        deliveryId: deliveryId || null,
        pdfUrl,
        pdfHash,
        invoiceData,
        sentToEmail: order.users.email || null,
      },
    });

    const to = order.users.email;
    if (to) {
      const sent = await this.emailService.sendInvoicePdf({
        to,
        firstName: order.users.firstName,
        lastName: order.users.lastName,
        invoiceNumber,
        orderNumber: order.orderNumber,
        pdfBuffer,
      });
      if (sent) {
        return this.prisma.invoices.update({
          where: { id },
          data: { sentAt: new Date() },
        });
      }
      this.logger.warn(`Invoice created (${invoiceNumber}) but email was not sent (mail not configured or send failed).`);
    }

    return invoice;
  }

  async getInvoice(orderId: string) {
    return this.prisma.invoices.findUnique({
      where: { orderId },
      include: {
        orders: {
          include: {
            estates: true,
            users: true,
            payments: true,
          },
        },
        deliveries: {
          include: {
            users: true,
          },
        },
      },
    });
  }

  async findAll(filters?: {
    buyerId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (filters?.buyerId) {
      where.orders = {
        buyerId: filters.buyerId,
      };
    }

    if (filters?.status) {
      // Status is based on payment status
      where.orders = {
        ...where.orders,
        payments: {
          status: filters.status,
        },
      };
    }

    if (filters?.startDate || filters?.endDate) {
      where.generatedAt = {};
      if (filters.startDate) {
        where.generatedAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.generatedAt.lte = new Date(filters.endDate);
      }
    }

    return this.prisma.invoices.findMany({
      where,
      include: {
        orders: {
          include: {
            estates: {
              select: {
                id: true,
                name: true,
              },
            },
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            payments: {
              select: {
                id: true,
                status: true,
                paymentMethod: true,
                releasedAt: true,
                createdAt: true,
                updatedAt: true,
              },
            },
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
      orderBy: {
        generatedAt: 'desc',
      },
    });
  }

  async findOne(invoiceId: string, buyerId?: string) {
    const invoice = await this.prisma.invoices.findUnique({
      where: { id: invoiceId },
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
                    partnerCode: true,
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
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Check if buyer has access
    if (buyerId && invoice.orders.buyerId !== buyerId) {
      throw new BadRequestException('Access denied');
    }

    return invoice;
  }

  /**
   * Regenerate PDF from stored `invoiceData` (same logical document as at creation).
   */
  async getInvoicePdfDownload(invoiceId: string, buyerId?: string) {
    const invoice = await this.findOne(invoiceId, buyerId);
    const data = (invoice.invoiceData || {}) as Record<string, unknown>;
    const buffer = await buildInvoicePdf(data);
    const safeName = `invoice-${String(data.invoiceNumber ?? invoiceId).replace(/[^a-zA-Z0-9._-]+/g, '_')}.pdf`;
    return { buffer, filename: safeName };
  }

  async sendInvoiceEmail(invoiceId: string, buyerId?: string, email?: string) {
    const invoice = await this.findOne(invoiceId, buyerId);
    const to = (email || invoice.orders.users.email || '').trim();
    if (!to) {
      throw new BadRequestException('No email address for this invoice');
    }
    const { buffer: pdfBuffer } = await this.getInvoicePdfDownload(invoiceId, buyerId);
    const data = invoice.invoiceData as Record<string, string | undefined>;
    const orderNumber = (data?.orderNumber as string) || invoice.orders.orderNumber;
    const invoiceNumber = (data?.invoiceNumber as string) || invoice.invoiceNumber;
    const sent = await this.emailService.sendInvoicePdf({
      to,
      firstName: invoice.orders.users.firstName,
      lastName: invoice.orders.users.lastName,
      invoiceNumber,
      orderNumber: orderNumber || '—',
      pdfBuffer,
    });
    if (!sent) {
      this.logger.warn(`Resend of invoice email failed for ${invoiceId}`);
      return {
        message: 'Email is not configured or delivery failed. Invoice was not marked as sent.',
        sent: false,
        invoice: await this.prisma.invoices.findUnique({ where: { id: invoiceId } }),
      };
    }
    const updated = await this.prisma.invoices.update({
      where: { id: invoiceId },
      data: {
        sentToEmail: to,
        sentAt: new Date(),
      },
    });
    return { message: 'Invoice email sent', sent: true, invoice: updated };
  }
}
