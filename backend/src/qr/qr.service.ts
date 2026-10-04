import { parseFieldOperation } from '../../../shared/passport/field-operation';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as QRCode from 'qrcode';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { QualityControlLevelsService } from '../quality-control-levels/quality-control-levels.service';
import { PassportDocumentsService } from '../passport-documents/passport-documents.service';
import { formatOptimalRoute } from '../common/format-route';
import { historyDate, sortProductionHistory, ProductionEvent, HistoryDate } from '../../../shared/passport/production-history';
import { parseWeatherObservation } from '../../../shared/passport/weather-observation';
import { historyFactLabel } from '../../../shared/passport/history-labels';
import * as englishGlossary from '../../../shared/i18n/glossary/en.json';
import { readOriginCandidate } from '../../../shared/passport/origin-candidate';
import {
  buildFreshnessEstimate,
  buildLotPackagingFormats,
  buildPassportSummary,
  buildPassportWarnings,
  buildPlatformStandard,
  coldChainPresentation,
  isLinkedFieldEntry,
  isLinkedGrowthLog,
  isLinkedSeed,
  readingsWithinRange,
  resolvePlantingChain,
} from './passport-lot-scope';

@Injectable()
export class QrService {
  constructor(
    private prisma: PrismaService,
    private qualityControlLevelsService: QualityControlLevelsService,
    private passportDocumentsService: PassportDocumentsService,
  ) {}

  /**
   * Generate QR code for a batch
   * Returns QR code data URL and public certificate URL
   */
  async generateBatchQR(batchId: string): Promise<{
    qrCodeDataUrl: string;
    certificateUrl: string;
    qrId: string;
  }> {
    const batch = await this.prisma.batches.findUnique({
      where: { id: batchId },
      include: {
        estates: {
          include: {
            users: true,
          },
        },
        freshness_trackers: true,
        missions: true,
        temperature_logs: true,
      },
    });

    if (!batch) {
      throw new Error(`Batch with ID ${batchId} not found`);
    }

    // Generate unique QR ID (using batch ID as base)
    const qrId = `BIO-VERA-${batch.batchId}`;

    // Public verification URL (consumer-facing portal)
    const certificateUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/verify/${batch.batchId}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(certificateUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
    });

    // Store QR ID in batch (if we add a qrId field to Batch model)
    // For now, we'll use the batchId as the QR identifier

