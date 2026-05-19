import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ComplianceService } from './compliance.service';
import { SeedsService } from '../seeds/seeds.service';

export type GrowerMaterialKind = 'SEED' | 'FERTILIZER' | 'PESTICIDE';

export type LegacyFieldEntryType = 'PRSKANJE' | 'SETVA' | 'BERBA';

/** Map legacy web/sync field-entry type + barcode field to material kind. */
export function materialKindForFieldEntry(
  entryType: LegacyFieldEntryType,
  field: 'seed' | 'fertilizer',
): GrowerMaterialKind {
  if (field === 'seed') return 'SEED';
  return entryType === 'PRSKANJE' ? 'PESTICIDE' : 'FERTILIZER';
}

/**
 * Single server-side gate for grower material barcodes (field diary, future sync paths).
 * Order: platform seed → bio white list → supplier physical unit (SOLD to this grower).
 */
@Injectable()
export class MaterialBarcodeValidationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly complianceService: ComplianceService,
    private readonly seedsService: SeedsService,
  ) {}

  private normalize(barcode: string): string {
    return barcode.trim().replace(/\s+/g, '');
  }

  async assertValidForGrower(
    userId: string,
    barcode: string,
    kind: GrowerMaterialKind,
    options?: { farmId?: string; entryType?: string },
  ): Promise<void> {
    const bar = this.normalize(barcode);
    if (bar.length < 3) {
      throw new BadRequestException('Material barcode is too short (minimum 3 characters).');
    }
    if (bar.length > 64) {
      throw new BadRequestException('Material barcode is too long.');
    }

    const treatAsSeed = kind === 'SEED' || bar.toUpperCase().startsWith('SEED');
    if (treatAsSeed) {
      await this.seedsService.validateSeed(bar, userId);
      return;
    }

    const compliance = await this.complianceService.checkCompliance({
      barcode: bar,
      userId,
      farmId: options?.farmId,
      entryType: options?.entryType ?? 'GROWTH_LOG',
    });
    if (compliance.compliant && !compliance.blocked) {
      return;
    }

    const unit = await this.prisma.supplier_material_barcodes.findUnique({
      where: { barcode: bar },
      select: {
        status: true,
        soldToFarmerId: true,
        supplierUserId: true,
      },
    });

    if (!unit) {
      throw new ForbiddenException(
        compliance.reason ??
          'Barcode is not on Bio-White-List and is not a registered supplier unit.',
      );
    }

    if (unit.status === 'VOID') {
      throw new ForbiddenException('This material unit barcode has been voided and cannot be used.');
    }

    if (unit.status === 'IN_STOCK') {
      throw new ForbiddenException(
        'This unit is still in supplier stock. The supplier must mark it as sold to you before field use.',
      );
    }

    if (unit.status === 'SOLD' && unit.soldToFarmerId && unit.soldToFarmerId !== userId) {
      throw new ForbiddenException('This material unit was sold to another grower account.');
    }
  }
}
