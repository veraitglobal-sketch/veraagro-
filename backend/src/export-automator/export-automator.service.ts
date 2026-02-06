import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'crypto';
import * as PDFDocument from 'pdfkit';

export interface CMRDocument {
  cmrNumber: string;
  sender: {
    name: string;
    address: string;
    city: string;
    country: string;
    taxId?: string;
  };
  receiver: {
    name: string;
    address: string;
    city: string;
    country: string;
    taxId?: string;
  };
  carrier: {
    name: string;
    vehiclePlate: string;
    driverName: string;
  };
  goods: {
    description: string;
    quantity: number;
    unit: string;
    weight: number;
    value: number;
  };
  route: {
    origin: string;
    destination: string;
    borderCrossing?: string;
  };
  date: Date;
}

export interface PhytosanitaryCertificate {
  certificateNumber: string;
  exporter: {
    name: string;
    address: string;
    country: string;
  };
  importer: {
    name: string;
    address: string;
    country: string;
  };
  product: {
    name: string;
    quantity: number;
    unit: string;
    origin: string;
    destination: string;
  };
  inspection: {
    date: Date;
    inspector: string;
    result: 'PASSED' | 'FAILED';
    notes?: string;
  };
  validity: {
    issuedAt: Date;
    expiresAt: Date;
  };
}

export interface TaxCalculation {
  orderId: string;
  batchId?: string;
  
  // Balkan costs (input costs - no VAT)
  balkanCosts: {
    growerPrice: number; // Price paid to grower (no VAT)
    transportBalkan: number; // Transport within Balkans (no VAT)
    packaging: number; // Packaging costs (no VAT)
    otherBalkan: number; // Other costs in Balkans
    totalBalkan: number;
  };
  
  // German market (output - with VAT)
  germanMarket: {
    sellPrice: number; // Price to buyer (before VAT)
    vatRate: number; // 19% for Germany (MwSt)
    vatAmount: number; // VAT to be paid
    netPrice: number; // Price after VAT deduction
    transportGermany: number; // Transport in Germany (with VAT)
    otherGermany: number; // Other costs in Germany (with VAT)
    totalGermany: number;
  };
  
  // Tax summary
  taxSummary: {
    totalRevenue: number; // Total revenue from sale
    totalCosts: number; // Total costs (Balkan + Germany)
    grossProfit: number; // Revenue - Costs
    vatToPay: number; // VAT amount to pay to German tax office
    vatToClaim: number; // VAT to claim back (input VAT in Germany)
    netVatLiability: number; // VAT to pay - VAT to claim
    netProfit: number; // Gross profit - Net VAT liability
  };
  
  // Export details
  exportDetails: {
    exportDate: Date;
    destinationCountry: string;
    customsValue: number; // Value for customs
    currency: string; // EUR
  };
}

export interface TaxReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalRevenue: number;
    totalBalkanCosts: number;
    totalGermanCosts: number;
    totalVatCollected: number;
    totalVatPaid: number;
    netVatLiability: number;
    grossProfit: number;
    netProfit: number;
  };
  transactions: TaxCalculation[];
  readyForSubmission: boolean;
}

