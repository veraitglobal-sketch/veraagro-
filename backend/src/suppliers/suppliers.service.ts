import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  /**
   * Generate Supplier Prospect PDF
   */
  async generateProspectPDF(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          margin: 50,
          size: 'A4',
        });
        const buffers: Buffer[] = [];

        // Add footer on each page
        doc.on('pageAdded', () => {
          const pageNumber = doc.bufferedPageRange().count;
          doc.fontSize(8)
            .fillColor(lightGray)
            .text(
              `Bio Vera - Strategic Supplier Program | Page ${pageNumber}`,
              50,
              doc.page.height - 30,
              { align: 'center', width: doc.page.width - 100 }
            );
        });

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Colors
        const veraGreen = '#2D5A27';
        const darkGray = '#1F2937';
        const lightGray = '#6B7280';
        const bgGreen = '#F0F9F0';

        // Header with Logo
        doc.rect(0, 0, doc.page.width, 150)
          .fill(bgGreen);
        
        // Try to add logo image if it exists
        const logoPath1 = path.join(process.cwd(), '..', 'web', 'public', 'logo1.png');
        const logoPath2 = path.join(process.cwd(), '..', 'web', 'public', 'logo.png');
        const logoPath = fs.existsSync(logoPath1) ? logoPath1 : (fs.existsSync(logoPath2) ? logoPath2 : null);
        
        if (logoPath && fs.existsSync(logoPath)) {
          try {
            // Larger logo - 300px width (increased from 250px)
            doc.image(logoPath, 50, 20, { 
              width: 300,
              height: 90,
              fit: [300, 90]
            });
            doc.fontSize(18)
              .fillColor(darkGray)
              .text('Strategic Supplier Program', 50, 110, { align: 'left' });
          } catch (error) {
            this.logger.warn('Could not load logo image, using text fallback:', error);
            doc.fontSize(48)
              .fillColor(veraGreen)
              .text('Bio Vera', 50, 50, { align: 'left' });
            doc.fontSize(18)
              .fillColor(darkGray)
              .text('Strategic Supplier Program', 50, 100, { align: 'left' });
          }
        } else {
          // Fallback to text if logo doesn't exist
          doc.fontSize(48)
            .fillColor(veraGreen)
            .text('Bio Vera', 50, 50, { align: 'left' });
          doc.fontSize(18)
            .fillColor(darkGray)
            .text('Strategic Supplier Program', 50, 100, { align: 'left' });
        }

        doc.moveDown(3);

        // Hero Section
        doc.fontSize(24)
          .fillColor(darkGray)
          .text('Become a Strategic Supplier', { align: 'center' });
        
        doc.moveDown();
        doc.fontSize(12)
          .fillColor(lightGray)
          .text('Join our network of trusted suppliers and expand your reach to the European market through the Bio Vera platform.', 
            { align: 'center', width: doc.page.width - 100 });
        
        doc.moveDown(2);

        // How It Works Section
        doc.fontSize(20)
          .fillColor(veraGreen)
          .text('How It Works', { underline: true });
        
        doc.moveDown(0.5);
        doc.fontSize(12)
          .fillColor(darkGray)
          .text('Understanding the Bio Vera supply chain', { italic: true });
        
        doc.moveDown();

        const processSteps = [
          {
            number: '1',
            title: 'Sourcing from Manufacturing Partners',
            description: 'Suppliers procure goods from our approved manufacturing partners within the country. These partners produce seeds, fertilizers, and packaging materials according to Bio Vera specifications.',
          },
          {
            number: '2',
            title: 'Agreed Pricing Structure',
            description: 'All products are sold at pre-agreed prices. This ensures price stability for growers and predictable revenue for suppliers. No price fluctuations or negotiations per transaction.',
          },
          {
            number: '3',
            title: 'Distribution to Growers',
            description: 'Suppliers distribute products to Bio Vera certified growers in their region. Every transaction is tracked through QR codes, ensuring complete traceability from manufacturing partner to field.',
          },
          {
            number: '4',
            title: 'Digital Tracking & Compliance',
            description: 'All inventory movements are recorded in the Vera Admin Dashboard. Suppliers maintain real-time visibility of stock levels, and the system automatically alerts when inventory falls below 20% threshold.',
          },
        ];

        processSteps.forEach((step, index) => {
          if (index > 0) doc.moveDown(0.5);
          
          // Step number circle
          const startY = doc.y;
          doc.circle(60, startY + 8, 12)
            .fill(veraGreen);
          doc.fontSize(10)
            .fillColor('white')
            .text(step.number, 52, startY + 4, { width: 16, align: 'center' });
          
          doc.fontSize(12)
            .fillColor(darkGray)
            .text(step.title, 80, startY, { continued: false });
          
          doc.fontSize(10)
            .fillColor(lightGray)
            .text(step.description, 80, startY + 15, { 
              width: doc.page.width - 130,
              align: 'left' 
            });
        });

        // Check if we need a new page
        if (doc.y > doc.page.height - 200) {
          doc.addPage();
        }

        doc.moveDown(2);

        // Requirements Section
        doc.fontSize(20)
          .fillColor(veraGreen)
          .text('Program Requirements', { underline: true });
        
        doc.moveDown(0.5);
        doc.fontSize(12)
          .fillColor(darkGray)
          .text('What we expect from our suppliers', { italic: true });
        
        doc.moveDown();

        // For Distributors
        doc.fontSize(16)
          .fillColor(darkGray)
          .text('For Distributors (Agricultural Pharmacies & Wholesalers)', { underline: true });
        
        doc.moveDown(0.3);

        const distributorRequirements = [
          'Vera Resources Storage: Obligation to provide dry and secure storage space for Vera seeds, fertilizers, and packaging materials.',
          'QR Code Issuance: Distributor cannot issue goods without scanning the QR code from the farmer\'s app. This is the only way to track consumption per hectare.',
          'Local Support: Distributor is the first point of contact for farmers in their region. They perform physical verification of received goods.',
          'Inventory Reporting: System must automatically notify headquarters in Hamburg when inventory falls below 20%.',
        ];

        distributorRequirements.forEach((req) => {
          doc.fontSize(10)
            .fillColor(darkGray)
            .text('• ' + req, { 
              width: doc.page.width - 100,
              indent: 20 
            });
          doc.moveDown(0.3);
        });

        doc.moveDown();

        // For Packaging Manufacturers
        doc.fontSize(16)
          .fillColor(darkGray)
          .text('For Packaging Manufacturers (Cardboard/Producers)', { underline: true });
        
        doc.moveDown(0.3);

        const packagingRequirements = [
          'Production to Vera Specification: Every box must be made from agreed cardboard weight (e.g., five-layer) with food contact certification.',
          'Just-in-Time Delivery: Obligation to deliver flat-packed packaging directly to our distributors within 48 hours of order.',
          'Barcode Printing: Every packaging series must have a printed serial number or barcode that we generate, so we know which farmer used which series of boxes.',
        ];

        packagingRequirements.forEach((req) => {
          doc.fontSize(10)
            .fillColor(darkGray)
            .text('• ' + req, { 
              width: doc.page.width - 100,
              indent: 20 
            });
          doc.moveDown(0.3);
        });

        doc.moveDown();

        // Common Obligation
        doc.rect(50, doc.y, doc.page.width - 100, 50)
          .fill(bgGreen)
          .stroke(veraGreen);
        
        doc.fontSize(11)
          .fillColor(darkGray)
          .text('Common Obligation:', 60, doc.y + 10, { continued: true });
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .text(' All partners must use the Vera Admin Dashboard to record every entry and exit of goods. No \'paperwork\' – everything must be in the digital system.', 
            { width: doc.page.width - 120 });

        // Check if we need a new page
        if (doc.y > doc.page.height - 150) {
          doc.addPage();
        }

        doc.moveDown(2);

        // Benefits Section
        doc.fontSize(20)
          .fillColor(veraGreen)
          .text('What You Get', { underline: true });
        
        doc.moveDown(0.5);
        doc.fontSize(12)
          .fillColor(darkGray)
          .text('Benefits of joining the Bio Vera network', { italic: true });
        
        doc.moveDown();

        const benefits = [
          {
            title: 'Guaranteed Purchase',
            description: 'All our growers must purchase from our approved suppliers. Guaranteed demand and stable revenue streams.',
          },
          {
            title: 'National Coverage Preferred',
            description: 'Main suppliers with good national coverage are highly preferred. Expand your market reach across the region.',
          },
          {
            title: 'Exclusive Market Access',
            description: 'Direct access to European market through our vertically integrated network. Your products reach end customers without intermediaries.',
          },
        ];

        benefits.forEach((benefit) => {
          doc.fontSize(12)
            .fillColor(veraGreen)
            .text(benefit.title, { underline: true });
          
          doc.fontSize(10)
            .fillColor(lightGray)
            .text(benefit.description, { 
              width: doc.page.width - 100,
              indent: 20 
            });
          
          doc.moveDown(0.5);
        });

        // Footer - add after all content is written
        // Note: We'll add footer text on each page after content is complete
        // For now, we'll add it at the end of the document

        doc.end();
      } catch (error) {
        this.logger.error('Error generating prospect PDF:', error);
        reject(error);
      }
    });
  }
}
