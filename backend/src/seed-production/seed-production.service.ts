import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, SeedCustodyEvent, SeedRunStatus, SeedStatus, UserRole } from '@prisma/client';
import { randomUUID, randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import {
  buildSeedSerial,
  extractSerialFromInput,
  isBioVeraSerialFormat,
  parseSeedSerial,
  seedLabelSecret,
} from './seed-serial';
import { buildLabelsCsv, buildLabelsPdf } from './seed-labels';
import { CreateApprovedProductDto } from './dto/create-approved-product.dto';
import { UpdateApprovedProductDto } from './dto/update-approved-product.dto';
import { CreateProducerDto } from './dto/create-producer.dto';
import { UpdateProducerDto } from './dto/update-producer.dto';
import { CreateRunDto } from './dto/create-run.dto';
import { ConfirmProductionDto } from './dto/confirm-production.dto';
import { AssignBagsDto } from './dto/assign-bags.dto';
import { ShipBagsDto } from './dto/ship-bags.dto';

export const PLANTING_ERROR_MESSAGES: Record<string, string> = {
  NOT_A_BIO_VERA_CODE: 'This is not a Bio Vera seed code.',
  RECALLED: 'This seed lot was recalled. Do not plant it — contact Bio Vera.',
  NOT_RELEASED: 'This seed bag is not released for planting.',
  EXPIRED: 'This seed bag has expired.',
  ALREADY_USED: 'This bag was already registered on {date}.',
  NOT_YOURS: 'This bag is not registered to your account. Ask your supplier or Bio Vera.',
};

export type PlantingCheckSuccess = {
  ok: true;
  legacy: boolean;
  serial: string;
  seed: {
    id: string;
    serialNumber: string;
    name: string;
    status: SeedStatus;
    batchNumber: string;
    quantity: number;
    quantityRemaining: number | null;
  };
  origin?: {
    product: string;
    variety?: string | null;
    lot: string;
    seedCropYear: number;
    producer: { name: string; city?: string | null; country: string };
    productionDate?: string | null;
    germinationPct?: number | null;
    certificateUrls?: string[];
  };
};

export type PlantingCheckFailure = {
  ok: false;
  code: string;
  message: string;
  serial: string;
};

@Injectable()
export class SeedProductionService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private email: EmailService,
  ) {}

  onModuleInit() {
    seedLabelSecret();
  }

  private async notifyAdmins(title: string, message: string) {
    const admins = await this.prisma.users.findMany({
      where: { roles: { hasSome: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } },
      select: { id: true },
    });
    for (const a of admins) {
      await this.notifications.create({ userId: a.id, type: 'SYSTEM', title, message });
    }
  }

  private async audit(actorId: string | null, entityId: string, action: string, detail: Record<string, unknown>) {
    await this.prisma.audit_trails.create({
      data: {
        id: randomUUID(),
        eventType: 'STATUS_CHANGE',
        entityType: 'SeedProduction',
        entityId,
        performedByUserId: actorId,
        newValue: { action, ...detail },
      },
    });
  }

  private parseBagSizeKg(label: string): number {
    const m = label.match(/([\d.]+)\s*kg/i);
    return m ? parseFloat(m[1]) : 1;
  }

  private runInclude = {
    approvedProduct: true,
    producer: true,
    bags: { orderBy: { bagNumber: 'asc' as const } },
  };

  // --- Approved products ---

  listApprovedProducts() {
    return this.prisma.approved_products.findMany({ orderBy: { name: 'asc' } });
  }

  async createApprovedProduct(dto: CreateApprovedProductDto, actorId: string) {
    const row = await this.prisma.approved_products.create({
      data: {
        ...dto,
        instructions: dto.instructions as Prisma.InputJsonValue | undefined,
      },
    });
    await this.audit(actorId, row.id, 'CREATE_APPROVED_PRODUCT', { name: row.name });
    return row;
  }

  async updateApprovedProduct(id: string, dto: UpdateApprovedProductDto, actorId: string) {
    const row = await this.prisma.approved_products.update({
      where: { id },
      data: {
        ...dto,
        instructions: dto.instructions as Prisma.InputJsonValue | undefined,
      },
    });
    await this.audit(actorId, id, 'UPDATE_APPROVED_PRODUCT', {});
    return row;
  }

  async retireApprovedProduct(id: string, actorId: string) {
    const row = await this.prisma.approved_products.update({
      where: { id },
      data: { status: 'RETIRED' },
    });
    await this.audit(actorId, id, 'RETIRE_APPROVED_PRODUCT', {});
    return row;
  }

  // --- Producers ---

  listProducers() {
    return this.prisma.seed_producers.findMany({ orderBy: { name: 'asc' } });
  }

  async createProducer(dto: CreateProducerDto, actorId: string) {
    const row = await this.prisma.seed_producers.create({ data: dto });
    await this.audit(actorId, row.id, 'CREATE_PRODUCER', { name: row.name });
    return row;
  }

  async updateProducer(id: string, dto: UpdateProducerDto, actorId: string) {
    const row = await this.prisma.seed_producers.update({ where: { id }, data: dto });
    await this.audit(actorId, id, 'UPDATE_PRODUCER', {});
    return row;
  }

  // --- Runs ---

  async listRuns() {
    const runs = await this.prisma.seed_production_runs.findMany({
      include: { approvedProduct: true, producer: true },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(
      runs.map(async (run) => ({
        ...run,
        bagCounts: await this.bagCountsForRun(run.id),
      })),
    );
  }

  private async bagCountsForRun(runId: string) {
    const groups = await this.prisma.seeds.groupBy({
      by: ['status'],
      where: { productionRunId: runId },
      _count: true,
    });
    const map: Record<string, number> = {};
    for (const g of groups) map[g.status] = g._count;
    return map;
  }

  /** Distinct bags that ever had a custody event (cumulative — status may have moved on). */
  private async countDistinctCustodyEventsForRun(
    runId: string,
    events: Array<'SOLD_TO_GROWER' | 'ASSIGNED_TO_GROWER'>,
  ): Promise<number> {
    const groups = await this.prisma.seed_custody_events.groupBy({
      by: ['seedId'],
      where: {
        event: { in: events },
        seed: { productionRunId: runId },
      },
    });
    return groups.length;
  }

  async getRun(id: string) {
    const run = await this.prisma.seed_production_runs.findUnique({
      where: { id },
      include: this.runInclude,
    });
    if (!run) throw new NotFoundException('Production run not found');
    return { ...run, bagCounts: await this.bagCountsForRun(id) };
  }

  async createRun(dto: CreateRunDto, actorId: string) {
    const lotNumber = dto.lotNumber.toUpperCase();
    const product = await this.prisma.approved_products.findUnique({
      where: { id: dto.approvedProductId },
    });
    if (!product || product.status !== 'ACTIVE' || product.category !== 'SEED') {
      throw new BadRequestException('Approved product must be an active SEED product');
    }
    const producer = await this.prisma.seed_producers.findUnique({ where: { id: dto.producerId } });
    if (!producer?.isActive) throw new BadRequestException('Producer not found or inactive');

    const existing = await this.prisma.seed_production_runs.findUnique({ where: { lotNumber } });
    if (existing) throw new ConflictException('Lot number already exists');

    const run = await this.prisma.seed_production_runs.create({
      data: {
        approvedProductId: dto.approvedProductId,
        producerId: dto.producerId,
        lotNumber,
        seedCropYear: dto.seedCropYear,
        originCountry: dto.originCountry,
        originRegion: dto.originRegion,
        bagSizeLabel: dto.bagSizeLabel,
        bagsPlanned: dto.bagsPlanned,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        createdBy: actorId,
      },
      include: this.runInclude,
    });
    await this.audit(actorId, run.id, 'CREATE_RUN', { lotNumber });
    return run;
  }

  async issueLabels(runId: string, actorId: string) {
    const run = await this.prisma.seed_production_runs.findUnique({
      where: { id: runId },
      include: { approvedProduct: true, bags: true },
    });
    if (!run) throw new NotFoundException('Production run not found');
    if (run.status !== 'PLANNED' && run.status !== 'LABELS_ISSUED') {
      throw new BadRequestException('Labels can only be issued from PLANNED status');
    }
    if (run.bags.length > 0) {
      if (run.status === 'PLANNED') {
        await this.prisma.seed_production_runs.update({
          where: { id: runId },
          data: { status: 'LABELS_ISSUED' },
        });
      }
      return this.getRun(runId);
    }

    const qty = this.parseBagSizeKg(run.bagSizeLabel);
    const now = new Date();
    const chunk = 1000;

    await this.prisma.$transaction(async (tx) => {
      for (let start = 1; start <= run.bagsPlanned; start += chunk) {
        const end = Math.min(start + chunk - 1, run.bagsPlanned);
        const rows: Prisma.seedsCreateManyInput[] = [];
        for (let bagNo = start; bagNo <= end; bagNo++) {
          const serial = buildSeedSerial(run.seedCropYear, run.lotNumber, bagNo);
          rows.push({
            id: randomUUID(),
            serialNumber: serial,
            type: 'SEED',
            name: run.approvedProduct.name,
            batchNumber: run.lotNumber,
            quantity: qty,
            areaCoverage: 0,
            status: 'LABELED',
            manufacturedAt: now,
            expiresAt: run.expiresAt,
            productionRunId: run.id,
            approvedProductId: run.approvedProductId,
            seedCropYear: run.seedCropYear,
            bagNumber: bagNo,
            updatedAt: now,
          });
        }
        await tx.seeds.createMany({ data: rows });
      }

      const created = await tx.seeds.findMany({
        where: { productionRunId: runId },
        select: { id: true },
      });
      const custodyRows = created.map((s) => ({
        id: randomUUID(),
        seedId: s.id,
        event: 'LABEL_ISSUED' as SeedCustodyEvent,
        actorId,
      }));
      for (let i = 0; i < custodyRows.length; i += chunk) {
        await tx.seed_custody_events.createMany({ data: custodyRows.slice(i, i + chunk) });
      }

      await tx.seed_production_runs.update({
        where: { id: runId },
        data: { status: 'LABELS_ISSUED' },
      });
    });

    await this.audit(actorId, runId, 'ISSUE_LABELS', { bags: run.bagsPlanned });
    return this.getRun(runId);
  }

  private async bagsForLabels(runId: string) {
    const run = await this.prisma.seed_production_runs.findUnique({
      where: { id: runId },
      include: { approvedProduct: true, bags: { orderBy: { bagNumber: 'asc' } } },
    });
    if (!run) throw new NotFoundException('Production run not found');
    if (!['LABELS_ISSUED', 'PRODUCED', 'RELEASED', 'RECALLED'].includes(run.status)) {
      throw new BadRequestException('Labels are available only after issue-labels');
    }
    return run;
  }

  async getLabelsCsv(runId: string) {
    const run = await this.bagsForLabels(runId);
    const csv = buildLabelsCsv(
      {
        lotNumber: run.lotNumber,
        seedCropYear: run.seedCropYear,
        bagSizeLabel: run.bagSizeLabel,
        originCountry: run.originCountry,
        expiresAt: run.expiresAt,
        approvedProduct: run.approvedProduct,
      },
      run.bags.map((b) => ({ serialNumber: b.serialNumber, bagNumber: b.bagNumber! })),
    );
    return { csv, filename: `seed-labels-${run.lotNumber}.csv` };
  }

  async getLabelsPdf(runId: string, format: 'sheet' | 'roll') {
    const run = await this.bagsForLabels(runId);
    const pdf = await buildLabelsPdf(
      {
        lotNumber: run.lotNumber,
        seedCropYear: run.seedCropYear,
        bagSizeLabel: run.bagSizeLabel,
        originCountry: run.originCountry,
        expiresAt: run.expiresAt,
        productionDate: run.productionDate,
        germinationPct: run.germinationPct,
        approvedProduct: run.approvedProduct,
      },
      run.bags.map((b) => ({ serialNumber: b.serialNumber, bagNumber: b.bagNumber! })),
      format,
    );
    return { pdf, filename: `seed-labels-${run.lotNumber}-${format}.pdf` };
  }

  async confirmProduction(runId: string, dto: ConfirmProductionDto, actorId: string) {
    const run = await this.prisma.seed_production_runs.findUnique({ where: { id: runId } });
    if (!run) throw new NotFoundException('Production run not found');
    if (run.status !== 'LABELS_ISSUED') {
      throw new BadRequestException('Production can only be confirmed from LABELS_ISSUED');
    }
    if (dto.bagsProduced <= 0 || dto.bagsProduced > run.bagsPlanned) {
      throw new BadRequestException('bagsProduced must be between 1 and bagsPlanned');
    }

    const productionDate = new Date(dto.productionDate);

    await this.prisma.$transaction(async (tx) => {
      const produced = await tx.seeds.findMany({
        where: { productionRunId: runId, bagNumber: { lte: dto.bagsProduced } },
      });
      const voided = await tx.seeds.findMany({
        where: { productionRunId: runId, bagNumber: { gt: dto.bagsProduced } },
      });

      for (const bag of produced) {
        await tx.seeds.update({
          where: { id: bag.id },
          data: { status: 'AVAILABLE', manufacturedAt: productionDate },
        });
        await tx.seed_custody_events.create({
          data: {
            id: randomUUID(),
            seedId: bag.id,
            event: 'PRODUCED',
            actorId,
          },
        });
      }
      for (const bag of voided) {
        await tx.seeds.update({
          where: { id: bag.id },
          data: { status: 'VOIDED' },
        });
        await tx.seed_custody_events.create({
          data: {
            id: randomUUID(),
            seedId: bag.id,
            event: 'VOIDED',
            actorId,
            note: 'Not produced',
          },
        });
      }

      await tx.seed_production_runs.update({
        where: { id: runId },
        data: {
          status: 'PRODUCED',
          bagsProduced: dto.bagsProduced,
          productionDate,
          germinationPct: dto.germinationPct,
          purityPct: dto.purityPct,
          certificateUrls: dto.certificateUrls ?? [],
        },
      });
    });

    await this.audit(actorId, runId, 'CONFIRM_PRODUCTION', { bagsProduced: dto.bagsProduced });
    return this.getRun(runId);
  }

  async releaseRun(runId: string, actorId: string) {
    const run = await this.prisma.seed_production_runs.findUnique({ where: { id: runId } });
    if (!run) throw new NotFoundException('Production run not found');
    if (run.status !== 'PRODUCED') throw new BadRequestException('Run must be PRODUCED before release');

    const available = await this.prisma.seeds.findMany({
      where: { productionRunId: runId, status: 'AVAILABLE' },
    });

    await this.prisma.$transaction(async (tx) => {
      for (const bag of available) {
        await tx.seed_custody_events.create({
          data: {
            id: randomUUID(),
            seedId: bag.id,
            event: 'RELEASED',
            actorId,
          },
        });
      }
      await tx.seed_production_runs.update({
        where: { id: runId },
        data: { status: 'RELEASED' },
      });
    });

    await this.audit(actorId, runId, 'RELEASE_RUN', {});
    return this.getRun(runId);
  }

  async getRecallPreview(runId: string) {
    const run = await this.prisma.seed_production_runs.findUnique({ where: { id: runId } });
    if (!run) throw new NotFoundException('Production run not found');
    if (!['PRODUCED', 'RELEASED'].includes(run.status)) {
      throw new BadRequestException('Recall allowed only from PRODUCED or RELEASED');
    }

    const bags = await this.prisma.seeds.findMany({
      where: {
        productionRunId: runId,
        status: { in: ['AVAILABLE', 'ASSIGNED', 'IN_SUPPLIER_STOCK', 'SOLD', 'LABELED'] },
      },
      select: {
        id: true,
        status: true,
        assignedToUserId: true,
        soldToGrowerId: true,
      },
    });

    const byStatus: Record<string, number> = {};
    const growerIds = new Set<string>();
    for (const bag of bags) {
      byStatus[bag.status] = (byStatus[bag.status] ?? 0) + 1;
      if (bag.assignedToUserId) growerIds.add(bag.assignedToUserId);
      if (bag.soldToGrowerId) growerIds.add(bag.soldToGrowerId);
    }

    const growers = growerIds.size
      ? await this.prisma.users.findMany({
          where: { id: { in: [...growerIds] } },
          select: { id: true, firstName: true, lastName: true, partnerCode: true },
        })
      : [];

    const planted = await this.prisma.seeds.findMany({
      where: { productionRunId: runId, plantedParcelId: { not: null } },
      select: {
        serialNumber: true,
        plantedParcelId: true,
        plantedAt: true,
      },
    });

    const parcelIds = [...new Set(planted.map((p) => p.plantedParcelId).filter(Boolean))] as string[];
    const parcelRows = parcelIds.length
      ? await this.prisma.parcels.findMany({
          where: { id: { in: parcelIds } },
          select: {
            id: true,
            cropType: true,
            calculatedArea: true,
            estates: { select: { name: true } },
          },
        })
      : [];
    const parcelById = new Map(parcelRows.map((p) => [p.id, p]));

    const affectedParcelsMap = new Map<
      string,
      {
        parcelId: string;
        serialNumbers: string[];
        plantedAt: string | null;
        cropType: string | null;
        estateName: string | null;
        areaM2: number | null;
      }
    >();
    for (const p of planted) {
      if (!p.plantedParcelId) continue;
      const parcel = parcelById.get(p.plantedParcelId);
      const existing = affectedParcelsMap.get(p.plantedParcelId);
      if (existing) {
        existing.serialNumbers.push(p.serialNumber);
      } else {
        affectedParcelsMap.set(p.plantedParcelId, {
          parcelId: p.plantedParcelId,
          serialNumbers: [p.serialNumber],
          plantedAt: p.plantedAt?.toISOString() ?? null,
          cropType: parcel?.cropType ?? null,
          estateName: parcel?.estates?.name ?? null,
          areaM2: parcel?.calculatedArea ?? null,
        });
      }
    }

    return {
      lotNumber: run.lotNumber,
      bagsToRecall: bags.length,
      byStatus,
      growers,
      affectedParcels: [...affectedParcelsMap.values()],
    };
  }

  async previewAssignBags(runId: string, serials: string[]) {
    const run = await this.prisma.seed_production_runs.findUnique({ where: { id: runId } });
    if (!run) throw new NotFoundException('Production run not found');

    const results: { serial: string; ok: boolean; reason?: string }[] = [];
    for (const raw of serials) {
      const parsed = parseSeedSerial(raw);
      if (!parsed.ok) {
        results.push({ serial: raw, ok: false, reason: parsed.ok === false ? parsed.reason : 'FORMAT' });
        continue;
      }
      const bag = await this.prisma.seeds.findUnique({
        where: { serialNumber: parsed.serial },
        include: { productionRun: true },
      });
      if (!bag || bag.productionRunId !== runId) {
        results.push({ serial: parsed.serial, ok: false, reason: 'NOT_IN_RUN' });
        continue;
      }
      if (bag.status !== 'AVAILABLE') {
        results.push({ serial: parsed.serial, ok: false, reason: bag.status });
        continue;
      }
      results.push({ serial: parsed.serial, ok: true });
    }
    return { results };
  }

  async recallRun(runId: string, reason: string, actorId: string) {
    const run = await this.prisma.seed_production_runs.findUnique({ where: { id: runId } });
    if (!run) throw new NotFoundException('Production run not found');
    if (!['PRODUCED', 'RELEASED'].includes(run.status)) {
      throw new BadRequestException('Recall allowed only from PRODUCED or RELEASED');
    }

    const bags = await this.prisma.seeds.findMany({
      where: {
        productionRunId: runId,
        status: { in: ['AVAILABLE', 'ASSIGNED', 'IN_SUPPLIER_STOCK', 'SOLD', 'LABELED'] },
      },
    });

    const growerIds = new Set<string>();
    for (const bag of bags) {
      if (bag.assignedToUserId) growerIds.add(bag.assignedToUserId);
      if (bag.soldToGrowerId) growerIds.add(bag.soldToGrowerId);
    }

    const affectedParcels = await this.prisma.seeds.findMany({
      where: { productionRunId: runId, plantedParcelId: { not: null } },
      select: { plantedParcelId: true, serialNumber: true },
    });

    await this.prisma.$transaction(async (tx) => {
      for (const bag of bags) {
        await tx.seeds.update({ where: { id: bag.id }, data: { status: 'RECALLED' } });
        await tx.seed_custody_events.create({
          data: {
            id: randomUUID(),
            seedId: bag.id,
            event: 'RECALLED',
            actorId,
            note: reason,
          },
        });
      }
      await tx.seed_production_runs.update({
        where: { id: runId },
        data: { status: 'RECALLED', recallReason: reason },
      });
    });

    for (const userId of growerIds) {
      await this.notifications.create({
        userId,
        type: 'SYSTEM',
        title: `Seed lot ${run.lotNumber} recalled`,
        message: `${reason}. Do not plant these bags — contact Bio Vera for guidance.`,
        actionUrl: '/grower/notifications',
      });
    }

    await this.audit(actorId, runId, 'RECALL_RUN', { reason, growers: [...growerIds] });
    return {
      run: await this.getRun(runId),
      affectedGrowers: [...growerIds],
      affectedParcels,
    };
  }

  async assignBags(runId: string, dto: AssignBagsDto, actorId: string) {
    const run = await this.prisma.seed_production_runs.findUnique({ where: { id: runId } });
    if (!run) throw new NotFoundException('Production run not found');
    if (run.status !== 'RELEASED') throw new BadRequestException('Bags can only be assigned from a RELEASED run');

    let growerId = dto.growerId;
    if (!growerId && dto.growerPartnerCode) {
      const user = await this.prisma.users.findFirst({
        where: { partnerCode: dto.growerPartnerCode.trim().toUpperCase() },
      });
      if (!user) throw new NotFoundException('Grower not found by partner code');
      growerId = user.id;
    }
    if (!growerId) throw new BadRequestException('growerId or growerPartnerCode is required');

    const results: { serial: string; ok: boolean; reason?: string }[] = [];
    const now = new Date();

    for (const raw of dto.serials) {
      const parsed = parseSeedSerial(raw);
      if (!parsed.ok) {
        const reason = parsed.ok === false ? parsed.reason : 'FORMAT';
        results.push({ serial: raw, ok: false, reason });
        continue;
      }
      const bag = await this.prisma.seeds.findUnique({
        where: { serialNumber: parsed.serial },
        include: { productionRun: true },
      });
      if (!bag || bag.productionRunId !== runId) {
        results.push({ serial: parsed.serial, ok: false, reason: 'NOT_IN_RUN' });
        continue;
      }
      if (bag.status !== 'AVAILABLE') {
        results.push({ serial: parsed.serial, ok: false, reason: bag.status });
        continue;
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.seeds.update({
          where: { id: bag.id },
          data: {
            status: 'ASSIGNED',
            assignedToUserId: growerId,
            assignedAt: now,
            soldToGrowerId: growerId,
            soldAt: now,
          },
        });
        await tx.seed_custody_events.create({
          data: {
            id: randomUUID(),
            seedId: bag.id,
            event: 'ASSIGNED_TO_GROWER',
            actorId,
            growerId,
          },
        });
      });
      results.push({ serial: parsed.serial, ok: true });
    }

    await this.audit(actorId, runId, 'ASSIGN_BAGS', { growerId, count: results.filter((r) => r.ok).length });
    return { growerId, results };
  }

  async shipBags(runId: string, dto: ShipBagsDto, actorId: string) {
    const run = await this.prisma.seed_production_runs.findUnique({ where: { id: runId } });
    if (!run) throw new NotFoundException('Production run not found');
    if (run.status !== 'RELEASED') {
      throw new BadRequestException('Bags can only be shipped from a RELEASED run');
    }

    const supplier = await this.prisma.users.findUnique({
      where: { id: dto.supplierUserId },
      include: { material_supplier_profile: true },
    });
    if (!supplier?.roles.includes('MATERIAL_SUPPLIER' as never)) {
      throw new BadRequestException('Target user must have MATERIAL_SUPPLIER role');
    }
    if (!supplier.material_supplier_profile?.mapApproved) {
      throw new BadRequestException('Supplier must be map-approved before receiving seed bags');
    }

    const results: { serial: string; ok: boolean; reason?: string }[] = [];

    for (const raw of dto.serials) {
      const parsed = parseSeedSerial(raw);
      if (!parsed.ok) {
        results.push({ serial: raw, ok: false, reason: parsed.ok === false ? parsed.reason : 'FORMAT' });
        continue;
      }
      const bag = await this.prisma.seeds.findUnique({
        where: { serialNumber: parsed.serial },
        include: { productionRun: true },
      });
      if (!bag || bag.productionRunId !== runId) {
        results.push({ serial: parsed.serial, ok: false, reason: 'NOT_IN_RUN' });
        continue;
      }
      if (bag.status !== 'AVAILABLE' || bag.supplierUserId) {
        results.push({ serial: parsed.serial, ok: false, reason: bag.supplierUserId ? 'ALREADY_SHIPPED' : bag.status });
        continue;
      }
      if (bag.assignedToUserId || bag.soldToGrowerId) {
        results.push({ serial: parsed.serial, ok: false, reason: 'ALREADY_ASSIGNED' });
        continue;
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.seeds.update({
          where: { id: bag.id },
          data: { supplierUserId: dto.supplierUserId },
        });
        await tx.seed_custody_events.create({
          data: {
            id: randomUUID(),
            seedId: bag.id,
            event: 'SHIPPED_TO_SUPPLIER',
            actorId,
            supplierUserId: dto.supplierUserId,
          },
        });
      });
      results.push({ serial: parsed.serial, ok: true });
    }

    await this.audit(actorId, runId, 'SHIP_BAGS', {
      supplierUserId: dto.supplierUserId,
      count: results.filter((r) => r.ok).length,
    });
    return { supplierUserId: dto.supplierUserId, results };
  }

  async getBagBySerial(serialInput: string) {
    const parsed = parseSeedSerial(serialInput);
    const serial = parsed.ok ? parsed.serial : extractSerialFromInput(serialInput);
    const bag = await this.prisma.seeds.findUnique({
      where: { serialNumber: serial },
      include: {
        productionRun: { include: { approvedProduct: true, producer: true } },
        approvedProduct: true,
        custody: { orderBy: { createdAt: 'asc' } },
        seed_scans: { orderBy: { createdAt: 'desc' }, take: 20 },
        planting: true,
      },
    });
    if (!bag) throw new NotFoundException('Bag not found');
    return bag;
  }

  async getDashboard() {
    const runs = await this.prisma.seed_production_runs.findMany({
      include: { approvedProduct: true, producer: true },
      orderBy: { createdAt: 'desc' },
    });
    const totals = {
      labeled: 0,
      produced: 0,
      voided: 0,
      available: 0,
      assigned: 0,
      planted: 0,
      recalled: 0,
    };
    const runStats = await Promise.all(
      runs.map(async (run) => {
        const counts = await this.bagCountsForRun(run.id);
        for (const [status, n] of Object.entries(counts)) {
          if (status === 'LABELED') totals.labeled += n;
          if (status === 'AVAILABLE') totals.available += n;
          if (status === 'ASSIGNED' || status === 'SOLD') totals.assigned += n;
          if (status === 'PLANTED' || status === 'USED') totals.planted += n;
          if (status === 'VOIDED') totals.voided += n;
          if (status === 'RECALLED') totals.recalled += n;
        }
        return { ...run, bagCounts: counts };
      }),
    );

    const plantedParcels = await this.prisma.seeds.findMany({
      where: { plantedParcelId: { not: null }, productionRunId: { not: null } },
      select: {
        serialNumber: true,
        plantedParcelId: true,
        plantedAt: true,
        productionRun: { select: { lotNumber: true } },
      },
    });

    return { totals, runs: runStats, plantedParcels };
  }

  async publicVerify(serialInput: string) {
    const parsed = parseSeedSerial(serialInput);
    if (!parsed.ok) {
      return { genuine: false, reason: 'NOT_A_BIO_VERA_CODE' as const };
    }

    const bag = await this.prisma.seeds.findUnique({
      where: { serialNumber: parsed.serial },
      include: {
        productionRun: { include: { approvedProduct: true, producer: true } },
      },
    });
    if (!bag?.productionRun) {
      return { genuine: false, reason: 'NOT_A_BIO_VERA_CODE' as const };
    }

    const run = bag.productionRun;
    if (bag.status === 'VOIDED' || run.status === 'LABELS_ISSUED') {
      return { genuine: false, reason: 'NOT_ISSUED_FOR_SALE' as const };
    }
    const product = run.approvedProduct;
    const producer = run.producer;

    let state: 'OK' | 'USED' | 'RECALLED' | 'EXPIRED' | 'NOT_RELEASED' = 'OK';
    if (run.status === 'RECALLED' || bag.status === 'RECALLED') state = 'RECALLED';
    else if (run.status !== 'RELEASED') state = 'NOT_RELEASED';
    else if (bag.expiresAt && bag.expiresAt < new Date()) state = 'EXPIRED';
    else if (bag.status === 'PLANTED' || bag.status === 'USED') state = 'USED';

    const instructions = product.instructions as Record<string, string> | null;

    return {
      genuine: true,
      state,
      product: product.name,
      variety: product.variety,
      lotNumber: run.lotNumber,
      seedCropYear: run.seedCropYear,
      bagSize: run.bagSizeLabel,
      producer: {
        name: producer.name,
        city: producer.city,
        country: producer.country,
      },
      productionDate: run.productionDate?.toISOString().slice(0, 10) ?? null,
      germinationPct: run.germinationPct,
      purityPct: run.purityPct,
      certificateUrls: run.certificateUrls,
      instructions,
      instructionsPdfUrl: product.instructionsPdfUrl,
      videoUrl: product.videoUrl,
    };
  }

  async recordFailedScan(params: {
    inputSerialNumber: string;
    userId: string;
    code: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
    deviceId?: string;
    parcelId?: string | null;
    seedId?: string | null;
  }) {
    return this.prisma.seed_scans.create({
      data: {
        id: randomUUID(),
        inputSerialNumber: params.inputSerialNumber,
        seedId: params.seedId ?? null,
        scannedByUserId: params.userId,
        gpsLatitude: params.gpsLatitude ?? 0,
        gpsLongitude: params.gpsLongitude ?? 0,
        deviceId: params.deviceId?.trim() || 'unknown',
        networkTimestamp: new Date(),
        deviceTimestamp: new Date(),
        parcelId: params.parcelId ?? null,
        isValid: false,
        validationError: params.code,
      },
    });
  }

  async checkBagForPlanting(
    serialInput: string,
    userId: string,
    opts?: {
      recordScan?: boolean;
      gpsLatitude?: number;
      gpsLongitude?: number;
      deviceId?: string;
      parcelId?: string | null;
      quantityKg?: number;
    },
  ): Promise<PlantingCheckSuccess | PlantingCheckFailure> {
    const raw = serialInput.trim();
    const isBv = isBioVeraSerialFormat(raw);

    if (!isBv) {
      const legacySerial = extractSerialFromInput(raw);
      const legacy = await this.prisma.seeds.findUnique({ where: { serialNumber: legacySerial } });
      if (legacy && !legacy.productionRunId) {
        if (legacy.status === 'USED' || legacy.status === 'EXPIRED') {
          const fail: PlantingCheckFailure = {
            ok: false,
            code: 'ALREADY_USED',
            message: PLANTING_ERROR_MESSAGES.ALREADY_USED.replace('{date}', legacy.updatedAt.toISOString().slice(0, 10)),
            serial: legacySerial,
          };
          if (opts?.recordScan) {
            await this.recordFailedScan({
              inputSerialNumber: raw,
              userId,
              code: 'LEGACY_SEED',
              seedId: legacy.id,
              ...opts,
            });
          }
          return fail;
        }
        if (legacy.assignedToUserId && legacy.assignedToUserId !== userId) {
          const fail: PlantingCheckFailure = {
            ok: false,
            code: 'NOT_YOURS',
            message: PLANTING_ERROR_MESSAGES.NOT_YOURS,
            serial: legacySerial,
          };
          if (opts?.recordScan) await this.recordFailedScan({ inputSerialNumber: raw, userId, code: fail.code, seedId: legacy.id, ...opts });
          return fail;
        }
        return {
          ok: true,
          legacy: true,
          serial: legacySerial,
          seed: {
            id: legacy.id,
            serialNumber: legacy.serialNumber,
            name: legacy.name,
            status: legacy.status,
            batchNumber: legacy.batchNumber,
            quantity: legacy.quantity,
            quantityRemaining: legacy.quantityRemaining,
          },
        };
      }
      const fail: PlantingCheckFailure = {
        ok: false,
        code: 'NOT_A_BIO_VERA_CODE',
        message: PLANTING_ERROR_MESSAGES.NOT_A_BIO_VERA_CODE,
        serial: legacySerial,
      };
      if (opts?.recordScan) await this.recordFailedScan({ inputSerialNumber: raw, userId, code: fail.code, ...opts });
      return fail;
    }

    const parsed = parseSeedSerial(raw);
    if (!parsed.ok) {
      const fail: PlantingCheckFailure = {
        ok: false,
        code: 'NOT_A_BIO_VERA_CODE',
        message: PLANTING_ERROR_MESSAGES.NOT_A_BIO_VERA_CODE,
        serial: extractSerialFromInput(raw),
      };
      if (opts?.recordScan) await this.recordFailedScan({ inputSerialNumber: raw, userId, code: fail.code, ...opts });
      return fail;
    }

    const bag = await this.prisma.seeds.findUnique({
      where: { serialNumber: parsed.serial },
      include: {
        productionRun: { include: { approvedProduct: true, producer: true } },
      },
    });

    if (!bag?.productionRun) {
      const fail: PlantingCheckFailure = {
        ok: false,
        code: 'NOT_A_BIO_VERA_CODE',
        message: PLANTING_ERROR_MESSAGES.NOT_A_BIO_VERA_CODE,
        serial: parsed.serial,
      };
      if (opts?.recordScan) await this.recordFailedScan({ inputSerialNumber: raw, userId, code: fail.code, ...opts });
      return fail;
    }

    const failWith = async (code: keyof typeof PLANTING_ERROR_MESSAGES, extra?: Partial<PlantingCheckFailure>): Promise<PlantingCheckFailure> => {
      let message = PLANTING_ERROR_MESSAGES[code];
      if (code === 'ALREADY_USED' && bag.plantedAt) {
        message = message.replace('{date}', bag.plantedAt.toISOString().slice(0, 10));
      }
      const fail: PlantingCheckFailure = { ok: false, code, message, serial: parsed.serial, ...extra };
      if (opts?.recordScan) {
        await this.recordFailedScan({
          inputSerialNumber: raw,
          userId,
          code,
          seedId: bag.id,
          ...opts,
        });
      }
      return fail;
    };

    const run = bag.productionRun;
    if (run.status === 'RECALLED' || bag.status === 'RECALLED') return failWith('RECALLED');
    if (bag.status === 'VOIDED' || run.status !== 'RELEASED') return failWith('NOT_RELEASED');
    if (bag.expiresAt && bag.expiresAt < new Date()) return failWith('EXPIRED');
    const availableKg = this.bagAvailableKg(bag);
    if (bag.status === 'PLANTED' || bag.status === 'USED') return failWith('ALREADY_USED');
    if (bag.status === 'PARTIALLY_USED' && availableKg <= 0) return failWith('ALREADY_USED');
    if (bag.plantedParcelId && bag.plantedParcelId !== opts?.parcelId && bag.status !== 'SOLD') {
      return failWith('ALREADY_USED');
    }
    if (opts?.quantityKg != null && opts.quantityKg > availableKg + 0.001) {
      const fail: PlantingCheckFailure = {
        ok: false,
        code: 'NOT_A_BIO_VERA_CODE',
        message: `Requested ${opts.quantityKg} kg exceeds ${availableKg} kg remaining in this bag.`,
        serial: parsed.serial,
      };
      if (opts?.recordScan) {
        await this.recordFailedScan({
          inputSerialNumber: raw,
          userId,
          code: 'NOT_A_BIO_VERA_CODE',
          seedId: bag.id,
          ...opts,
        });
      }
      return fail;
    }

    const holder = bag.soldToGrowerId || bag.assignedToUserId;
    if (!holder || holder !== userId) return failWith('NOT_YOURS');

    const origin = {
      product: run.approvedProduct.name,
      variety: run.approvedProduct.variety,
      lot: run.lotNumber,
      seedCropYear: run.seedCropYear,
      producer: {
        name: run.producer.name,
        city: run.producer.city,
        country: run.producer.country,
      },
      productionDate: run.productionDate?.toISOString().slice(0, 10) ?? null,
      germinationPct: run.germinationPct,
      certificateUrls: run.certificateUrls,
    };

    return {
      ok: true,
      legacy: false,
      serial: parsed.serial,
      seed: {
        id: bag.id,
        serialNumber: bag.serialNumber,
        name: bag.name,
        status: bag.status,
        batchNumber: bag.batchNumber,
        quantity: bag.quantity,
        quantityRemaining: bag.quantityRemaining,
      },
      origin,
    };
  }

  bagAvailableKg(bag: { quantity: number; quantityRemaining: number | null; status: string }): number {
    if (bag.status === 'PARTIALLY_USED') return bag.quantityRemaining ?? 0;
    if (bag.status === 'PLANTED' || bag.status === 'USED') return 0;
    return bag.quantity;
  }

  async markBagPlanted(params: {
    serial: string;
    userId: string;
    parcelId: string;
    gpsLatitude: number;
    gpsLongitude: number;
    deviceId?: string;
    quantityKg?: number;
    plantingId?: string | null;
  }) {
    const quantityKg = params.quantityKg ?? undefined;
    const check = await this.checkBagForPlanting(params.serial, params.userId, {
      recordScan: false,
      gpsLatitude: params.gpsLatitude,
      gpsLongitude: params.gpsLongitude,
      deviceId: params.deviceId,
      parcelId: params.parcelId,
      quantityKg,
    });
    if (!check.ok) return check;

    const bag = await this.prisma.seeds.findUnique({
      where: { serialNumber: check.serial },
      include: { productionRun: { include: { approvedProduct: true } } },
    });
    if (!bag) throw new NotFoundException('Bag not found');

    const usedKg = quantityKg ?? this.bagAvailableKg(bag);
    const availableKg = this.bagAvailableKg(bag);
    if (usedKg <= 0 || usedKg > availableKg + 0.001) {
      throw new BadRequestException(`Invalid quantity: ${usedKg} kg (available ${availableKg} kg)`);
    }

    const now = new Date();
    let plantingId: string | null = params.plantingId ?? null;

    if (!plantingId && bag.productionRunId && bag.productionRun?.approvedProduct.cropType) {
      const cropType = bag.productionRun.approvedProduct.cropType;
      const plantings = await this.prisma.harvest_announcements.findMany({
        where: {
          parcelId: params.parcelId,
          userId: params.userId,
          announcementType: 'PLANTING',
          cropType,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      });
      if (plantings.length === 1) plantingId = plantings[0].id;
    }

    const remainingKg = availableKg - usedKg;
    const nextStatus =
      bag.productionRunId && remainingKg > 0.001 ? 'PARTIALLY_USED' : bag.productionRunId ? 'PLANTED' : 'SCANNED';

    await this.prisma.$transaction(async (tx) => {
      await tx.seeds.update({
        where: { id: bag.id },
        data: {
          status: nextStatus,
          plantedParcelId: params.parcelId,
          plantedAt: bag.plantedAt ?? now,
          plantingId: plantingId ?? bag.plantingId,
          quantityRemaining: remainingKg > 0.001 ? remainingKg : null,
          assignedToUserId: bag.assignedToUserId ?? params.userId,
          assignedAt: bag.assignedAt ?? now,
        },
      });
      if (bag.productionRunId) {
        await tx.seed_custody_events.create({
          data: {
            id: randomUUID(),
            seedId: bag.id,
            event: 'PLANTED',
            actorId: params.userId,
            growerId: params.userId,
            parcelId: params.parcelId,
            lat: params.gpsLatitude,
            lng: params.gpsLongitude,
            note: `${usedKg} kg`,
          },
        });
      }
      await tx.seed_scans.create({
        data: {
          id: randomUUID(),
          inputSerialNumber: check.serial,
          seedId: bag.id,
          scannedByUserId: params.userId,
          gpsLatitude: params.gpsLatitude,
          gpsLongitude: params.gpsLongitude,
          deviceId: params.deviceId?.trim() || 'unknown',
          networkTimestamp: now,
          deviceTimestamp: now,
          parcelId: params.parcelId,
          isValid: true,
        },
      });
      if (!bag.productionRunId) {
        const parcel = await tx.parcels.findUnique({ where: { id: params.parcelId } });
        if (parcel && !parcel.seedId) {
          await tx.parcels.update({
            where: { id: params.parcelId },
            data: { seedId: bag.id, inputSerialNumber: check.serial, status: 'ACTIVE', validationError: null },
          });
        }
      }
    });

    return { ok: true as const, check, plantingId, usedKg, remainingKg, status: nextStatus };
  }

  /** Admin read — planted Bio Vera bags on a parcel (no grower ownership check). */
  async listPlantedBagsForParcel(parcelId: string) {
    const parcel = await this.prisma.parcels.findUnique({
      where: { id: parcelId },
      select: { id: true, cropType: true, calculatedArea: true },
    });
    if (!parcel) throw new NotFoundException('Parcel not found');

    const bags = await this.prisma.seeds.findMany({
      where: { plantedParcelId: parcelId, productionRunId: { not: null } },
      include: {
        productionRun: { select: { lotNumber: true, bagSizeLabel: true } },
      },
      orderBy: { plantedAt: 'asc' },
    });

    let totalKg = 0;
    const lots = new Set<string>();
    const rows = bags.map((b) => {
      const kgMatch = b.productionRun?.bagSizeLabel?.match(/([\d.]+)\s*kg/i);
      const kg = kgMatch ? parseFloat(kgMatch[1]) : b.quantity || 0;
      totalKg += kg;
      if (b.productionRun?.lotNumber) lots.add(b.productionRun.lotNumber);
      return {
        serialNumber: b.serialNumber,
        status: b.status,
        lotNumber: b.productionRun?.lotNumber ?? null,
        bagSizeLabel: b.productionRun?.bagSizeLabel ?? null,
        bagKg: kg,
        plantedAt: b.plantedAt?.toISOString() ?? null,
      };
    });

    return {
      parcel,
      plantedBags: {
        count: rows.length,
        totalKg,
        lots: [...lots],
        bags: rows,
      },
    };
  }

  /** Grower read — Bio Vera seed origin on own parcel (no serials). */
  async getGrowerParcelSeedOrigin(userId: string, parcelId: string) {
    const parcel = await this.prisma.parcels.findUnique({
      where: { id: parcelId },
      include: { estates: { select: { ownerId: true } } },
    });
    if (!parcel) throw new NotFoundException('Parcel not found');
    if (parcel.estates.ownerId !== userId) {
      throw new ForbiddenException('You can only view seed origin on your own parcels');
    }

    const bags = await this.prisma.seeds.findMany({
      where: { plantedParcelId: parcelId, productionRunId: { not: null } },
      include: {
        productionRun: { include: { approvedProduct: true, producer: true } },
      },
      orderBy: { plantedAt: 'asc' },
    });

    const byRun = new Map<string, typeof bags>();
    for (const b of bags) {
      if (!b.productionRunId) continue;
      const list = byRun.get(b.productionRunId) ?? [];
      list.push(b);
      byRun.set(b.productionRunId, list);
    }

    const seedOrigin = [...byRun.values()].map((runBags) => {
      const run = runBags[0].productionRun!;
      const plantedDates = runBags.map((b) => b.plantedAt).filter(Boolean) as Date[];
      const recalled = run.status === 'RECALLED' || runBags.some((b) => b.status === 'RECALLED');
      return {
        product: run.approvedProduct.name,
        variety: run.approvedProduct.variety,
        lotNumber: run.lotNumber,
        seedCropYear: run.seedCropYear,
        producer: {
          name: run.producer.name,
          city: run.producer.city,
          country: run.producer.country,
        },
        productionDate: run.productionDate?.toISOString().slice(0, 10) ?? null,
        germinationPct: run.germinationPct,
        purityPct: run.purityPct,
        certificateUrls: run.certificateUrls ?? [],
        bagsPlanted: runBags.length,
        plantedFrom: plantedDates[0]?.toISOString().slice(0, 10) ?? null,
        plantedTo: plantedDates[plantedDates.length - 1]?.toISOString().slice(0, 10) ?? null,
        recalled,
        recallNotice: recalled ? 'This seed lot was recalled by Bio Vera.' : null,
      };
    });

    return { parcelId, seedOrigin };
  }

  // --- Producer portal (SEED_PRODUCER role) ---

  async resolveProducerForUser(userId: string) {
    const producer = await this.prisma.seed_producers.findFirst({ where: { userId } });
    if (!producer) throw new NotFoundException('No producer profile linked to this account');
    return producer;
  }

  async getProducerMe(userId: string) {
    const producer = await this.resolveProducerForUser(userId);
    return {
      id: producer.id,
      name: producer.name,
      city: producer.city,
      country: producer.country,
      licenseNumber: producer.licenseNumber,
      contactName: producer.contactName,
      contactEmail: producer.contactEmail,
    };
  }

  async listProducerRuns(userId: string) {
    const producer = await this.resolveProducerForUser(userId);
    const runs = await this.prisma.seed_production_runs.findMany({
      where: { producerId: producer.id },
      include: { approvedProduct: true },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(
      runs.map(async (run) => ({
        id: run.id,
        lotNumber: run.lotNumber,
        seedCropYear: run.seedCropYear,
        product: run.approvedProduct.name,
        variety: run.approvedProduct.variety,
        bagsPlanned: run.bagsPlanned,
        bagsProduced: run.bagsProduced,
        status: run.status,
        productionDate: run.productionDate?.toISOString().slice(0, 10) ?? null,
        labelsReady: ['LABELS_ISSUED', 'PRODUCED', 'RELEASED'].includes(run.status),
      })),
    );
  }

  async getProducerRun(userId: string, runId: string) {
    const producer = await this.resolveProducerForUser(userId);
    const run = await this.prisma.seed_production_runs.findFirst({
      where: { id: runId, producerId: producer.id },
      include: { approvedProduct: true, producer: true },
    });
    if (!run) throw new NotFoundException('Production run not found');
    return { ...run, bagCounts: await this.bagCountsForRun(runId) };
  }

  private assertProducerCanDownloadLabels(status: SeedRunStatus) {
    if (!['LABELS_ISSUED', 'PRODUCED', 'RELEASED', 'RECALLED'].includes(status)) {
      throw new BadRequestException('Labels are available after labels are issued');
    }
  }

  async getProducerLabelsCsv(userId: string, runId: string) {
    const run = await this.getProducerRun(userId, runId);
    this.assertProducerCanDownloadLabels(run.status);
    return this.getLabelsCsv(runId);
  }

  async getProducerLabelsPdf(userId: string, runId: string, format: 'sheet' | 'roll') {
    const run = await this.getProducerRun(userId, runId);
    this.assertProducerCanDownloadLabels(run.status);
    return this.getLabelsPdf(runId, format);
  }

  async confirmProductionAsProducer(userId: string, runId: string, dto: ConfirmProductionDto) {
    const producer = await this.resolveProducerForUser(userId);
    const run = await this.prisma.seed_production_runs.findFirst({
      where: { id: runId, producerId: producer.id },
    });
    if (!run) throw new NotFoundException('Production run not found');
    const updated = await this.confirmProduction(runId, dto, userId);
    await this.notifyAdmins(
      'Production confirmed by producer',
      `Production confirmed by ${producer.name} — lot ${run.lotNumber}: ${dto.bagsProduced} of ${run.bagsPlanned} bags`,
    );
    return updated;
  }

  async appendProducerCertificate(userId: string, runId: string, url: string) {
    const producer = await this.resolveProducerForUser(userId);
    const run = await this.prisma.seed_production_runs.findFirst({
      where: { id: runId, producerId: producer.id },
    });
    if (!run) throw new NotFoundException('Production run not found');
    const urls = [...(run.certificateUrls ?? []), url];
    await this.prisma.seed_production_runs.update({
      where: { id: runId },
      data: { certificateUrls: urls },
    });
    await this.audit(userId, runId, 'PRODUCER_UPLOAD_CERTIFICATE', { url });
    return { certificateUrls: urls };
  }

  async inviteProducerPortalUser(
    producerId: string,
    dto: { firstName: string; lastName: string; email: string },
    actorId: string,
  ) {
    const producer = await this.prisma.seed_producers.findUnique({ where: { id: producerId } });
    if (!producer) throw new NotFoundException('Producer not found');
    if (producer.userId) throw new ConflictException('Producer already has a portal user');

    const emailTaken = await this.prisma.users.findFirst({ where: { email: dto.email.trim() } });
    if (emailTaken) throw new ConflictException('Email already registered');

    const short = producer.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase() || 'FACTORY';
    const partnerCode = `PROD-${short}-${randomUUID().slice(0, 4).toUpperCase()}`;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let tempPassword = '';
    for (let i = 0; i < 12; i++) tempPassword += chars.charAt(randomInt(chars.length));
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await this.prisma.users.create({
      data: {
        id: randomUUID(),
        partnerCode,
        email: dto.email.trim(),
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        passwordHash,
        roles: [UserRole.SEED_PRODUCER],
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });

    await this.prisma.seed_producers.update({
      where: { id: producerId },
      data: { userId: user.id },
    });

    const webBase = (process.env.WEB_PUBLIC_URL || process.env.FRONTEND_URL || 'https://biovera.app').replace(/\/$/, '');
    await this.email.sendProducerPortalInviteEmail({
      email: dto.email.trim(),
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      partnerCode,
      temporaryPassword: tempPassword,
      portalUrl: `${webBase}/seed-producer`,
      loginUrl: `${webBase}/login/seed-producer`,
    });

    await this.audit(actorId, producerId, 'INVITE_PRODUCER_USER', { userId: user.id, email: dto.email });
    return { userId: user.id, partnerCode, email: dto.email };
  }

  async unlinkProducerPortalUser(producerId: string, actorId: string) {
    const producer = await this.prisma.seed_producers.findUnique({ where: { id: producerId } });
    if (!producer) throw new NotFoundException('Producer not found');
    if (!producer.userId) throw new BadRequestException('Producer has no linked portal user');

    await this.prisma.users.update({
      where: { id: producer.userId },
      data: { status: 'SUSPENDED', updatedAt: new Date() },
    });
    await this.prisma.seed_producers.update({
      where: { id: producerId },
      data: { userId: null },
    });
    await this.audit(actorId, producerId, 'UNLINK_PRODUCER_USER', { userId: producer.userId });
    return { ok: true };
  }

  // --- Reporting ---

  /** Funnel metrics for one production run (see admin reports tooltips). */
  private async bagFunnelForRun(runId: string, run: { bagsProduced: number | null }) {
    const counts = await this.bagCountsForRun(runId);
    const labeled = Object.values(counts).reduce((sum, n) => sum + n, 0);
    const [shipped, soldEver, assignedEver] = await Promise.all([
      this.prisma.seeds.count({
        where: { productionRunId: runId, supplierUserId: { not: null } },
      }),
      this.countDistinctCustodyEventsForRun(runId, ['SOLD_TO_GROWER']),
      this.countDistinctCustodyEventsForRun(runId, ['ASSIGNED_TO_GROWER']),
    ]);
    return {
      labeled,
      produced: run.bagsProduced ?? 0,
      voided: counts.VOIDED ?? 0,
      atProducer: counts.AVAILABLE ?? 0,
      shipped,
      inSupplierStock: counts.IN_SUPPLIER_STOCK ?? 0,
      sold: soldEver,
      assignedAdmin: assignedEver,
      planted: (counts.PLANTED ?? 0) + (counts.PARTIALLY_USED ?? 0),
      recalled: counts.RECALLED ?? 0,
    };
  }

  async getReportsSummary(filters?: { year?: number; productId?: string }) {
    const where: Prisma.seed_production_runsWhereInput = {};
    if (filters?.year) where.seedCropYear = filters.year;
    if (filters?.productId) where.approvedProductId = filters.productId;

    const runs = await this.prisma.seed_production_runs.findMany({
      where,
      include: { approvedProduct: true, producer: true },
    });

    const byProductYear = new Map<
      string,
      {
        productId: string;
        product: string;
        variety: string | null;
        seedCropYear: number;
        labeled: number;
        produced: number;
        voided: number;
        atProducer: number;
        shipped: number;
        inSupplierStock: number;
        sold: number;
        assignedAdmin: number;
        planted: number;
        recalled: number;
      }
    >();

    for (const run of runs) {
      const key = `${run.approvedProductId}:${run.seedCropYear}`;
      if (!byProductYear.has(key)) {
        byProductYear.set(key, {
          productId: run.approvedProductId,
          product: run.approvedProduct.name,
          variety: run.approvedProduct.variety,
          seedCropYear: run.seedCropYear,
          labeled: 0,
          produced: 0,
          voided: 0,
          atProducer: 0,
          shipped: 0,
          inSupplierStock: 0,
          sold: 0,
          assignedAdmin: 0,
          planted: 0,
          recalled: 0,
        });
      }
      const row = byProductYear.get(key)!;
      const funnel = await this.bagFunnelForRun(run.id, run);
      row.labeled += funnel.labeled;
      row.produced += funnel.produced;
      row.voided += funnel.voided;
      row.atProducer += funnel.atProducer;
      row.shipped += funnel.shipped;
      row.inSupplierStock += funnel.inSupplierStock;
      row.sold += funnel.sold;
      row.assignedAdmin += funnel.assignedAdmin;
      row.planted += funnel.planted;
      row.recalled += funnel.recalled;
    }

    const suppliers = await this.prisma.users.findMany({
      where: { roles: { has: UserRole.MATERIAL_SUPPLIER } },
      select: { id: true, partnerCode: true, firstName: true, lastName: true },
    });
    const supplierStats = await Promise.all(
      suppliers.map(async (s) => {
        const received = await this.prisma.seeds.count({
          where: { supplierUserId: s.id, productionRunId: { not: null } },
        });
        const inStock = await this.prisma.seeds.count({
          where: { supplierUserId: s.id, status: 'IN_SUPPLIER_STOCK' },
        });
        const sold = await this.prisma.seeds.count({
          where: { supplierUserId: s.id, status: { in: ['SOLD', 'ASSIGNED', 'PLANTED', 'PARTIALLY_USED'] } },
        });
        return {
          supplierUserId: s.id,
          partnerCode: s.partnerCode,
          name: [s.firstName, s.lastName].filter(Boolean).join(' '),
          received,
          inStock,
          sold,
        };
      }),
    );

    const plantedParcels = await this.plantedParcelsReport();

    return {
      byProductYear: [...byProductYear.values()],
      suppliers: supplierStats,
      plantedParcels,
    };
  }

  private async plantedParcelsReport() {
    const bags = await this.prisma.seeds.findMany({
      where: { plantedParcelId: { not: null }, productionRunId: { not: null } },
      include: { productionRun: { select: { lotNumber: true } } },
    });
    const parcelIds = [...new Set(bags.map((b) => b.plantedParcelId).filter(Boolean))] as string[];
    const parcelRows = parcelIds.length
      ? await this.prisma.parcels.findMany({
          where: { id: { in: parcelIds } },
          include: { estates: { include: { users: { select: { partnerCode: true } } } } },
        })
      : [];
    const parcelById = new Map(parcelRows.map((p) => [p.id, p]));

    const byParcel = new Map<
      string,
      {
        parcelId: string;
        growerPartnerCode: string | null;
        areaHa: number | null;
        bags: number;
        lots: Map<string, number>;
        plantedAt: string | null;
      }
    >();
    for (const b of bags) {
      const pid = b.plantedParcelId!;
      const parcel = parcelById.get(pid);
      const lot = b.productionRun?.lotNumber ?? '—';
      const plantedAt = b.plantedAt?.toISOString().slice(0, 10) ?? null;
      const existing = byParcel.get(pid);
      if (existing) {
        existing.bags += 1;
        existing.lots.set(lot, (existing.lots.get(lot) ?? 0) + 1);
        if (plantedAt && (!existing.plantedAt || plantedAt < existing.plantedAt)) existing.plantedAt = plantedAt;
      } else {
        const lots = new Map<string, number>();
        lots.set(lot, 1);
        byParcel.set(pid, {
          parcelId: pid,
          growerPartnerCode: parcel?.estates?.users?.partnerCode ?? null,
          areaHa: parcel?.calculatedArea ? parcel.calculatedArea / 10000 : null,
          bags: 1,
          lots,
          plantedAt,
        });
      }
    }
    return [...byParcel.values()].map((row) => ({
      parcelId: row.parcelId,
      growerPartnerCode: row.growerPartnerCode,
      areaHa: row.areaHa,
      bags: row.bags,
      lots: [...row.lots.entries()]
        .map(([lot, count]) => ({ lot, bags: count }))
        .sort((a, b) => a.lot.localeCompare(b.lot)),
      plantedAt: row.plantedAt,
    }));
  }

  async streamBagsCsv(filters?: { runId?: string; status?: SeedStatus; supplierUserId?: string }) {
    const where: Prisma.seedsWhereInput = { productionRunId: { not: null } };
    if (filters?.runId) where.productionRunId = filters.runId;
    if (filters?.status) where.status = filters.status;
    if (filters?.supplierUserId) where.supplierUserId = filters.supplierUserId;

    const bags = await this.prisma.seeds.findMany({
      where,
      include: {
        productionRun: { include: { approvedProduct: true } },
        custody: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { serialNumber: 'asc' },
    });

    const userIds = [
      ...new Set(
        bags.flatMap((b) => [b.supplierUserId, b.soldToGrowerId, b.assignedToUserId].filter(Boolean)),
      ),
    ] as string[];
    const users = userIds.length
      ? await this.prisma.users.findMany({
          where: { id: { in: userIds } },
          select: { id: true, partnerCode: true, firstName: true, lastName: true },
        })
      : [];
    const userById = new Map(users.map((u) => [u.id, u]));

    const header =
      'serial,lot,product,seed_year,status,supplier_partner,grower_partner,parcel_id,sold_at,planted_at,last_event';
    const rows = bags.map((b) => {
      const supplier = b.supplierUserId ? userById.get(b.supplierUserId) : undefined;
      const grower = b.soldToGrowerId
        ? userById.get(b.soldToGrowerId)
        : b.assignedToUserId
          ? userById.get(b.assignedToUserId)
          : undefined;
      const cols = [
        b.serialNumber,
        b.productionRun?.lotNumber ?? '',
        b.productionRun?.approvedProduct?.name ?? '',
        b.productionRun?.seedCropYear ?? '',
        b.status,
        supplier?.partnerCode ?? '',
        grower?.partnerCode ?? '',
        b.plantedParcelId ?? '',
        b.soldAt?.toISOString() ?? '',
        b.plantedAt?.toISOString() ?? '',
        b.custody[0]?.event ?? '',
      ];
      return cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',');
    });
    return [header, ...rows].join('\n');
  }

  async getRecallImpact(runId: string) {
    const preview = await this.getRecallPreview(runId);
    const growersWithPhone = preview.growers.length
      ? await this.prisma.users.findMany({
          where: { id: { in: preview.growers.map((g) => g.id) } },
          select: { id: true, firstName: true, lastName: true, partnerCode: true, phone: true },
        })
      : [];
    return { ...preview, growers: growersWithPhone };
  }
}
