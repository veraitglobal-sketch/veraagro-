import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface StandardSku {
  id: string;
  skuCode: string;
  name: string;
  description: string;
  packaging: {
    type: string; // e.g., 'Reusable Crate', 'Cardboard Box'
    weight: number; // grams
    dimensions: string; // e.g., '30x20x15 cm'
  };
  film: {
    type: string; // e.g., 'Bio-degradable film'
    thickness: string; // microns
  };
  label: {
    design: string; // Design template ID
    qrCodeRequired: boolean;
    barcodeRequired: boolean;
  };
  specifications: {
    weight: number; // grams
    unit: string; // e.g., '125g', '250g', '500g'
    category: string; // e.g., 'Raspberry', 'Blackberry'
    grade: string; // e.g., 'Premium', 'Standard'
  };
  compliance: {
    euStandards: string[];
    certifications: string[];
  };
}

@Injectable()
export class SkuService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all standard SKUs
   */
  async getAllSkus(): Promise<StandardSku[]> {
    // In production, this would come from database
    // For now, return standard SKUs
    return [
      {
        id: 'SKU-001',
        skuCode: 'BIO-VERA-RASP-125G-PREM',
        name: 'Bio Vera Premium Raspberry 125g',
        description: 'Premium raspberry in reusable crate with QR code',
        packaging: {
          type: 'Reusable Crate',
          weight: 200,
          dimensions: '30x20x15 cm',
        },
        film: {
          type: 'Bio-degradable film',
          thickness: '15 microns',
        },
        label: {
          design: 'BIO-VERA-STANDARD-V1',
          qrCodeRequired: true,
          barcodeRequired: true,
        },
        specifications: {
          weight: 125,
          unit: '125g',
          category: 'Raspberry',
          grade: 'Premium',
        },
        compliance: {
          euStandards: ['EU Organic', 'Global G.A.P.'],
          certifications: ['Bio-Ready'],
        },
      },
      {
        id: 'SKU-002',
        skuCode: 'BIO-VERA-BLACK-250G-PREM',
        name: 'Bio Vera Premium Blackberry 250g',
        description: 'Premium blackberry in reusable crate',
        packaging: {
          type: 'Reusable Crate',
          weight: 250,
          dimensions: '30x20x15 cm',
        },
        film: {
          type: 'Bio-degradable film',
          thickness: '15 microns',
        },
        label: {
          design: 'BIO-VERA-STANDARD-V1',
          qrCodeRequired: true,
          barcodeRequired: true,
        },
        specifications: {
          weight: 250,
          unit: '250g',
          category: 'Blackberry',
          grade: 'Premium',
        },
        compliance: {
          euStandards: ['EU Organic', 'Global G.A.P.'],
          certifications: ['Bio-Ready'],
        },
      },
    ];
  }

  /**
   * Get SKU by code
   */
  async getSkuByCode(skuCode: string): Promise<StandardSku | null> {
    const skus = await this.getAllSkus();
    return skus.find(sku => sku.skuCode === skuCode) || null;
  }

  /**
   * Create or update standard SKU
   */
  async createOrUpdateSku(sku: StandardSku) {
    // In production, save to database
    // For now, return the SKU
    return sku;
  }
}
