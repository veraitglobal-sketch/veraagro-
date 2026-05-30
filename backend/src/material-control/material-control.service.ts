import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PurchaseMaterialDto, VerifyStickerRollDto, UploadCompliancePhotosDto, UpdateBioVeraStandardDto } from './dto/material-control.dto';
import * as crypto from 'crypto';

@Injectable()
export class MaterialControlService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lot (batch) the user may document: estate owner OR whoever harvested/packed (same as `/batches`).
   * `batchRef` = internal UUID or public id e.g. BATCH-2026-0001.
   */
  private async resolveGrowerBatch(batchRef: string, userId: string) {
    const batch = await this.prisma.batches.findFirst({
      where: {
        AND: [
          { OR: [{ id: batchRef }, { batchId: batchRef }] },
          {
            OR: [{ harvestedByUserId: userId }, { estates: { ownerId: userId } }],
          },
        ],
      },
      include: {
        compliance_photos: { orderBy: { uploadedAt: 'desc' } },
      },
    });
    if (!batch) {
      throw new NotFoundException('Batch not found or you do not have access');
    }
    return batch;
  }

  private assertParcelMatchesBatchOptional(parcelIdFromClient: string | undefined, batchParcelId: string | null) {
    const asserted = typeof parcelIdFromClient === 'string' ? parcelIdFromClient.trim() : '';
    if (!asserted) return;
    if (!batchParcelId) {
      throw new BadRequestException(
        'This batch has no parcel on file. Omit parcel identifier or recreate the batch from an approved parcel.',
      );
    }
    if (asserted !== batchParcelId) {
      throw new ForbiddenException('Selected parcel does not match this batch.');
    }
  }

  private async findOwnedBadgeRoot(stickerRollId: string, userId: string) {
    const row = await this.prisma.package_badges.findUnique({
      where: { serial: stickerRollId.trim() },
    });
    if (!row) return null;
    let root = row;
    while (root.parentId) {
      const p = await this.prisma.package_badges.findUnique({ where: { id: root.parentId } });
      if (!p) break;
      root = p;
    }
    if (root.ownerUserId !== userId) return null;
    if (root.lifecycle !== 'ACTIVE') return null;
    return root;
  }

  private async badgeTreeIds(rootId: string): Promise<string[]> {
    const kids = await this.prisma.package_badges.findMany({
      where: { parentId: rootId },
      select: { id: true },
    });
    return [rootId, ...kids.map((k) => k.id)];
  }

  /**
   * Get available material types. If the catalog is empty (fresh DB / no seed), create the default
   * Bio Vera CRATE, LABEL, FILM products so the grower "Materials" page always has a dropdown.
   */
  async getMaterialTypeEnums() {
    const anyRow = await this.prisma.material_types.count();
    if (anyRow === 0) {
      await this.seedDefaultMaterialTypes();
    }
    return this.prisma.material_types.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  private async seedDefaultMaterialTypes() {
    const now = new Date();
    const rows = [
      {
        name: 'Bio Vera Crate (standard)',
        type: 'CRATE' as const,
        unit: 'crate',
        unitPrice: 0.5,
        description: 'Official reusable crate for transport compliance',
      },
      {
        name: 'Bio Vera Label roll',
        type: 'LABEL' as const,
        unit: 'roll',
        unitPrice: 0.1,
        description: 'Official sticker / QR label roll',
      },
      {
        name: 'Bio Vera Protective film',
        type: 'FILM' as const,
        unit: 'meter',
        unitPrice: 0.05,
        description: 'Official protective film (per meter)',
      },
    ];
    for (const r of rows) {
      try {
        await this.prisma.material_types.create({
          data: {
            id: crypto.randomUUID(),
            name: r.name,
            type: r.type,
            unit: r.unit,
            unitPrice: r.unitPrice,
            description: r.description,
            isActive: true,
            updatedAt: now,
          },
        });
      } catch (e) {
        // e.g. unique name race — ignore
      }
    }
  }

  /**
   * Get Bio Vera Standard
   */
  async getBioVeraStandard() {
    const standard = await this.prisma.bio_vera_standards.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!standard) {
      // Create default standard if none exists
      return this.prisma.bio_vera_standards.create({
        data: {
          id: crypto.randomUUID(),
          requiredTemperatureMin: 2.0,
          requiredTemperatureMax: 8.0,
          requiredPackagingType: 'BIO_VERA_CRATE',
          requiredFilmType: 'BIO_VERA_FILM',
          requiresCompliancePhotos: true,
          requiredPhotoTypes: ['PUNNETS', 'LABELING', 'PALLETIZATION'],
          qualityPremiumAmount: 0.10,
          crateCostPerUnit: 0.50,
          labelCostPerUnit: 0.10,
          filmCostPerMeter: 0.05,
          updatedAt: new Date(),
        },
      });
    }

    return standard;
  }

  /**
   * Update Bio Vera Standard (Admin only)
   */
  async updateBioVeraStandard(adminId: string, dto: UpdateBioVeraStandardDto) {
    // Deactivate old standard
    await this.prisma.bio_vera_standards.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Get current standard to preserve defaults
    const current = await this.getBioVeraStandard();

    // Create new standard
    const newStandard = await this.prisma.bio_vera_standards.create({
      data: {
        id: crypto.randomUUID(),
        requiredTemperatureMin: dto.requiredTemperatureMin ?? current.requiredTemperatureMin,
        requiredTemperatureMax: dto.requiredTemperatureMax ?? current.requiredTemperatureMax,
        requiredPackagingType: dto.requiredPackagingType ?? current.requiredPackagingType,
        requiredFilmType: dto.requiredFilmType ?? current.requiredFilmType,
        requiresCompliancePhotos: dto.requiresCompliancePhotos ?? current.requiresCompliancePhotos,
        qualityPremiumAmount: dto.qualityPremiumAmount ?? current.qualityPremiumAmount,
        updatedByUserId: adminId,
        updatedAt: new Date(),
      },
    });

    return newStandard;
  }

  /**
   * Get farmer's material balance
   */
  async getFarmerMaterialBalance(userId: string) {
    let balance = await this.prisma.farmer_material_balances.findUnique({
      where: { userId },
    });

    if (!balance) {
      balance = await this.prisma.farmer_material_balances.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          crateBalance: 0,
          labelRollBalance: 0,
          filmMeterBalance: 0,
          totalPurchased: {},
          updatedAt: new Date(),
        },
      });
    }

    return balance;
  }

  /**
   * Purchase materials
   */
  async purchaseMaterials(userId: string, dto: PurchaseMaterialDto) {
    const materialType = await this.prisma.material_types.findUnique({
      where: { id: dto.materialTypeId },
    });

    if (!materialType || !materialType.isActive) {
      throw new NotFoundException('Material type not found or inactive');
    }

    // Create inventory entries (each row needs id + updatedAt)
    const now = new Date();
    const inventoryEntries = [];
    for (let i = 0; i < dto.quantity; i++) {
      const serialNumber = this.generateSerialNumber(materialType.type, i);
      inventoryEntries.push({
        id: crypto.randomUUID(),
        materialTypeId: dto.materialTypeId,
        serialNumber,
        status: 'SOLD' as const,
        soldToUserId: userId,
        soldAt: now,
        updatedAt: now,
      });
    }

    await this.prisma.material_inventory.createMany({
      data: inventoryEntries,
    });

    // Update farmer balance
    const balance = await this.getFarmerMaterialBalance(userId);
    const updateData: any = {};
    const totalPurchased: any = balance.totalPurchased || {};

    if (materialType.type === 'CRATE') {
      updateData.crateBalance = balance.crateBalance + dto.quantity;
      totalPurchased.crates = (totalPurchased.crates || 0) + dto.quantity;
    } else if (materialType.type === 'LABEL') {
      updateData.labelRollBalance = balance.labelRollBalance + dto.quantity;
      totalPurchased.labelRolls = (totalPurchased.labelRolls || 0) + dto.quantity;
    } else if (materialType.type === 'FILM') {
      updateData.filmMeterBalance = balance.filmMeterBalance + dto.quantity;
      totalPurchased.filmMeters = (totalPurchased.filmMeters || 0) + dto.quantity;
    }

    await this.prisma.farmer_material_balances.update({
      where: { userId },
      data: {
        ...updateData,
        totalPurchased,
        lastUpdated: new Date(),
      },
    });

    const newSerials = inventoryEntries.map((e) => e.serialNumber).filter((s): s is string => Boolean(s));

    return {
      success: true,
      message: `Purchased ${dto.quantity} ${materialType.name}`,
      balance: await this.getFarmerMaterialBalance(userId),
      /** Sticker / crate / film IDs for this purchase (copy to Compliance, etc.) */
      newSerials,
    };
  }

  /**
   * Label roll serial numbers sold to this grower (for Compliance "Sticker Roll ID" field)
   */
  async getMyLabelRollSerials(userId: string) {
    const rows = await this.prisma.material_inventory.findMany({
      where: {
        soldToUserId: userId,
        material_types: { type: 'LABEL' },
      },
      include: { material_types: { select: { name: true } } },
      orderBy: { soldAt: 'desc' },
    });
    type LabelRollListRow = {
      serialNumber: string;
      status: string;
      soldAt: string | null;
      productName: string;
      source?: 'inventory' | 'package_badge';
    };
    const fromInventory: LabelRollListRow[] = rows
      .filter((r) => r.serialNumber)
      .map((r) => ({
        serialNumber: r.serialNumber as string,
        status: r.status,
        soldAt: r.soldAt?.toISOString() ?? null,
        productName: r.material_types?.name ?? 'Label roll',
        source: 'inventory' as const,
      }));

    const badgeRoots = await this.prisma.package_badges.findMany({
      where: {
        ownerUserId: userId,
        parentId: null,
        lifecycle: 'ACTIVE',
        type: { in: ['ROLL_LINE', 'PALLET_MASTER'] },
        batchId: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    const seen = new Set(fromInventory.map((r) => r.serialNumber));
    for (const b of badgeRoots) {
      if (seen.has(b.serial)) continue;
      fromInventory.push({
        serialNumber: b.serial,
        status: 'AVAILABLE',
        soldAt: b.createdAt.toISOString(),
        productName: b.type === 'ROLL_LINE' ? 'Rola nalepnica' : 'Paleta / paket',
        source: 'package_badge' as const,
      });
      seen.add(b.serial);
    }
    return fromInventory;
  }

  /**
   * One lot = one set of compliance photos + one label roll ID on file. Used to show "done" in the grower UI
   * and avoid re-doing the whole flow when everything is already submitted.
   */
  async getComplianceBatchStatus(userId: string, batchRef: string) {
    const batch = await this.resolveGrowerBatch(batchRef, userId);
    const batchInternalId = batch.id;

    const standard = await this.getBioVeraStandard();
    const required = standard.requiredPhotoTypes || ['PUNNETS', 'LABELING', 'PALLETIZATION'];
    const uploadedTypes = [...new Set(batch.compliance_photos.map((p) => p.photoType))];
    const missing = required.filter((t) => !uploadedTypes.includes(t));
    const usedForLot = await this.prisma.material_inventory.findMany({
      where: { usedInBatchId: batchInternalId },
      include: { material_types: { select: { type: true } } },
    });
    const labelRow = usedForLot.find((r) => r.material_types?.type === 'LABEL') ?? null;
    const badgeForLot = await this.prisma.package_badges.findFirst({
      where: {
        batchId: batchInternalId,
        parentId: null,
        type: { in: ['ROLL_LINE', 'PALLET_MASTER'] },
      },
    });

    const complete = missing.length === 0 && (labelRow != null || badgeForLot != null);

    return {
      publicBatchId: batch.batchId,
      complete,
      requiredPhotoTypes: required,
      uploadedPhotoTypes: uploadedTypes,
      missingPhotoTypes: missing,
      stickerRollId: labelRow?.serialNumber ?? badgeForLot?.serial ?? null,
      stickerStatus: labelRow != null ? labelRow.status : badgeForLot != null ? 'USED' : null,
      lastComplianceAt: batch.compliance_photos[0]
        ? batch.compliance_photos[0].uploadedAt.toISOString()
        : null,
    };
  }

  /**
   * Verify sticker roll ID for a lot (same access as `/batches`: owner OR harvester).
   */
  async verifyStickerRoll(userId: string, dto: VerifyStickerRollDto) {
    const batch = await this.resolveGrowerBatch(dto.batchId, userId);
    this.assertParcelMatchesBatchOptional(dto.parcelId, batch.parcelId);

    const badgeRoot = await this.findOwnedBadgeRoot(dto.stickerRollId, userId);
    if (badgeRoot) {
      if (badgeRoot.batchId && badgeRoot.batchId !== batch.id) {
        throw new BadRequestException('This sticker package is already linked to another lot');
      }
      return {
        success: true,
        verified: true,
        stickerRollId: badgeRoot.serial,
        batchId: batch.id,
        source: 'package_badge' as const,
      };
    }

    const inventory = await this.prisma.material_inventory.findUnique({
      where: { serialNumber: dto.stickerRollId },
      include: {
        material_types: true,
      },
    });

    if (!inventory) {
      throw new NotFoundException('Sticker roll ID not found');
    }

    if (inventory.material_types?.type !== 'LABEL') {
      throw new BadRequestException('Invalid material type. Expected LABEL.');
    }

    if (inventory.soldToUserId !== userId) {
      throw new ForbiddenException('This sticker roll was not sold to you. Non-standard packaging detected.');
    }

    if (inventory.status === 'USED') {
      if (inventory.usedInBatchId === batch.id && inventory.soldToUserId === userId) {
        return {
          success: true,
          verified: true,
          stickerRollId: dto.stickerRollId,
          batchId: batch.id,
          source: 'inventory' as const,
        };
      }
      throw new BadRequestException('This sticker roll has already been used');
    }

    return {
      success: true,
      verified: true,
      stickerRollId: dto.stickerRollId,
      batchId: batch.id,
      source: 'inventory' as const,
    };
  }

  /**
   * Check if batch can be shipped. For *transport request* (booking a truck), we only require compliance —
   * not virtual crate stock on file (growers may pack before balance sync). Crate checks stay for stricter flows.
   */
  async validateBatchForShipment(
    batchId: string,
    userId: string,
    options?: { requireCrateBalance?: boolean },
  ) {
    const requireCrateBalance = options?.requireCrateBalance !== false;

    const ref = batchId.trim();
    const batch = await this.prisma.batches.findFirst({
      where: { OR: [{ id: ref }, { batchId: ref }] },
      include: {
        estates: true,
        compliance_photos: true,
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    const canActOnBatch =
      batch.estates.ownerId === userId || batch.harvestedByUserId === userId;
    if (!canActOnBatch) {
      throw new ForbiddenException(
        'This batch is not on your account. It must belong to your farm (estate owner) or you must be the harvester/packer on record.',
      );
    }

    const standard = await this.getBioVeraStandard();
    const balance = await this.getFarmerMaterialBalance(userId);

    const errors: string[] = [];

    if (requireCrateBalance) {
      const requiredCrates = Math.ceil(batch.quantity / 10);
      if (balance.crateBalance < requiredCrates) {
        errors.push(
          `Non-standard packaging detected. You need ${requiredCrates} Bio Vera crates but only have ${balance.crateBalance}. Order official materials.`
        );
      }
    }

    if (standard.requiresCompliancePhotos) {
      const requiredTypes = standard.requiredPhotoTypes || ['PUNNETS', 'LABELING', 'PALLETIZATION'];
      const uploadedTypes = [...new Set(batch.compliance_photos.map((p) => p.photoType))];
      const missingTypes = requiredTypes.filter((type) => !uploadedTypes.includes(type));

      if (missingTypes.length > 0) {
        errors.push(
          `Missing compliance photos: ${missingTypes.join(', ')}. Please upload all required photos before shipping.`
        );
      }

      const usedForLot = await this.prisma.material_inventory.findMany({
        where: { usedInBatchId: batch.id },
        include: { material_types: { select: { type: true } } },
      });
      const labelRow = usedForLot.find((r) => r.material_types?.type === 'LABEL') ?? null;
      const badgeLabel = await this.prisma.package_badges.findFirst({
        where: {
          batchId: batch.id,
          parentId: null,
          type: { in: ['ROLL_LINE', 'PALLET_MASTER'] },
        },
      });
      if (!labelRow && !badgeLabel) {
        errors.push(
          'Official label roll is not registered for this lot. Complete compliance (verify sticker roll + photos) before requesting transport.'
        );
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors.join(' '));
    }

    return {
      valid: true,
      message: 'Batch is ready for shipment',
    };
  }

  /**
   * Upload compliance photos (always stored on the resolved internal batch id).
   */
  async uploadCompliancePhotos(userId: string, dto: UploadCompliancePhotosDto) {
    const batch = await this.resolveGrowerBatch(dto.batchId, userId);
    this.assertParcelMatchesBatchOptional(dto.parcelId, batch.parcelId);
    const internalBatchId = batch.id;

    await this.verifyStickerRoll(userId, {
      stickerRollId: dto.stickerRollId,
      batchId: internalBatchId,
      parcelId: dto.parcelId,
    });

    const standard = await this.getBioVeraStandard();
    const requiredTypes = standard.requiredPhotoTypes || ['PUNNETS', 'LABELING', 'PALLETIZATION'];

    if (dto.photos.length !== requiredTypes.length) {
      throw new BadRequestException(
        `You must upload exactly ${requiredTypes.length} compliance photos: ${requiredTypes.join(', ')}`
      );
    }

    const photos = await this.prisma.$transaction(async (tx) => {
      await tx.compliance_photos.deleteMany({
        where: {
          batchId: internalBatchId,
          photoType: { in: requiredTypes },
        },
      });

      return Promise.all(
        dto.photos.map((photo, index) =>
          tx.compliance_photos.create({
            data: {
              id: crypto.randomUUID(),
              batchId: internalBatchId,
              photoType: requiredTypes[index],
              photoUrl: photo,
              photoHash: this.generateHash(photo),
              uploadedBy: userId,
            },
          })
        )
      );
    });

    const inv = await this.prisma.material_inventory.findUnique({
      where: { serialNumber: dto.stickerRollId },
    });
    if (inv) {
      await this.prisma.material_inventory.update({
        where: { id: inv.id },
        data: { status: 'USED', usedInBatchId: internalBatchId, usedAt: new Date() },
      });
    }

    const badgeRoot = await this.findOwnedBadgeRoot(dto.stickerRollId, userId);
    if (badgeRoot) {
      const grower = await this.prisma.users.findUnique({ where: { id: userId } });
      const fq = grower?.farmerQrCode?.trim() || (grower ? `FARMER-${grower.partnerCode}` : null);
      const ids = await this.badgeTreeIds(badgeRoot.id);
      await this.prisma.package_badges.updateMany({
        where: { id: { in: ids } },
        data: {
          batchId: internalBatchId,
          ...(fq ? { farmerQrCode: fq } : {}),
        },
      });
    }

    return {
      success: true,
      photos,
      message: 'Compliance photos uploaded successfully',
    };
  }

  /**
   * Calculate material costs for a batch
   */
  async calculateMaterialCosts(batchId: string) {
    const batch = await this.prisma.batches.findUnique({
      where: { id: batchId },
      include: {
        compliance_photos: true,
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    const standard = await this.getBioVeraStandard();
    const requiredCrates = Math.ceil(batch.quantity / 10); // Assuming 10kg per crate
    const requiredLabels = requiredCrates; // One label per crate
    const requiredFilmMeters = requiredCrates * 2; // Rough estimate

    const crateCost = requiredCrates * standard.crateCostPerUnit;
    const labelCost = requiredLabels * standard.labelCostPerUnit;
    const filmCost = requiredFilmMeters * standard.filmCostPerMeter;

    const totalMaterialCost = crateCost + labelCost + filmCost;

    // Check if quality premium applies
    const allPhotosVerified = batch.compliance_photos.every((p) => p.isVerified);
    const qualityPremium = allPhotosVerified
      ? batch.quantity * standard.qualityPremiumAmount
      : 0;

    return {
      batchId: batch.batchId,
      materialCosts: {
        crates: { quantity: requiredCrates, cost: crateCost },
        labels: { quantity: requiredLabels, cost: labelCost },
        film: { meters: requiredFilmMeters, cost: filmCost },
        total: totalMaterialCost,
      },
      qualityPremium,
      netAmount: qualityPremium - totalMaterialCost,
    };
  }

  /**
   * Deduct materials from balance when batch is shipped
   */
  async deductMaterialsOnShipment(batchId: string, userId: string) {
    const batch = await this.prisma.batches.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    const balance = await this.getFarmerMaterialBalance(userId);
    const requiredCrates = Math.ceil(batch.quantity / 10);
    const requiredLabels = requiredCrates;
    const requiredFilmMeters = requiredCrates * 2;

    if (balance.crateBalance < requiredCrates) {
      throw new BadRequestException('Insufficient crate balance');
    }

    // Update balance
    await this.prisma.farmer_material_balances.update({
      where: { userId },
      data: {
        crateBalance: balance.crateBalance - requiredCrates,
        labelRollBalance: balance.labelRollBalance - requiredLabels,
        filmMeterBalance: balance.filmMeterBalance - requiredFilmMeters,
        lastUpdated: new Date(),
      },
    });

    return {
      success: true,
      deducted: {
        crates: requiredCrates,
        labels: requiredLabels,
        filmMeters: requiredFilmMeters,
      },
    };
  }

  /**
   * Generate serial number for material
   */
  private generateSerialNumber(type: string, index: number): string {
    const prefix = type === 'CRATE' ? 'CRATE' : type === 'LABEL' ? 'LABEL-ROLL' : 'FILM';
    const timestamp = Date.now();
    return `${prefix}-${timestamp}-${String(index + 1).padStart(4, '0')}`;
  }

  /**
   * Generate hash for photo verification
   */
  private generateHash(data: string): string {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
  }

  async listCompliancePhotosForAdmin(opts?: { partnerCode?: string; limit?: number }) {
    const limit = Math.min(Math.max(opts?.limit ?? 100, 1), 200);
    const partnerCode = opts?.partnerCode?.trim();
    const where: {
      batches?: {
        users_batches_harvestedByUserIdTousers: { partnerCode: string };
      };
    } = {};
    if (partnerCode) {
      where.batches = {
        users_batches_harvestedByUserIdTousers: { partnerCode },
      };
    }
    return this.prisma.compliance_photos.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      take: limit,
      include: {
        batches: {
          select: {
            batchId: true,
            productName: true,
            users_batches_harvestedByUserIdTousers: {
              select: { id: true, firstName: true, lastName: true, partnerCode: true },
            },
          },
        },
      },
    });
  }

  async adminDeleteCompliancePhoto(id: string) {
    const row = await this.prisma.compliance_photos.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Compliance photo not found');
    }
    await this.prisma.compliance_photos.delete({ where: { id } });
    return { ok: true, id };
  }
}
