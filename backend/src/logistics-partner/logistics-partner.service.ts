import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class LogisticsPartnerService {
  private readonly logger = new Logger(LogisticsPartnerService.name);

  /**
   * Generate Logistics Partner Prospect PDF
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

        // Helper function to add header with logo on new pages
        const addHeader = () => {
          doc.rect(0, 0, doc.page.width, 150)
            .fill(bgGreen);
          
          const logoPath1 = path.join(process.cwd(), 'public', 'logo1.png');
          const logoPath2 = path.join(process.cwd(), 'public', 'logo.png');
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
                .text('For Logistics Partners', 50, 110, { align: 'left' });
            } catch (error) {
              this.logger.warn('Could not load logo image, using text fallback:', error);
              doc.fontSize(48)
                .fillColor(veraGreen)
                .text('Bio Vera', 50, 50, { align: 'left' });
              doc.fontSize(18)
                .fillColor(darkGray)
                .text('For Logistics Partners', 50, 100, { align: 'left' });
            }
          } else {
            doc.fontSize(48)
              .fillColor(veraGreen)
              .text('Bio Vera', 50, 50, { align: 'left' });
            doc.fontSize(18)
              .fillColor(darkGray)
              .text('For Logistics Partners', 50, 100, { align: 'left' });
          }
          doc.y = 160;
        };

        // Initial header
        addHeader();
        doc.moveDown(2.5);

        // Helper function to check if we need a new page
        const checkPageBreak = (requiredSpace: number) => {
          if (doc.y + requiredSpace > doc.page.height - 50) {
            doc.addPage();
            addHeader();
            doc.moveDown(1);
          }
        };

        // Hero Section
        const heroY = doc.y;
        const heroBoxHeight = 90;
        checkPageBreak(heroBoxHeight + 20);
        const currentHeroY = doc.y;
        
        doc.rect(50, currentHeroY, doc.page.width - 100, heroBoxHeight)
          .fill(bgGreen)
          .stroke(veraGreen, 2);
        
        doc.fontSize(28)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('Join Bio Vera Transport Network', 70, currentHeroY + 20, { 
            align: 'left',
            width: doc.page.width - 140
          });
        
        doc.fontSize(11)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('Open to independent drivers, small vans, medium trucks, and large transport companies. Deliver organic products with complete traceability. Earn stable, long-term contracts with guaranteed routes and automated payments. Join the most trusted logistics network in Europe.', 
            70, currentHeroY + 55, { 
              align: 'left', 
              width: doc.page.width - 140 
            });
        
        doc.y = currentHeroY + heroBoxHeight;
        doc.moveDown(2);

        // Truck Image Section - Bio Vera: From Orchard to Shelf (Split Layout)
        const truckImagePath1 = path.join(process.cwd(), 'public', 'truck-cerada.jpg');
        const truckImagePath2 = path.join(process.cwd(), 'public', 'truck-cerada.png');
        const truckImagePath = fs.existsSync(truckImagePath1) ? truckImagePath1 : (fs.existsSync(truckImagePath2) ? truckImagePath2 : null);
        
        if (truckImagePath && fs.existsSync(truckImagePath)) {
          try {
            checkPageBreak(250);
            const sectionY = doc.y;
            
            // Title above the split section
            doc.fontSize(16)
              .fillColor(veraGreen)
              .font('Helvetica-Bold')
              .text('Bio Vera: From Orchard to Shelf', 50, sectionY, { align: 'left', width: doc.page.width - 100 });
            
            doc.y = sectionY + 25;
            
            // Split layout: Image left (45%), Text right (50%) with larger gap
            const imageWidth = (doc.page.width - 100) * 0.45; // 45% for image
            const textWidth = (doc.page.width - 100) * 0.50; // 50% for text
            const gap = (doc.page.width - 100) * 0.05; // 5% gap between (increased)
            const imageHeight = 220; // Increased height for better resolution
            const imageX = 50;
            const textX = imageX + imageWidth + gap;
            const contentY = doc.y;
            
            // Draw image on the left side with higher resolution
            doc.image(truckImagePath, imageX, contentY, { 
              width: imageWidth,
              height: imageHeight,
              fit: [imageWidth, imageHeight],
              align: 'left',
              valign: 'top'
            });
            
            // Text content on the right side - using dynamic positioning to avoid overlap
            let textY = contentY;
            
            // Section 1: Complete Traceability
            doc.fontSize(11)
              .fillColor(darkGray)
              .font('Helvetica-Bold')
              .text('Complete Traceability', textX, textY, {
                width: textWidth
              });
            
            textY = textY + 18;
            
            const text1Lines = doc.heightOfString('Our branded transport vehicles ensure complete traceability from farm pickup to retail shelf delivery. Every journey is tracked, every temperature is monitored, every handover is digital.', {
                width: textWidth,
                lineGap: 4
              });
            
            doc.fontSize(10)
              .fillColor(lightGray)
              .font('Helvetica')
              .text('Our branded transport vehicles ensure complete traceability from farm pickup to retail shelf delivery. Every journey is tracked, every temperature is monitored, every handover is digital.', 
                textX, textY, {
                  align: 'left',
                  width: textWidth,
                  lineGap: 4
                });
            
            textY = textY + text1Lines + 18; // Add spacing between sections
            
            // Section 2: End-to-End Responsibility
            doc.fontSize(11)
              .fillColor(darkGray)
              .font('Helvetica-Bold')
              .text('End-to-End Responsibility', textX, textY, {
                width: textWidth
              });
            
            textY = textY + 18;
            
            const text2Lines = doc.heightOfString('You guarantee full cold chain integrity, GPS tracking, and digital handover at every stage. No partial deliveries - you are responsible for the entire journey from field to final destination.', {
                width: textWidth,
                lineGap: 4
              });
            
            doc.fontSize(10)
              .fillColor(lightGray)
              .font('Helvetica')
              .text('You guarantee full cold chain integrity, GPS tracking, and digital handover at every stage. No partial deliveries - you are responsible for the entire journey from field to final destination.', 
                textX, textY, {
                  align: 'left',
                  width: textWidth,
                  lineGap: 4
                });
            
            textY = textY + text2Lines + 18; // Add spacing between sections
            
            // Section 3: Automated Payments
            doc.fontSize(11)
              .fillColor(darkGray)
              .font('Helvetica-Bold')
              .text('Automated Payments', textX, textY, {
                width: textWidth
              });
            
            textY = textY + 18;
            
            doc.fontSize(10)
              .fillColor(lightGray)
              .font('Helvetica')
              .text('Receive automated payments upon successful delivery verification. No paperwork, no delays - just seamless financial transactions integrated with our platform.', 
                textX, textY, {
                  align: 'left',
                  width: textWidth,
                  lineGap: 4
                });
            
            // Set Y position to the bottom of the tallest element (image or text)
            const imageBottom = contentY + imageHeight;
            const textBottom = textY + 35; // Add extra space at bottom
            doc.y = Math.max(imageBottom, textBottom);
            
            doc.moveDown(1.5);
          } catch (error) {
            this.logger.warn('Could not load truck image in PDF:', error);
            // Continue without image
            doc.moveDown(1.5);
          }
        } else {
          doc.moveDown(1.5);
        }

        // How It Works Section
        checkPageBreak(150);
        doc.fontSize(22)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('How It Works', 50, doc.y, { align: 'left' });
        doc.moveDown(1);
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('Our streamlined process ensures efficient delivery and transparent operations:', 50, doc.y, {
            align: 'left',
            width: doc.page.width - 100
          });
        doc.moveDown(1.5);

        const steps = [
          {
            title: '1. Partner Registration',
            description: 'Submit your company details, vehicle information, and certifications. Our team reviews your application and verifies compliance with EU transport standards.'
          },
          {
            title: '2. Route Assignment',
            description: 'Receive guaranteed routes based on your vehicle capacity and location. Access real-time delivery schedules through our logistics dashboard.'
          },
          {
            title: '3. Digital Handover',
            description: 'Use our mobile app to scan QR codes, verify batch integrity, and complete digital handovers. All transactions are recorded with GPS timestamps.'
          },
          {
            title: '4. Automated Payments',
            description: 'Get paid automatically upon delivery confirmation. Payments are split transparently: transport fees go directly to your account within 24 hours.'
          },
          {
            title: '5. Performance Tracking',
            description: 'Monitor your delivery performance, customer ratings, and earnings through your dedicated partner dashboard. Build your reputation in the network.'
          }
        ];

        steps.forEach((step, index) => {
          checkPageBreak(80);
          const stepY = doc.y;
          const stepBoxHeight = 70;
          
          doc.rect(50, stepY, doc.page.width - 100, stepBoxHeight)
            .fill('#FFFFFF')
            .stroke(veraGreen, 1);
          
          doc.fontSize(12)
            .fillColor(veraGreen)
            .font('Helvetica-Bold')
            .text(step.title, 60, stepY + 10, {
              align: 'left',
              width: doc.page.width - 120
            });
          
          doc.fontSize(9)
            .fillColor(lightGray)
            .font('Helvetica')
            .text(step.description, 60, stepY + 30, {
              align: 'left',
              width: doc.page.width - 120
            });
          
          doc.y = stepY + stepBoxHeight;
          doc.moveDown(1);
        });

        // Requirements Section
        checkPageBreak(150);
        doc.fontSize(22)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('Requirements', 50, doc.y, { align: 'left' });
        doc.moveDown(1);
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('To join our network, partners must meet the following standards:', 50, doc.y, {
            align: 'left',
            width: doc.page.width - 100
          });
        doc.moveDown(1.5);

        const requirements = [
          {
            title: 'Bio Vera: From Orchard to Shelf',
            description: 'Complete end-to-end responsibility from farm pickup to retail shelf delivery. Partners must guarantee full cold chain integrity, GPS tracking, and digital handover at every stage. No partial deliveries - you are responsible for the entire journey from field to final destination.'
          },
          {
            title: 'Frigo Vehicles',
            description: 'Temperature-controlled vehicles (0-4°C) certified for organic food transport. Minimum 2-ton capacity per vehicle. Suitable for both small vans and large trucks - all vehicle sizes welcome.'
          },
          {
            title: 'EU Compliance',
            description: 'Valid transport licenses, insurance, and certifications required for cross-border operations. GPS tracking equipment mandatory. Open to independent drivers, small vans, and large transport companies.'
          },
          {
            title: 'Digital Integration',
            description: 'Ability to use mobile app for QR scanning, GPS logging, and digital handovers. Reliable internet connection required.'
          },
          {
            title: 'Performance Standards',
            description: 'Maintain on-time delivery rate above 95%. Respond to route assignments within 2 hours. Zero temperature violations.'
          }
        ];

        requirements.forEach((req, index) => {
          checkPageBreak(80);
          const reqY = doc.y;
          const reqBoxHeight = 70;
          
          doc.rect(50, reqY, doc.page.width - 100, reqBoxHeight)
            .fill('#FFFFFF')
            .stroke(veraGreen, 1);
          
          doc.fontSize(12)
            .fillColor(veraGreen)
            .font('Helvetica-Bold')
            .text(req.title, 60, reqY + 10, {
              align: 'left',
              width: doc.page.width - 120
            });
          
          doc.fontSize(9)
            .fillColor(lightGray)
            .font('Helvetica')
            .text(req.description, 60, reqY + 30, {
              align: 'left',
              width: doc.page.width - 120
            });
          
          doc.y = reqY + reqBoxHeight;
          doc.moveDown(1);
        });

        // Benefits Section
        checkPageBreak(150);
        doc.fontSize(22)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('Value Proposition', 50, doc.y, { align: 'left' });
        doc.moveDown(1);
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('Why logistics partners choose Bio Vera:', 50, doc.y, {
            align: 'left',
            width: doc.page.width - 100
          });
        doc.moveDown(1.5);

        const benefits = [
          {
            title: 'Guaranteed Routes',
            description: 'Stable, long-term contracts with predictable income. No empty return trips. Optimized routes reduce fuel costs by up to 15%.'
          },
          {
            title: 'Fast Payments',
            description: 'Automated payment processing. Receive transport fees within 24 hours of delivery confirmation. No invoicing delays.'
          },
          {
            title: 'Technology Support',
            description: 'Free mobile app with GPS tracking, route optimization, and digital handover tools. 24/7 technical support included.'
          },
          {
            title: 'Network Growth',
            description: 'Access to expanding network of producers and buyers. Priority assignment for high-performing partners. Build your reputation.'
          }
        ];

        benefits.forEach((benefit, index) => {
          checkPageBreak(80);
          const benefitY = doc.y;
          const benefitBoxHeight = 70;
          
          doc.rect(50, benefitY, doc.page.width - 100, benefitBoxHeight)
            .fill(bgGreen)
            .stroke(veraGreen, 1);
          
          doc.fontSize(12)
            .fillColor(veraGreen)
            .font('Helvetica-Bold')
            .text(benefit.title, 60, benefitY + 10, {
              align: 'left',
              width: doc.page.width - 120
            });
          
          doc.fontSize(9)
            .fillColor(lightGray)
            .font('Helvetica')
            .text(benefit.description, 60, benefitY + 30, {
              align: 'left',
              width: doc.page.width - 120
            });
          
          doc.y = benefitY + benefitBoxHeight;
          doc.moveDown(1);
        });

        // Technical Standards Section
        checkPageBreak(150);
        doc.fontSize(22)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('Technical Standards', 50, doc.y, { align: 'left' });
        doc.moveDown(1);
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('Our platform ensures complete traceability and compliance:', 50, doc.y, {
            align: 'left',
            width: doc.page.width - 100
          });
        doc.moveDown(1.5);

        const standards = [
          {
            title: 'GPS Tracking',
            description: 'Real-time location tracking throughout the journey. Automatic temperature and location logs every 15 minutes.'
          },
          {
            title: 'QR Code Verification',
            description: 'Scan batch QR codes at pickup and delivery. Verify batch integrity and prevent fraud. Digital proof of delivery.'
          },
          {
            title: 'Cold Chain Compliance',
            description: 'Continuous temperature monitoring. Automatic alerts for violations. Compliance reports for EU certification.'
          },
          {
            title: 'Digital Documentation',
            description: 'Automated waybills, delivery confirmations, and invoices. All documents stored digitally with blockchain verification.'
          }
        ];

        standards.forEach((standard, index) => {
          checkPageBreak(80);
          const standardY = doc.y;
          const standardBoxHeight = 70;
          
          doc.rect(50, standardY, doc.page.width - 100, standardBoxHeight)
            .fill('#FFFFFF')
            .stroke(veraGreen, 1);
          
          doc.fontSize(12)
            .fillColor(veraGreen)
            .font('Helvetica-Bold')
            .text(standard.title, 60, standardY + 10, {
              align: 'left',
              width: doc.page.width - 120
            });
          
          doc.fontSize(9)
            .fillColor(lightGray)
            .font('Helvetica')
            .text(standard.description, 60, standardY + 30, {
              align: 'left',
              width: doc.page.width - 120
            });
          
          doc.y = standardY + standardBoxHeight;
          doc.moveDown(1);
        });

        // Application Process Section
        checkPageBreak(150);
        doc.fontSize(22)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('Application Process', 50, doc.y, { align: 'left' });
        doc.moveDown(1);
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('Getting started is simple and straightforward:', 50, doc.y, {
            align: 'left',
            width: doc.page.width - 100
          });
        doc.moveDown(1.5);

        const processSteps = [
          {
            title: '1. Submit Application',
            description: 'Fill out the online application form with your company details, vehicle information, and certifications.'
          },
          {
            title: '2. Verification',
            description: 'Our team reviews your application and verifies your licenses, insurance, and vehicle certifications (typically 2-3 business days).'
          },
          {
            title: '3. Onboarding',
            description: 'Complete digital onboarding: install mobile app, set up GPS tracking, and attend training session (1-2 hours).'
          },
          {
            title: '4. Start Delivering',
            description: 'Receive your first route assignment and start earning. Access 24/7 support through our partner dashboard.'
          }
        ];

        processSteps.forEach((step, index) => {
          checkPageBreak(80);
          const stepY = doc.y;
          const stepBoxHeight = 70;
          
          doc.rect(50, stepY, doc.page.width - 100, stepBoxHeight)
            .fill(bgGreen)
            .stroke(veraGreen, 1);
          
          doc.fontSize(12)
            .fillColor(veraGreen)
            .font('Helvetica-Bold')
            .text(step.title, 60, stepY + 10, {
              align: 'left',
              width: doc.page.width - 120
            });
          
          doc.fontSize(9)
            .fillColor(lightGray)
            .font('Helvetica')
            .text(step.description, 60, stepY + 30, {
              align: 'left',
              width: doc.page.width - 120
            });
          
          doc.y = stepY + stepBoxHeight;
          doc.moveDown(1);
        });

        // Contact & Next Steps Section
        checkPageBreak(120);
        doc.fontSize(22)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('Contact & Next Steps', 50, doc.y, { align: 'left' });
        doc.moveDown(1.5);
        
        const contactY = doc.y;
        const contactBoxHeight = 90;
        
        doc.rect(50, contactY, doc.page.width - 100, contactBoxHeight)
          .fill(bgGreen)
          .stroke(veraGreen, 2);
        
        doc.fontSize(11)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('Ready to join the network?', 70, contactY + 20, {
            align: 'left',
            width: doc.page.width - 140
          });
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('Visit our website to submit your application or contact our logistics team for more information. We look forward to partnering with you.', 
            70, contactY + 45, {
              align: 'left',
              width: doc.page.width - 140
            });
        
        doc.y = contactY + contactBoxHeight;
        doc.moveDown(2);

        // Next steps – How to apply (detailed)
        checkPageBreak(140);
        const nextStepsY = doc.y;
        doc.fontSize(22)
          .fillColor(veraGreen)
          .font('Helvetica-Bold')
          .text('Next steps – How to apply', 50, nextStepsY);
        doc.moveTo(50, nextStepsY + 20).lineTo(260, nextStepsY + 20).stroke(veraGreen, 2);
        doc.y = nextStepsY + 28;
        doc.fontSize(11).fillColor(lightGray).font('Helvetica').text('Detailed application process for logistics partners.');
        doc.moveDown(1.5);
        const nextSteps = [
          { step: '1. Partner registration', detail: 'Submit company details, vehicle fleet (vans, trucks), and EU transport certifications. We verify compliance with cold chain and safety standards.' },
          { step: '2. Route assignment', detail: 'Receive guaranteed routes based on capacity and location. Access real-time schedules and pickup/delivery points via the logistics dashboard.' },
          { step: '3. Digital handover training', detail: 'Training on mobile app: QR scan at pickup, in-transit temperature/GPS logging, and digital handover at hub or retail. All steps recorded with timestamps.' },
          { step: '4. First mission & payment', detail: 'Complete first mission; payment is released automatically upon delivery confirmation (typically within 24 hours). Build rating and long-term contracts.' },
        ];
        nextSteps.forEach((item) => {
          checkPageBreak(50);
          const boxY = doc.y;
          doc.rect(50, boxY, doc.page.width - 100, 42).fill('#FAFAFA').stroke(veraGreen, 1);
          doc.fontSize(12).fillColor(veraGreen).font('Helvetica-Bold').text(item.step, 70, boxY + 8);
          doc.fontSize(9).fillColor(lightGray).font('Helvetica').text(item.detail, 70, boxY + 26, { width: doc.page.width - 140 });
          doc.y = boxY + 46;
          doc.moveDown(0.5);
        });
        doc.moveDown(1);
        doc.fontSize(8).fillColor(lightGray).text('Document v2.0 | Valid as of February 2026. © 2026 Bio Vera.', 50, doc.y, { align: 'left' });
        doc.moveDown(1);

        // Footer
        doc.fontSize(8)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('© 2026 Bio Vera. All rights reserved. Document v2.0 | Last updated: February 2026', 50, doc.page.height - 30, {
            align: 'center',
            width: doc.page.width - 100
          });

        doc.end();
      } catch (error) {
        this.logger.error('Error generating prospect PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Helper function to add header with logo to PDF
   */
  private addHeader(doc: any, title: string, veraGreen: string, darkGray: string, lightGray: string, bgGreen: string): void {
    doc.rect(0, 0, doc.page.width, 150).fill(bgGreen);
    
    const logoPath1 = path.join(process.cwd(), 'public', 'logo1.png');
    const logoPath2 = path.join(process.cwd(), 'public', 'logo.png');
    const logoPath = fs.existsSync(logoPath1) ? logoPath1 : (fs.existsSync(logoPath2) ? logoPath2 : null);
    
    if (logoPath && fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, 50, 20, { width: 300, height: 90, fit: [300, 90] });
        doc.fontSize(18).fillColor(darkGray).text(title, 50, 110, { align: 'left' });
      } catch (error) {
        this.logger.warn('Could not load logo image:', error);
        doc.fontSize(48).fillColor(veraGreen).text('Bio Vera', 50, 50, { align: 'left' });
        doc.fontSize(18).fillColor(darkGray).text(title, 50, 100, { align: 'left' });
      }
    } else {
      doc.fontSize(48).fillColor(veraGreen).text('Bio Vera', 50, 50, { align: 'left' });
      doc.fontSize(18).fillColor(darkGray).text(title, 50, 100, { align: 'left' });
    }
    
    doc.y = 160;
  }

  /**
   * Helper function to add footer to PDF
   */
  private addFooter(doc: any, lightGray: string, version: string): void {
    const footerY = doc.page.height - 50;
    doc.fontSize(8).fillColor(lightGray).text('© 2026 Bio Vera. All rights reserved. Document v2.0 | Last updated: February 2026', 50, footerY, { align: 'left' });
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
   * Generate Transport Operations Guide PDF
   */
  async generateTransportOperationsGuidePDF(): Promise<Buffer> {
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

        this.addHeader(doc, 'Transport Operations Guide', veraGreen, darkGray, lightGray, bgGreen);
        doc.moveDown(1);

        doc.fontSize(22).fillColor(veraGreen).font('Helvetica-Bold').text('Introduction', 50, doc.y);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(200, doc.y).stroke(veraGreen, 2);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(lightGray).font('Helvetica').text(
          'This guide provides comprehensive instructions for managing deliveries, digital handovers, and route optimization using the Bio Vera logistics system. All handovers are digital; payment is released upon confirmation at Hamburg or designated hub. Document v2.0 (February 2026).',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(2);

        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('1. Delivery Management', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'All deliveries must be tracked from pickup to final destination. Use the Bio Vera mobile app to log pickup, in-transit status, and delivery confirmation.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('2. Digital Handover', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Digital handover is mandatory for all deliveries. Scan QR codes at pickup and delivery points. The system automatically triggers payment release upon successful handover confirmation.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('3. Route Optimization', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Our route optimization software reduces empty kilometers and fuel costs. The system automatically suggests optimal routes based on real-time traffic and delivery priorities.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(2);

        this.addFooter(doc, lightGray, 'Transport Operations Guide v2.0');
        doc.end();
      } catch (error) {
        this.logger.error('Error generating transport operations guide PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate Cold Chain Protocol PDF
   */
  async generateColdChainProtocolPDF(): Promise<Buffer> {
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

        this.addHeader(doc, 'Cold Chain Protocol', veraGreen, darkGray, lightGray, bgGreen);
        doc.moveDown(1);

        doc.fontSize(22).fillColor(veraGreen).font('Helvetica-Bold').text('Protocol Overview', 50, doc.y);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(200, doc.y).stroke(veraGreen, 2);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(lightGray).font('Helvetica').text(
          'Maintaining proper temperature control is critical for organic product quality. This protocol defines the standards and requirements for temperature-controlled transport. Permitted range: 0°C to +12°C; violations above 8°C for >15 minutes trigger buyer alerts. Document v2.0 (February 2026).',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(2);

        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('1. Temperature Requirements', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'All organic products must be transported at temperatures between 0°C and +12°C. Temperature violations above 8°C for more than 15 minutes trigger automatic alerts to buyers.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('2. Monitoring Equipment', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Bio Vera sensors must be installed in all vehicles. Sensors provide real-time temperature monitoring, GPS tracking, and automatic data logging throughout the journey.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('3. Compliance Standards', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'All temperature logs are automatically recorded and verified. Non-compliance may result in payment delays or contract termination. Regular equipment maintenance is mandatory.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(2);

        this.addFooter(doc, lightGray, 'Cold Chain Protocol v2.0');
        doc.end();
      } catch (error) {
        this.logger.error('Error generating cold chain protocol PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate Mobile App Guide PDF (for logistics)
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

        this.addHeader(doc, 'Mobile App Guide - Logistics', veraGreen, darkGray, lightGray, bgGreen);
        doc.moveDown(1);

        doc.fontSize(22).fillColor(veraGreen).font('Helvetica-Bold').text('Getting Started', 50, doc.y);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(200, doc.y).stroke(veraGreen, 2);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(lightGray).font('Helvetica').text(
          'The Bio Vera mobile application for logistics partners provides real-time mission tracking, delivery confirmations, and route optimization. Scan QR at pickup and delivery; digital handover triggers payment release. Document v2.0 (February 2026).',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(2);

        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('1. Mission Management', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'View all assigned missions in the app. Each mission shows pickup location, delivery destination, cargo details, and temperature requirements. Accept missions and start tracking immediately.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('2. Delivery Confirmation', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Scan QR codes at pickup and delivery points. The app automatically logs GPS coordinates, timestamps, and temperature readings. Digital handover triggers immediate payment release.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('3. Route Optimization', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'The app provides optimized routes based on real-time traffic, delivery priorities, and fuel efficiency. Follow suggested routes to maximize savings and minimize delivery times.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(2);

        this.addFooter(doc, lightGray, 'Mobile App Guide v2.0');
        doc.end();
      } catch (error) {
        this.logger.error('Error generating mobile app guide PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate Payment Process Guide PDF (for logistics)
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

        doc.fontSize(22).fillColor(veraGreen).font('Helvetica-Bold').text('Payment System Overview', 50, doc.y);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke(veraGreen, 2);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(lightGray).font('Helvetica').text(
          'Bio Vera provides automated, fast payments for logistics partners. Payments are released upon successful digital handover confirmation, typically within 24 hours. Document v2.0 (February 2026).',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(2);

        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('1. Automated Payments', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Upon successful digital handover confirmation, payment is automatically released to your account. No waiting periods, no paperwork delays. Payments are processed within 24 hours.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('2. Payment Calculation', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Payment is calculated based on distance, cargo weight, route complexity, and delivery urgency. Route optimization bonuses are added for efficient deliveries.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('3. Payment Methods', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Payments can be received via bank transfer, digital wallet, or other methods as configured in your profile. All payment details are securely stored and encrypted.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(2);

        this.addFooter(doc, lightGray, 'Payment Process Guide v2.0');
        doc.end();
      } catch (error) {
        this.logger.error('Error generating payment process guide PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate GPS Tracking Standards PDF
   */
  async generateGPSTrackingStandardsPDF(): Promise<Buffer> {
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

        this.addHeader(doc, 'GPS Tracking Standards', veraGreen, darkGray, lightGray, bgGreen);
        doc.moveDown(1);

        doc.fontSize(22).fillColor(veraGreen).font('Helvetica-Bold').text('Tracking Requirements', 50, doc.y);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(200, doc.y).stroke(veraGreen, 2);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(lightGray).font('Helvetica').text(
          'GPS tracking is mandatory for all Bio Vera deliveries. This ensures complete traceability, route optimization, and delivery verification. Position is logged every 5 minutes during active missions; data syncs to the platform in real time. Document v2.0 (February 2026).',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(2);

        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('1. Equipment Requirements', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Bio Vera sensors must be installed in all vehicles. Sensors provide real-time GPS tracking, temperature monitoring, and automatic data logging. Equipment is provided by Bio Vera.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('2. Data Logging', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'GPS coordinates are logged every 5 minutes during active missions. Location data is automatically synchronized with the Bio Vera platform for real-time tracking and route analysis.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(1.5);

        this.checkPageBreak(doc, 200);
        doc.fontSize(20).fillColor(veraGreen).font('Helvetica-Bold').text('3. Route Verification', 50, doc.y);
        doc.moveDown(1);
        doc.fontSize(11).fillColor(darkGray).font('Helvetica').text(
          'Route deviations are automatically detected and logged. Significant deviations may trigger alerts. Follow optimized routes to maximize efficiency and maintain high Trust Score.',
          50, doc.y, { width: doc.page.width - 100, align: 'left' }
        );
        doc.moveDown(2);

        this.addFooter(doc, lightGray, 'GPS Tracking Standards v2.0');
        doc.end();
      } catch (error) {
        this.logger.error('Error generating GPS tracking standards PDF:', error);
        reject(error);
      }
    });
  }
}
