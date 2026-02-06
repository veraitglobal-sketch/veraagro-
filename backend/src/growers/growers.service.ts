import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GrowersService {
  private readonly logger = new Logger(GrowersService.name);

  /**
   * Generate Grower Prospect PDF
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
              `Bio Vera - For Growers | Page ${pageNumber}`,
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
              .text('For Growers', 50, 110, { align: 'left' });
          } catch (error) {
            this.logger.warn('Could not load logo image, using text fallback:', error);
            doc.fontSize(48)
              .fillColor(veraGreen)
              .text('Bio Vera', 50, 50, { align: 'left' });
            doc.fontSize(18)
              .fillColor(darkGray)
              .text('For Growers', 50, 100, { align: 'left' });
          }
        } else {
          // Fallback to text if logo doesn't exist
          doc.fontSize(48)
            .fillColor(veraGreen)
            .text('Bio Vera', 50, 50, { align: 'left' });
          doc.fontSize(18)
            .fillColor(darkGray)
            .text('For Growers', 50, 100, { align: 'left' });
        }

        doc.moveDown(3);

        // Hero Section
        doc.fontSize(24)
          .fillColor(darkGray)
          .text('For Growers', { align: 'center' });
        
        doc.moveDown();
        doc.fontSize(12)
          .fillColor(lightGray)
          .text('Join the most advanced In-Time logistics network. Secure your placement and eliminate market volatility by following the Bio Vera Protocol.', 
            { align: 'center', width: doc.page.width - 100 });
        
        doc.moveDown(2);

        // Bio Vera Protocol Section
        doc.fontSize(20)
          .fillColor(veraGreen)
          .text('The Bio Vera Protocol', { underline: true });
        
        doc.moveDown(0.5);
        doc.fontSize(12)
          .fillColor(darkGray)
          .text('Strict requirements for network participation', { italic: true });
        
        doc.moveDown();

        const protocolRequirements = [
          {
            title: 'Digital Scheduling',
            description: 'All harvests must be announced 24h in advance via the app. Real-time start/stop harvest reporting is mandatory.',
          },
          {
            title: 'Quality Verification',
            description: 'Our Field Coordinators have the final authority to approve or reject batches on-site based on Bio Vera\'s visual and chemical standards.',
          },
          {
            title: 'Smart Packaging',
            description: 'Use only Bio Vera reusable crates with integrated QR codes. No manual repacking allowed.',
          },
          {
            title: 'Full Transparency',
            description: 'Soil and spray logs must be uploaded digitally before the season starts.',
          },
        ];

        protocolRequirements.forEach((req) => {
          doc.fontSize(12)
            .fillColor(darkGray)
            .text(req.title, { underline: true });
          
          doc.fontSize(10)
            .fillColor(lightGray)
            .text(req.description, { 
              width: doc.page.width - 100,
              indent: 20 
            });
          
          doc.moveDown(0.5);
        });

        // Check if we need a new page
        if (doc.y > doc.page.height - 200) {
          doc.addPage();
        }

        doc.moveDown(2);

        // Value Proposition Section
        doc.fontSize(20)
          .fillColor(veraGreen)
          .text('The Value Proposition', { underline: true });
        
        doc.moveDown(0.5);
        doc.fontSize(12)
          .fillColor(darkGray)
          .text('What we offer', { italic: true });
        
        doc.moveDown();

        const valueProps = [
          {
            title: 'Fixed Pricing',
            description: 'Seasonal price stability. No middleman, no daily price fluctuations. Secure your revenue with predictable pricing throughout the season.',
          },
          {
            title: 'Logistics Priority',
            description: 'Our Frigo-Fleet picks up your goods at the exact scheduled minute. Zero wait time. Your harvest gets priority treatment from field to market.',
          },
          {
            title: 'Automated Payments',
            description: 'Funds are reserved upon field verification and released within 48 hours of Hub arrival. No payment delays, no cash flow worries.',
          },
        ];

        valueProps.forEach((prop) => {
          doc.fontSize(12)
            .fillColor(veraGreen)
            .text(prop.title, { underline: true });
          
          doc.fontSize(10)
            .fillColor(lightGray)
            .text(prop.description, { 
              width: doc.page.width - 100,
              indent: 20 
            });
          
          doc.moveDown(0.5);
        });

        // Check if we need a new page
        if (doc.y > doc.page.height - 250) {
          doc.addPage();
        }

        doc.moveDown(2);

        // Group Certification Section
        doc.fontSize(20)
          .fillColor(veraGreen)
          .text('Group Certification', { underline: true });
        
        doc.moveDown(0.5);
        doc.fontSize(12)
          .fillColor(darkGray)
          .text('Group Certification Option 2', { italic: true });
        
        doc.moveDown();

        doc.fontSize(11)
          .fillColor(darkGray)
          .text('Vera Agrar holds the certification for all our partners. We cover the costs and certification process, while you gain direct access to the German market.', 
            { width: doc.page.width - 100 });

        doc.moveDown();

        // Technical Standards Table
        doc.fontSize(14)
          .fillColor(darkGray)
          .text('Technical Standards', { underline: true });
        
        doc.moveDown(0.3);

        const standards = [
          { category: 'Certification', standard: 'GlobalG.A.P. IFA v6 (Group)' },
          { category: 'Analysis', standard: 'MRL limit at 70% of EU permitted levels' },
          { category: 'Logistics', standard: 'Direct packaging at farm in Vera packaging' },
        ];

        standards.forEach((std) => {
          doc.fontSize(10)
            .fillColor(darkGray)
            .text(`${std.category}:`, { continued: true, width: 150 });
          doc.fontSize(10)
            .fillColor(lightGray)
            .text(std.standard, { width: doc.page.width - 200 });
          doc.moveDown(0.3);
        });

        doc.moveDown();

        // Guaranteed Payment
        doc.rect(50, doc.y, doc.page.width - 100, 40)
          .fill(bgGreen)
          .stroke(veraGreen);
        
        doc.fontSize(11)
          .fillColor(darkGray)
          .text('Guaranteed Payment:', 60, doc.y + 10, { continued: true });
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .text(' Payment is secured by contracts with German retail chains (60-90 days).', 
            { width: doc.page.width - 120 });

        // Footer will be added automatically on each page
        // Using pageAdded event would require more complex handling
        // For now, we'll skip the footer to avoid page switching issues

        doc.end();
      } catch (error) {
        this.logger.error('Error generating prospect PDF:', error);
        reject(error);
      }
    });
  }
}