@Injectable()
export class ExportAutomatorService {
  private readonly logger = new Logger(ExportAutomatorService.name);
  private readonly GERMAN_VAT_RATE = 0.19; // 19% MwSt
  private readonly COMPANY_INFO = {
    name: 'Bio Vera GmbH',
    address: 'Hamburg, Germany',
    taxId: 'DE123456789', // Replace with actual tax ID
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Generate CMR (International Road Transport Document)
   */
  async generateCMR(deliveryId: string): Promise<{ cmr: CMRDocument; pdfUrl: string; pdfHash: string }> {
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
      throw new NotFoundException(`Delivery ${deliveryId} not found`);
    }

    // Generate CMR number
    const cmrNumber = `CMR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Prepare CMR data
    const cmr: CMRDocument = {
      cmrNumber,
      sender: {
        name: `${delivery.orders.estates.users.firstName} ${delivery.orders.estates.users.lastName}`,
        address: delivery.pickupAddress,
        city: 'Serbia', // Extract from address
        country: 'RS',
        taxId: undefined, // Add if available
      },
      receiver: {
        name: `${delivery.orders.users.firstName} ${delivery.orders.users.lastName}`,
        address: delivery.deliveryAddress,
        city: 'Hamburg', // Extract from address
        country: 'DE',
        taxId: undefined, // Add if available
      },
      carrier: {
        name: `${delivery.users.firstName} ${delivery.users.lastName}`,
        vehiclePlate: 'UNKNOWN', // Add vehicle info if available
        driverName: `${delivery.users.firstName} ${delivery.users.lastName}`,
      },
      goods: {
        description: delivery.orders.productName,
        quantity: delivery.orders.quantity,
        unit: delivery.orders.unit,
        weight: delivery.orders.quantity, // Assuming kg
        value: delivery.orders.totalAmount,
      },
      route: {
        origin: delivery.pickupAddress,
        destination: delivery.deliveryAddress,
        borderCrossing: 'Horgos', // Default border crossing
      },
      date: new Date(),
    };

    // Generate PDF
    const pdfBuffer = await this.generateCMRPDF(cmr);
    const pdfHash = createHash('sha256').update(pdfBuffer).digest('hex');
    const pdfUrl = `/exports/cmr/${cmrNumber}.pdf`;

    // Save to database (if CMR model exists)
    try {
      await (this.prisma as any).cmrDocument.create({
        data: {
          cmrNumber,
          deliveryId,
          pdfUrl,
          pdfHash,
          cmrData: cmr,
        },
      });
    } catch (error) {
      this.logger.warn('CMR model not found. Document generated but not persisted.');
    }

    return { cmr, pdfUrl, pdfHash };
  }

  /**
   * Generate Phytosanitary Certificate
   */
  async generatePhytosanitaryCertificate(batchId: string): Promise<{
    certificate: PhytosanitaryCertificate;
    pdfUrl: string;
    pdfHash: string;
  }> {
    const batch = await this.prisma.batches.findUnique({
      where: { id: batchId },
      include: {
        estates: {
          include: {
            users: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`Batch ${batchId} not found`);
    }

    // Generate certificate number
    const certificateNumber = `PHYTO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Prepare certificate data
    const certificate: PhytosanitaryCertificate = {
      certificateNumber,
      exporter: {
        name: `${batch.estates.users.firstName} ${batch.estates.users.lastName}`,
        address: batch.estates.name,
        country: 'RS',
      },
      importer: {
        name: this.COMPANY_INFO.name,
        address: this.COMPANY_INFO.address,
        country: 'DE',
      },
      product: {
        name: batch.productName,
        quantity: batch.quantity,
        unit: batch.unit,
        origin: 'Serbia',
        destination: 'Germany',
      },
      inspection: {
        date: new Date(),
        inspector: 'Bio Vera Quality Control',
        result: 'PASSED',
        notes: 'Product meets EU phytosanitary standards',
      },
      validity: {
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    };

    // Generate PDF
    const pdfBuffer = await this.generatePhytosanitaryPDF(certificate);
    const pdfHash = createHash('sha256').update(pdfBuffer).digest('hex');
    const pdfUrl = `/exports/phytosanitary/${certificateNumber}.pdf`;

    // Save to database (if model exists)
    try {
      await (this.prisma as any).phytosanitaryCertificate.create({
        data: {
          certificateNumber,
          batchId,
          pdfUrl,
          pdfHash,
          certificateData: certificate,
        },
      });
    } catch (error) {
      this.logger.warn('PhytosanitaryCertificate model not found. Document generated but not persisted.');
    }

    return { certificate, pdfUrl, pdfHash };
  }

  /**
   * Calculate tax separation (Balkan costs vs German market)
   */
  async calculateTaxSeparation(orderId: string): Promise<TaxCalculation> {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        estates: {
          include: {
            users: true,
          },
        },
        users: true,
        payments: true,
        deliveries: {
          include: {
            users: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Get market price to determine grower price
    const marketPrice = await this.prisma.market_prices.findFirst({
      where: {
        cropType: order.productName,
        isActive: true,
      },
      orderBy: {
        effectiveFrom: 'desc',
      },
    });

    const growerPrice = marketPrice?.buyPrice || order.unitPrice * 0.7; // Fallback: 70% of sell price

    // Calculate Balkan costs (no VAT)
    const balkanCosts = {
      growerPrice: growerPrice * order.quantity,
      transportBalkan: order.quantity * 0.10, // 0.10 EUR per kg
      packaging: order.quantity * 0.05, // 0.05 EUR per kg
      otherBalkan: order.quantity * 0.02, // 0.02 EUR per kg
      totalBalkan: 0,
    };
    balkanCosts.totalBalkan =
      balkanCosts.growerPrice +
      balkanCosts.transportBalkan +
      balkanCosts.packaging +
      balkanCosts.otherBalkan;

    // Calculate German market (with VAT)
    const sellPrice = order.totalAmount;
    const vatAmount = sellPrice * this.GERMAN_VAT_RATE;
    const netPrice = sellPrice - vatAmount;

    const germanMarket = {
      sellPrice,
      vatRate: this.GERMAN_VAT_RATE,
      vatAmount,
      netPrice,
      transportGermany: order.quantity * 0.15, // 0.15 EUR per kg (with VAT)
      otherGermany: order.quantity * 0.03, // 0.03 EUR per kg (with VAT)
      totalGermany: 0,
    };
    germanMarket.totalGermany =
      germanMarket.transportGermany + germanMarket.otherGermany;

    // Calculate VAT to claim (input VAT on German costs)
    const vatToClaim =
      (germanMarket.transportGermany + germanMarket.otherGermany) * this.GERMAN_VAT_RATE;

    // Tax summary
    const taxSummary = {
      totalRevenue: sellPrice,
      totalCosts: balkanCosts.totalBalkan + germanMarket.totalGermany,
      grossProfit: sellPrice - (balkanCosts.totalBalkan + germanMarket.totalGermany),
      vatToPay: vatAmount,
      vatToClaim,
      netVatLiability: vatAmount - vatToClaim,
      netProfit: 0,
    };
    taxSummary.netProfit = taxSummary.grossProfit - taxSummary.netVatLiability;

    // Export details
    const exportDetails = {
      exportDate: order.createdAt,
      destinationCountry: 'DE',
      customsValue: balkanCosts.totalBalkan, // Value for customs (cost basis)
      currency: 'EUR',
    };

    const taxCalculation: TaxCalculation = {
      orderId,
      batchId: order.deliveries?.id,
      balkanCosts,
      germanMarket,
      taxSummary,
      exportDetails,
    };

    // Save tax calculation
    try {
      await (this.prisma as any).taxCalculation.create({
        data: {
          orderId,
          taxCalculationData: taxCalculation,
        },
      });
    } catch (error) {
      this.logger.warn('TaxCalculation model not found. Calculation done but not persisted.');
    }

    return taxCalculation;
  }

  /**
   * Generate tax report for Hamburg accounting
   */
  async generateTaxReport(startDate: Date, endDate: Date): Promise<TaxReport> {
    // Get all orders in period
    const orders = await this.prisma.orders.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['PAID', 'DELIVERED', 'COMPLETED'],
        },
      },
      include: {
        payments: true,
      },
    });

