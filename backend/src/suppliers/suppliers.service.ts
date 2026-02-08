import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  /**
   * Generate Supplier Prospect PDF
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
        doc.on('error', (error: Error) => {
          this.logger.error('PDF generation error:', error);
          reject(error);
        });

        // Try to add logo image if it exists
        const logoPath1 = path.join(process.cwd(), '..', 'web', 'public', 'logo1.png');
        const logoPath2 = path.join(process.cwd(), '..', 'web', 'public', 'logo.png');
        const logoPath = fs.existsSync(logoPath1) ? logoPath1 : (fs.existsSync(logoPath2) ? logoPath2 : null);

        // Helper function to add header on new pages
        const addHeader = () => {
          doc.rect(0, 0, doc.page.width, 150).fill(bgGreen);
          if (logoPath && fs.existsSync(logoPath)) {
            try {
              doc.image(logoPath, 50, 20, { width: 300, height: 90, fit: [300, 90] });
              doc.fontSize(18).fillColor(darkGray).text('Strategic Supplier Program', 50, 110, { align: 'left' });
            } catch (error) {
              doc.fontSize(48).fillColor(veraGreen).text('Bio Vera', 50, 50, { align: 'left' });
              doc.fontSize(18).fillColor(darkGray).text('Strategic Supplier Program', 50, 100, { align: 'left' });
            }
          } else {
            doc.fontSize(48).fillColor(veraGreen).text('Bio Vera', 50, 50, { align: 'left' });
            doc.fontSize(18).fillColor(darkGray).text('Strategic Supplier Program', 50, 100, { align: 'left' });
          }
          doc.y = 160;
        };

        // Initial header
        addHeader();
        doc.moveDown(2.5);

        // Hero Section with better styling and padding
        const heroY = doc.y;
        const heroBoxHeight = 90;
        doc.rect(50, heroY, doc.page.width - 100, heroBoxHeight)
          .fill(bgGreen)
          .stroke(veraGreen, 2);
        
        doc.fontSize(28)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('Become a Strategic Supplier', 70, heroY + 20, { 
            align: 'left',
            width: doc.page.width - 140
          });
        
        doc.fontSize(11)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('Join our network of trusted suppliers and expand your reach to the European market through the Bio Vera platform.', 
            70, heroY + 55, { 
              align: 'left', 
              width: doc.page.width - 140 
            });
        
        doc.y = heroY + heroBoxHeight;
        doc.moveDown(2.5);

        // How It Works Section with better styling
        const sectionY = doc.y;
        doc.fontSize(22)
          .fillColor(veraGreen)
          .font('Helvetica-Bold')
          .text('How It Works', 50, sectionY);
        
        // Underline
        doc.moveTo(50, sectionY + 20)
          .lineTo(200, sectionY + 20)
          .stroke(veraGreen, 2);
        
        doc.y = sectionY + 28;
        doc.fontSize(11)
          .fillColor(lightGray)
          .font('Helvetica-Oblique')
          .text('Understanding the Bio Vera supply chain');
        
        doc.moveDown(2);

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
            description: 'Suppliers distribute products to Bio Vera certified growers across Europe. Every transaction is tracked through QR codes, ensuring complete traceability from manufacturing partner to field.',
          },
          {
            number: '4',
            title: 'Digital Tracking & Compliance',
            description: 'All inventory movements are recorded in the Vera Admin Dashboard. Suppliers maintain real-time visibility of stock levels, and the system automatically alerts when inventory falls below 20% threshold.',
          },
        ];

        processSteps.forEach((step, index) => {
          // Check if we need a new page before adding step
          const boxHeight = 60;
          const spacing = index > 0 ? 1.2 : 0;
          const neededSpace = spacing * 20 + boxHeight;
          
          if (doc.y + neededSpace > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            addHeader();
          }
          
          if (index > 0) doc.moveDown(1.2);
          
          const startY = doc.y;
          
          // Step box with background and better padding
          doc.rect(50, startY, doc.page.width - 100, boxHeight)
            .fill('#FAFAFA')
            .stroke(veraGreen, 1);
          
          // Step number circle
          doc.circle(70, startY + 30, 16)
            .fill(veraGreen);
          doc.fontSize(13)
            .fillColor('white')
            .font('Helvetica-Bold')
            .text(step.number, 58, startY + 22, { width: 24, align: 'center' });
          
          // Title
          doc.fontSize(14)
            .fillColor(darkGray)
            .font('Helvetica-Bold')
            .text(step.title, 100, startY + 12, { 
              width: doc.page.width - 160,
              align: 'left' 
            });
          
          // Description
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

        // Requirements Section - check space for header + first item
        // Calculate needed space: title (22) + underline (20) + subtitle (28) + spacing (40) + first box (30) = ~140
        if (doc.y + 140 > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          addHeader();
        }

        const reqSectionY = doc.y;
        doc.fontSize(22)
          .fillColor(veraGreen)
          .font('Helvetica-Bold')
          .text('Program Requirements', 50, reqSectionY);
        
        // Underline
        doc.moveTo(50, reqSectionY + 20)
          .lineTo(250, reqSectionY + 20)
          .stroke(veraGreen, 2);
        
        doc.y = reqSectionY + 28;
        doc.fontSize(11)
          .fillColor(lightGray)
          .font('Helvetica-Oblique')
          .text('What we expect from our suppliers');
        
        doc.moveDown(2);

        // For Distributors with box
        const distY = doc.y;
        const distBoxHeight = 30;
        doc.rect(50, distY, doc.page.width - 100, distBoxHeight)
          .fill(veraGreen)
          .stroke(veraGreen);
        
        doc.fontSize(14)
          .fillColor('white')
          .font('Helvetica-Bold')
          .text('For Distributors (Agricultural Pharmacies & Wholesalers)', 70, distY + 9, {
            width: doc.page.width - 140
          });
        
        doc.y = distY + distBoxHeight;
        doc.moveDown(0.8);

        const distributorRequirements = [
          'Vera Resources Storage: Obligation to provide dry and secure storage space for Vera seeds, fertilizers, and packaging materials.',
          'QR Code Issuance: Distributor cannot issue goods without scanning the QR code from the farmer\'s app. This is the only way to track consumption per hectare.',
          'Local Support: Distributor is the first point of contact for farmers in their area. They perform physical verification of received goods.',
          'Inventory Reporting: System must automatically notify headquarters in Hamburg when inventory falls below 20%.',
        ];

        distributorRequirements.forEach((req) => {
          // Check space before adding requirement
          const reqHeight = 20; // Approximate height for requirement line
          if (doc.y + reqHeight > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            addHeader();
          }
          
          const reqY = doc.y;
          doc.circle(70, reqY + 5, 4)
            .fill(veraGreen);
          doc.fontSize(10)
            .fillColor(darkGray)
            .font('Helvetica')
            .text(req, 82, reqY, { 
              width: doc.page.width - 140,
              align: 'left' 
            });
          doc.moveDown(0.7);
        });

        doc.moveDown();

        // For Packaging Manufacturers with box - check space
        doc.moveDown(1.2);
        const packBoxHeight = 30;
        const packNeededSpace = packBoxHeight + 50; // Box + requirements below
        if (doc.y + packNeededSpace > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          addHeader();
        }
        
        const packY = doc.y;
        doc.rect(50, packY, doc.page.width - 100, packBoxHeight)
          .fill(veraGreen)
          .stroke(veraGreen);
        
        doc.fontSize(14)
          .fillColor('white')
          .font('Helvetica-Bold')
          .text('For Packaging Manufacturers (Cardboard/Producers)', 70, packY + 9, {
            width: doc.page.width - 140
          });
        
        doc.y = packY + packBoxHeight;
        doc.moveDown(0.8);

        const packagingRequirements = [
          'Production to Vera Specification: Every box must be made from agreed cardboard weight (e.g., five-layer) with food contact certification.',
          'Just-in-Time Delivery: Obligation to deliver flat-packed packaging directly to our distributors within 48 hours of order.',
          'Barcode Printing: Every packaging series must have a printed serial number or barcode that we generate, so we know which farmer used which series of boxes.',
        ];

        packagingRequirements.forEach((req) => {
          // Check space before adding requirement
          const reqHeight = 20; // Approximate height for requirement line
          if (doc.y + reqHeight > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            addHeader();
          }
          
          const reqY = doc.y;
          doc.circle(70, reqY + 5, 4)
            .fill(veraGreen);
          doc.fontSize(10)
            .fillColor(darkGray)
            .font('Helvetica')
            .text(req, 82, reqY, { 
              width: doc.page.width - 140,
              align: 'left' 
            });
          doc.moveDown(0.7);
        });

        doc.moveDown();

        // Common Obligation with better styling and padding - check space
        doc.moveDown(1.2);
        const commonBoxHeight = 70;
        if (doc.y + commonBoxHeight > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          addHeader();
        }
        
        const commonY = doc.y;
        doc.rect(50, commonY, doc.page.width - 100, commonBoxHeight)
          .fill(bgGreen)
          .stroke(veraGreen, 2);
        
        doc.fontSize(13)
          .fillColor(veraGreen)
          .font('Helvetica-Bold')
          .text('Common Obligation:', 70, commonY + 15);
        
        doc.fontSize(10)
          .fillColor(darkGray)
          .font('Helvetica')
          .text('All partners must use the Vera Admin Dashboard to record every entry and exit of goods. No \'paperwork\' – everything must be in the digital system.', 
            70, commonY + 35, { 
              width: doc.page.width - 140 
            });
        
        doc.y = commonY + commonBoxHeight;

        doc.moveDown(2);

        // Benefits Section - check space for header + first item
        // Calculate needed space: title (22) + underline (20) + subtitle (28) + spacing (40) + first box (55) = ~165
        if (doc.y + 165 > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          addHeader();
        }

        const benefitsY = doc.y;
        doc.fontSize(22)
          .fillColor(veraGreen)
          .font('Helvetica-Bold')
          .text('What You Get', 50, benefitsY);
        
        // Underline
        doc.moveTo(50, benefitsY + 20)
          .lineTo(180, benefitsY + 20)
          .stroke(veraGreen, 2);
        
        doc.y = benefitsY + 28;
        doc.fontSize(11)
          .fillColor(lightGray)
          .font('Helvetica-Oblique')
          .text('Benefits of joining the Bio Vera network');
        
        doc.moveDown(2);

        const benefits = [
          {
            title: 'Guaranteed Purchase',
            description: 'All our growers must purchase from our approved suppliers. Guaranteed demand and stable revenue streams.',
          },
          {
            title: 'National Coverage Preferred',
            description: 'Main suppliers with good national coverage are highly preferred. Expand your market reach across Europe.',
          },
          {
            title: 'Exclusive Market Access',
            description: 'Direct access to European market through our vertically integrated network. Your products reach end customers without intermediaries.',
          },
        ];

        benefits.forEach((benefit, index) => {
          // Check space before adding benefit
          const benefitBoxHeight = 55;
          const spacing = index > 0 ? 1.2 : 0;
          const neededSpace = spacing * 20 + benefitBoxHeight;
          
          if (doc.y + neededSpace > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            addHeader();
          }
          
          if (index > 0) doc.moveDown(1.2);
          
          const benefitY = doc.y;
          
          // Benefit box with better padding
          doc.rect(50, benefitY, doc.page.width - 100, benefitBoxHeight)
            .fill('#FAFAFA')
            .stroke(veraGreen, 1);
          
          // Title
          doc.fontSize(14)
            .fillColor(veraGreen)
            .font('Helvetica-Bold')
            .text(benefit.title, 70, benefitY + 12, {
              width: doc.page.width - 140
            });
          
          // Description
          doc.fontSize(10)
            .fillColor(lightGray)
            .font('Helvetica')
            .text(benefit.description, 70, benefitY + 30, { 
              width: doc.page.width - 140,
              align: 'left' 
            });
          
          doc.y = benefitY + benefitBoxHeight;
        });

        doc.moveDown(2);

        // Our Products Section
        // Check space for header + first product
        if (doc.y + 200 > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          addHeader();
        }

        const productsY = doc.y;
        doc.fontSize(22)
          .fillColor(veraGreen)
          .font('Helvetica-Bold')
          .text('Our Products', 50, productsY);
        
        // Underline
        doc.moveTo(50, productsY + 20)
          .lineTo(200, productsY + 20)
          .stroke(veraGreen, 2);
        
        doc.y = productsY + 28;
        doc.fontSize(11)
          .fillColor(lightGray)
          .font('Helvetica-Oblique')
          .text('Bio Vera certified products with complete traceability');
        
        doc.moveDown(1.5);

        // Try to add products triptych image (all three products together)
        const productsTriptychPaths = [
          'bio-vera-products.jpg', 'bio-vera-products.png',
          'bio-vera-products-triptych.jpg', 'products-overview.jpg',
          'all-products.jpg', 'products.jpg'
        ];
        let productsTriptychPath = null;
        for (const imgName of productsTriptychPaths) {
          const imgPath = path.join(process.cwd(), '..', 'web', 'public', imgName);
          if (fs.existsSync(imgPath)) {
            productsTriptychPath = imgPath;
            break;
          }
        }

        if (productsTriptychPath) {
          try {
            if (doc.y + 220 > doc.page.height - doc.page.margins.bottom) {
              doc.addPage();
              addHeader();
            }
            const triptychY = doc.y;
            doc.image(productsTriptychPath, 50, triptychY, {
              width: doc.page.width - 100,
              height: 200,
              fit: [doc.page.width - 100, 200]
            });
            doc.y = triptychY + 210;
            doc.moveDown(1.5);
          } catch (error) {
            this.logger.warn('Could not load products triptych image:', error);
          }
        }
        
        doc.moveDown(0.5);

        // Product 1: BIO-GROW Liquid Nutrients
        if (doc.y + 170 > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          addHeader();
        }

        const bioGrowY = doc.y;
        const bioGrowBoxHeight = 150;
        doc.rect(50, bioGrowY, doc.page.width - 100, bioGrowBoxHeight)
          .fill('#FAFAFA')
          .stroke(veraGreen, 1);
        
        // Try to add BIO-GROW image
        const bioGrowImagePaths = [
          'bio-grow.jpg', 'bio-grow.png', 'bio-grow-bottle.jpg',
          'bottle.jpg', 'fertilizer.jpg'
        ];
        let bioGrowImagePath = null;
        for (const imgName of bioGrowImagePaths) {
          const imgPath = path.join(process.cwd(), '..', 'web', 'public', imgName);
          if (fs.existsSync(imgPath)) {
            bioGrowImagePath = imgPath;
            break;
          }
        }

        const textStartX = bioGrowImagePath ? 320 : 70;
        
        if (bioGrowImagePath) {
          try {
            doc.image(bioGrowImagePath, 70, bioGrowY + 10, {
              width: 220,
              height: 130,
              fit: [220, 130]
            });
          } catch (error) {
            this.logger.warn('Could not load BIO-GROW image:', error);
          }
        }
        
        // Product title
        doc.fontSize(16)
          .fillColor(veraGreen)
          .font('Helvetica-Bold')
          .text('BIO-GROW Liquid Nutrients', textStartX, bioGrowY + 10);
        
        // Product details
        doc.fontSize(10)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('Premium Quality Assurance', textStartX, bioGrowY + 15);
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Triple-Check Certified - Fuel for the Gold Standard', textStartX, bioGrowY + 32, {
            width: doc.page.width - textStartX - 50
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Bio-Active formula for optimal plant growth', textStartX, bioGrowY + 48, {
            width: doc.page.width - textStartX - 50
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Available in 5L containers with QR code traceability', textStartX, bioGrowY + 64, {
            width: doc.page.width - textStartX - 50
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Premium liquid nutrients for professional growers', textStartX, bioGrowY + 80, {
            width: doc.page.width - textStartX - 50
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Complete traceability from production to field', textStartX, bioGrowY + 96, {
            width: doc.page.width - textStartX - 50
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Gold standard certification and quality assurance', textStartX, bioGrowY + 112, {
            width: doc.page.width - textStartX - 50
          });
        
        doc.y = bioGrowY + bioGrowBoxHeight;
        doc.moveDown(1.5);

        // Product 2: Seeds
        if (doc.y + 170 > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          addHeader();
        }

        const seedsY = doc.y;
        const seedsBoxHeight = 150;
        doc.rect(50, seedsY, doc.page.width - 100, seedsBoxHeight)
          .fill('#FAFAFA')
          .stroke(veraGreen, 1);
        
        // Try to add seed packet image
        const seedImagePaths = [
          'seed-packet.jpg', 'seed-packet.png', 'seeds-packet.jpg',
          'premium-seed-selection.jpg', 'cucumber-seeds.jpg',
          'seeds.jpg', 'seed.jpg'
        ];
        let seedImagePath = null;
        for (const imgName of seedImagePaths) {
          const imgPath = path.join(process.cwd(), '..', 'web', 'public', imgName);
          if (fs.existsSync(imgPath)) {
            seedImagePath = imgPath;
            break;
          }
        }

        const seedsTextStartX = seedImagePath ? 320 : 70;
        
        if (seedImagePath) {
          try {
            doc.image(seedImagePath, 70, seedsY + 10, {
              width: 220,
              height: 130,
              fit: [220, 130]
            });
          } catch (error) {
            this.logger.warn('Could not load seed packet image:', error);
          }
        }
        
        // Product title
        doc.fontSize(16)
          .fillColor(veraGreen)
          .font('Helvetica-Bold')
          .text('Premium Seed Selection', seedsTextStartX, seedsY + 15);
        
        // Product details
        doc.fontSize(10)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('Triple-Check Certified', seedsTextStartX, seedsY + 32);
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Non-GMO, Organically Certified, Traceable Origin', seedsTextStartX, seedsY + 48, {
            width: doc.page.width - seedsTextStartX - 50
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Premium quality seeds with full traceability from source to harvest', seedsTextStartX, seedsY + 64, {
            width: doc.page.width - seedsTextStartX - 50
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Partner pricing available for Vera Partners', seedsTextStartX, seedsY + 80, {
            width: doc.page.width - seedsTextStartX - 50
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Serial number tracking and QR code integration', seedsTextStartX, seedsY + 96, {
            width: doc.page.width - seedsTextStartX - 50
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Wide variety of certified seeds for all crop types', seedsTextStartX, seedsY + 112, {
            width: doc.page.width - seedsTextStartX - 50
          });
        
        doc.y = seedsY + seedsBoxHeight;
        doc.moveDown(1.5);

        // Product 3: Seedlings
        if (doc.y + 100 > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          addHeader();
        }

        const seedlingsY = doc.y;
        const seedlingsBoxHeight = 80;
        doc.rect(50, seedlingsY, doc.page.width - 100, seedlingsBoxHeight)
          .fill('#FAFAFA')
          .stroke(veraGreen, 1);
        
        doc.fontSize(16)
          .fillColor(veraGreen)
          .font('Helvetica-Bold')
          .text('Young Seedlings', 70, seedlingsY + 10);
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Healthy, certified seedlings ready for transplanting', 70, seedlingsY + 28, {
            width: doc.page.width - 140
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Complete traceability from seed to mature plant', 70, seedlingsY + 42, {
            width: doc.page.width - 140
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Packaged in Bio Vera standard boxes with QR codes', 70, seedlingsY + 56, {
            width: doc.page.width - 140
          });
        
        doc.y = seedlingsY + seedlingsBoxHeight;
        doc.moveDown(1.5);

        // Product 4: Packaging Boxes (Retail & Wholesale)
        if (doc.y + 250 > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          addHeader();
        }

        const packagingY = doc.y;
        const packagingBoxHeight = 230;
        doc.rect(50, packagingY, doc.page.width - 100, packagingBoxHeight)
          .fill('#FAFAFA')
          .stroke(veraGreen, 1);
        
        doc.fontSize(16)
          .fillColor(veraGreen)
          .font('Helvetica-Bold')
          .text('Packaging Boxes for Sale', 70, packagingY + 10);
        
        doc.moveDown(0.5);
        
        // Retail Box Section
        doc.fontSize(12)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('1. Retail Box', 70, doc.y);
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Bio Vera Standard Box: 400mm × 266mm × 90mm (15-pack for apples)', 90, doc.y, {
            width: doc.page.width - 160
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Natural kraft cardboard with clear plastic windows (front and top)', 90, doc.y + 14, {
            width: doc.page.width - 160
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Die-cut handles on both sides for easy handling', 90, doc.y + 14, {
            width: doc.page.width - 160
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Bio Vera branding: "FROM FARM TO SHELF" slogan, QR code, and icons', 90, doc.y + 14, {
            width: doc.page.width - 160
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Five-layer cardboard with moisture barrier (4-5mm thickness)', 90, doc.y + 14, {
            width: doc.page.width - 160
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Molded pulp inserts available for delicate products (eggs, fruits)', 90, doc.y + 14, {
            width: doc.page.width - 160
          });
        
        doc.y = doc.y + 14;
        doc.moveDown(0.8);
        
        // Wholesale Box Section
        doc.fontSize(12)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('2. Wholesale Box', 70, doc.y);
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Larger boxes for bulk orders and pallet packaging', 90, doc.y, {
            width: doc.page.width - 160
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Pallet layout: 3×3 boxes per level, 22 levels max (198 boxes per pallet)', 90, doc.y + 14, {
            width: doc.page.width - 160
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Volume: 1.90 m³ per pallet, 9.48 m³ for 5 pallets', 90, doc.y + 14, {
            width: doc.page.width - 160
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• QR code and logo on 400mm side for easy scanning on pallet', 90, doc.y + 14, {
            width: doc.page.width - 160
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Flat-packed delivery to distributors within 48 hours', 90, doc.y + 14, {
            width: doc.page.width - 160
          });
        
        doc.y = doc.y + 14;
        
        // Try to add box images
        const boxImagePaths = [
          'retail-box.jpg', 'retail-box.png', 'box-retail.jpg',
          'wholesale-box.jpg', 'box-wholesale.jpg', 'packaging-box.jpg',
          'bio-vera-box.jpg', 'box.jpg'
        ];
        let boxImagePath = null;
        for (const imgName of boxImagePaths) {
          const imgPath = path.join(process.cwd(), '..', 'web', 'public', imgName);
          if (fs.existsSync(imgPath)) {
            boxImagePath = imgPath;
            break;
          }
        }

        if (boxImagePath && doc.y + 180 < packagingY + packagingBoxHeight - 20) {
          try {
            const boxImageY = doc.y + 10;
            const boxImageWidth = 250;
            const boxImageHeight = 160;
            const boxTextStartX = 70 + boxImageWidth + 20;
            
            // Image on the left
            doc.image(boxImagePath, 70, boxImageY, {
              width: boxImageWidth,
              height: boxImageHeight,
              fit: [boxImageWidth, boxImageHeight]
            });
            
            // Text on the right
            doc.fontSize(9)
              .fillColor(lightGray)
              .font('Helvetica')
              .text('Example: Bio Vera retail and wholesale boxes. All boxes must meet precise specifications for perfect pallet fit and brand consistency. Retail boxes feature clear windows and die-cut handles, while wholesale boxes are optimized for pallet stacking.', 
                boxTextStartX, boxImageY, {
                  align: 'left',
                  width: doc.page.width - boxTextStartX - 50,
                  lineGap: 3
                });
            
            doc.y = boxImageY + boxImageHeight + 10;
          } catch (error) {
            this.logger.warn('Could not load box image:', error);
          }
        }
        
        doc.y = packagingY + packagingBoxHeight;
        doc.moveDown(1.5);

        // Product 5: Logistics Materials (Cerada/Tarpaulin)
        if (doc.y + 200 > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          addHeader();
        }

        const logisticsY = doc.y;
        const logisticsBoxHeight = 150;
        doc.rect(50, logisticsY, doc.page.width - 100, logisticsBoxHeight)
          .fill('#FAFAFA')
          .stroke(veraGreen, 1);
        
        // Try to add truck cerada image
        const ceradaImagePaths = [
          'truck-cerada.jpg', 'truck-cerada-1.jpg', 'truck-cerada.png', 
          'cerada.jpg', 'tarpaulin.jpg', 'truck-cover.jpg', 'logistics-cover.jpg'
        ];
        let ceradaImagePath = null;
        for (const imgName of ceradaImagePaths) {
          const imgPath = path.join(process.cwd(), '..', 'web', 'public', imgName);
          if (fs.existsSync(imgPath)) {
            ceradaImagePath = imgPath;
            break;
          }
        }

        const logisticsTextStartX = ceradaImagePath ? 320 : 70;
        
        if (ceradaImagePath) {
          try {
            doc.image(ceradaImagePath, 70, logisticsY + 10, {
              width: 220,
              height: 130,
              fit: [220, 130]
            });
          } catch (error) {
            this.logger.warn('Could not load cerada image:', error);
          }
        }
        
        // Product title
        doc.fontSize(16)
          .fillColor(veraGreen)
          .font('Helvetica-Bold')
          .text('Logistics Materials', logisticsTextStartX, logisticsY + 15);
        
        // Product details
        doc.fontSize(10)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('Transport Tarpaulin (Cerada)', logisticsTextStartX, logisticsY + 32);
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Heavy-duty waterproof tarpaulin for truck cargo protection', logisticsTextStartX, logisticsY + 48, {
            width: doc.page.width - logisticsTextStartX - 50
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Bio Vera branded with "FROM ORCHARD TO SHELF" design', logisticsTextStartX, logisticsY + 64, {
            width: doc.page.width - logisticsTextStartX - 50
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• UV-resistant and weatherproof materials for long-distance transport', logisticsTextStartX, logisticsY + 80, {
            width: doc.page.width - logisticsTextStartX - 50
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Standard sizes for all vehicle types (vans, trucks, trailers)', logisticsTextStartX, logisticsY + 96, {
            width: doc.page.width - logisticsTextStartX - 50
          });
        
        doc.fontSize(9)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('• Reinforced edges and grommets for secure fastening', logisticsTextStartX, logisticsY + 112, {
            width: doc.page.width - logisticsTextStartX - 50
          });
        
        doc.y = logisticsY + logisticsBoxHeight;

        // Footer - add after all content is written
        // Note: We'll add footer text on each page after content is complete
        // For now, we'll add it at the end of the document

        doc.end();
      } catch (error) {
        this.logger.error('Error generating prospect PDF:', error);
        this.logger.error('Error details:', error instanceof Error ? error.message : String(error));
        this.logger.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
        reject(error);
      }
    });
  }
}
