import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class MissionPassportService {
  private readonly logger = new Logger(MissionPassportService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate Digital Passport PDF for a mission/truck
   * This PDF contains all certificates and documentation for batches in the truck
   */
  async generateMissionPassportPDF(missionId: string): Promise<Buffer> {
    const mission = await this.prisma.missions.findUnique({
      where: { id: missionId },
      include: {
        batches: {
          include: {
            estates: {
              include: {
                users: true,
                parcels: true,
              },
            },
            parcels: true,
            users_batches_harvestedByUserIdTousers: true,
            compliance_photos: {
              take: 5,
            },
            quality_entries: true,
            temperature_logs: {
              orderBy: { timestamp: 'asc' },
              take: 10,
            },
          },
        },
        vehicles: true,
        users_missions_logisticsPartnerIdTousers: true,
        users_missions_growerIdTousers: true,
      },
    });

    if (!mission) {
      throw new NotFoundException(`Mission with ID ${missionId} not found`);
    }

    const batch = (mission as any).batches;
    if (!batch) {
      throw new NotFoundException('Mission has no batch assigned');
    }

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
                .text('Digital Passport', 50, 110, { align: 'left' });
            } catch (error) {
              this.logger.warn('Could not load logo image:', error);
              doc.fontSize(48)
                .fillColor(veraGreen)
                .text('Bio Vera', 50, 50, { align: 'left' });
              doc.fontSize(18)
                .fillColor(darkGray)
                .text('Digital Passport', 50, 100, { align: 'left' });
            }
          } else {
            doc.fontSize(48)
              .fillColor(veraGreen)
              .text('Bio Vera', 50, 50, { align: 'left' });
            doc.fontSize(18)
              .fillColor(darkGray)
              .text('Digital Passport', 50, 100, { align: 'left' });
          }
          doc.y = 160;
        };

        // Initial header
        addHeader();
        doc.moveDown(1);

        // Helper function to check if we need a new page
        const checkPageBreak = (requiredSpace: number) => {
          if (doc.y + requiredSpace > doc.page.height - 50) {
            doc.addPage();
            addHeader();
            doc.moveDown(1);
          }
        };

        // Mission Information
        checkPageBreak(120);
        doc.fontSize(22)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('Mission Information', 50, doc.y, { align: 'left' });
        doc.moveDown(0.5);
        
        const missionY = doc.y;
        const missionBoxHeight = 100;
        doc.rect(50, missionY, doc.page.width - 100, missionBoxHeight)
          .fill('#FFFFFF')
          .stroke(veraGreen, 1);
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('Mission Number:', 60, missionY + 15, { align: 'left' });
        doc.fontSize(12)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text(mission.missionNumber, 60, missionY + 30, { align: 'left' });
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('Vehicle:', 60, missionY + 50, { align: 'left' });
        doc.fontSize(11)
          .fillColor(darkGray)
          .font('Helvetica')
          .text((mission as any).vehicles ? `${(mission as any).vehicles.vehicleNumber} (${(mission as any).vehicles.licensePlate})` : 'Not assigned', 60, missionY + 65, { align: 'left' });
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('Pickup Date:', 300, missionY + 15, { align: 'left' });
        doc.fontSize(11)
          .fillColor(darkGray)
          .font('Helvetica')
          .text(mission.pickedUpAt ? new Date(mission.pickedUpAt).toLocaleDateString('en-US') : 'Pending', 300, missionY + 30, { align: 'left' });
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('Status:', 300, missionY + 50, { align: 'left' });
        doc.fontSize(11)
          .fillColor(darkGray)
          .font('Helvetica')
          .text(mission.status, 300, missionY + 65, { align: 'left' });
        
        doc.y = missionY + missionBoxHeight;
        doc.moveDown(2);

        // Batch Information
        checkPageBreak(150);
        doc.fontSize(22)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('Product Information', 50, doc.y, { align: 'left' });
        doc.moveDown(0.5);
        
        const batchY = doc.y;
        const batchBoxHeight = 120;
        doc.rect(50, batchY, doc.page.width - 100, batchBoxHeight)
          .fill(bgGreen)
          .stroke(veraGreen, 1);
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('Batch ID:', 60, batchY + 15, { align: 'left' });
        doc.fontSize(12)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text(batch.batchId, 60, batchY + 30, { align: 'left' });
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('Product:', 60, batchY + 50, { align: 'left' });
        doc.fontSize(11)
          .fillColor(darkGray)
          .font('Helvetica')
          .text(batch.productName, 60, batchY + 65, { align: 'left' });
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('Quantity:', 60, batchY + 85, { align: 'left' });
        doc.fontSize(11)
          .fillColor(darkGray)
          .font('Helvetica')
          .text(`${batch.quantity} ${batch.unit}`, 60, batchY + 100, { align: 'left' });
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('Harvest Date:', 300, batchY + 15, { align: 'left' });
        doc.fontSize(11)
          .fillColor(darkGray)
          .font('Helvetica')
          .text(new Date(batch.harvestDate).toLocaleDateString('en-US'), 300, batchY + 30, { align: 'left' });
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('Harvest Year:', 300, batchY + 50, { align: 'left' });
        doc.fontSize(11)
          .fillColor(darkGray)
          .font('Helvetica')
          .text(new Date(batch.harvestDate).getFullYear().toString(), 300, batchY + 65, { align: 'left' });
        
        doc.y = batchY + batchBoxHeight;
        doc.moveDown(2);

        // Farmer Information
        checkPageBreak(150);
        doc.fontSize(22)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('Farmer Information', 50, doc.y, { align: 'left' });
        doc.moveDown(0.5);
        
        const farmerY = doc.y;
        const farmerBoxHeight = 120;
        doc.rect(50, farmerY, doc.page.width - 100, farmerBoxHeight)
          .fill('#FFFFFF')
          .stroke(veraGreen, 1);
        
        const farmer = batch.estates.users;
        const farmerName = `${farmer.firstName} ${farmer.lastName}`;
        const farmerLocation = this.extractRegion(batch.estates.polygonCoordinates || null);
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('Farmer Name:', 60, farmerY + 15, { align: 'left' });
        doc.fontSize(12)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text(farmerName, 60, farmerY + 30, { align: 'left' });
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('Location:', 60, farmerY + 50, { align: 'left' });
        doc.fontSize(11)
          .fillColor(darkGray)
          .font('Helvetica')
          .text(farmerLocation || batch.estates.name, 60, farmerY + 65, { align: 'left' });
        
        if (farmer.yearsOfExperience) {
          doc.fontSize(10)
            .fillColor(lightGray)
            .font('Helvetica')
            .text('Experience:', 60, farmerY + 85, { align: 'left' });
          doc.fontSize(11)
            .fillColor(darkGray)
            .font('Helvetica')
            .text(`${farmer.yearsOfExperience} years`, 60, farmerY + 100, { align: 'left' });
        }
        
        if (farmer.generation) {
          doc.fontSize(10)
            .fillColor(lightGray)
            .font('Helvetica')
            .text('Generation:', 300, farmerY + 15, { align: 'left' });
          doc.fontSize(11)
            .fillColor(darkGray)
            .font('Helvetica')
            .text(`${farmer.generation} generation`, 300, farmerY + 30, { align: 'left' });
        }
        
        if (farmer.farmerQrCode) {
          doc.fontSize(10)
            .fillColor(lightGray)
            .font('Helvetica')
            .text('Farmer QR Code:', 300, farmerY + 50, { align: 'left' });
          doc.fontSize(11)
            .fillColor(veraGreen)
            .font('Helvetica')
            .text(farmer.farmerQrCode, 300, farmerY + 65, { align: 'left' });
        }
        
        doc.y = farmerY + farmerBoxHeight;
        doc.moveDown(2);

        // Certifications & Compliance
        checkPageBreak(200);
        doc.fontSize(22)
          .fillColor(darkGray)
          .font('Helvetica-Bold')
          .text('Certifications & Compliance', 50, doc.y, { align: 'left' });
        doc.moveDown(0.5);
        
        const certY = doc.y;
        const certBoxHeight = 140;
        doc.rect(50, certY, doc.page.width - 100, certBoxHeight)
          .fill(bgGreen)
          .stroke(veraGreen, 1);
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('EU Organic Certification:', 60, certY + 15, { align: 'left' });
        doc.fontSize(11)
          .fillColor(darkGray)
          .font('Helvetica')
          .text('RS-BIO-001 (Group Certification)', 60, certY + 30, { align: 'left' });
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('GlobalG.A.P. IFA v6:', 60, certY + 50, { align: 'left' });
        doc.fontSize(11)
          .fillColor(darkGray)
          .font('Helvetica')
          .text('Certified', 60, certY + 65, { align: 'left' });
        
        if (batch.quality_entries && batch.quality_entries.length > 0) {
          const qualityEntry = batch.quality_entries[0];
          doc.fontSize(10)
            .fillColor(lightGray)
            .font('Helvetica')
            .text('Pesticide Analysis:', 60, certY + 85, { align: 'left' });
          doc.fontSize(11)
            .fillColor(darkGray)
            .font('Helvetica')
            .text(qualityEntry.pesticideFree ? 'Negative' : 'Pending', 60, certY + 100, { align: 'left' });
        }
        
        doc.fontSize(10)
          .fillColor(lightGray)
          .font('Helvetica')
          .text('Soil Health Check:', 300, certY + 15, { align: 'left' });
        doc.fontSize(11)
          .fillColor(darkGray)
          .font('Helvetica')
          .text(batch.estates.certificationStartDate 
            ? new Date(batch.estates.certificationStartDate).toLocaleDateString('en-US')
            : 'N/A', 300, certY + 30, { align: 'left' });
        
        doc.y = certY + certBoxHeight;
        doc.moveDown(2);

        // Temperature Log (Cold Chain Proof)
        if (batch.temperature_logs && batch.temperature_logs.length > 0) {
          checkPageBreak(150);
          doc.fontSize(22)
            .fillColor(darkGray)
            .font('Helvetica-Bold')
            .text('Cold Chain Proof', 50, doc.y, { align: 'left' });
          doc.moveDown(0.5);
          
          const tempY = doc.y;
          const tempBoxHeight = 100;
          doc.rect(50, tempY, doc.page.width - 100, tempBoxHeight)
            .fill('#FFFFFF')
            .stroke(veraGreen, 1);
          
          const temps = batch.temperature_logs.map(log => log.temperature);
          const minTemp = Math.min(...temps);
          const maxTemp = Math.max(...temps);
          const avgTemp = temps.reduce((sum, t) => sum + t, 0) / temps.length;
          const isWithinRange = temps.every(t => t >= 2 && t <= 8);
          
          doc.fontSize(10)
            .fillColor(lightGray)
            .font('Helvetica')
            .text('Temperature Range:', 60, tempY + 15, { align: 'left' });
          doc.fontSize(11)
            .fillColor(darkGray)
            .font('Helvetica')
            .text(`${minTemp.toFixed(1)}°C - ${maxTemp.toFixed(1)}°C`, 60, tempY + 30, { align: 'left' });
          
          doc.fontSize(10)
            .fillColor(lightGray)
            .font('Helvetica')
            .text('Average Temperature:', 60, tempY + 50, { align: 'left' });
          doc.fontSize(11)
            .fillColor(darkGray)
            .font('Helvetica')
            .text(`${avgTemp.toFixed(1)}°C`, 60, tempY + 65, { align: 'left' });
          
          doc.fontSize(10)
            .fillColor(lightGray)
            .font('Helvetica')
            .text('Compliance:', 300, tempY + 15, { align: 'left' });
          doc.fontSize(11)
            .fillColor(isWithinRange ? veraGreen : '#DC2626')
            .font('Helvetica-Bold')
            .text(isWithinRange ? 'Within Range (2-8°C)' : 'Out of Range', 300, tempY + 30, { align: 'left' });
          
          doc.fontSize(10)
            .fillColor(lightGray)
            .font('Helvetica')
            .text('Log Entries:', 300, tempY + 50, { align: 'left' });
          doc.fontSize(11)
            .fillColor(darkGray)
            .font('Helvetica')
            .text(`${batch.temperature_logs.length} records`, 300, tempY + 65, { align: 'left' });
          
          doc.y = tempY + tempBoxHeight;
          doc.moveDown(2);
        }

        // Footer
        doc.fontSize(8)
          .fillColor(lightGray)
          .font('Helvetica')
          .text(`Generated on ${new Date().toLocaleString('en-US')} | Bio Vera Digital Passport`, 50, doc.page.height - 30, {
            align: 'center',
            width: doc.page.width - 100
          });

        doc.end();
      } catch (error) {
        this.logger.error('Error generating mission passport PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Extract region from location
   */
  private extractRegion(location: any): string | null {
    if (!location) return null;
    if (typeof location === 'string') {
      const parts = location.split(',');
      return parts[parts.length - 1]?.trim() || null;
    }
    return null;
  }
}
