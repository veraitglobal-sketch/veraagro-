import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class GrowersService {
  private readonly logger = new Logger(GrowersService.name);

  // Bio Vera Standard Box (Apple 15-pack) Technical Specifications
  private readonly BOX_SPECS = {
    // Unit Dimensions (mm)
    LENGTH: 400, // mm - Three boxes per row = 1200mm (pallet width)
    WIDTH: 266,  // mm - Three boxes per row = 798mm (perfect for 800mm pallet)
    HEIGHT: 90,  // mm - Enough for large apple (75-80mm) + cardboard thickness
    CARDBOARD_THICKNESS: 4.5, // mm - Five-layer cardboard with internal moisture barrier
    
    // Pallet Layout
    BOXES_PER_LEVEL: 9,      // 3x3 layout per level
    MAX_LEVELS: 22,          // Maximum stacking height
    BOXES_PER_PALLET: 198,   // 9 boxes × 22 levels
    
    // Calculations
    BOX_VOLUME_M3: 0.009576, // 0.4m × 0.266m × 0.09m
    LEVEL_VOLUME_M3: 0.086184, // 9 boxes × 0.009576 m³
    PALLET_VOLUME_M3: 1.896048, // 22 levels × 0.086184 m³
    FIVE_PALLETS_VOLUME_M3: 9.48024, // 5 × 1.896048 m³
    
    // Safety & Labeling
    SAFETY_MARGIN_WEIGHT: 0.02, // 2% weight margin for moisture and film
    LABEL_SIDE: 'LONG',         // QR code and logo on 400mm side (longer side)
  };

  /**
   * Generate Grower Prospect PDF
   */
  async generateProspectPDF(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // @ts-ignore - pdfkit types may not be perfect
        const doc = new PDFDocument({ 
          margin: 50,
          size: 'A4',
        });
        const buffers: Buffer[] = [];

        // Colors - define before using in event handlers
        const veraGreen = '#2D5A27';
        const darkGray = '#1F2937';
        const lightGray = '#6B7280';
        const bgGreen = '#F0F9F0';

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Header with Logo
        doc.rect(0, 0, doc.page.width, 150)
          .fill(bgGreen);
        
        // Try to add logo image if it exists
        const logoPath1 = path.join(process.cwd(), '..', 'web', 'public', 'logo1.png');
        const logoPath2 = path.join(process.cwd(), '..', 'web', 'public', 'logo.png');
        const logoPath = fs.existsSync(logoPath1) ? logoPath1 : (fs.existsSync(logoPath2) ? logoPath2 : null);
        
        if (logoPath && fs.existsSync(logoPath)) {
          try {
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
          doc.fontSize(48)
            .fillColor(veraGreen)
            .text('Bio Vera', 50, 50, { align: 'left' });
          doc.fontSize(18)
            .fillColor(darkGray)
            .text('For Growers', 50, 100, { align: 'left' });
        }

        doc.moveDown(2.5);

        // Hero Section
        const heroY = doc.y;
        const heroBoxHeight = 90;
        doc.rect(50, heroY, doc.page.width - 100, heroBoxHeight)
          .fill(bgGreen)
          .stroke(veraGreen, 2);
        
        doc.fontSize(28)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('Join the Bio Vera Network', 70, heroY + 20, { 
            align: 'left',
            width: doc.page.width - 140
          });
        
        doc.fontSize(11)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('Join the most advanced In-Time logistics network. Secure your placement and eliminate market volatility by following the Bio Vera Protocol. Get guaranteed pricing, priority logistics, and automated payments.', 
            70, heroY + 55, { 
              align: 'left', 
              width: doc.page.width - 140 
            });
        
        doc.y = heroY + heroBoxHeight;
        doc.moveDown(2.5);

        // How It Works Section
        const sectionY = doc.y;
        doc.fontSize(22)
          .fillColor(veraGreen)
          .font('Helvetica-Bold')
          .text('How It Works', 50, sectionY);
        
        doc.moveTo(50, sectionY + 20)
          .lineTo(200, sectionY + 20)
          .stroke(veraGreen, 2);
        
        doc.y = sectionY + 28;
        doc.fontSize(11)
          .fillColor(lightGray)
          .font('Helvetica-Oblique')
          .text('Understanding the Bio Vera grower journey');
        
        doc.moveDown(2);

        const processSteps = [
          {
            number: '1',
            title: 'Application & Certification',
            description: 'Apply to join the Bio Vera network through our online application. We handle all GlobalG.A.P. IFA v6 group certification costs and processes. Once approved, you gain direct access to the German market without individual certification requirements.',
          },
          {
            number: '2',
            title: 'Digital Field Management',
            description: 'Use the Bio Vera mobile app to manage your estates and parcels. Upload soil and spray logs digitally before the season starts. All field entries (planting, spraying, harvesting) are tracked with GPS validation and QR code scanning for complete traceability.',
          },
          {
            number: '3',
            title: 'Harvest Announcement & Scheduling',
            description: 'Announce all harvests 24 hours in advance via the app. Report real-time start/stop harvest status. Our Field Coordinators verify quality on-site based on Bio Vera\'s visual and chemical standards. Only approved batches proceed to packaging.',
          },
          {
            number: '4',
            title: 'Smart Packaging & Logistics',
            description: 'Use only Bio Vera reusable crates with integrated QR codes. No manual repacking allowed. Our Frigo-Fleet picks up your goods at the exact scheduled minute with zero wait time. Your harvest gets priority treatment from field to market.',
          },
          {
            number: '5',
            title: 'Automated Payments',
            description: 'Funds are reserved upon field verification and released within 48 hours of Hub arrival. No payment delays, no cash flow worries. Payment is secured by contracts with German retail chains (60-90 days).',
          },
        ];

        processSteps.forEach((step, index) => {
          // Check if we need a new page before adding step
          const boxHeight = 70;
          const spacing = index > 0 ? 1.2 : 0;
          const neededSpace = spacing * 20 + boxHeight;
          
          if (doc.y + neededSpace > doc.page.height - 50) {
            doc.addPage();
            doc.y = 50;
          }
          
          if (index > 0) doc.moveDown(1.2);
          
          const startY = doc.y;
          
          doc.rect(50, startY, doc.page.width - 100, boxHeight)
            .fill('#FAFAFA')
            .stroke(veraGreen, 1);
          
          doc.circle(70, startY + 35, 16)
            .fill(veraGreen);
          doc.fontSize(13)
            .fillColor('white')
            .font('Helvetica-Bold')
            .text(step.number, 58, startY + 27, { width: 24, align: 'center' });
          
          doc.fontSize(14)
            .fillColor(darkGray)
            .font('Helvetica-Bold')
            .text(step.title, 100, startY + 12, {
              width: doc.page.width - 160,
              align: 'left'
            });
          
          doc.fontSize(10)
            .fillColor(lightGray)
            .font('Helvetica')
            .text(step.description, 100, startY + 32, {
              width: doc.page.width - 160,
              align: 'left'
            });
          
          doc.y = startY + boxHeight;
        });

        doc.moveDown(2);

        // Bio Vera Protocol Section - check space for header + first item
        // Calculate needed space: title (22) + underline (20) + subtitle (28) + spacing (40) + first box (70) = ~180
        if (doc.y + 180 > doc.page.height - 50) {
          doc.addPage();
          doc.y = 50;
        }

        const protocolY = doc.y;
        doc.fontSize(22)
          .fillColor(veraGreen)
          .font('Helvetica-Bold')
          .text('The Bio Vera Protocol', 50, protocolY);
        
        doc.moveTo(50, protocolY + 20)
          .lineTo(250, protocolY + 20)
          .stroke(veraGreen, 2);
        
        doc.y = protocolY + 28;
        doc.fontSize(11)
          .fillColor(lightGray)
          .font('Helvetica-Oblique')
          .text('Strict requirements for network participation');
        
        doc.moveDown(2);

        const protocolRequirements = [
          {
            title: 'Digital Scheduling',
            description: 'All harvests must be announced 24h in advance via the app. Real-time start/stop harvest reporting is mandatory. This ensures our logistics team can coordinate pickup times precisely and maintain the cold chain from field to market.',
          },
          {
            title: 'Quality Verification',
            description: 'Our Field Coordinators have the final authority to approve or reject batches on-site based on Bio Vera\'s visual and chemical standards. All products must meet MRL limits at 70% of EU permitted levels. Quality is non-negotiable.',
          },
          {
            title: 'Smart Packaging',
            description: 'Use only Bio Vera reusable crates with integrated QR codes. No manual repacking allowed. Every crate is tracked from farm to retail, ensuring complete traceability. Packaging must be done directly at farm in Vera packaging.',
          },
          {
            title: 'Full Transparency',
            description: 'Soil and spray logs must be uploaded digitally before the season starts. All field entries (planting, spraying, harvesting) are tracked with GPS validation. Complete digital record-keeping is mandatory for certification and traceability.',
          },
        ];

        protocolRequirements.forEach((req, index) => {
          // Check space before adding requirement
          const reqBoxHeight = 70;
          const spacing = index > 0 ? 1.2 : 0;
          const neededSpace = spacing * 20 + reqBoxHeight;
          
          if (doc.y + neededSpace > doc.page.height - 50) {
            doc.addPage();
            doc.y = 50;
          }
          
          if (index > 0) doc.moveDown(1.2);
          
          const reqY = doc.y;
          
          doc.rect(50, reqY, doc.page.width - 100, reqBoxHeight)
            .fill('#FAFAFA')
            .stroke(veraGreen, 1);
          
          doc.fontSize(14)
            .fillColor(darkGray)
            .font('Helvetica-Bold')
            .text(req.title, 70, reqY + 12, {
              width: doc.page.width - 140
            });
          
          doc.fontSize(10)
            .fillColor(lightGray)
            .font('Helvetica')
            .text(req.description, 70, reqY + 32, {
              width: doc.page.width - 140,
              align: 'left'
            });
          
          doc.y = reqY + reqBoxHeight;
        });

        doc.moveDown(2);

        // Value Proposition Section - check space for header + first item
        if (doc.y + 180 > doc.page.height - 50) {
          doc.addPage();
          doc.y = 50;
        }

        const valueY = doc.y;
        doc.fontSize(22)
          .fillColor(veraGreen)
          .font('Helvetica-Bold')
          .text('The Value Proposition', 50, valueY);
        
        doc.moveTo(50, valueY + 20)
          .lineTo(250, valueY + 20)
          .stroke(veraGreen, 2);
        
        doc.y = valueY + 28;
        doc.fontSize(11)
          .fillColor(lightGray)
          .font('Helvetica-Oblique')
          .text('What we offer to our growers');
        
        doc.moveDown(2);

        const valueProps = [
          {
            title: 'Fixed Pricing',
            description: 'Seasonal price stability. No middleman, no daily price fluctuations. Secure your revenue with predictable pricing throughout the season. Prices are agreed before the season starts, eliminating market volatility and ensuring financial planning.',
          },
          {
            title: 'Logistics Priority',
            description: 'Our Frigo-Fleet picks up your goods at the exact scheduled minute. Zero wait time. Your harvest gets priority treatment from field to market. Direct packaging at farm in Vera packaging ensures freshness and quality.',
          },
          {
            title: 'Automated Payments',
            description: 'Funds are reserved upon field verification and released within 48 hours of Hub arrival. No payment delays, no cash flow worries. Payment is secured by contracts with German retail chains (60-90 days), providing financial security.',
          },
          {
            title: 'Group Certification',
            description: 'Vera Agrar holds the certification for all our partners. We cover the costs and certification process, while you gain direct access to the German market. No individual certification fees or complex paperwork required.',
          },
        ];

        valueProps.forEach((prop, index) => {
          // Check space before adding value prop
          const propBoxHeight = 70;
          const spacing = index > 0 ? 1.2 : 0;
          const neededSpace = spacing * 20 + propBoxHeight;
          
          if (doc.y + neededSpace > doc.page.height - 50) {
            doc.addPage();
            doc.y = 50;
          }
          
          if (index > 0) doc.moveDown(1.2);
          
          const propY = doc.y;
          
          doc.rect(50, propY, doc.page.width - 100, propBoxHeight)
            .fill('#FAFAFA')
            .stroke(veraGreen, 1);
          
          doc.fontSize(14)
            .fillColor(veraGreen)
            .font('Helvetica-Bold')
            .text(prop.title, 70, propY + 12, {
              width: doc.page.width - 140
            });
          
          doc.fontSize(10)
            .fillColor(lightGray)
            .font('Helvetica')
            .text(prop.description, 70, propY + 32, {
              width: doc.page.width - 140,
              align: 'left'
            });
          
          doc.y = propY + propBoxHeight;
        });

        doc.moveDown(2);

        // Technical Standards Section - check space for header + first item
        if (doc.y + 180 > doc.page.height - 50) {
          doc.addPage();
          doc.y = 50;
        }

        const standardsY = doc.y;
        doc.fontSize(22)
          .fillColor(veraGreen)
          .font('Helvetica-Bold')
          .text('Technical Standards', 50, standardsY);
        
        doc.moveTo(50, standardsY + 20)
          .lineTo(250, standardsY + 20)
          .stroke(veraGreen, 2);
        
        doc.y = standardsY + 28;
        doc.fontSize(11)
          .fillColor(lightGray)
          .font('Helvetica-Oblique')
          .text('Quality and compliance requirements');
        
        doc.moveDown(2);

        const standards = [
          {
            category: 'Certification',
            standard: 'GlobalG.A.P. IFA v6 (Group)',
            details: 'Group certification managed by Vera Agrar. All costs covered. Direct access to German market without individual certification.',
          },
          {
            category: 'Chemical Analysis',
            standard: 'MRL limit at 70% of EU permitted levels',
            details: 'All products must meet strict Maximum Residue Limits. Testing is performed at field verification stage. Quality is non-negotiable.',
          },
          {
            category: 'Logistics',
            standard: 'Direct packaging at farm in Vera packaging',
            details: 'Packaging must be done directly at farm using Bio Vera reusable crates with integrated QR codes. No manual repacking allowed.',
          },
          {
            category: 'Traceability',
            standard: 'Complete digital tracking from field to retail',
            details: 'Every crate is tracked with QR codes. GPS validation for all field entries. Complete transparency from seed to shelf.',
          },
        ];

        standards.forEach((std, index) => {
          // Check space before adding standard
          const stdBoxHeight = 70;
          const spacing = index > 0 ? 1.2 : 0;
          const neededSpace = spacing * 20 + stdBoxHeight;
          
          if (doc.y + neededSpace > doc.page.height - 50) {
            doc.addPage();
            doc.y = 50;
          }
          
          if (index > 0) doc.moveDown(1.2);
          
          const stdY = doc.y;
          
          doc.rect(50, stdY, doc.page.width - 100, stdBoxHeight)
            .fill('#FAFAFA')
            .stroke(veraGreen, 1);
          
          doc.fontSize(13)
            .fillColor(veraGreen)
            .font('Helvetica-Bold')
            .text(std.category + ':', 70, stdY + 10, {
              width: doc.page.width - 140
            });
          
          doc.fontSize(11)
            .fillColor(darkGray)
            .font('Helvetica-Bold')
            .text(std.standard, 70, stdY + 26, {
              width: doc.page.width - 140
            });
          
          doc.fontSize(9)
            .fillColor(lightGray)
            .font('Helvetica')
            .text(std.details, 70, stdY + 42, {
              width: doc.page.width - 140,
              align: 'left'
            });
          
          doc.y = stdY + stdBoxHeight;
        });

        doc.moveDown(2);

        // Application Process Section - check space for header + first item
        if (doc.y + 180 > doc.page.height - 50) {
          doc.addPage();
          doc.y = 50;
        }

        const appY = doc.y;
        doc.fontSize(22)
          .fillColor(veraGreen)
          .font('Helvetica-Bold')
          .text('Application Process', 50, appY);
        
        doc.moveTo(50, appY + 20)
          .lineTo(250, appY + 20)
          .stroke(veraGreen, 2);
        
        doc.y = appY + 28;
        doc.fontSize(11)
          .fillColor(lightGray)
          .font('Helvetica-Oblique')
          .text('How to join the Bio Vera network');
        
        doc.moveDown(2);

        const appSteps = [
          {
            step: '1. Submit Application',
            description: 'Fill out the online application form with your farm details, contact information, GPS location, crop types, and total hectares. Include field photos and indicate if you have GlobalG.A.P. certification, irrigation systems, and digital integration capabilities.',
          },
          {
            step: '2. Initial Review',
            description: 'Our team reviews your application within 3-5 business days. We assess your farm location, crop types, and compliance readiness. We may request additional information or schedule a preliminary site visit.',
          },
          {
            step: '3. On-Site Verification',
            description: 'A Field Coordinator visits your farm to verify GPS boundaries, assess infrastructure, and discuss the Bio Vera Protocol requirements. This includes checking irrigation systems, storage facilities, and digital readiness.',
          },
          {
            step: '4. Certification & Onboarding',
            description: 'Once approved, we handle all GlobalG.A.P. group certification processes and costs. You receive access to the Bio Vera mobile app and digital dashboard. Training sessions are provided on field management, harvest scheduling, and quality standards.',
          },
        ];

        appSteps.forEach((step, index) => {
          // Check space before adding step
          const stepBoxHeight = 60;
          const spacing = index > 0 ? 1.2 : 0;
          const neededSpace = spacing * 20 + stepBoxHeight;
          
          if (doc.y + neededSpace > doc.page.height - 50) {
            doc.addPage();
            doc.y = 50;
          }
          
          if (index > 0) doc.moveDown(1.2);
          
          const stepY = doc.y;
          
          doc.rect(50, stepY, doc.page.width - 100, stepBoxHeight)
            .fill('#FAFAFA')
            .stroke(veraGreen, 1);
          
          doc.fontSize(13)
            .fillColor(veraGreen)
            .font('Helvetica-Bold')
            .text(step.step, 70, stepY + 12, {
              width: doc.page.width - 140
            });
          
          doc.fontSize(10)
            .fillColor(lightGray)
            .font('Helvetica')
            .text(step.description, 70, stepY + 32, {
              width: doc.page.width - 140,
              align: 'left'
            });
          
          doc.y = stepY + stepBoxHeight;
        });

        doc.moveDown(2);

        // Contact & Next Steps Section - check space
        const contactBoxHeight = 80;
        if (doc.y + contactBoxHeight > doc.page.height - 50) {
          doc.addPage();
          doc.y = 50;
        }

        const contactY = doc.y;
        doc.rect(50, contactY, doc.page.width - 100, contactBoxHeight)
          .fill(bgGreen)
          .stroke(veraGreen, 2);
        
        doc.fontSize(16)
          .fillColor(veraGreen)
          .font('Helvetica-Bold')
          .text('Ready to Join?', 70, contactY + 15);
        
        doc.fontSize(10)
          .fillColor(darkGray)
          .font('Helvetica')
          .text('Visit our website to submit your application or contact us for more information. Our team is ready to help you join the most advanced agricultural logistics network in Europe. Open to producers across all European countries.', 
            70, contactY + 35, {
              width: doc.page.width - 140,
              align: 'left'
            });
        
        doc.y = contactY + contactBoxHeight;

        doc.end();
      } catch (error) {
        this.logger.error('Error generating prospect PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate Packaging Guidelines PDF for Growers
   */
  async generatePackagingGuidelinesPDF(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // @ts-ignore - pdfkit types may not be perfect
        const doc = new PDFDocument({ 
          margin: 50,
          size: 'A4',
        });
        const buffers: Buffer[] = [];

        // Colors
        const veraGreen = '#2D5A27';
        const darkGray = '#1F2937';
        const lightGray = '#6B7280';
        const bgGreen = '#F0F9F0';
        const accentGreen = '#4A7C59';

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Helper function to add header on each page
        const addHeader = () => {
          doc.rect(0, 0, doc.page.width, 120)
            .fill(bgGreen);
          
          const logoPath1 = path.join(process.cwd(), '..', 'web', 'public', 'logo1.png');
          const logoPath2 = path.join(process.cwd(), '..', 'web', 'public', 'logo.png');
          const logoPath = fs.existsSync(logoPath1) ? logoPath1 : (fs.existsSync(logoPath2) ? logoPath2 : null);
          
          if (logoPath && fs.existsSync(logoPath)) {
            try {
              doc.image(logoPath, 50, 15, { 
                width: 250,
                height: 75,
                fit: [250, 75]
              });
            } catch (error) {
              doc.fontSize(36)
                .fillColor(veraGreen)
                .text('Bio Vera', 50, 30);
            }
          } else {
            doc.fontSize(36)
              .fillColor(veraGreen)
              .text('Bio Vera', 50, 30);
          }
          
          doc.fontSize(16)
            .fillColor(darkGray)
            .text('Packaging Guidelines', 50, 85);
          
          doc.y = 130;
        };

        // Helper function to check if we need a new page
        const checkPageBreak = (requiredSpace: number = 100) => {
          if (doc.y + requiredSpace > doc.page.height - 50) {
            doc.addPage();
            addHeader();
          }
        };

        // Helper function to add section title with proper spacing
        const addSectionTitle = (title: string, requiredContentSpace: number = 150) => {
          // Check if we have space for title + first paragraph
          if (doc.y + 30 + requiredContentSpace > doc.page.height - 50) {
            doc.addPage();
            addHeader();
          }
          doc.fontSize(20)
            .fillColor(veraGreen)
            .font('Helvetica-Bold')
            .text(title, 50, doc.y);
          doc.moveDown(1);
        };

        // Page 1: Header
        addHeader();

        // Title Section
        doc.fontSize(28)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('Packaging Standards', 50, doc.y, { align: 'left' });
        
        doc.moveTo(50, doc.y + 5)
          .lineTo(250, doc.y + 5)
          .stroke(veraGreen, 2);
        
        doc.moveDown(1.5);

        doc.fontSize(12)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('All products must be packaged according to Bio Vera standards to ensure quality, traceability, and brand consistency. This guide provides detailed specifications for proper packaging.', 
            50, doc.y, { 
              align: 'left',
              width: doc.page.width - 100,
              lineGap: 3
            });
        
        doc.moveDown(2);

        // Box Specifications Section
        addSectionTitle('1. Box Specifications', 250);

        // Try to add box images (marketing/retail boxes)
        const boxImagePaths = [
          'packaging-box.jpg', 'packaging-box.png', 'box-example.jpg',
          'retail-box.jpg', 'marketing-box.jpg', 'kutija.jpg', 'box.jpg'
        ];
        let boxImagePath = null;
        for (const imgName of boxImagePaths) {
          const imgPath = path.join(process.cwd(), '..', 'web', 'public', imgName);
          if (fs.existsSync(imgPath)) {
            boxImagePath = imgPath;
            break;
          }
        }
        
        if (boxImagePath) {
          try {
            checkPageBreak(200);
            const imageY = doc.y;
            const imageWidth = 200; // Increased image width
            const imageHeight = 200; // Increased image height
            const textStartX = 50 + imageWidth + 20; // Text starts after image + gap
            
            // Image on the left side
            doc.image(boxImagePath, 50, imageY, {
              width: imageWidth,
              height: imageHeight,
              fit: [imageWidth, imageHeight]
            });
            
            // Text on the right side
            doc.fontSize(10)
              .fillColor(lightGray)
              .font('Helvetica')
              .text('Example: Bio Vera retail boxes ready for marketing. All boxes must meet precise specifications for perfect pallet fit without gaps that cause transport damage.', 
                textStartX, imageY, {
                  align: 'left',
                  width: doc.page.width - textStartX - 50,
                  lineGap: 3
                });
            
            doc.y = imageY + imageHeight + 15;
            doc.moveDown(1);
          } catch (error) {
            this.logger.warn('Could not load box image:', error);
          }
        }

        const boxSpecs = [
          { label: 'Material', value: 'Five-layer cardboard with internal moisture barrier (4-5mm thickness)' },
          { label: 'Standard Dimensions', value: `${this.BOX_SPECS.LENGTH}mm × ${this.BOX_SPECS.WIDTH}mm × ${this.BOX_SPECS.HEIGHT}mm (L × W × H)` },
          { label: 'Pallet Layout', value: `3×3 boxes per level (9 boxes per level), maximum 22 levels (198 boxes per pallet)` },
          { label: 'Pallet Volume', value: `${this.BOX_SPECS.PALLET_VOLUME_M3.toFixed(2)} m³ per pallet, ${this.BOX_SPECS.FIVE_PALLETS_VOLUME_M3.toFixed(2)} m³ for 5 pallets` },
          { label: 'Safety Margin', value: `2% weight margin for moisture and film` },
          { label: 'Label Placement', value: 'QR code and logo on 400mm side (longer side) for easy scanning on pallet' },
          { label: 'Branding', value: 'Bio Vera logo and "FROM ORCHARD TO SHELF" slogan' },
        ];

        boxSpecs.forEach((spec, index) => {
          checkPageBreak(30);
          doc.fontSize(11)
            .fillColor(darkGray)
            .font('Helvetica-Bold')
            .text(`${spec.label}:`, 70, doc.y);
          
          doc.fontSize(10)
            .fillColor(lightGray)
            .font('Helvetica')
            .text(spec.value, 200, doc.y, {
              width: doc.page.width - 250,
              align: 'left'
            });
          
          doc.moveDown(1.2);
        });

        doc.moveDown(1.5);

        // Product Arrangement Section
        addSectionTitle('2. Product Arrangement Standards', 300);

        // Try to add product arrangement images (apples and avocado examples)
        const appleImagePaths = [
          'apples-retail.jpg', 'apples-retail.jpg .jpg', // Handle duplicate extension
          'apples-box.jpg', 'apples-box.png',
          'apples.jpg', 'jabuke.jpg'
        ];
        let appleImagePath = null;
        for (const imgName of appleImagePaths) {
          const imgPath = path.join(process.cwd(), '..', 'web', 'public', imgName);
          if (fs.existsSync(imgPath)) {
            appleImagePath = imgPath;
            break;
          }
        }
        
        const avocadoImagePaths = [
          'avocado-retail.jpg', 'avocado-box.jpg', 'avocado-box.png',
          'avocado.jpg', 'avokado.jpg'
        ];
        let avocadoImagePath = null;
        for (const imgName of avocadoImagePaths) {
          const imgPath = path.join(process.cwd(), '..', 'web', 'public', imgName);
          if (fs.existsSync(imgPath)) {
            avocadoImagePath = imgPath;
            break;
          }
        }
        
        // Add apples example image - LEFT SIDE with text on RIGHT
        if (appleImagePath && fs.existsSync(appleImagePath)) {
          try {
            checkPageBreak(200);
            const imageY = doc.y;
            const imageWidth = 200; // Increased image width
            const imageHeight = 200; // Increased image height
            const textStartX = 50 + imageWidth + 20; // Text starts after image + gap
            
            // Image on the left side
            doc.image(appleImagePath, 50, imageY, {
              width: imageWidth,
              height: imageHeight,
              fit: [imageWidth, imageHeight]
            });
            
            // Text on the right side
            doc.fontSize(10)
              .fillColor(lightGray)
              .font('Helvetica')
              .text('Example: Apples in Bio Vera packaging (5 rows × 3 products = 15 apples per box). Each apple is individually nestled in compartments to prevent movement and damage during transport.', 
                textStartX, imageY, {
                  align: 'left',
                  width: doc.page.width - textStartX - 50,
                  lineGap: 3
                });
            
            doc.y = imageY + imageHeight + 15;
            doc.moveDown(1);
          } catch (error) {
            this.logger.warn('Could not load apples image:', error);
          }
        }
        
        // Add avocado example image - LEFT SIDE with text on RIGHT
        if (avocadoImagePath && fs.existsSync(avocadoImagePath)) {
          try {
            checkPageBreak(200);
            const imageY = doc.y;
            const imageWidth = 200; // Increased image width
            const imageHeight = 200; // Increased image height
            const textStartX = 50 + imageWidth + 20; // Text starts after image + gap
            
            // Image on the left side
            doc.image(avocadoImagePath, 50, imageY, {
              width: imageWidth,
              height: imageHeight,
              fit: [imageWidth, imageHeight]
            });
            
            // Text on the right side
            doc.fontSize(10)
              .fillColor(lightGray)
              .font('Helvetica')
              .text('Example: Avocado in Bio Vera packaging. All products must meet quality standards and be properly arranged in boxes according to specifications.', 
                textStartX, imageY, {
                  align: 'left',
                  width: doc.page.width - textStartX - 50,
                  lineGap: 3
                });
            
            doc.y = imageY + imageHeight + 15;
            doc.moveDown(1);
          } catch (error) {
            this.logger.warn('Could not load avocado image:', error);
          }
        }

        doc.fontSize(11)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('For Round Products (Apples, Oranges, Peaches, etc.):', 70, doc.y);
        
        doc.moveDown(0.8);

        const roundProductSpecs = [
          'Each box contains exactly 5 rows',
          'Each row contains exactly 3 products',
          'Total: 15 products per box (5 rows × 3 products)',
          'Products must be individually nestled in compartments or cups',
          'Compartments prevent movement and damage during transport',
          'All products must be uniform in size within the same box',
        ];

        roundProductSpecs.forEach((spec) => {
          checkPageBreak(25);
          doc.fontSize(10)
            .fillColor(lightGray)
            .font('Helvetica')
            .text(`• ${spec}`, 90, doc.y, {
              width: doc.page.width - 140,
              align: 'left',
              lineGap: 2
            });
          doc.moveDown(0.8);
        });

        doc.moveDown(1.5);

        checkPageBreak(200);
        doc.fontSize(11)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('For Other Products:', 70, doc.y);
        
        doc.moveDown(0.8);

        const otherProductSpecs = [
          'Berries (Raspberries, Strawberries, etc.): Use shallow trays, single layer, maximum 2kg per box',
          'Leafy Vegetables (Lettuce, Spinach, etc.): Bundle and wrap, maximum 3kg per box',
          'Root Vegetables (Carrots, Potatoes, etc.): Arrange in rows, maximum 10kg per box',
          'Grains: Use sealed bags within boxes, maximum 20kg per box',
        ];

        otherProductSpecs.forEach((spec) => {
          checkPageBreak(25);
          doc.fontSize(10)
            .fillColor(lightGray)
            .font('Helvetica')
            .text(`• ${spec}`, 90, doc.y, {
              width: doc.page.width - 140,
              align: 'left',
              lineGap: 2
            });
          doc.moveDown(0.8);
        });

        doc.moveDown(2);

        // Bulk Quantities Section
        addSectionTitle('2.1. Bulk Quantities for Wholesale', 200);

        doc.fontSize(11)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('Packaging for Wholesale/Marketing:', 70, doc.y);
        
        doc.moveDown(0.8);

        const bulkSpecs = [
          `For wholesale orders, products are packaged on standard pallets (1200mm × 800mm)`,
          `Each pallet contains ${this.BOX_SPECS.BOXES_PER_PALLET} retail boxes (3×3 layout per level, ${this.BOX_SPECS.MAX_LEVELS} levels maximum)`,
          `Pallet volume: ${this.BOX_SPECS.PALLET_VOLUME_M3.toFixed(2)} m³ per pallet`,
          `For 5 pallets: Total volume ${this.BOX_SPECS.FIVE_PALLETS_VOLUME_M3.toFixed(2)} m³ (for transport documentation)`,
          'All retail boxes must follow the same standards (5 rows × 3 products = 15 apples per box)',
          'Boxes are arranged 3×3 per level to perfectly fit pallet dimensions without gaps',
          'Pallets must be shrink-wrapped and labeled with batch information',
          'QR codes on each retail box (400mm side) remain scannable even when on pallet',
          'Wholesale customers receive products in Bio Vera branded boxes ready for retail',
        ];

        bulkSpecs.forEach((spec) => {
          checkPageBreak(25);
          doc.fontSize(10)
            .fillColor(lightGray)
            .font('Helvetica')
            .text(`• ${spec}`, 90, doc.y, {
              width: doc.page.width - 140,
              align: 'left',
              lineGap: 2
            });
          doc.moveDown(0.8);
        });

        doc.moveDown(1);

        // Try to add pallet image
        const palletImagePaths = [
          'apples-pallet.jpg', 'apples-pallet.png',
          'pallet.jpg', 'pallet.png'
        ];
        let palletImagePath = null;
        for (const imgName of palletImagePaths) {
          const imgPath = path.join(process.cwd(), '..', 'web', 'public', imgName);
          if (fs.existsSync(imgPath)) {
            palletImagePath = imgPath;
            break;
          }
        }

        if (palletImagePath && fs.existsSync(palletImagePath)) {
          try {
            checkPageBreak(200);
            const imageY = doc.y;
            const imageWidth = 200; // Increased image width
            const imageHeight = 200; // Increased image height
            const textStartX = 50 + imageWidth + 20; // Text starts after image + gap
            
            // Image on the left side
            doc.image(palletImagePath, 50, imageY, {
              width: imageWidth,
              height: imageHeight,
              fit: [imageWidth, imageHeight]
            });
            
            // Text on the right side
            doc.fontSize(10)
              .fillColor(lightGray)
              .font('Helvetica')
              .text(`Example: Pallet packaging for wholesale. Standard pallet layout: 3×3 boxes per level (9 boxes), maximum 22 levels (198 boxes per pallet). Total volume: ${this.BOX_SPECS.PALLET_VOLUME_M3.toFixed(2)} m³ per pallet.`, 
                textStartX, imageY, {
                  align: 'left',
                  width: doc.page.width - textStartX - 50,
                  lineGap: 3
                });
            
            doc.y = imageY + imageHeight + 15;
            doc.moveDown(1);
          } catch (error) {
            this.logger.warn('Could not load pallet image:', error);
          }
        }

        // Try to add bulk image
        const bulkImagePaths = [
          'apples-bulk.jpg', 'apples-bulk.png',
          'bulk.jpg', 'bulk.png'
        ];
        let bulkImagePath = null;
        for (const imgName of bulkImagePaths) {
          const imgPath = path.join(process.cwd(), '..', 'web', 'public', imgName);
          if (fs.existsSync(imgPath)) {
            bulkImagePath = imgPath;
            break;
          }
        }

        if (bulkImagePath && fs.existsSync(bulkImagePath)) {
          try {
            checkPageBreak(200);
            const imageY = doc.y;
            const imageWidth = 200; // Increased image width
            const imageHeight = 200; // Increased image height
            const textStartX = 50 + imageWidth + 20; // Text starts after image + gap
            
            // Image on the left side
            doc.image(bulkImagePath, 50, imageY, {
              width: imageWidth,
              height: imageHeight,
              fit: [imageWidth, imageHeight]
            });
            
            // Text on the right side
            doc.fontSize(10)
              .fillColor(lightGray)
              .font('Helvetica')
              .text(`Example: Bulk packaging. For 5 pallets, total volume: ${this.BOX_SPECS.FIVE_PALLETS_VOLUME_M3.toFixed(2)} m³. All boxes must be properly arranged without gaps to prevent transport damage.`, 
                textStartX, imageY, {
                  align: 'left',
                  width: doc.page.width - textStartX - 50,
                  lineGap: 3
                });
            
            doc.y = imageY + imageHeight + 15;
            doc.moveDown(1);
          } catch (error) {
            this.logger.warn('Could not load bulk image:', error);
          }
        }

        doc.moveDown(1.5);

        // Branding Requirements Section
        addSectionTitle('3. Branding Requirements', 250);

        // Try to add branding example image if available
        const brandingImagePath1 = path.join(process.cwd(), '..', 'web', 'public', 'branding-example.jpg');
        const brandingImagePath2 = path.join(process.cwd(), '..', 'web', 'public', 'branding-example.png');
        const brandingImagePath3 = path.join(process.cwd(), '..', 'web', 'public', 'box-branding.jpg');
        const brandingImagePath = fs.existsSync(brandingImagePath1) ? brandingImagePath1 : 
                                 (fs.existsSync(brandingImagePath2) ? brandingImagePath2 : 
                                 (fs.existsSync(brandingImagePath3) ? brandingImagePath3 : null));
        
        if (brandingImagePath && fs.existsSync(brandingImagePath)) {
          try {
            checkPageBreak(120);
            const imageY = doc.y;
            doc.image(brandingImagePath, 50, imageY, {
              width: doc.page.width - 100,
              height: 100,
              fit: [doc.page.width - 100, 100]
            });
            doc.y = imageY + 110;
            doc.moveDown(1);
          } catch (error) {
            this.logger.warn('Could not load branding image:', error);
          }
        }

        const brandingRequirements = [
          {
            title: 'Front Panel (Main Display)',
            items: [
              'Bio Vera logo (top center)',
              'Product name or "PREMIUM SELECTION" label',
              'Large QR code (centered, minimum 5cm × 5cm)',
              'Certification icons (small circular icons below QR code)',
            ]
          },
          {
            title: 'Side Panel',
            items: [
              '"FROM ORCHARD TO SHELF" slogan',
              'Farmer QR code (if applicable)',
              'Harvest date',
              'Batch number',
            ]
          },
          {
            title: 'Top Surface',
            items: [
              'Clear plastic window (if applicable)',
              'Product visibility through window',
              'Premium appearance',
            ]
          },
        ];

        brandingRequirements.forEach((section) => {
          checkPageBreak(80);
          doc.fontSize(12)
            .fillColor(darkGray)
            .font('Helvetica-Bold')
            .text(section.title, 70, doc.y);
          
          doc.moveDown(0.6);
          
          section.items.forEach((item) => {
            checkPageBreak(20);
            doc.fontSize(10)
              .fillColor(lightGray)
              .font('Helvetica')
              .text(`• ${item}`, 90, doc.y, {
                width: doc.page.width - 140,
                align: 'left'
              });
            doc.moveDown(0.7);
          });
          
          doc.moveDown(1);
        });

        doc.moveDown(1.5);

        // QR Code Specifications
        addSectionTitle('4. QR Code Specifications', 200);

        const qrSpecs = [
          'QR code must be printed in high contrast (black on white)',
          'Minimum size: 5cm × 5cm for main product QR code',
          'Position: Centered on front panel, below Bio Vera logo',
          'QR code links to digital passport with full traceability information',
          'Farmer QR code (optional): Links to farmer profile page',
          'QR codes must be scannable from 30cm distance',
          'No damage, smudging, or covering of QR codes allowed',
        ];

        qrSpecs.forEach((spec) => {
          checkPageBreak(20);
          doc.fontSize(10)
            .fillColor(lightGray)
            .font('Helvetica')
            .text(`• ${spec}`, 70, doc.y, {
              width: doc.page.width - 120,
              align: 'left',
              lineGap: 2
            });
          doc.moveDown(0.8);
        });

        doc.moveDown(2);

        // Quality Standards Section
        addSectionTitle('5. Quality Standards', 250);

        const qualityStandards = [
          {
            title: 'Product Quality',
            items: [
              'All products must meet Bio Vera visual standards',
              'No damaged, bruised, or overripe products',
              'Uniform size within each box',
              'Products must be clean and free of soil',
            ]
          },
          {
            title: 'Packaging Quality',
            items: [
              'Boxes must be clean and undamaged',
              'No torn or wet cardboard',
              'Proper closure and sealing',
              'Shrink-wrap (if applicable) must be tight and secure',
            ]
          },
          {
            title: 'Labeling',
            items: [
              'All labels must be clearly visible',
              'No smudged or illegible text',
              'Certification icons must be present',
              'Batch numbers must match digital records',
            ]
          },
        ];

        qualityStandards.forEach((section) => {
          checkPageBreak(80);
          doc.fontSize(12)
            .fillColor(darkGray)
            .font('Helvetica-Bold')
            .text(section.title, 70, doc.y);
          
          doc.moveDown(0.6);
          
          section.items.forEach((item) => {
            checkPageBreak(20);
            doc.fontSize(10)
              .fillColor(lightGray)
              .font('Helvetica')
              .text(`• ${item}`, 90, doc.y, {
                width: doc.page.width - 140,
                align: 'left'
              });
            doc.moveDown(0.7);
          });
          
          doc.moveDown(1);
        });

        doc.moveDown(1.5);

        // Packaging Process Section
        addSectionTitle('6. Packaging Process', 300);

        const processSteps = [
          {
            step: 'Step 1: Preparation',
            description: 'Ensure all Bio Vera packaging materials are available. Check that boxes are clean and undamaged. Verify QR codes are printed correctly.',
          },
          {
            step: 'Step 2: Product Selection',
            description: 'Select only products that meet Bio Vera quality standards. Sort by size and quality. Remove any damaged or substandard items.',
          },
          {
            step: 'Step 3: Arrangement',
            description: 'Arrange products according to standards (5 rows × 3 products for round items). Ensure products are securely nestled in compartments.',
          },
          {
            step: 'Step 4: Branding',
            description: 'Apply Bio Vera labels and ensure QR codes are visible. Verify all branding elements are correctly positioned.',
          },
          {
            step: 'Step 5: Sealing',
            description: 'Close boxes securely. Apply shrink-wrap if required. Ensure boxes are ready for transport.',
          },
          {
            step: 'Step 6: Documentation',
            description: 'Scan QR code and verify batch information in the app. Confirm packaging completion in the system.',
          },
        ];

        processSteps.forEach((step, index) => {
          checkPageBreak(60);
          doc.fontSize(11)
            .fillColor(darkGray)
            .font('Helvetica-Bold')
            .text(`${index + 1}. ${step.step}`, 70, doc.y);
          
          doc.moveDown(0.6);
          
          doc.fontSize(10)
            .fillColor(lightGray)
            .font('Helvetica')
            .text(step.description, 90, doc.y, {
              width: doc.page.width - 140,
              align: 'left',
              lineGap: 2
            });
          
          doc.moveDown(1.2);
        });

        doc.moveDown(2);

        // Important Notes Section
        addSectionTitle('7. Important Notes', 200);

        const importantNotes = [
          'Packaging must be done directly at the farm using Bio Vera materials only',
          'No manual repacking is allowed after initial packaging',
          'All boxes must be tracked from farm to retail',
          'Non-compliance with packaging standards may result in batch rejection',
          'Field Coordinators will verify packaging standards on-site',
          'Proper packaging ensures eligibility for Vera Bonus payments',
          'Questions? Contact your Field Coordinator or support team',
        ];

        importantNotes.forEach((note) => {
          checkPageBreak(25);
          doc.fontSize(10)
            .fillColor(lightGray)
            .font('Helvetica')
            .text(`⚠ ${note}`, 70, doc.y, {
              width: doc.page.width - 120,
              align: 'left',
              lineGap: 2
            });
          doc.moveDown(1);
        });

        doc.moveDown(2);

        // Footer
        const footerY = doc.page.height - 50;
        doc.fontSize(8)
          .fillColor(lightGray)
          .text('© 2026 Bio Vera. All rights reserved.', 50, footerY, { align: 'left' });
        
        doc.text('Packaging Guidelines v1.0', doc.page.width - 200, footerY, { align: 'right' });

        doc.end();
      } catch (error) {
        this.logger.error('Error generating packaging guidelines PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Helper function to add header with logo to PDF
   */
  private addHeader(doc: any, title: string, veraGreen: string, darkGray: string, lightGray: string, bgGreen: string): void {
    // Header background
    doc.rect(0, 0, doc.page.width, 150)
      .fill(bgGreen);
    
    // Try to add logo
    const logoPath1 = path.join(process.cwd(), '..', 'web', 'public', 'logo1.png');
    const logoPath2 = path.join(process.cwd(), '..', 'web', 'public', 'logo.png');
    const logoPath = fs.existsSync(logoPath1) ? logoPath1 : (fs.existsSync(logoPath2) ? logoPath2 : null);
    
    if (logoPath && fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, 50, 20, { 
          width: 300,
          height: 90,
          fit: [300, 90]
        });
        doc.fontSize(18)
          .fillColor(darkGray)
          .text(title, 50, 110, { align: 'left' });
      } catch (error) {
        this.logger.warn('Could not load logo image:', error);
        doc.fontSize(48)
          .fillColor(veraGreen)
          .text('Bio Vera', 50, 50, { align: 'left' });
        doc.fontSize(18)
          .fillColor(darkGray)
          .text(title, 50, 100, { align: 'left' });
      }
    } else {
      doc.fontSize(48)
        .fillColor(veraGreen)
        .text('Bio Vera', 50, 50, { align: 'left' });
      doc.fontSize(18)
        .fillColor(darkGray)
        .text(title, 50, 100, { align: 'left' });
    }
    
    doc.y = 160;
  }

  /**
   * Helper function to add footer to PDF
   */
  private addFooter(doc: any, lightGray: string, version: string): void {
    const footerY = doc.page.height - 50;
    doc.fontSize(8)
      .fillColor(lightGray)
      .text('© 2026 Bio Vera. All rights reserved.', 50, footerY, { align: 'left' });
    doc.text(version, doc.page.width - 200, footerY, { align: 'right' });
  }

  /**
   * Helper function to check if we need a new page
   */
  private checkPageBreak(doc: any, requiredHeight: number): void {
    if (doc.y + requiredHeight > doc.page.height - 100) {
      doc.addPage();
      doc.y = 50;
    }
  }

  /**
   * Generate Farmer Field Management Guide PDF
   */
  async generateFieldManagementGuidePDF(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new (PDFDocument as any)({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];

        const veraGreen = '#2D5A27';
        const darkGray = '#1F2937';
        const lightGray = '#6B7280';
        const bgGreen = '#F0F9F0';

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        this.addHeader(doc, 'Farmer Field Management Guide', veraGreen, darkGray, lightGray, bgGreen);
        doc.moveDown(1);

        // Introduction
        doc.fontSize(22).fillColor(veraGreen).font('Helvetica-Bold').text('Introduction', 50, doc.y);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(200, doc.y).stroke(veraGreen, 2);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(lightGray).font('Helvetica').text(
          'This guide provides comprehensive instructions for managing your estates, parcels, and field entries using the Bio Vera system. Follow these steps to ensure accurate tracking, compliance, and optimal yield management.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(2);

        // Section 1: Estate Management
        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('1. Estate Management', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'An estate represents your farm or agricultural property. Each estate must have defined boundaries using GPS coordinates.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1);
        doc.fontSize(12).fillColor(darkGray).font('Helvetica-Bold').text('Key Features:', 50, doc.y);
        doc.moveDown(0.5);
        const estateFeatures = [
          'GPS polygon coordinates for precise boundary definition',
          'Multiple parcels within a single estate',
          'Certification tracking (GlobalG.A.P., Organic, etc.)',
          'Owner and contact information management',
          'Historical data and compliance records'
        ];
        estateFeatures.forEach(feature => {
          doc.fontSize(10).fillColor(lightGray).font('Helvetica').text(`• ${feature}`, 60, doc.y, { width: doc.page.width - 120 });
          doc.moveDown(0.4);
        });
        doc.moveDown(1.5);

        // Section 2: Parcel Management
        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('2. Parcel Management', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Parcels are specific plots of land within your estate where crops are grown. Each parcel tracks individual crop types, planting dates, and expected harvest dates.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1);
        doc.fontSize(12).fillColor(darkGray).font('Helvetica-Bold').text('Creating a Parcel:', 50, doc.y);
        doc.moveDown(0.5);
        const parcelSteps = [
          'Select the estate where the parcel is located',
          'Define crop type (apple, raspberry, pepper, etc.)',
          'Set planting date and expected harvest date',
          'Record initial GPS coordinates',
          'Add any special notes or requirements'
        ];
        parcelSteps.forEach((step, idx) => {
          doc.fontSize(10).fillColor(lightGray).font('Helvetica').text(`${idx + 1}. ${step}`, 60, doc.y, { width: doc.page.width - 120 });
          doc.moveDown(0.4);
        });
        doc.moveDown(1.5);

        // Section 3: Field Entries
        this.checkPageBreak(doc, 250);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('3. Field Entries', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Field entries are the core of the Bio Vera system. They record all activities, treatments, and observations in your fields. All entries work offline and sync automatically when internet is available.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1);
        doc.fontSize(12).fillColor(darkGray).font('Helvetica-Bold').text('Entry Types:', 50, doc.y);
        doc.moveDown(0.5);
        const entryTypes = [
          'Fertilizer Application: Record fertilizer type, quantity, and barcode verification',
          'Pesticide Treatment: Log pesticide use with BioWhiteList validation',
          'Irrigation: Track water usage and irrigation schedules',
          'Growth Observations: Document crop development stages',
          'Weather Events: Record significant weather conditions',
          'Harvest Activities: Log harvest dates and quantities'
        ];
        entryTypes.forEach(type => {
          doc.fontSize(10).fillColor(lightGray).font('Helvetica').text(`• ${type}`, 60, doc.y, { width: doc.page.width - 120 });
          doc.moveDown(0.4);
        });
        doc.moveDown(1.5);

        // Section 4: GPS Validation
        this.checkPageBreak(doc, 150);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('4. GPS Validation', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Every field entry must include GPS coordinates. The system automatically validates that entries are made within your estate boundaries. Invalid GPS locations will be blocked.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        // Section 5: Offline Functionality
        this.checkPageBreak(doc, 150);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('5. Offline Functionality', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'The Bio Vera mobile app works completely offline. All field entries are stored locally and automatically synchronized when internet connection is restored. No data is ever lost, even if you are offline for 24 hours or more.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(2);

        this.addFooter(doc, lightGray, 'Field Management Guide v1.0');
        doc.end();
      } catch (error) {
        this.logger.error('Error generating field management guide PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate Bio Vera Protocol PDF
   */
  async generateProtocolPDF(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new (PDFDocument as any)({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];

        const veraGreen = '#2D5A27';
        const darkGray = '#1F2937';
        const lightGray = '#6B7280';
        const bgGreen = '#F0F9F0';

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        this.addHeader(doc, 'Bio Vera Protocol', veraGreen, darkGray, lightGray, bgGreen);
        doc.moveDown(1);

        // Introduction
        doc.fontSize(22).fillColor(veraGreen).font('Helvetica-Bold').text('Protocol Overview', 50, doc.y);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(200, doc.y).stroke(veraGreen, 2);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(lightGray).font('Helvetica').text(
          'The Bio Vera Protocol defines the standards, requirements, and processes for network participation. Adherence to this protocol ensures quality, traceability, and market access.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(2);

        // Section 1: Quality Standards
        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('1. Quality Standards', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'All products must meet Bio Vera quality standards, including visual inspection, chemical analysis, and compliance with certification requirements.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        // Section 2: Traceability Requirements
        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('2. Traceability Requirements', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Complete traceability from field to shelf is mandatory. Every batch must have a digital passport with full journey documentation, including GPS tracking, temperature logs, and quality checks.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        // Section 3: Certification
        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('3. Certification', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'GlobalG.A.P. IFA v6 group certification is required. Bio Vera handles all certification costs and processes. Individual certification is not required for network participation.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        // Section 4: Packaging Standards
        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('4. Packaging Standards', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'All products must be packaged according to Bio Vera specifications. This includes box dimensions, product arrangement, QR code placement, and branding requirements. See Packaging Guidelines for detailed specifications.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        // Section 5: Payment Terms
        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('5. Payment Terms', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Payments are processed through escrow system. Funds are released upon successful delivery verification. Payment splits include farmer base price, Vera bonus for compliance, transport fees, and platform margins.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(2);

        this.addFooter(doc, lightGray, 'Bio Vera Protocol v1.0');
        doc.end();
      } catch (error) {
        this.logger.error('Error generating protocol PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate Certification Requirements PDF
   */
  async generateCertificationRequirementsPDF(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new (PDFDocument as any)({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];

        const veraGreen = '#2D5A27';
        const darkGray = '#1F2937';
        const lightGray = '#6B7280';
        const bgGreen = '#F0F9F0';

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        this.addHeader(doc, 'Certification Requirements', veraGreen, darkGray, lightGray, bgGreen);
        doc.moveDown(1);

        // Introduction
        doc.fontSize(22).fillColor(veraGreen).font('Helvetica-Bold').text('GlobalG.A.P. IFA v6 Group Certification', 50, doc.y);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke(veraGreen, 2);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(lightGray).font('Helvetica').text(
          'Bio Vera provides group certification under GlobalG.A.P. IFA v6 standard. This eliminates individual certification costs and simplifies the certification process for network participants.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(2);

        // Requirements Checklist
        this.checkPageBreak(doc, 300);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('Compliance Checklist', 50, doc.y);
        doc.moveDown(1);
        
        const requirements = [
          'Farm registration and GPS boundary definition',
          'Documentation of all agricultural inputs (fertilizers, pesticides)',
          'Barcode verification for all chemicals (BioWhiteList compliance)',
          'Irrigation system documentation',
          'Harvest records and batch tracking',
          'Quality control procedures',
          'Worker safety and training records',
          'Environmental impact documentation',
          'Traceability system implementation',
          'Regular audit participation'
        ];

        requirements.forEach((req, idx) => {
          this.checkPageBreak(doc, 30);
          doc.fontSize(10).fillColor(lightGray).font('Helvetica').text(`□ ${req}`, 60, doc.y, { width: doc.page.width - 120 });
          doc.moveDown(0.6);
        });
        doc.moveDown(1.5);

        // Benefits
        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('Benefits of Group Certification', 50, doc.y);
        doc.moveDown(1);
        const benefits = [
          'No individual certification costs',
          'Simplified audit process',
          'Direct access to European markets',
          'Ongoing support and training',
          'Automatic compliance tracking'
        ];
        benefits.forEach(benefit => {
          doc.fontSize(10).fillColor(lightGray).font('Helvetica').text(`• ${benefit}`, 60, doc.y, { width: doc.page.width - 120 });
          doc.moveDown(0.5);
        });
        doc.moveDown(2);

        this.addFooter(doc, lightGray, 'Certification Requirements v1.0');
        doc.end();
      } catch (error) {
        this.logger.error('Error generating certification requirements PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate Mobile App Guide PDF
   */
  async generateMobileAppGuidePDF(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new (PDFDocument as any)({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];

        const veraGreen = '#2D5A27';
        const darkGray = '#1F2937';
        const lightGray = '#6B7280';
        const bgGreen = '#F0F9F0';

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        this.addHeader(doc, 'Mobile App Guide', veraGreen, darkGray, lightGray, bgGreen);
        doc.moveDown(1);

        // Introduction
        doc.fontSize(22).fillColor(veraGreen).font('Helvetica-Bold').text('Getting Started', 50, doc.y);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(200, doc.y).stroke(veraGreen, 2);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(lightGray).font('Helvetica').text(
          'The Bio Vera mobile application is designed for farmers of all ages, with large buttons, clear instructions, and offline functionality. This guide will help you navigate the app and manage your fields effectively.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(2);

        // Section 1: Installation
        this.checkPageBreak(doc, 150);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('1. Installation & Setup', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Download the Bio Vera app from the App Store (iOS) or Google Play (Android). After installation, log in with your credentials provided by Bio Vera. The app will automatically sync your estates and parcels.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        // Section 2: Field Entry
        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('2. Creating Field Entries', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'To create a field entry, tap the "+" button on the home screen. Select the parcel, choose the entry type (fertilizer, pesticide, irrigation, etc.), scan the barcode if applicable, and confirm your GPS location. The entry is saved automatically, even offline.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        // Section 3: Barcode Scanning
        this.checkPageBreak(doc, 150);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('3. Barcode Scanning', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'When applying fertilizers or pesticides, scan the product barcode. The app automatically verifies the product against the BioWhiteList. Unauthorized products will be blocked with an alert to admin.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        // Section 4: Offline Mode
        this.checkPageBreak(doc, 150);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('4. Offline Mode', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'The app works completely offline. All entries are stored locally and automatically synchronized when internet is available. You can work in the field without worrying about connectivity.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        // Section 5: Viewing Records
        this.checkPageBreak(doc, 150);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('5. Viewing Records', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Access all your field entries, harvest records, and compliance data from the "History" tab. Filter by date, parcel, or entry type. Export data for your records if needed.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(2);

        this.addFooter(doc, lightGray, 'Mobile App Guide v1.0');
        doc.end();
      } catch (error) {
        this.logger.error('Error generating mobile app guide PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate Payment Process Guide PDF
   */
  async generatePaymentProcessGuidePDF(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new (PDFDocument as any)({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];

        const veraGreen = '#2D5A27';
        const darkGray = '#1F2937';
        const lightGray = '#6B7280';
        const bgGreen = '#F0F9F0';

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        this.addHeader(doc, 'Payment Process Guide', veraGreen, darkGray, lightGray, bgGreen);
        doc.moveDown(1);

        // Introduction
        doc.fontSize(22).fillColor(veraGreen).font('Helvetica-Bold').text('Payment System Overview', 50, doc.y);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke(veraGreen, 2);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(lightGray).font('Helvetica').text(
          'Bio Vera uses an escrow payment system to ensure secure and timely payments. All transactions are transparent, automated, and protected.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(2);

        // Section 1: Escrow System
        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('1. Escrow System', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'When a buyer places an order, payment is held in escrow until delivery is confirmed. This protects both buyers and growers, ensuring payment only occurs after successful delivery verification.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        // Section 2: Payment Split
        this.checkPageBreak(doc, 250);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('2. Payment Split', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Upon successful delivery, payment is automatically split among all parties:',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(0.8);
        const paymentSplits = [
          'Farmer: Base product price + Vera bonus (for compliance)',
          'Driver: Transport fee (Balkan transport without VAT, German transport with 19% VAT)',
          'Platform: Seed margin + insurance commission + transport margin'
        ];
        paymentSplits.forEach(split => {
          doc.fontSize(10).fillColor(lightGray).font('Helvetica').text(`• ${split}`, 60, doc.y, { width: doc.page.width - 120 });
          doc.moveDown(0.5);
        });
        doc.moveDown(1.5);

        // Section 3: Release Schedule
        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('3. Release Schedule', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Payments are released automatically upon delivery confirmation. No paperwork or delays. Digital handover triggers immediate payment release to all parties.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        // Section 4: Vera Bonus
        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('4. Vera Bonus', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Growers receive a bonus for proper packaging compliance and quality standards. The bonus is calculated based on material control verification and added to the base farmer payout.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        // Section 5: Payment Methods
        this.checkPageBreak(doc, 150);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('5. Payment Methods', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Payments can be received via bank transfer, digital wallet, or other methods as configured in your profile. All payment details are securely stored and encrypted.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(2);

        this.addFooter(doc, lightGray, 'Payment Process Guide v1.0');
        doc.end();
      } catch (error) {
        this.logger.error('Error generating payment process guide PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate Quality Standards PDF
   */
  async generateQualityStandardsPDF(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new (PDFDocument as any)({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];

        const veraGreen = '#2D5A27';
        const darkGray = '#1F2937';
        const lightGray = '#6B7280';
        const bgGreen = '#F0F9F0';

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        this.addHeader(doc, 'Quality Standards', veraGreen, darkGray, lightGray, bgGreen);
        doc.moveDown(1);

        // Introduction
        doc.fontSize(22).fillColor(veraGreen).font('Helvetica-Bold').text('Quality Assurance', 50, doc.y);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(200, doc.y).stroke(veraGreen, 2);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(lightGray).font('Helvetica').text(
          'Bio Vera maintains strict quality standards for all certified products. These standards ensure consistency, safety, and market acceptance across all product categories.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(2);

        // Section 1: Visual Standards
        this.checkPageBreak(doc, 250);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('1. Visual Quality Standards', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'All products must meet visual quality criteria:',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(0.8);
        const visualStandards = [
          'Uniform size and shape (within 5% deviation tolerance)',
          'No visible defects, bruises, or damage',
          'Proper color development for variety',
          'Clean appearance, free from soil or debris',
          'Appropriate firmness for product type'
        ];
        visualStandards.forEach(standard => {
          doc.fontSize(10).fillColor(lightGray).font('Helvetica').text(`• ${standard}`, 60, doc.y, { width: doc.page.width - 120 });
          doc.moveDown(0.5);
        });
        doc.moveDown(1.5);

        // Section 2: Chemical Standards
        this.checkPageBreak(doc, 250);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('2. Chemical Quality Standards', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Chemical analysis requirements:',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(0.8);
        const chemicalStandards = [
          'Pesticide residue levels within EU MRL limits',
          'Heavy metals below maximum allowed concentrations',
          'Nitrate levels within safe ranges',
          'pH levels appropriate for product type',
          'Moisture content within optimal range (48h before harvest)'
        ];
        chemicalStandards.forEach(standard => {
          doc.fontSize(10).fillColor(lightGray).font('Helvetica').text(`• ${standard}`, 60, doc.y, { width: doc.page.width - 120 });
          doc.moveDown(0.5);
        });
        doc.moveDown(1.5);

        // Section 3: Protocol 360
        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('3. Protocol 360 Quality Control', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'All products undergo three levels of quality control:',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(0.8);
        const protocolLevels = [
          'Level 1: Eco-Safe Verification (Field) - Heavy metals, nitrates, pH, moisture',
          'Level 2: Biometric & Visual Scan (Packaging Center) - Calibration, firmness, film integrity',
          'Level 3: Logistics Guard (Transport) - Thermal shock monitoring, CO2 footprint tracking'
        ];
        protocolLevels.forEach(level => {
          doc.fontSize(10).fillColor(lightGray).font('Helvetica').text(`• ${level}`, 60, doc.y, { width: doc.page.width - 120 });
          doc.moveDown(0.5);
        });
        doc.moveDown(1.5);

        // Section 4: Rejection Criteria
        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('4. Rejection Criteria', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Products will be rejected if they fail to meet any of the following:',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(0.8);
        const rejectionCriteria = [
          'Visual defects exceeding 5% of batch',
          'Color deviation greater than 5% from standard',
          'Pesticide residues above MRL limits',
          'Temperature violations during transport (>8°C for >15 minutes)',
          'Missing or invalid QR codes',
          'Non-compliance with packaging standards'
        ];
        rejectionCriteria.forEach(criterion => {
          doc.fontSize(10).fillColor(lightGray).font('Helvetica').text(`• ${criterion}`, 60, doc.y, { width: doc.page.width - 120 });
          doc.moveDown(0.5);
        });
        doc.moveDown(2);

        this.addFooter(doc, lightGray, 'Quality Standards v1.0');
        doc.end();
      } catch (error) {
        this.logger.error('Error generating quality standards PDF:', error);
        reject(error);
      }
    });
  }
}