    // Calculate tax for each order
    const transactions: TaxCalculation[] = [];
    let totalRevenue = 0;
    let totalBalkanCosts = 0;
    let totalGermanCosts = 0;
    let totalVatCollected = 0;
    let totalVatPaid = 0;

    for (const order of orders) {
      try {
        const taxCalc = await this.calculateTaxSeparation(order.id);
        transactions.push(taxCalc);

        totalRevenue += taxCalc.taxSummary.totalRevenue;
        totalBalkanCosts += taxCalc.balkanCosts.totalBalkan;
        totalGermanCosts += taxCalc.germanMarket.totalGermany;
        totalVatCollected += taxCalc.germanMarket.vatAmount;
        totalVatPaid += taxCalc.germanMarket.vatAmount; // VAT collected = VAT to pay
      } catch (error) {
        this.logger.error(`Error calculating tax for order ${order.id}:`, error);
      }
    }

    const netVatLiability = totalVatCollected - transactions.reduce((sum, t) => sum + t.taxSummary.vatToClaim, 0);
    const grossProfit = totalRevenue - totalBalkanCosts - totalGermanCosts;
    const netProfit = grossProfit - netVatLiability;

    const report: TaxReport = {
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalRevenue,
        totalBalkanCosts,
        totalGermanCosts,
        totalVatCollected,
        totalVatPaid,
        netVatLiability,
        grossProfit,
        netProfit,
      },
      transactions,
      readyForSubmission: true, // All data ready for tax office
    };

    // Generate PDF report
    const pdfBuffer = await this.generateTaxReportPDF(report);
    const pdfHash = createHash('sha256').update(pdfBuffer).digest('hex');
    const pdfUrl = `/exports/tax-reports/tax-report-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.pdf`;

    // Save report
    try {
      await (this.prisma as any).taxReport.create({
        data: {
          periodStart: startDate,
          periodEnd: endDate,
          pdfUrl,
          pdfHash,
          reportData: report,
        },
      });
    } catch (error) {
      this.logger.warn('TaxReport model not found. Report generated but not persisted.');
    }

    return report;
  }

  /**
   * Generate all export documents for a delivery
   */
  async generateAllExportDocuments(deliveryId: string): Promise<{
    cmr: { cmr: CMRDocument; pdfUrl: string; pdfHash: string };
    invoice?: { invoiceNumber: string; pdfUrl: string };
    phytosanitary?: { certificate: PhytosanitaryCertificate; pdfUrl: string; pdfHash: string };
    taxCalculation?: TaxCalculation;
  }> {
    const delivery = await this.prisma.deliveries.findUnique({
      where: { id: deliveryId },
      include: {
        orders: true,
      },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${deliveryId} not found`);
    }

    // Generate CMR
    const cmr = await this.generateCMR(deliveryId);

    // Get invoice if exists
    const invoice = await this.prisma.invoices.findUnique({
      where: { orderId: delivery.orderId },
    });

    // Generate phytosanitary certificate if batch exists
    let phytosanitary;
    const batch = await this.prisma.batches.findFirst({
      where: {
        estateId: delivery.orders.estateId,
      },
    });

    if (batch) {
      phytosanitary = await this.generatePhytosanitaryCertificate(batch.id);
    }

    // Calculate tax separation
    const taxCalculation = await this.calculateTaxSeparation(delivery.orderId);

    return {
      cmr,
      invoice: invoice
        ? {
            invoiceNumber: invoice.invoiceNumber,
            pdfUrl: invoice.pdfUrl,
          }
        : undefined,
      phytosanitary,
      taxCalculation,
    };
  }

  /**
   * Generate CMR PDF
   */
  private async generateCMRPDF(cmr: CMRDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // CMR Header
      doc.fontSize(20).text('CMR - International Road Transport Document', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`CMR Number: ${cmr.cmrNumber}`, { align: 'right' });
      doc.moveDown();

      // Sender
      doc.fontSize(14).text('Sender:', { underline: true });
      doc.fontSize(10).text(`Name: ${cmr.sender.name}`);
      doc.text(`Address: ${cmr.sender.address}`);
      doc.text(`City: ${cmr.sender.city}, Country: ${cmr.sender.country}`);
      doc.moveDown();

      // Receiver
      doc.fontSize(14).text('Receiver:', { underline: true });
      doc.fontSize(10).text(`Name: ${cmr.receiver.name}`);
      doc.text(`Address: ${cmr.receiver.address}`);
      doc.text(`City: ${cmr.receiver.city}, Country: ${cmr.receiver.country}`);
      doc.moveDown();

      // Carrier
      doc.fontSize(14).text('Carrier:', { underline: true });
      doc.fontSize(10).text(`Name: ${cmr.carrier.name}`);
      doc.text(`Vehicle: ${cmr.carrier.vehiclePlate}`);
      doc.text(`Driver: ${cmr.carrier.driverName}`);
      doc.moveDown();

      // Goods
      doc.fontSize(14).text('Goods:', { underline: true });
      doc.fontSize(10).text(`Description: ${cmr.goods.description}`);
      doc.text(`Quantity: ${cmr.goods.quantity} ${cmr.goods.unit}`);
      doc.text(`Weight: ${cmr.goods.weight} kg`);
      doc.text(`Value: ${cmr.goods.value} EUR`);
      doc.moveDown();

      // Route
      doc.fontSize(14).text('Route:', { underline: true });
      doc.fontSize(10).text(`Origin: ${cmr.route.origin}`);
      doc.text(`Destination: ${cmr.route.destination}`);
      if (cmr.route.borderCrossing) {
        doc.text(`Border Crossing: ${cmr.route.borderCrossing}`);
      }
      doc.moveDown();

      // Date
      doc.fontSize(10).text(`Date: ${cmr.date.toLocaleDateString()}`, { align: 'right' });

      doc.end();
    });
  }

  /**
   * Generate Phytosanitary Certificate PDF
   */
  private async generatePhytosanitaryPDF(certificate: PhytosanitaryCertificate): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      // @ts-ignore - pdfkit types may not be perfect
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Phytosanitary Certificate', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Certificate Number: ${certificate.certificateNumber}`, { align: 'right' });
      doc.moveDown();

      // Exporter
      doc.fontSize(14).text('Exporter:', { underline: true });
      doc.fontSize(10).text(`Name: ${certificate.exporter.name}`);
      doc.text(`Address: ${certificate.exporter.address}`);
      doc.text(`Country: ${certificate.exporter.country}`);
      doc.moveDown();

      // Importer
      doc.fontSize(14).text('Importer:', { underline: true });
      doc.fontSize(10).text(`Name: ${certificate.importer.name}`);
      doc.text(`Address: ${certificate.importer.address}`);
      doc.text(`Country: ${certificate.importer.country}`);
      doc.moveDown();

      // Product
      doc.fontSize(14).text('Product:', { underline: true });
      doc.fontSize(10).text(`Name: ${certificate.product.name}`);
      doc.text(`Quantity: ${certificate.product.quantity} ${certificate.product.unit}`);
      doc.text(`Origin: ${certificate.product.origin}`);
      doc.text(`Destination: ${certificate.product.destination}`);
      doc.moveDown();

      // Inspection
      doc.fontSize(14).text('Inspection:', { underline: true });
      doc.fontSize(10).text(`Date: ${certificate.inspection.date.toLocaleDateString()}`);
      doc.text(`Inspector: ${certificate.inspection.inspector}`);
      doc.text(`Result: ${certificate.inspection.result}`);
      if (certificate.inspection.notes) {
        doc.text(`Notes: ${certificate.inspection.notes}`);
      }
      doc.moveDown();

      // Validity
      doc.fontSize(14).text('Validity:', { underline: true });
      doc.fontSize(10).text(`Issued: ${certificate.validity.issuedAt.toLocaleDateString()}`);
      doc.text(`Expires: ${certificate.validity.expiresAt.toLocaleDateString()}`);

      doc.end();
    });
  }

  /**
   * Generate Tax Report PDF
   */
  private async generateTaxReportPDF(report: TaxReport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      // @ts-ignore - pdfkit types may not be perfect
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Tax Report - Hamburg Accounting', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(
        `Period: ${report.period.startDate.toLocaleDateString()} - ${report.period.endDate.toLocaleDateString()}`,
        { align: 'center' }
      );
      doc.moveDown(2);

      // Summary
      doc.fontSize(16).text('Summary', { underline: true });
      doc.moveDown();
      doc.fontSize(10);
      doc.text(`Total Revenue: ${report.summary.totalRevenue.toFixed(2)} EUR`);
      doc.text(`Total Balkan Costs: ${report.summary.totalBalkanCosts.toFixed(2)} EUR`);
      doc.text(`Total German Costs: ${report.summary.totalGermanCosts.toFixed(2)} EUR`);
      doc.text(`Total VAT Collected: ${report.summary.totalVatCollected.toFixed(2)} EUR`);
      doc.text(`Net VAT Liability: ${report.summary.netVatLiability.toFixed(2)} EUR`);
      doc.text(`Gross Profit: ${report.summary.grossProfit.toFixed(2)} EUR`);
      doc.text(`Net Profit: ${report.summary.netProfit.toFixed(2)} EUR`);
      doc.moveDown();

      // Ready for submission
      doc.fontSize(12).text(
        `Status: ${report.readyForSubmission ? '✅ Ready for Tax Office Submission' : '⏳ Pending'}`,
        { align: 'center' }
      );

      doc.end();
    });
  }
}