    return {
      qrCodeDataUrl,
      certificateUrl,
      qrId,
    };
  }

  /**
   * Get certificate data by QR ID
   */
  async getCertificateData(qrId: string, opts?: { packageBadgeSerial?: string }) {
    // QR ID format: BIO-VERA-BATCH-2026-001 (public batch code) or BIO-VERA-<cuid> (internal id)
    const key = String(qrId).replace(/^BIO-VERA-/, '').trim();
    if (!key) {
      throw new NotFoundException('Invalid QR or batch id');
    }

    // Human-readable batchId (BATCH-…) or Prisma cuid
    const batch = await this.prisma.batches.findFirst({
      where: { OR: [{ batchId: key }, { id: key }] },
      include: {
        estates: {
          include: {
            users: true,
          },
        },
        parcels: true,
        package_badges: { where: { lifecycle: 'ACTIVE' }, orderBy: { createdAt: 'asc' }, take: 20 },
        compliance_photos: {
          orderBy: { uploadedAt: 'desc' },
        },
        users_batches_harvestedByUserIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        freshness_trackers: true,
        temperature_logs: {
          orderBy: {
            timestamp: 'asc',
          },
        },
        quality_entries: true,
        missions: {
          include: {
            logistics_handovers: true,
            users_missions_logisticsPartnerIdTousers: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            vehicles: true,
            border_wait_times: true,
            location_logs: {
              orderBy: {
                timestamp: 'asc',
              },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(
        `No batch found for "${key}". Check the code on the label (e.g. BATCH-2026-…); links must match production data.`,
      );
    }

    const harvestRow = batch.harvestAnnouncementId
      ? await this.prisma.harvest_announcements.findUnique({
          where: { id: batch.harvestAnnouncementId },
          select: {
            id: true,
            sourcePlantingId: true,
            status: true,
            announcementType: true,
            cropType: true,
            estimatedDate: true,
            actualDate: true,
            actualQuantity: true,
            estimatedQuantity: true,
            notes: true,
            sortingSpec: true,
          },
        })
      : null;

    const chain = resolvePlantingChain(batch.harvestAnnouncementId, harvestRow);

    const plantingRow =
      chain.plantingId != null
        ? await this.prisma.harvest_announcements.findUnique({
            where: { id: chain.plantingId },
            select: {
              id: true,
              cropType: true,
              estimatedDate: true,
              actualDate: true,
              status: true,
              announcementType: true,
              notes: true,
            },
          })
        : null;

    const [scopedGrowthLogs, scopedFieldEntries, complianceMaterialLogs, linkedSeeds, packedOrders, catalogProduct, bioStandard] =
      await Promise.all([
        chain.announcementIds.length
          ? this.prisma.growth_logs.findMany({
              where: {
                harvestAnnouncementId: { in: chain.announcementIds },
                moderationStatus: { not: 'REJECTED' },
              },
              orderBy: { networkTimestamp: 'asc' },
            })
          : Promise.resolve([]),
        chain.announcementIds.length
          ? this.prisma.field_entries.findMany({
              where: { plantingId: { in: chain.announcementIds } },
              orderBy: { occurredAt: 'asc' },
            })
          : Promise.resolve([]),
        this.prisma.compliance_logs.findMany({
          where: { relatedBatchId: batch.id },
          orderBy: { networkTimestamp: 'asc' },
        }),
        chain.announcementIds.length
          ? this.prisma.seeds.findMany({
              where: { plantingId: { in: chain.announcementIds } },
              include: {
                productionRun: { include: { approvedProduct: true, producer: true } },
              },
              orderBy: { plantedAt: 'asc' },
            })
          : Promise.resolve([]),
        this.prisma.orders.findMany({
          where: { packedBatchId: batch.id },
          select: {
            packLabel: true,
            packSizeKg: true,
            packedPackCount: true,
            packedKg: true,
            packedAt: true,
            packagingType: true,
            declaredShelfLifeHours: true,
            declaredExpiresAt: true,
            packedByUserId: true,
          },
          orderBy: { packedAt: 'asc' },
        }),
        batch.catalogProductId
          ? this.prisma.catalog_products.findUnique({
              where: { id: batch.catalogProductId },
              select: {
                id: true,
                name: true,
                variety: true,
                description: true,
                storageConditions: true,
                imageUrl: true,
                category: true,
                sourcePlantingId: true,
              },
            })
          : chain.plantingId
            ? this.prisma.catalog_products.findFirst({
                where: { sourcePlantingId: chain.plantingId, status: { not: 'ARCHIVED' } },
                select: {
                  id: true,
                  name: true,
                  variety: true,
                  description: true,
                  storageConditions: true,
                  imageUrl: true,
                  category: true,
                  sourcePlantingId: true,
                },
                orderBy: { updatedAt: 'desc' },
              })
            : Promise.resolve(null),
        this.prisma.bio_vera_standards.findFirst({
          where: { isActive: true },
          orderBy: { updatedAt: 'desc' },
        }),
      ]);

    // Calculate timeline
    const timeline = {
      harvested: batch.harvestDate,
      verified: null as Date | null,
      loaded: null as Date | null,
      arrived: null as Date | null,
    };

    // Find verification time (coordinator action)
    const verificationAudit = await this.prisma.audit_trails.findFirst({
      where: {
        entityType: 'Batch',
        entityId: batch.id,
        eventType: 'QUALITY_CHECK',
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    if (verificationAudit) {
      timeline.verified = verificationAudit.timestamp;
    }

    const originCandidateAudit = await this.prisma.audit_trails.findFirst({
      where: { entityType: 'PassportOriginCandidate', entityId: batch.id, batchId: batch.id,
        eventType: 'STATUS_CHANGE' },
      orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
    });
    const originCandidate = originCandidateAudit
      ? readOriginCandidate(originCandidateAudit.newValue, originCandidateAudit.timestamp) : null;

    // Find loaded time (mission picked up)
    const mission = batch.missions?.[0];
    if (mission?.pickedUpAt) {
      timeline.loaded = mission.pickedUpAt;
    }

    // Find arrived time (mission delivered)
    if (mission?.completedAt) {
      timeline.arrived = mission.completedAt;
    }

    // Calculate total distance traveled
    let totalDistance = 0;
    if (mission?.location_logs && mission.location_logs.length > 1) {
      for (let i = 1; i < mission.location_logs.length; i++) {
        const prev = mission.location_logs[i - 1];
        const curr = mission.location_logs[i];
        const distance = this.calculateDistance(
          prev.latitude,
          prev.longitude,
          curr.latitude,
          curr.longitude,
        );
        totalDistance += distance;
      }
    }

    // Calculate sustainability score (lower distance = better score)
    const sustainabilityScore = Math.max(0, Math.min(100, 100 - (totalDistance / 10)));

    const missionById = new Map((batch.missions ?? []).map((m) => [m.id, m]));
    const temperatureReadingsDetailed = batch.temperature_logs.map((log) => {
      const phase: 'farm' | 'transport' =
        log.missionId != null && missionById.has(log.missionId) ? 'transport' : 'farm';
      const mission = log.missionId ? missionById.get(log.missionId) : undefined;
      let locationLabel = '—';
      try {
        if (typeof log.location === 'string') locationLabel = log.location;
        else if (log.location != null) locationLabel = JSON.stringify(log.location);
      } catch {
        locationLabel = '—';
      }
      return {
        timestamp: log.timestamp,
        temperature: log.temperature,
        humidity: log.humidity ?? null,
        location: locationLabel,
        phase,
        missionNumber: mission?.missionNumber ?? null,
      };
    });
    const numericsOk = temperatureReadingsDetailed.every((d) => Number.isFinite(d.temperature));
    const temps = temperatureReadingsDetailed.map((d) => d.temperature).filter(Number.isFinite);
    const farmTemps = temperatureReadingsDetailed
      .filter((d) => d.phase === 'farm')
      .map((d) => d.temperature)
      .filter(Number.isFinite);
    const transportTemps = temperatureReadingsDetailed
      .filter((d) => d.phase === 'transport')
      .map((d) => d.temperature)
      .filter(Number.isFinite);

    // Check if batch is compromised
    const isCompromised = await this.checkBatchCompromised(batch.id);

    const regionName = this.extractRegionFromAddress(batch.estates.name);
    const country = batch.estates.users.productionCountry ?? null;
    const regionLabel = [regionName, country].filter(Boolean).join(' · ');

    const platformStandard =
      bioStandard != null
        ? buildPlatformStandard(bioStandard.requiredTemperatureMin, bioStandard.requiredTemperatureMax)
        : null;
    const withinCriteria =
      platformStandard != null && numericsOk
        ? readingsWithinRange(temps, platformStandard.minC, platformStandard.maxC)
        : null;
    const coldChainMeta = coldChainPresentation(temps.length, withinCriteria, platformStandard);

    const growthLogsLinked = scopedGrowthLogs.filter((g) => isLinkedGrowthLog(g, chain));
    const fieldWorkEntries = scopedFieldEntries.filter((e) => isLinkedFieldEntry(e, chain));
    const seedsLinked = linkedSeeds.filter((s) => isLinkedSeed(s, chain));

    const seedVariety =
      seedsLinked.find((s) => s.productionRun?.approvedProduct?.variety)?.productionRun?.approvedProduct
        ?.variety ?? null;
    const frozen = batch.passportProductSnapshot && typeof batch.passportProductSnapshot === 'object'
      && !Array.isArray(batch.passportProductSnapshot)
      ? batch.passportProductSnapshot as Record<string, unknown> : null;
    const productValue = (key: 'name' | 'variety' | 'description' | 'storageConditions' | 'imageUrl') => {
      const value = frozen ? frozen[key] : catalogProduct?.[key];
      return typeof value === 'string' ? value.trim() || null : null;
    };
    const catalogVariety = productValue('variety');
    const variety = catalogVariety ?? seedVariety;
    const varietyLinkage = catalogVariety
      ? ('confirmed' as const)
      : seedVariety
        ? ('confirmed' as const)
        : ('notRecorded' as const);
    const productDescription = productValue('description');
    const storageConditions = productValue('storageConditions');
    const storageLinkage = storageConditions ? ('confirmed' as const) : ('notRecorded' as const);

    const productPhotoUrl =
      productValue('imageUrl') ??
      batch.compliance_photos?.find((p) => p.photoType === 'PRODUCT')?.photoUrl ??
      batch.compliance_photos?.[0]?.photoUrl ??
      growthLogsLinked.filter((g) => g.imageUrl).slice(-1)[0]?.imageUrl ??
      null;
    const photoLinkage = productPhotoUrl
      ? catalogProduct?.imageUrl
        ? ('confirmed' as const)
        : ('confirmed' as const)
      : ('notRecorded' as const);

    const lotPackagingFormats = buildLotPackagingFormats(packedOrders);

    let identifiedPackaging: { badgeSerial: string; badgeType: string; linkage: 'confirmed' } | null =
      null;
    const badgeSerial = opts?.packageBadgeSerial?.trim();
    if (badgeSerial) {
      const badge = await this.prisma.package_badges.findUnique({
        where: { serial: badgeSerial },
        select: { serial: true, type: true, batchId: true, lifecycle: true },
      });
      if (badge?.batchId === batch.id && badge.lifecycle === 'ACTIVE') {
        identifiedPackaging = {
          badgeSerial: badge.serial,
          badgeType: badge.type,
          linkage: 'confirmed',
        };
      }
    }

    const freshnessEstimate = buildFreshnessEstimate(
      batch.freshness_trackers
        ? {
            remainingShelfLifeHours: batch.freshness_trackers.remainingShelfLifeHours,
            expiresAt: batch.freshness_trackers.expiresAt,
            shelfLifeHours: batch.freshness_trackers.shelfLifeHours,
          }
        : null,
    );

    const seedOriginRows = this.buildSeedOriginFromLinked(seedsLinked);
    const seedRecalled = seedOriginRows.some((s) => s.recalled);

    const summary = buildPassportSummary({
      productName: productValue('name') || batch.productName,
      variety,
      varietyLinkage,
      productPhotoUrl,
      photoLinkage,
      producerName: batch.estates.name,
      regionLabel: regionLabel || regionName,
      productionCountry: country,
      actualHarvestDate: batch.harvestDate,
      harvestDateLinkage: batch.harvestDate ? 'confirmed' : 'notRecorded',
      lotBatchId: batch.batchId,
      lotQuantity: batch.quantity,
      lotUnit: batch.unit,
      identifiedPackaging,
      platformStandard,
      productStorageConditions: storageConditions,
      productStorageLinkage: storageLinkage,
      // A badge identifies the lot/package, not its order. Keep declarations on
      // packingRecords until a physical package has an explicit order association.
      declaredShelfLifeHours: null,
      declaredExpiresAt: null,
      freshnessEstimate,
    });

    const publicDocs = catalogProduct?.id
      ? await this.passportDocumentsService.listPublicForCatalogProduct(catalogProduct.id)
      : [];
    const lotPublicDocs = await this.passportDocumentsService.listPublicForBatch(batch.id);
    const passportDocuments = [...publicDocs, ...lotPublicDocs]
      .filter((d, i, arr) => arr.findIndex((x) => x.id === d.id) === i)
      .map((d) => ({
        id: d.id,
        title: d.title,
        docType: d.docType,
        scope: d.scope,
        issuer: d.issuer,
        issuedAt: d.issuedAt,
        expiresAt: d.expiresAt,
        verificationStatus: d.verificationStatus,
        url: this.passportDocumentsService.documentPublicUrl(d.fileDocumentId),
      }));

    const warnings = buildPassportWarnings({ isCompromised, seedRecalled });

    const fieldTreatments = fieldWorkEntries
      .filter((e) => /^(PRSKANJE|PRIHRANA|SPRAYING|SPRAY|TREATMENT|FERTILIZING|FERTILIZER|PESTICIDE)/i.test(e.type))
      .map((e) => ({
        appliedAt: e.occurredAt,
        productName: e.materialName ?? e.type,
        dosage:
          e.materialQuantity != null && e.materialUnit
            ? `${e.materialQuantity} ${e.materialUnit}`
            : '—',
        waterVolume: (() => { try { return parseFieldOperation((e.data as Record<string, unknown> | null)?.operation).waterLitres ?? null; } catch { return null; } })(),
        reason: e.notes ?? null,
        deviceTimestamp: e.occurredAt,
        gpsLatitude: e.lat ?? undefined,
        gpsLongitude: e.lng ?? undefined,
        gpsAccuracyM: ((e.data as Record<string, unknown> | null)?.location as { accuracy?: number } | undefined)?.accuracy ?? null,
        needsAudit: e.createdAt.getTime() - e.occurredAt.getTime() > 24 * 60 * 60 * 1000,
        linkage: 'confirmed' as const,
        source: 'field_entry' as const,
      }));

    const harvestAnnouncementsOut: Array<{
      id: string;
      kind: 'planting' | 'harvest';
      estimatedDate: Date;
      actualDate: Date | null;
      cropType: string;
      estimatedQuantity: number | null;
      actualQuantity: number | null;
      status: string;
      notes: string | null;
      linkage: 'confirmed';
    }> = [];
    if (plantingRow && plantingRow.status !== 'CANCELLED' && plantingRow.status !== 'REJECTED') {
      harvestAnnouncementsOut.push({
        id: plantingRow.id,
        kind: 'planting',
        estimatedDate: plantingRow.estimatedDate,
        actualDate: plantingRow.actualDate ?? null,
        cropType: plantingRow.cropType,
        estimatedQuantity: null,
        actualQuantity: null,
        status: plantingRow.status,
        notes: plantingRow.notes ?? null,
        linkage: 'confirmed',
      });
    }
    if (harvestRow && harvestRow.status !== 'CANCELLED' && harvestRow.status !== 'REJECTED') {
      harvestAnnouncementsOut.push({
        id: harvestRow.id,
        kind: 'harvest',
        estimatedDate: harvestRow.estimatedDate,
        actualDate: harvestRow.actualDate ?? null,
        cropType: harvestRow.cropType,
        estimatedQuantity: harvestRow.estimatedQuantity ?? null,
        actualQuantity: harvestRow.actualQuantity ?? null,
        status: harvestRow.status,
        notes: harvestRow.notes ?? null,
        linkage: 'confirmed',
      });
    }

    const primarySeed = seedsLinked[0] ?? null;

    const productionHistory: ProductionEvent[] = [];
    const event = (id: string, kind: string, date: HistoryDate, source: string,
      facts: Record<string, unknown>, recordedAt?: HistoryDate, photos?: string[]) => {
      const row: ProductionEvent = { id, kind, date: historyDate(date), source,
        recordedAt: historyDate(recordedAt), photos,
        facts: Object.entries(facts).filter(([, v]) => v !== null && v !== undefined && v !== '')
          .map(([label, value]) => ({ label, value: String(value) })) };
      productionHistory.push(row);
      return row;
    };
    for (const seed of seedsLinked) {
      const run = seed.productionRun;
      event(`seed-${seed.id}`, 'seed', run?.productionDate, 'seed', {
        product: run?.approvedProduct?.name ?? seed.name, variety: run?.approvedProduct?.variety,
        serial: seed.serialNumber, lot: run?.lotNumber ?? seed.batchNumber,
        producer: run?.producer?.name, country: run?.producer?.country,
        cropYear: run?.seedCropYear, germination: run?.germinationPct, purity: run?.purityPct,
      }, seed.createdAt);
      if (seed.plantedAt) event(`seed-planted-${seed.id}`, 'planting', seed.plantedAt, 'seed', { serial: seed.serialNumber });
    }
    for (const plan of harvestAnnouncementsOut.filter(p => p.kind === 'planting')) {
      event(`planting-${plan.id}`, plan.actualDate ? 'planting' : 'plantingPlan',
        plan.actualDate ?? plan.estimatedDate, 'planting', { product: plan.cropType, notes: plan.notes });
    }
    for (const e of fieldWorkEntries) {
      const treatment = /^(PRSKANJE|PRIHRANA|SPRAY|TREATMENT|FERTILIZ|PESTICIDE)/i.test(e.type);
      const row = event(`field-${e.id}`, e.type === 'WEATHER' ? 'weather' : e.type === 'IRRIGATION' ? 'irrigation' : e.type === 'INSPECTION' ? 'inspection' : treatment ? 'treatment' : 'fieldWork',
        e.occurredAt, 'fieldDiary', { activity: e.type, material: e.materialName, materialBarcode: e.fertilizerBarcode,
          quantity: e.materialQuantity != null ? `${e.materialQuantity} ${e.materialUnit ?? ''}`.trim() : null,
          area: e.areaHa, notes: e.notes }, e.createdAt, e.photos);
      try {
        const operation = parseFieldOperation((e.data as Record<string, unknown> | null)?.operation);
        row.endDate = operation.endedAt ?? null;
        if (operation.waterLitres != null) row.facts.push({ label: 'waterLitres', value: `${operation.waterLitres} L` });
        if (operation.method) row.facts.push({ label: 'method', value: operation.method });
      } catch { /* Legacy entries remain visible with only their recorded fields. */ }
      if (e.type === 'WEATHER') {
        try {
          const weather = parseWeatherObservation((e.data as Record<string, unknown> | null)?.weather);
          row.date = weather.from; row.endDate = weather.until;
          row.facts.push({ label: 'temperature', value: `${weather.minimumC} – ${weather.maximumC} °C` },
            { label: 'frost', value: weather.frostObserved === null ? 'unknown' : weather.frostObserved ? 'yes' : 'no' });
        } catch { /* Keep the diary note without fabricating missing measurements. */ }
      }
    }
    for (const g of growthLogsLinked) event(`growth-${g.id}`, 'growth', g.deviceTimestamp ?? g.networkTimestamp,
      'growthDiary', { stage: g.growthStage, notes: g.notes, material: g.materialBarcode }, g.networkTimestamp,
      g.imageUrl ? [g.imageUrl] : []);
    event(`harvest-${batch.id}`, 'harvest', batch.harvestDate, 'lot', {
      product: batch.productName, quantity: `${batch.quantity} ${batch.unit}`,
    }, batch.createdAt);
    packedOrders.forEach((p, i) => event(`packing-${i}`, 'packing', p.packedAt, 'packing', {
      packaging: p.packagingType ?? p.packLabel, netMass: p.packSizeKg != null ? `${p.packSizeKg} kg` : null,
      count: p.packedPackCount, quantity: p.packedKg != null ? `${p.packedKg} kg` : null,
      declaredHours: p.declaredShelfLifeHours,
    }));
    if (verificationAudit) event(`quality-${verificationAudit.id}`, 'quality', verificationAudit.timestamp, 'quality', {});
    temperatureReadingsDetailed.forEach((r, i) => event(`temperature-${i}`,
      r.phase === 'transport' ? 'temperatureTransport' : 'temperatureFarm', r.timestamp, 'temperatureLog',
      { temperature: `${r.temperature} °C`, humidity: r.humidity != null ? `${r.humidity}%` : null, mission: r.missionNumber }));
    for (const m of batch.missions ?? []) {
      if (m.pickedUpAt) event(`pickup-${m.id}`, 'pickup', m.pickedUpAt, 'transport', { mission: m.missionNumber });
      if (m.completedAt) event(`delivery-${m.id}`, 'delivery', m.completedAt, 'transport', { mission: m.missionNumber });
    }
    const historyGaps = ['seed', 'planting', 'weather', 'packing'].filter(kind => !productionHistory.some(e => e.kind === kind));
    if (!temperatureReadingsDetailed.length) historyGaps.push('temperature');

    return {
      qrId,
      productionHistory: sortProductionHistory(productionHistory),
      historyGaps,
      originCandidate,
      summary: {
        ...summary,
        productDescription,
        actualPackDate: batch.actualPackDate ?? null,
      },
      warnings,
      lotPackagingFormats,
      passportDocuments,
      packingRecords: packedOrders.map((o) => ({
        packLabel: o.packLabel,
        packSizeKg: o.packSizeKg,
        packedPackCount: o.packedPackCount,
        packedKg: o.packedKg,
        packedAt: o.packedAt,
        packagingType: o.packagingType,
        declaredShelfLifeHours: o.declaredShelfLifeHours,
        declaredExpiresAt: o.declaredExpiresAt,
      })),
      linkage: {
        plantingChain: chain,
        hasConfirmedPlanting: Boolean(chain.plantingId),
        hasConfirmedHarvest: Boolean(chain.harvestId),
      },
      batch: {
        id: batch.id,
        batchId: batch.batchId,
        estateId: batch.estateId,
        productName: batch.productName,
        quantity: batch.quantity,
        unit: batch.unit,
        harvestDate: batch.harvestDate,
        status: batch.status,
        isCompromised,
      },
      origin: {
        farmName: batch.estates.name,
        /** Human-readable “where in the world” for the passport (region + country). */
        regionLabel: regionLabel || regionName,
        productionCountry: country,
        // Where harvested: region + farm (for passport headline; no producer name)
        harvestLocation: `${batch.estates.name}${regionName ? `, ${regionName}` : ''}`,
        harvestRegion: regionName,
        // When harvested: date and period (e.g. "June 2026")
        harvestDate: batch.harvestDate,
        harvestPeriod: batch.harvestDate ? this.formatHarvestPeriod(batch.harvestDate) : null,
        ownerName: batch.estates.users.firstName,
        ownerLastName: undefined,
        location: regionName,
        /** Field (estate) and plot (parcel) size in ha + map centroids (traceability). */
        estateCalculatedAreaHa: batch.estates.calculatedArea,
        parcelCalculatedAreaHa: batch.parcels?.calculatedArea ?? null,
        estateMapCenter: this.polygonCentroid(batch.estates.polygonCoordinates as unknown),
        parcelMapCenter: this.polygonCentroid(batch.parcels?.polygonCoordinates as unknown),
        gpsLocation: undefined,
        address: undefined,
      },
      timeline,
      coldChainProof:
        temps.length > 0
          ? {
              ...coldChainMeta,
              temperatureData: temperatureReadingsDetailed,
              minTemp: Math.min(...temps),
              maxTemp: Math.max(...temps),
              avgTemp: temps.reduce((sum, x) => sum + x, 0) / temps.length,
              isWithinRange: coldChainMeta.readingsWithinCriteria,
              continuousControlConfirmed: coldChainMeta.continuousControlConfirmed,
              evaluationCriteria: coldChainMeta.evaluationCriteria,
              farmColdChain:
                farmTemps.length > 0
                  ? {
                      minTemp: Math.min(...farmTemps),
                      maxTemp: Math.max(...farmTemps),
                      avgTemp: farmTemps.reduce((sum, x) => sum + x, 0) / farmTemps.length,
                      readingsCount: farmTemps.length,
                    }
                  : null,
              transportColdChain:
                transportTemps.length > 0
                  ? {
                      minTemp: Math.min(...transportTemps),
                      maxTemp: Math.max(...transportTemps),
                      avgTemp:
                        transportTemps.reduce((sum, x) => sum + x, 0) / transportTemps.length,
                      readingsCount: transportTemps.length,
                    }
                  : null,
            }
          : {
              ...coldChainMeta,
              temperatureData: [],
              minTemp: null,
              maxTemp: null,
              avgTemp: null,
              isWithinRange: null,
              continuousControlConfirmed: coldChainMeta.continuousControlConfirmed,
              evaluationCriteria: coldChainMeta.evaluationCriteria,
              farmColdChain: null,
              transportColdChain: null,
            },
      sustainability: (() => {
        const { route, routeDetail } = formatOptimalRoute(
          mission?.optimalRoute,
          mission?.pickupAddress ?? batch.estates?.name ?? null,
        );
        return {
          totalDistanceKm: totalDistance.toFixed(2),
          sustainabilityScore: sustainabilityScore.toFixed(1),
          route,
          routeDetail,
        };
      })(),
      freshness: freshnessEstimate
        ? {
            estimate: freshnessEstimate,
            timestampHarvested: batch.freshness_trackers?.timestampHarvested ?? null,
            isExpired: batch.freshness_trackers?.isExpired ?? false,
          }
        : null,
      missions: (batch.missions ?? []).map((m) => ({
        id: m.id,
        missionNumber: m.missionNumber,
        status: m.status,
        pickupAddress: m.pickupAddress,
        pickupLocation: m.pickupLocation,
        estimatedPickupTime: m.estimatedPickupTime,
        assignedAt: m.assignedAt,
        acceptedAt: m.acceptedAt,
        logisticsPartner: m.users_missions_logisticsPartnerIdTousers
          ? {
              name: `${m.users_missions_logisticsPartnerIdTousers.firstName} ${m.users_missions_logisticsPartnerIdTousers.lastName}`.trim(),
            }
          : null,
        vehicle: m.vehicles
          ? {
              id: m.vehicles.id,
              vehicleNumber: m.vehicles.vehicleNumber,
              licensePlate: m.vehicles.licensePlate,
              type: m.vehicles.type,
              make: m.vehicles.make,
              model: m.vehicles.model,
            }
          : null,
        locationLogs: (m.location_logs ?? []).map((ll) => ({
          timestamp: ll.timestamp,
          latitude: ll.latitude,
          longitude: ll.longitude,
          accuracy: ll.accuracy,
          address: ll.address,
        })),
        borderWaits: (m.border_wait_times ?? []).map((b) => ({
          borderName: b.borderName,
          borderArrivalTime: b.borderArrivalTime,
          borderExitTime: b.borderExitTime,
          waitTimeMinutes: b.waitTimeMinutes,
        })),
        pickedUpAt: m.pickedUpAt,
        deliveredAt: m.completedAt,
        logisticsHandover: m.logistics_handovers
          ? {
              insideTruckTemperature: m.logistics_handovers.insideTruckTemperature,
              timestamp: m.logistics_handovers.timestamp,
              status: m.logistics_handovers.status,
              notes: m.logistics_handovers.notes ?? null,
            }
          : null,
      })),
      farmer: {
        // Privacy protection: Only first name
        name: batch.estates.users.firstName,
        lastName: undefined, // Never send to Buyer
        bio: batch.estates.users.farmerBio ?? null,
        photo: batch.estates.users.farmerPhoto || null,
        generation: batch.estates.users.generation || '3rd',
        yearsOfExperience: batch.estates.users.yearsOfExperience || null,
        farmerQrCode: batch.estates.users.farmerQrCode || null,
        farmerProfileUrl: batch.estates.users.farmerProfileUrl || null,
        phone: undefined, // Never send to Buyer
        email: undefined, // Never send to Buyer
      },
      // Product photos (compliance / packaging) for passport
      photos: (batch.compliance_photos || []).map((p) => ({
        url: p.photoUrl,
        type: p.photoType,
        verified: p.isVerified,
      })),
      // Protocol 360: Quality Control Levels
      protocol360: await this.getProtocol360Data(batch.id),
      parcelInfo: batch.parcels
        ? {
            cropType: plantingRow?.cropType ?? harvestRow?.cropType ?? batch.parcels.cropType ?? null,
            plantingDate: plantingRow?.actualDate ?? null,
            plannedPlantingDate: plantingRow?.estimatedDate ?? null,
            expectedHarvestDate: harvestRow?.estimatedDate ?? null,
            calculatedAreaHa: batch.parcels.calculatedArea,
            mapCenter: this.polygonCentroid(batch.parcels.polygonCoordinates as unknown),
            linkage: chain.plantingId ? ('confirmed' as const) : ('notRecorded' as const),
          }
        : null,
      fieldWork: fieldWorkEntries.map((e) => ({
        type: e.type,
        occurredAt: e.occurredAt,
        materialName: e.materialName ?? null,
        materialQuantity: e.materialQuantity ?? null,
        materialUnit: e.materialUnit ?? null,
        notes: e.notes ?? null,
        linkage: 'confirmed' as const,
      })),
      treatments: fieldTreatments,
      growthLogs: growthLogsLinked.map((g) => ({
        networkTimestamp: g.networkTimestamp,
        deviceTimestamp: g.deviceTimestamp,
        growthStage: g.growthStage ?? null,
        notes: g.notes ?? null,
        labTestDate: g.labTestDate ?? null,
        labResultUrl: g.labResultUrl ?? null,
        imageUrl: g.imageUrl ?? null,
        materialBarcode: g.materialBarcode ?? null,
        materialKind: g.materialKind ?? null,
        gpsLatitude: g.gpsLatitude,
        gpsLongitude: g.gpsLongitude,
        gpsAccuracyM: g.gpsAccuracy,
        linkage: 'confirmed' as const,
      })),
      harvestAnnouncements: harvestAnnouncementsOut,
      parcelSeed: primarySeed
        ? {
            serialNumber: primarySeed.serialNumber,
            name: primarySeed.name,
            batchNumber: primarySeed.batchNumber,
            seedType: primarySeed.type,
            linkage: 'confirmed' as const,
          }
        : { linkage: 'notRecorded' as const },
      packageBadges: (batch.package_badges ?? []).map((b) => ({
        serial: b.serial,
        type: b.type,
        linkage: 'confirmed' as const,
      })),
      seedOrigin: seedOriginRows,
      /** Barcode / packaging scans confirmed for this lot only. */
      materialScans: complianceMaterialLogs.map((m) => ({
        entryType: m.entryType,
        scannedBarcode: m.scannedBarcode,
        barcodeType: m.barcodeType,
        isCompliant: m.isCompliant,
        complianceStatus: m.complianceStatus,
        networkTimestamp: m.networkTimestamp,
        deviceTimestamp: m.deviceTimestamp,
        relatedBatchId: m.relatedBatchId,
        blockedReason: m.blockedReason ?? null,
        linkage: 'confirmed' as const,
      })),
      qualityEntry: batch.quality_entries
        ? {
            preCoolingStartTime: batch.quality_entries.preCoolingStartTime,
            weatherAtHarvest: batch.quality_entries.weatherAtHarvest,
            weatherAtHarvestSummary: this.summarizeHarvestWeather(
              batch.quality_entries.weatherAtHarvest,
            ),
            notes: batch.quality_entries.notes ?? null,
            status: batch.quality_entries.status,
          }
        : null,
    };
  }

  /** Bio Vera seed bags linked to the lot planting chain (public-safe fields only). */
  private buildSeedOriginFromLinked(
    seedsLinked: Array<{
      productionRunId: string | null;
      plantedAt: Date | null;
      status: string;
      productionRun?: {
        status: string;
        lotNumber: string;
        seedCropYear: number;
        productionDate: Date | null;
        germinationPct: number | null;
        purityPct: number | null;
        certificateUrls: string[];
        approvedProduct: { name: string; variety: string | null };
        producer: { name: string; city: string | null; country: string };
      } | null;
    }>,
  ) {
    const withRun = seedsLinked.filter((b) => b.productionRunId && b.productionRun);
    const byRun = new Map<string, typeof withRun>();
    for (const b of withRun) {
      if (!b.productionRunId) continue;
      const list = byRun.get(b.productionRunId) ?? [];
      list.push(b);
      byRun.set(b.productionRunId, list);
    }

    return [...byRun.values()].map((runBags) => {
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
        linkage: 'confirmed' as const,
      };
    });
  }

  /** Human-readable harvest-time weather for passports (JSON varies by client). */
  private summarizeHarvestWeather(weather: unknown): string | null {
    if (weather == null) return null;
    if (typeof weather === 'string') return weather.trim() || null;
    if (typeof weather === 'number') return `${weather} °C`;
    if (typeof weather === 'object' && !Array.isArray(weather)) {
      const o = weather as Record<string, unknown>;
      const parts: string[] = [];
      const tc = o.temperatureCelsius ?? o.temperature ?? o.airTempCelsius;
      if (typeof tc === 'number') parts.push(`${tc} °C`);
      if (typeof o.humidity === 'number') parts.push(`${o.humidity}% RH`);
      if (typeof o.conditions === 'string' && o.conditions.trim()) parts.push(o.conditions.trim());
      if (typeof o.sky === 'string' && o.sky.trim()) parts.push(o.sky.trim());
      if (typeof o.wind === 'string' && o.wind.trim()) parts.push(`Wind: ${o.wind.trim()}`);
      if (parts.length) return parts.join(' · ');
      try {
        return JSON.stringify(o);
      } catch {
        return null;
      }
    }
    try {
      return JSON.stringify(weather);
    } catch {
      return null;
    }
  }

  /**
   * Get Protocol 360 data for certificate
   */
  private async getProtocol360Data(batchId: string) {
    try {
      const protocol360 = await this.qualityControlLevelsService.getProtocol360Status(batchId);
      return {
        overallStatus: protocol360.overallStatus,
        levels: protocol360.levels.map(level => ({
          level: level.level,
          name: level.name,
          status: level.status,
          badgeText: level.badgeText,
        })),
        brandingSlogan: protocol360.brandingSlogan,
      };
    } catch (error) {
      // If Protocol 360 data is not available, return null
      return null;
    }
  }

  /**
   * Check if batch is compromised (temperature >10°C for >30 minutes)
   */
  private async checkBatchCompromised(batchId: string): Promise<boolean> {
    const compromisedBatches = await this.prisma.batches.findMany({
      where: {
        id: batchId,
        temperature_logs: {
          some: {
            temperature: {
              gt: 10,
            },
          },
        },
      },
      include: {
        temperature_logs: {
          where: {
            temperature: {
              gt: 10,
            },
          },
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });

    if (compromisedBatches.length === 0) {
      return false;
    }

    const batch = compromisedBatches[0];
    const highTempLogs = batch.temperature_logs;

    if (highTempLogs.length === 0) {
      return false;
    }

    // Check if there's a continuous period >30 minutes above 10°C
    let startTime: Date | null = null;
    for (const log of highTempLogs) {
      if (!startTime) {
        startTime = log.timestamp;
      } else {
        const duration = (log.timestamp.getTime() - startTime.getTime()) / (1000 * 60); // minutes
        if (duration > 30) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Format harvest date as period (e.g. "June 2026") for passport display
   */
  private formatHarvestPeriod(harvestDate: Date): string {
    const d = new Date(harvestDate);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  /**
   * Extract region from address (privacy protection)
   * Returns only region/city, not exact address
   */
  /** Approximate center of a polygon or point list (for passport “where on the map”). */
  private polygonCentroid(coords: unknown): { lat: number; lng: number } | null {
    if (coords == null) return null;
    const raw = coords as { lat?: number; lng?: number; coordinates?: unknown } | unknown[];
    const points = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as { coordinates?: unknown }).coordinates)
        ? ((raw as { coordinates: unknown[] }).coordinates as unknown[])
        : [];
    if (!Array.isArray(points) || points.length === 0) return null;
    let sumLat = 0;
    let sumLng = 0;
    let n = 0;
    for (const p of points) {
      const pt = p as { lat?: number; lng?: number };
      const lat = typeof pt?.lat === 'number' ? pt.lat : Array.isArray(p) ? (p as number[])[1] : undefined;
      const lng = typeof pt?.lng === 'number' ? pt.lng : Array.isArray(p) ? (p as number[])[0] : undefined;
      if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
        sumLat += lat;
        sumLng += lng;
        n++;
      }
    }
    return n > 0 ? { lat: sumLat / n, lng: sumLng / n } : null;
  }

  private extractRegionFromAddress(address?: string): string {
    if (!address) return 'Unknown Region';
    
    // Try to extract city/region from address
    // Common patterns: "City, Country", "City", "Region District"
    const cityMatch = address.match(/^([^,]+)/);
    if (cityMatch) {
      const city = cityMatch[1].trim();
      
      // If it already contains "Region" or "District", return as is
      if (city.toLowerCase().includes('region') || city.toLowerCase().includes('district')) {
        return city;
      }
      
      // Otherwise add "Region" suffix
      return `${city} Region`;
    }
    
    return 'Unknown Region';
  }

  /**
   * Calculate distance between two GPS points (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Generate QR code for testing (SEED or FERTILIZER)
   * Used for creating test QR codes for development
   */
  async generateTestQR(type: 'SEED' | 'FERTILIZER', value: string) {
    const qrData = `${type}:${value}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
    });

    return {
      qrCodeDataUrl,
      value,
      type,
      qrData, // For testing - what's encoded in QR
    };
  }

  /**
   * Generate detailed Product Passport PDF for a batch (for download from passport page)
   */
  async generatePassportPDF(
    batchId: string,
    opts?: { packageBadgeSerial?: string },
  ): Promise<Buffer> {
    const qrId = batchId.startsWith('BIO-VERA-') ? batchId : `BIO-VERA-${batchId}`;
    const data = await this.getCertificateData(qrId, opts) as any;

    const veraGreen = '#2D5A27';
    const darkGray = '#1F2937';
    const lightGray = '#6B7280';
    const bgGreen = '#F0F9F0';

    const formatDate = (d: Date | string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formatDateTime = (d: Date | string) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return new Promise((resolve, reject) => {
      try {
        const doc = new (PDFDocument as any)({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        const addHeader = (subtitle: string) => {
          doc.rect(0, 0, doc.page.width, 100).fill(bgGreen);
          doc.fontSize(24).fillColor(veraGreen).text('Bio Vera', 50, 25);
          doc.fontSize(14).fillColor(darkGray).text(subtitle, 50, 58);
          doc.y = 115;
        };

        const checkPage = (need: number) => {
          if (doc.y + need > doc.page.height - 60) {
            doc.addPage();
            addHeader('Product Passport – continued');
          }
        };

        addHeader('Product Passport');

        // 1. Product & Harvest
        doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('1. Product & harvest', 50, doc.y);
        doc.moveDown(0.5);
        const boxY = doc.y;
        const boxH = 130;
        doc.rect(50, boxY, doc.page.width - 100, boxH).fill('#FFF').stroke(veraGreen, 1);
        doc.fontSize(10).fillColor(lightGray).text('Batch ID:', 60, boxY + 10);
        doc.fontSize(11).fillColor(darkGray).text(data.batch?.batchId ?? '—', 60, boxY + 24);
        doc.text('Product:', 60, boxY + 42);
        doc.text(data.summary?.productName ?? data.batch?.productName ?? '—', 140, boxY + 42, { width: 160 });
        if (data.summary?.variety) {
          doc.text('Variety:', 60, boxY + 58);
          doc.text(data.summary.variety, 140, boxY + 58, { width: 160 });
        }
        doc.text('Lot quantity:', 60, boxY + 74);
        doc.text(`${data.summary?.lot?.totalQuantity ?? data.batch?.quantity ?? '—'} ${data.summary?.lot?.unit ?? data.batch?.unit ?? ''}`, 140, boxY + 74);
        if (data.summary?.identifiedPackaging) {
          doc.text('This package:', 60, boxY + 90);
          doc.text(`${data.summary.identifiedPackaging.badgeSerial} · ${data.summary.identifiedPackaging.badgeType}`, 140, boxY + 90, { width: 160 });
        }
        if (data.summary?.productDescription) {
          doc.fontSize(9).fillColor(lightGray).text(data.summary.productDescription, 60, boxY + 106, { width: doc.page.width - 120 });
        }
        doc.fontSize(10).fillColor(lightGray).text('Where harvested:', 320, boxY + 10);
        doc.fontSize(11).fillColor(darkGray).text(data.origin?.harvestLocation ?? '—', 320, boxY + 24, { width: 200 });
        doc.fontSize(10).fillColor(lightGray).text('When harvested:', 320, boxY + 42);
        doc.fontSize(11).fillColor(darkGray).text(
          data.summary?.actualHarvestDate ? formatDateTime(data.summary.actualHarvestDate) : data.origin?.harvestDate ? formatDateTime(data.origin.harvestDate) : '—',
          320, boxY + 56, { width: 200 },
        );
        if (data.summary?.actualPackDate) {
          doc.fontSize(10).fillColor(lightGray).text('Packed on:', 320, boxY + 72);
          doc.fontSize(11).fillColor(darkGray).text(formatDate(data.summary.actualPackDate), 320, boxY + 86);
        }
        if (data.summary?.storage?.productStorageConditions) {
          doc.fontSize(10).fillColor(lightGray).text('Storage:', 320, boxY + 100);
          doc.fontSize(10).fillColor(darkGray).text(data.summary.storage.productStorageConditions, 320, boxY + 114, { width: 200 });
        }
        if (data.summary?.storage?.declaredShelfLifeHours != null) {
          doc.fontSize(10).fillColor(darkGray).text(`Declared shelf life: ${data.summary.storage.declaredShelfLifeHours} h`, 60, boxY + boxH - 14);
        }
        doc.y = boxY + boxH + 8;
        doc.moveDown(1);

        if (data.originCandidate?.status === 'PENDING_DOCUMENTATION' && data.originCandidate.verified === false) {
          checkPage(100);
          doc.font('Helvetica-Bold').fontSize(11).fillColor('#92400e')
            .text(englishGlossary.productionHistory.candidateSupplier, 50, doc.y);
          doc.font('Helvetica').fontSize(10).fillColor(darkGray)
            .text(data.originCandidate.supplierName, 50, doc.y)
            .text(englishGlossary.productionHistory.pendingOrigin, 50, doc.y)
            .text(englishGlossary.productionHistory.pendingOriginHelp, 50, doc.y, { width: doc.page.width - 100 });
          doc.moveDown(1);
        }

        // 2. Parcel & chronology intro
        if (data.parcelInfo && (data.parcelInfo.cropType || data.parcelInfo.plantingDate || data.parcelInfo.expectedHarvestDate)) {
          checkPage(80);
          doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('2. Parcel & cultivation period', 50, doc.y);
          doc.moveDown(0.5);
          doc.fontSize(10).fillColor(darkGray)
            .text(`Crop: ${data.parcelInfo.cropType ?? '—'}`, 50, doc.y)
            .text(`Planting date: ${data.parcelInfo.plantingDate ? formatDate(data.parcelInfo.plantingDate) : '—'}`, 50, doc.y + 16)
            .text(`Expected harvest: ${data.parcelInfo.expectedHarvestDate ? formatDate(data.parcelInfo.expectedHarvestDate) : '—'}`, 50, doc.y + 32);
          doc.y += 50;
          doc.moveDown(1);
        }

        if (data.seedOrigin?.length > 0) {
          checkPage(80);
          doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('2b. Seed origin (Bio Vera)', 50, doc.y);
          doc.moveDown(0.5);
          data.seedOrigin.forEach((run: {
            product: string;
            variety?: string | null;
            lotNumber: string;
            seedCropYear: number;
            producer: { name: string; city?: string | null; country: string };
            productionDate?: string | null;
            germinationPct?: number | null;
            purityPct?: number | null;
            bagsPlanted: number;
            plantedFrom?: string | null;
            plantedTo?: string | null;
            recalled?: boolean;
          }) => {
            checkPage(60);
            if (run.recalled) {
              doc.fontSize(9).fillColor('#B45309').text('This seed lot was recalled by Bio Vera.', 50, doc.y);
              doc.y += 14;
            }
            doc.fontSize(10).fillColor(darkGray)
              .text(
                `${run.product}${run.variety ? ` — ${run.variety}` : ''} · Lot ${run.lotNumber} · Seed year ${run.seedCropYear}`,
                50,
                doc.y,
                { width: doc.page.width - 100 },
              );
            doc.y += 14;
            doc.text(
              `${run.producer.name}${run.producer.city ? `, ${run.producer.city}` : ''}, ${run.producer.country}`,
              50,
              doc.y,
            );
            doc.y += 14;
            const prodParts: string[] = [];
            if (run.productionDate) prodParts.push(`Production: ${run.productionDate}`);
            if (run.germinationPct != null) prodParts.push(`Germination ${run.germinationPct}%`);
            if (run.purityPct != null) prodParts.push(`Purity ${run.purityPct}%`);
            if (prodParts.length) {
              doc.text(prodParts.join(' · '), 50, doc.y);
              doc.y += 14;
            }
            const plantedRange =
              run.plantedFrom && run.plantedTo && run.plantedFrom !== run.plantedTo
                ? `${run.plantedFrom} – ${run.plantedTo}`
                : run.plantedFrom ?? '—';
            doc.text(`Planted: ${run.bagsPlanted} bag(s) · ${plantedRange}`, 50, doc.y);
            doc.y += 18;
          });
          doc.moveDown(0.5);
        }

        // Use the same complete, source-attributed history as web and mobile.
        const translate = (key: string, opts?: { defaultValue?: string }): string => {
          const value = key.replace(/^glossary\./, '').split('.').reduce<any>((node, part) => node?.[part], englishGlossary);
          return typeof value === 'string' ? value : opts?.defaultValue ?? key;
        };
        const historyLabel = (key: string) => translate(`glossary.productionHistory.${key}`);
        if (data.productionHistory?.length) {
          checkPage(90);
          doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('3. Production history', 50, doc.y);
          doc.moveDown(0.5);
          for (const row of data.productionHistory as ProductionEvent[]) {
            checkPage(70);
            doc.fontSize(10).fillColor(darkGray).font('Helvetica-Bold').text(historyLabel(row.kind), 50, doc.y);
            doc.font('Helvetica').fontSize(9);
            const date = row.date ? formatDateTime(row.date) : historyLabel('unknown');
            doc.text(`${date}${row.endDate ? ` – ${formatDateTime(row.endDate)}` : ''}`, 50, doc.y);
            doc.text(`${historyLabel('source')}: ${historyLabel(row.source)}`, 50, doc.y);
            if (row.recordedAt) doc.text(`${historyLabel('recordedAt')}: ${formatDateTime(row.recordedAt)}`, 50, doc.y);
            for (const fact of row.facts) {
              checkPage(24);
              doc.text(`${historyLabel(fact.label)}: ${historyFactLabel(translate, fact)}`, 50, doc.y, { width: doc.page.width - 100 });
            }
            doc.moveDown(0.7);
          }
        }

        // 4. Applied inputs (treatments)
        if (data.treatments && data.treatments.length > 0) {
          checkPage(100);
          doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('4. Applied inputs (treatments)', 50, doc.y);
          doc.moveDown(0.5);
          const tTop = doc.y;
          doc.fontSize(9).fillColor(lightGray);
          doc.text('Applied at', 50, tTop);
          doc.text('Product', 160, tTop);
          doc.text('Quantity / rate', 300, tTop);
          doc.text('Water (L)', 380, tTop);
          doc.text('Reason', 430, tTop);
          doc.moveTo(50, tTop + 12).lineTo(doc.page.width - 50, tTop + 12).stroke(veraGreen, 0.5);
          doc.y = tTop + 18;
          data.treatments.forEach((t: any) => {
            checkPage(14);
            doc.fontSize(8).fillColor(darkGray).text(formatDateTime(t.appliedAt), 50, doc.y, { width: 105 });
            doc.text(t.productName, 160, doc.y, { width: 135 });
            doc.text(t.dosage, 300, doc.y, { width: 75 });
            doc.text(t.waterVolume != null ? String(t.waterVolume) : '—', 380, doc.y);
            doc.text(t.reason || '—', 430, doc.y, { width: doc.page.width - 435 });
            doc.y += 14;
          });
          doc.y += 10;
          doc.moveDown(1);
        }

        if (data.parcelSeed?.serialNumber || data.parcelSeed?.name) {
          checkPage(50);
          doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('4b. Registered seed / planting material', 50, doc.y);
          doc.moveDown(0.5);
          doc.fontSize(10).fillColor(darkGray)
            .text(`Serial: ${data.parcelSeed.serialNumber ?? '—'}  ·  Name: ${data.parcelSeed.name ?? '—'}  ·  Seed batch: ${data.parcelSeed.batchNumber ?? '—'}  ·  Type: ${data.parcelSeed.seedType ?? '—'}`, 50, doc.y);
          doc.y += 28;
          doc.moveDown(0.5);
        }

        if (data.materialScans?.length > 0) {
          checkPage(120);
          doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('4c. Material & barcode scans (this lot only)', 50, doc.y);
          doc.moveDown(0.5);
          data.materialScans.slice(0, 25).forEach((scan: any) => {
            checkPage(12);
            doc.fontSize(8).fillColor(darkGray).text(
              `${formatDateTime(scan.networkTimestamp)} · ${scan.entryType} · ${scan.barcodeType} · ${scan.scannedBarcode} · compliant: ${scan.isCompliant ? 'yes' : 'no'}`,
              50,
              doc.y,
            );
            doc.y += 11;
          });
          doc.y += 6;
          doc.moveDown(0.5);
        }

        if (data.qualityEntry?.weatherAtHarvestSummary || data.qualityEntry?.notes) {
          checkPage(50);
          doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('4d. Harvest conditions & quality intake', 50, doc.y);
          doc.moveDown(0.5);
          doc.fontSize(10).fillColor(darkGray);
          if (data.qualityEntry.weatherAtHarvestSummary) {
            doc.text(`Harvest weather snapshot: ${data.qualityEntry.weatherAtHarvestSummary}`, 50, doc.y);
            doc.y += 14;
          }
          if (data.qualityEntry.notes) {
            doc.text(`Notes: ${data.qualityEntry.notes}`, 50, doc.y, { width: doc.page.width - 100 });
            doc.y += 22;
          }
          doc.moveDown(0.5);
        }

        // 5. Cold chain & freshness
        if (data.coldChainProof && (data.coldChainProof.minTemp != null || data.coldChainProof.temperatureData?.length)) {
          checkPage(100);
          doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('5. Cold chain & freshness', 50, doc.y);
          doc.moveDown(0.5);
          const cc = data.coldChainProof;
          doc.fontSize(10).fillColor(darkGray)
            .text(`Min temp: ${cc.minTemp != null ? cc.minTemp + ' °C' : '—'}  |  Max temp: ${cc.maxTemp != null ? cc.maxTemp + ' °C' : '—'}  |  Avg: ${cc.avgTemp != null ? Number(cc.avgTemp).toFixed(1) + ' °C' : '—'}  |  Criteria: ${cc.evaluationCriteria ?? '—'}  |  Points within criteria: ${cc.isWithinRange === true ? 'Yes' : cc.isWithinRange === false ? 'No' : '—'}  |  Continuous control: No (spot readings only)`, 50, doc.y, { width: doc.page.width - 100 });
          doc.y += 20;
          if (cc.temperatureData && cc.temperatureData.length > 0) {
            doc.fontSize(9).fillColor(lightGray).text('Temperature log (first 15):', 50, doc.y);
            doc.y += 12;
            cc.temperatureData.slice(0, 15).forEach((row: any) => {
              const hum = row.humidity != null ? ` · ${row.humidity}% RH` : '';
              const ph = row.phase ? ` · ${row.phase}` : '';
              const mn = row.missionNumber ? ` · ${row.missionNumber}` : '';
              doc.fontSize(8).fillColor(darkGray)
                .text(`${formatDateTime(row.timestamp)}  ${row.temperature} °C${hum}${ph}${mn}  ${row.location || '—'}`, 50, doc.y);
              doc.y += 10;
            });
            doc.y += 5;
          }
          doc.moveDown(0.5);
        }
        if (data.freshness?.estimate) {
          checkPage(50);
          doc.fontSize(10).fillColor(darkGray)
            .text(
              `Freshness estimate (${data.freshness.estimate.source}): ${data.freshness.estimate.remainingHours != null ? Math.round(data.freshness.estimate.remainingHours) + ' h remaining' : '—'}  |  Estimated use-by: ${data.freshness.estimate.estimatedExpiresAt ? formatDate(data.freshness.estimate.estimatedExpiresAt) : '—'}`,
              50,
              doc.y,
              { width: doc.page.width - 100 },
            );
          doc.y += 25;
          if (data.summary?.storage?.declaredShelfLifeHours != null) {
            doc.fontSize(8).fillColor(darkGray).text(
              `Declared shelf life (on pack label): ${data.summary.storage.declaredShelfLifeHours} h`,
              50,
              doc.y,
            );
          } else {
            doc.fontSize(8).fillColor(lightGray).text('Declared shelf life: not recorded on this lot.', 50, doc.y);
          }
          doc.y += 16;
        }
        if (data.summary?.storage?.platformStandard) {
          checkPage(30);
          doc.fontSize(9).fillColor(darkGray).text(
            `Platform temperature standard (${data.summary.storage.platformStandard.source}): ${data.summary.storage.platformStandard.label}`,
            50,
            doc.y,
          );
          doc.y += 18;
        }
        if (data.lotPackagingFormats?.length) {
          checkPage(40);
          doc.fontSize(9).fillColor(darkGray).text('Pack formats recorded on orders from this lot (informational):', 50, doc.y);
          doc.y += 14;
          data.lotPackagingFormats.forEach((p: { label?: string | null; packSizeKg?: number | null }) => {
            doc.text(`· ${p.label ?? '—'}${p.packSizeKg != null ? ` · ${p.packSizeKg} kg` : ''}`, 60, doc.y);
            doc.y += 12;
          });
          doc.y += 8;
        }

        // 6. Timeline (journey)
        checkPage(90);
        doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('6. Journey (timeline)', 50, doc.y);
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor(darkGray);
        if (data.timeline?.harvested) doc.text(`Harvested: ${formatDateTime(data.timeline.harvested)}`, 60, doc.y), doc.y += 14;
        if (data.timeline?.verified) doc.text(`Quality verified: ${formatDateTime(data.timeline.verified)}`, 60, doc.y), doc.y += 14;
        if (data.timeline?.loaded) doc.text(`Picked up: ${formatDateTime(data.timeline.loaded)}`, 60, doc.y), doc.y += 14;
        if (data.timeline?.arrived) doc.text(`Arrived: ${formatDateTime(data.timeline.arrived)}`, 60, doc.y), doc.y += 14;
        doc.y += 10;

        // 7. Missions
        if (data.missions && data.missions.length > 0) {
          checkPage(60);
          doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('7. Missions', 50, doc.y);
          doc.moveDown(0.5);
          data.missions.forEach((m: any, i: number) => {
            doc.fontSize(10).fillColor(darkGray).text(`${m.missionNumber || 'Mission ' + (i + 1)}  ·  ${m.status}  ·  Vehicle: ${m.vehicle?.vehicleNumber ?? m.vehicle?.licensePlate ?? '—'}  ·  Truck °C at load handover: ${m.logisticsHandover?.insideTruckTemperature ?? '—'}  ·  Picked up: ${m.pickedUpAt ? formatDateTime(m.pickedUpAt) : '—'}  ·  Delivered: ${m.deliveredAt ? formatDateTime(m.deliveredAt) : '—'}`, 60, doc.y);
            doc.y += 14;
          });
          doc.y += 8;
        }

        // 8. Sustainability
        if (data.sustainability && (data.sustainability.totalDistanceKm != null || data.sustainability.sustainabilityScore != null)) {
          checkPage(40);
          doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('8. Sustainability', 50, doc.y);
          doc.moveDown(0.5);
          doc.fontSize(10).fillColor(darkGray).text(`Distance: ${data.sustainability.totalDistanceKm ?? '—'} km  |  Score: ${data.sustainability.sustainabilityScore ?? '—'}  |  Route: ${data.sustainability.route ?? '—'}`, 60, doc.y);
          doc.y += 25;
        }

        // 9. Protocol 360
        if (data.protocol360 && (data.protocol360.levels?.length || data.protocol360.overallStatus)) {
          checkPage(60);
          doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('9. Protocol 360', 50, doc.y);
          doc.moveDown(0.5);
          doc.fontSize(10).fillColor(darkGray).text(`Overall: ${data.protocol360.overallStatus ?? '—'}`, 60, doc.y);
          doc.y += 14;
          (data.protocol360.levels || []).forEach((l: any) => {
            doc.fontSize(9).text(`Level ${l.level}: ${l.name}  –  ${l.badgeText || l.status}`, 60, doc.y);
            doc.y += 12;
          });
        }

        if (data.passportDocuments?.length) {
          checkPage(60);
          doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('10. Verified documents', 50, doc.y);
          doc.moveDown(0.5);
          data.passportDocuments.forEach((d: { title: string; docType: string; verificationStatus?: string; url?: string }) => {
            doc.fontSize(10).fillColor(darkGray).text(
              `· ${d.title} (${d.docType})${d.verificationStatus === 'CONFIRMED' ? ' — verified' : ''}`,
              60,
              doc.y,
            );
            doc.y += 14;
          });
          doc.y += 8;
        }

        doc.fontSize(8).fillColor(lightGray).text(`Document generated: ${formatDateTime(new Date())}  ·  Bio Vera Product Passport  ·  Batch: ${data.batch?.batchId ?? batchId}`, 50, doc.page.height - 35);
        doc.end();
      } catch (e) {
        reject(e);
      }
    });
  }
}
