import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateQualityEntryDto,
  LogisticsHandoverDto,
  HandoverReceiverProofDto,
} from './dto/quality-entry.dto';
import { buildLogisticsHandoverReceiverProofPdf } from '../common/pdf/simple-documents-pdf';
import * as crypto from 'crypto';
import sharp from 'sharp';

@Injectable()
export class QualityEntryService {
  private readonly logger = new Logger(QualityEntryService.name);
  private readonly STANDARD_TRUCK_TEMP_MIN = 2; // °C
  private readonly STANDARD_TRUCK_TEMP_MAX = 8; // °C
  /** Per-image cap for data URLs / long URL strings (bytes as sent in JSON). */
  private readonly MAX_PHOTO_STRING_LENGTH = 5 * 1024 * 1024;
  /** Decoded image bytes cap before blob upload (matches client “max file” guidance). */
  private readonly MAX_HANDOVER_PHOTO_BYTES = 5 * 1024 * 1024;

  /** E2E: handover only after dispatch to logistics, before truck leaves farm (see docs/E2E_TRANSPORT_MISSION_SMOKE.md). */
  private static readonly LOGISTICS_HANDOVER_MISSION_STATUSES = new Set([
    'ASSIGNED',
    'ACCEPTED',
    'IN_PROGRESS',
  ]);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /** Buyer inbox when missions.orderId ties this pickup to a portal order */
  private async notifyBuyerFarmHandoverIfLinkedOrder(missionId: string): Promise<void> {
    try {
      const m = await this.prisma.missions.findUnique({
        where: { id: missionId },
        select: {
          orderId: true,
        },
      });
      const orderId = m?.orderId;
      if (!orderId) return;

      const order = await this.prisma.orders.findUnique({
        where: { id: orderId },
        select: {
          buyerId: true,
          orderNumber: true,
          status: true,
        },
      });
      if (!order || order.status === 'CANCELLED' || order.status === 'REFUNDED') return;

      await this.notificationsService.create({
        userId: order.buyerId,
        type: 'SYSTEM',
        title: 'Farm loading checked',
        message: `${order.orderNumber}: truck temperature and cargo were recorded at the farm. The shipment leaves once the carrier confirms departure.`,
        actionUrl: `/buyer-portal/orders`,
      });
    } catch (e) {
      this.logger.warn(
        `notifyBuyerFarmHandoverIfLinkedOrder failed (mission=${missionId}): ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }

  private stripDataUrlBase64(input: string): string {
    const m = input.trim().match(/^data:image\/\w+;base64,(.+)$/is);
    return m ? m[1] : input.replace(/\s/g, '');
  }

  private static guessHandoverImageExt(buf: Buffer): 'jpg' | 'png' | 'webp' {
    if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg';
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
    if (
      buf[0] === 0x52 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x46 &&
      buf[8] === 0x57 &&
      buf[9] === 0x45 &&
      buf[10] === 0x42 &&
      buf[11] === 0x50
    ) {
      return 'webp';
    }
    return 'jpg';
  }

  /**
   * When BLOB_READ_WRITE_TOKEN is unset, data URLs are stored in Postgres — shrink with sharp
   * so typical handovers stay under pooler / payload limits.
   * Uses tolerant decode + fallbacks because some PNG/WebP files fail strict metadata checks.
   */
  private async shrinkHandoverImageToJpegDataUrl(buf: Buffer, context: string): Promise<string> {
    type LooseSharpInput = { failOn?: 'none'; limitInputPixels?: boolean; sequentialRead?: boolean };

    const jpegAttempts: Array<{
      edge: number;
      quality: number;
      flatten: boolean;
      mozjpeg: boolean;
      input: LooseSharpInput;
    }> = [
      { edge: 1024, quality: 68, flatten: true, mozjpeg: true, input: {} },
      { edge: 1024, quality: 62, flatten: false, mozjpeg: false, input: { limitInputPixels: false } },
      { edge: 800, quality: 56, flatten: false, mozjpeg: false, input: { limitInputPixels: false, sequentialRead: true } },
      { edge: 640, quality: 48, flatten: false, mozjpeg: false, input: { limitInputPixels: false } },
      { edge: 480, quality: 42, flatten: true, mozjpeg: false, input: { limitInputPixels: false } },
    ];

    let lastMessage = '';
    for (const a of jpegAttempts) {
      try {
        const inputs = { failOn: 'none' as const, ...a.input };
        let img = sharp(buf, inputs).rotate();
        if (a.flatten) {
          img = img.flatten({ background: { r: 255, g: 255, b: 255 } });
        }
        const out = await img
          .resize(a.edge, a.edge, { fit: 'inside', withoutEnlargement: true })
          .jpeg(
            a.mozjpeg
              ? { quality: a.quality, mozjpeg: true, chromaSubsampling: '4:4:4' }
              : { quality: a.quality, chromaSubsampling: '4:4:4' },
          )
          .toBuffer();
        if (out.length > 0) {
          return `data:image/jpeg;base64,${out.toString('base64')}`;
        }
      } catch (e) {
        lastMessage = e instanceof Error ? e.message : String(e);
        this.logger.warn(
          `shrinkHandoverImageToJpegDataUrl (${context}) jpeg ${a.edge}px q=${a.quality}: ${lastMessage}`,
        );
      }
    }

    for (const edge of [800, 640, 480]) {
      try {
        const out = await sharp(buf, { failOn: 'none', limitInputPixels: false })
          .rotate()
          .flatten({ background: { r: 255, g: 255, b: 255 } })
          .resize(edge, edge, { fit: 'inside', withoutEnlargement: true })
          .png({ compressionLevel: 9, adaptiveFiltering: true })
          .toBuffer();
        if (out.length > 0) {
          return `data:image/png;base64,${out.toString('base64')}`;
        }
      } catch (e) {
        lastMessage = e instanceof Error ? e.message : String(e);
        this.logger.warn(`shrinkHandoverImageToJpegDataUrl (${context}) png ${edge}px: ${lastMessage}`);
      }
    }

    /** Last resort: store original bytes (small files only) so uncommon formats are not hard-blocked. */
    const ext = QualityEntryService.guessHandoverImageExt(buf);
    const mime =
      ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const passthrough = `data:${mime};base64,${buf.toString('base64')}`;
    const maxPassthroughChars = 950_000;
    if (passthrough.length <= maxPassthroughChars) {
      this.logger.warn(
        `shrinkHandoverImageToJpegDataUrl (${context}): passthrough original (${passthrough.length} chars)`,
      );
      return passthrough;
    }

    throw new BadRequestException(
      `${context}: could not shrink this image on the server (try a smaller JPG/PNG under ~700KB, or set BLOB_READ_WRITE_TOKEN on the API).`,
    );
  }

  /**
   * Replace data-URL images with public blob URLs when BLOB_READ_WRITE_TOKEN is set so JSON rows
   * stay small (avoids DB / pooler failures on multi-megabyte base64 payloads).
   */
  private async normalizeHandoverPhotosForStorage(
    photos: string[],
    missionId: string,
    group: 'pallet' | 'truck',
  ): Promise<string[]> {
    const token = (process.env.BLOB_READ_WRITE_TOKEN || '').trim();
    const out: string[] = [];

    for (let i = 0; i < photos.length; i += 1) {
      const p = photos[i];
      if (p.startsWith('https://') || p.startsWith('http://')) {
        out.push(p);
        continue;
      }
      if (!p.startsWith('data:image/')) {
        throw new BadRequestException(
          `${group} photos: expected data:image URLs or http(s) links (entry ${i + 1})`,
        );
      }

      if (!token) {
        const raw = this.stripDataUrlBase64(p);
        const buf = Buffer.from(raw, 'base64');
        if (buf.length === 0) {
          throw new BadRequestException(`${group} photos: invalid image data (entry ${i + 1})`);
        }
        if (buf.length > this.MAX_HANDOVER_PHOTO_BYTES) {
          throw new BadRequestException(
            `${group}: each image must be at most ${this.MAX_HANDOVER_PHOTO_BYTES} bytes after decoding`,
          );
        }
        const label = group === 'pallet' ? 'Pallet' : 'Truck';
        const shrunk = await this.shrinkHandoverImageToJpegDataUrl(buf, `${label} photo ${i + 1}`);
        out.push(shrunk);
        continue;
      }

      const raw = this.stripDataUrlBase64(p);
      const buf = Buffer.from(raw, 'base64');
      if (buf.length === 0) {
        throw new BadRequestException(`${group} photos: invalid image data (entry ${i + 1})`);
      }
      if (buf.length > this.MAX_HANDOVER_PHOTO_BYTES) {
        throw new BadRequestException(
          `${group}: each image must be at most ${this.MAX_HANDOVER_PHOTO_BYTES} bytes after decoding`,
        );
      }

      const ext = QualityEntryService.guessHandoverImageExt(buf);
      const key = `logistics-handover/${missionId}/${group}-${crypto.randomUUID()}.${ext}`;

      try {
        const { put } = await import('@vercel/blob');
        const uploaded = await put(key, buf, { access: 'public', token });
        out.push(uploaded.url);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Handover blob upload failed (${group} #${i + 1}): ${msg}`);
        throw new BadRequestException(
          'Could not upload handover photos to storage. Try smaller images or fewer photos, then retry.',
        );
      }
    }

    return out;
  }

  private assertHandoverSingleAsset(s: string, label: string, maxStringLen: number) {
    if (typeof s !== 'string' || s.length < 20) {
      throw new BadRequestException(`${label}: invalid image data`);
    }
    if (s.length > maxStringLen) {
      throw new BadRequestException(`${label}: file too large`);
    }
    if (!s.startsWith('data:image/') && !s.startsWith('http://') && !s.startsWith('https://')) {
      throw new BadRequestException(`${label}: must be image data URL or http(s) link`);
    }
  }

  /** One image (badge or signature) → blob URL when token set */
  private async handoverAssetToStoredUrl(
    dataUrlOrUrl: string,
    missionId: string,
    part: string,
  ): Promise<string> {
    const partLabel =
      part.includes('badge') || part.includes('pickup-badge')
        ? 'ID badge'
        : part.includes('signature')
          ? 'Driver signature'
          : part;

    const t = dataUrlOrUrl.trim();
    if (t.startsWith('https://') || t.startsWith('http://')) return t;
    if (!t.startsWith('data:image/')) {
      throw new BadRequestException(`${partLabel}: expected data:image URL or https link`);
    }
    const token = (process.env.BLOB_READ_WRITE_TOKEN || '').trim();
    if (!token) {
      const raw = this.stripDataUrlBase64(t);
      const buf = Buffer.from(raw, 'base64');
      if (buf.length === 0) throw new BadRequestException(`${partLabel}: invalid image data`);
      if (buf.length > this.MAX_HANDOVER_PHOTO_BYTES) {
        throw new BadRequestException(`${partLabel}: image too large`);
      }
      const shrunk = await this.shrinkHandoverImageToJpegDataUrl(buf, partLabel);
      if (shrunk.length > this.MAX_PHOTO_STRING_LENGTH) {
        throw new BadRequestException(
          `${partLabel}: still too large after compression; set BLOB_READ_WRITE_TOKEN or use a smaller image.`,
        );
      }
      return shrunk;
    }
    const raw = this.stripDataUrlBase64(t);
    const buf = Buffer.from(raw, 'base64');
    if (buf.length === 0) throw new BadRequestException(`${partLabel}: invalid image data`);
    if (buf.length > this.MAX_HANDOVER_PHOTO_BYTES) {
      throw new BadRequestException(`${partLabel}: image too large`);
    }
    const ext = QualityEntryService.guessHandoverImageExt(buf);
    const safePart = part.replace(/\s+/g, '-').slice(0, 40);
    const key = `logistics-handover/${missionId}/${safePart}-${crypto.randomUUID()}.${ext}`;
    try {
      const { put } = await import('@vercel/blob');
      const uploaded = await put(key, buf, { access: 'public', token });
      return uploaded.url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Handover blob upload failed (${part}): ${msg}`);
      throw new BadRequestException('Could not upload handover image to storage. Try a smaller image.');
    }
  }

  private assertHandoverPhotos(photos: string[], label: string) {
    for (const p of photos) {
      if (typeof p !== 'string' || p.length < 20) {
        throw new BadRequestException(`${label}: invalid photo entry`);
      }
      if (p.length > this.MAX_PHOTO_STRING_LENGTH) {
        throw new BadRequestException(`${label}: each image must be under 5MB`);
      }
      if (!p.startsWith('data:image/') && !p.startsWith('http://') && !p.startsWith('https://')) {
        throw new BadRequestException(
          `${label}: photos must be image data URLs (data:image/...) or http(s) URLs`,
        );
      }
    }
  }

  /**
   * Create quality entry for a batch (Farmer's responsibility)
   * — Full: pre-cool, weather, 3 photos, standard confirmation.
   * — Simple (grower app): `qualityScore` and/or `notes` only; optional photos/weather can be added later in web.
   */
  async createQualityEntry(userId: string, dto: CreateQualityEntryDto) {
    // Internal UUID or public lot code (e.g. BATCH-2026-0001) — list UIs may send either
    const batch = await this.prisma.batches.findFirst({
      where: { OR: [{ id: dto.batchId }, { batchId: dto.batchId }] },
      include: {
        estates: {
          include: {
            users: true,
          },
        },
      },
    });

    if (!batch) {
      throw new BadRequestException(`Batch ${dto.batchId} not found`);
    }

    const ownerId = batch.estates?.users?.id;
    const isEstateOwner = ownerId === userId;
    const isHarvester = batch.harvestedByUserId === userId;
    if (!isEstateOwner && !isHarvester) {
      throw new ForbiddenException('You can only create quality entries for your own batches');
    }

    const assertedParcelId = typeof dto.parcelId === 'string' ? dto.parcelId.trim() : '';
    if (assertedParcelId) {
      if (!batch.parcelId) {
        throw new BadRequestException(
          'This batch has no parcel on file. Omit parcel identifier or recreate the batch from an approved parcel.',
        );
      }
      if (assertedParcelId !== batch.parcelId) {
        throw new ForbiddenException('Selected parcel does not match this batch.');
      }
    }

    const batchIdFk = batch.id;

    const existing = await this.prisma.quality_entries.findUnique({
      where: { batchId: batchIdFk },
    });

    if (existing) {
      throw new BadRequestException(
        'A quality entry for this batch already exists. Do not submit again. Continue with Request transport or check My Batches.',
      );
    }

    const isFull =
      Boolean(dto.preCoolingStartTime) &&
      dto.weatherAtHarvest != null &&
      typeof dto.weatherAtHarvest === 'object' &&
      Array.isArray(dto.visualGradePhotos) &&
      dto.visualGradePhotos.length === 3;

    if (isFull) {
      if (!dto.standardConfirmation) {
        throw new BadRequestException(
          'Standard confirmation is required. You must confirm that Bio Vera packaging, film, and labels are applied according to the protocol.',
        );
      }
    } else {
      const hasScore = dto.qualityScore != null && !Number.isNaN(Number(dto.qualityScore));
      const hasNotes = Boolean(dto.notes?.trim());
      if (!hasScore && !hasNotes) {
        throw new BadRequestException(
          'Add a quality score (0–100) and/or notes, or send the full checklist (pre-cool time, weather, 3 photos, confirmation).',
        );
      }
    }

    if (isFull) {
      const qualityEntry = await this.prisma.quality_entries.create({
        data: {
          id: crypto.randomUUID(),
          batchId: batchIdFk,
          preCoolingStartTime: new Date(dto.preCoolingStartTime!),
          weatherAtHarvest: dto.weatherAtHarvest as any,
          visualGradePhotos: dto.visualGradePhotos!,
          qualityScore: dto.qualityScore != null ? Number(dto.qualityScore) : null,
          standardConfirmation: true,
          confirmedBy: userId,
          notes: dto.notes,
          status: 'COMPLETED',
          updatedAt: new Date(),
        },
      });

      await this.prisma.batches.update({
        where: { id: batchIdFk },
        data: { status: 'QUALITY_VERIFIED' },
      });

      await this.prisma.audit_trails.create({
        data: {
          id: crypto.randomUUID(),
          eventType: 'QUALITY_ENTRY',
          entityType: 'Batch',
          entityId: batchIdFk,
          batchId: batchIdFk,
          performedByUserId: userId,
          newValue: {
            qualityEntryId: qualityEntry.id,
            preCoolingStartTime: dto.preCoolingStartTime,
            weatherAtHarvest: dto.weatherAtHarvest,
            fullProtocol: true,
          } as any,
          changeReason: 'Farmer quality entry completed (full protocol)',
          isCompliant: true,
          timestamp: new Date(),
        } as any,
      });

      return qualityEntry;
    }

    const score =
      dto.qualityScore != null && !Number.isNaN(Number(dto.qualityScore))
        ? Math.min(100, Math.max(0, Number(dto.qualityScore)))
        : null;
    const weatherPlaceholder = {
      _entryMode: 'mobile_simple' as const,
      temperature: 0,
      humidity: 0,
      cloudCover: 'clear' as const,
    };

    const qualityEntry = await this.prisma.quality_entries.create({
      data: {
        id: crypto.randomUUID(),
        batchId: batchIdFk,
        preCoolingStartTime: new Date(),
        weatherAtHarvest: weatherPlaceholder as any,
        visualGradePhotos: [],
        qualityScore: score,
        standardConfirmation: true,
        confirmedBy: userId,
        notes: dto.notes?.trim() || null,
        status: 'COMPLETED',
        updatedAt: new Date(),
      },
    });

    await this.prisma.batches.update({
      where: { id: batchIdFk },
      data: { status: 'QUALITY_VERIFIED' },
    });

    await this.prisma.audit_trails.create({
      data: {
        id: crypto.randomUUID(),
        eventType: 'QUALITY_ENTRY',
        entityType: 'Batch',
        entityId: batchIdFk,
        batchId: batchIdFk,
        performedByUserId: userId,
        newValue: {
          qualityEntryId: qualityEntry.id,
          qualityScore: score,
          fullProtocol: false,
        } as any,
        changeReason: 'Farmer quality entry (score/notes; full photo protocol optional for later)',
        isCompliant: true,
        timestamp: new Date(),
      } as any,
    });

    return qualityEntry;
  }

  /**
   * Logistics handover: truck temperature + pallet photos + inside-truck photos.
   * All must be satisfied before the mission is set to READY_FOR_LOADING (ready for the loading / shipment step).
   */
  async logisticsHandover(userId: string, dto: LogisticsHandoverDto) {
    // Verify mission exists
    const mission = await this.prisma.missions.findUnique({
      where: { id: dto.missionId },
      include: {
        batches: {
          include: {
            quality_entries: true,
          },
        },
        vehicles: true,
        users_missions_logisticsPartnerIdTousers: true,
        logistics_handovers: true,
      },
    });

    if (!mission) {
      throw new BadRequestException(`Mission ${dto.missionId} not found`);
    }

    if (mission.status === 'CANCELLED' || mission.status === 'COMPLETED') {
      throw new BadRequestException(
        'Cannot record loading handover on a completed or cancelled mission.',
      );
    }
    if (!QualityEntryService.LOGISTICS_HANDOVER_MISSION_STATUSES.has(mission.status)) {
      throw new BadRequestException(
        `Loading handover is only available once logistics is assigned and before departure from the farm. Current status: ${mission.status}`,
      );
    }

    if (mission.logistics_handovers) {
      throw new BadRequestException(
        'Loading handover for this mission is already complete. Pallet and truck photos were recorded.',
      );
    }

    // Verify user is the assigned logistics partner
    if (mission.logisticsPartnerId !== userId) {
      throw new ForbiddenException('You are not assigned to this mission');
    }

    const qe = mission.batches?.quality_entries;
    if (!qe) {
      throw new BadRequestException(
        'Quality entry must be completed before loading. Please wait for the grower to complete the quality step.',
      );
    }
    if (qe.status !== 'COMPLETED' && qe.status !== 'VERIFIED') {
      throw new BadRequestException(
        `Quality entry for this lot is not completed (status: ${qe.status}). The grower must finish the quality step first.`,
      );
    }

    this.assertHandoverPhotos(dto.palletPhotos, 'Pallet photos');
    this.assertHandoverPhotos(dto.truckInteriorPhotos, 'Inside-truck photos');
    this.assertHandoverSingleAsset(dto.pickupBadgePhoto, 'Partner ID badge photo', this.MAX_PHOTO_STRING_LENGTH);
    this.assertHandoverSingleAsset(
      dto.pickupDriverSignatureDataUrl,
      'Driver signature',
      Math.min(this.MAX_PHOTO_STRING_LENGTH, 2 * 1024 * 1024),
    );

    const pickupDriver = await this.prisma.logistics_drivers.findFirst({
      where: {
        id: dto.pickupDriverId.trim(),
        logisticsPartnerId: userId,
        isActive: true,
      },
    });
    if (!pickupDriver) {
      throw new BadRequestException('Pickup driver not found or not active for your company');
    }

    const pickupDriverSnapshot = {
      driverId: pickupDriver.id,
      firstName: pickupDriver.firstName,
      lastName: pickupDriver.lastName,
      email: pickupDriver.email,
      phone: pickupDriver.phone,
      photoUrl: pickupDriver.photoUrl,
    };

    const tempC = Number(dto.insideTruckTemperature);
    const isWithinStandard =
      tempC >= this.STANDARD_TRUCK_TEMP_MIN && tempC <= this.STANDARD_TRUCK_TEMP_MAX;

    if (!isWithinStandard) {
      throw new BadRequestException(
        `Truck temperature (${tempC}°C) is outside standard range (${this.STANDARD_TRUCK_TEMP_MIN}°C - ${this.STANDARD_TRUCK_TEMP_MAX}°C). Loading is blocked. Please adjust temperature before proceeding.`,
      );
    }

    // Stale or broken mission.vehicleId would break temperature_logs FK to vehicles
    let safeVehicleId: string | null = null;
    if (mission.vehicleId) {
      const v = await this.prisma.vehicles.findUnique({
        where: { id: mission.vehicleId },
        select: { id: true },
      });
      if (v) {
        safeVehicleId = v.id;
      } else {
        this.logger.warn(
          `Mission ${mission.id} has vehicleId ${mission.vehicleId} not found; temperature log will omit vehicle`,
        );
      }
    }

    const blobConfigured = Boolean((process.env.BLOB_READ_WRITE_TOKEN || '').trim());

    const palletStored = await this.normalizeHandoverPhotosForStorage(
      dto.palletPhotos,
      dto.missionId,
      'pallet',
    );
    const truckStored = await this.normalizeHandoverPhotosForStorage(
      dto.truckInteriorPhotos,
      dto.missionId,
      'truck',
    );
    const palletJson = JSON.parse(JSON.stringify(palletStored)) as Prisma.InputJsonValue;
    const truckJson = JSON.parse(JSON.stringify(truckStored)) as Prisma.InputJsonValue;

    const badgeUrl = await this.handoverAssetToStoredUrl(
      dto.pickupBadgePhoto,
      dto.missionId,
      'pickup-badge',
    );
    const signatureUrl = await this.handoverAssetToStoredUrl(
      dto.pickupDriverSignatureDataUrl,
      dto.missionId,
      'pickup-driver-signature',
    );

    if (!blobConfigured) {
      let inlineChars = 0;
      for (const s of palletStored) inlineChars += s.length;
      for (const s of truckStored) inlineChars += s.length;
      inlineChars += badgeUrl.length + signatureUrl.length;
      this.logger.log(
        `logisticsHandover inline payload (no blob): ~${inlineChars} chars, photos pallet=${palletStored.length} truck=${truckStored.length}`,
      );
      /** Stay under typical Postgres/pooler limits when rows contain base64 JSON */
      if (inlineChars > 2_600_000) {
        throw new BadRequestException(
          'Handover is still too large after server compression. Use fewer photos, or set BLOB_READ_WRITE_TOKEN on the API.',
        );
      }
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const handover = await tx.logistics_handovers.create({
          data: {
            id: crypto.randomUUID(),
            missionId: dto.missionId,
            insideTruckTemperature: tempC,
            palletPhotos: palletJson,
            truckInteriorPhotos: truckJson,
            verifiedBy: userId,
            notes: dto.notes?.trim() || null,
            status: 'APPROVED',
            timestamp: new Date(),
            pickupDriverId: pickupDriver.id,
            pickupDriverSnapshot: pickupDriverSnapshot as Prisma.InputJsonValue,
            pickupBadgePhotoUrl: badgeUrl,
            pickupDriverSignatureUrl: signatureUrl,
          },
        });

        await tx.missions.update({
          where: { id: dto.missionId },
          data: {
            status: 'READY_FOR_LOADING',
            assignedLogisticsDriverId: pickupDriver.id,
          },
        });

        await tx.temperature_logs.create({
          data: {
            id: crypto.randomUUID(),
            missionId: dto.missionId,
            vehicleId: safeVehicleId,
            batchId: mission.batchId,
            temperature: tempC,
            humidity: 60,
            location: { lat: 0, lng: 0 } as Prisma.InputJsonValue,
            reportedByUserId: userId,
            sensorId: 'MANUAL_ENTRY',
            deviceId: 'DRIVER_APP',
            isOutOfRange: false,
            timestamp: new Date(),
          },
        });

        await tx.audit_trails.create({
          data: {
            id: crypto.randomUUID(),
            eventType: 'LOGISTICS_HANDOVER',
            entityType: 'Mission',
            entityId: dto.missionId,
            batchId: mission.batchId,
            performedByUserId: userId,
            newValue: {
              handoverId: handover.id,
              insideTruckTemperature: tempC,
              palletPhotoCount: dto.palletPhotos.length,
              truckInteriorPhotoCount: dto.truckInteriorPhotos.length,
              pickupDriverId: pickupDriver.id,
            } as Prisma.InputJsonValue,
            changeReason:
              'Driver completed loading handover: temperature, pallet photos, and inside-truck photos',
            isCompliant: true,
            timestamp: new Date(),
          },
        });

        return {
          success: true,
          handover,
          message:
            'Loading evidence saved (temperature, pallet and inside-truck photos). Mission is ready for loading.',
        };
      });

      void this.notifyBuyerFarmHandoverIfLinkedOrder(dto.missionId);

      return result;
    } catch (e: unknown) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(`logisticsHandover Prisma ${e.code}: ${e.message} meta=${JSON.stringify(e.meta)}`);
        if (e.code === 'P2022' || e.code === 'P2021' || e.code === 'P2010') {
          throw new BadRequestException(
            `Database schema is out of date: ${e.message}. On the API host run: npx prisma migrate deploy (same DATABASE_URL as production).`,
          );
        }
        throw new BadRequestException(
          `Could not save handover (${e.code}). If you recently changed vehicle data, refresh missions and try again, or contact support.`,
        );
      }
      if (e instanceof Prisma.PrismaClientValidationError) {
        this.logger.error(`logisticsHandover PrismaClientValidationError: ${e.message}`);
        throw new BadRequestException(
          'Handover could not be saved. Check temperature and images (data URLs or https links only, max 5MB each). Try fewer photos if the request is large.',
        );
      }
      if (e instanceof Prisma.PrismaClientUnknownRequestError) {
        const cause = (e as { cause?: unknown }).cause;
        const prismaMsg = `${e.message}${cause != null ? ` ${String(cause)}` : ''}`;
        this.logger.error(`logisticsHandover PrismaClientUnknownRequestError: ${prismaMsg}`);
        const low = prismaMsg.toLowerCase();
        const looksSchema =
          low.includes('column') ||
          low.includes('does not exist') ||
          low.includes('unknown field') ||
          low.includes('undefined column');
        const mentionsHandoverEnum =
          low.includes('logisticshandoverstatus') ||
          (low.includes('expression is of type') && low.includes('handover') && low.includes('status'));
        const detail = looksSchema
          ? mentionsHandoverEnum
            ? 'The logistics_handovers.status column must use the same PostgreSQL enum as the API (HandoverStatus). On the API host run: npx prisma migrate deploy with production DATABASE_URL (includes migration 20260704120000_align_logistics_handover_status_column).'
            : 'The database is probably missing migrations for loading handover (pickup driver, photos, signature). On the API server, run: npx prisma migrate deploy — with the same DATABASE_URL as production — then retry. Ask your admin to check API logs.'
          : 'The request may be too large for the connection pool, or the database timed out. Try fewer photos, set BLOB_READ_WRITE_TOKEN on the API, or check API logs.';
        throw new BadRequestException(`Could not save loading handover to the database. ${detail}`);
      }
      this.logger.error(
        `logisticsHandover: ${e instanceof Error ? e.message : String(e)}`,
        e instanceof Error ? e.stack : undefined,
      );
      throw new BadRequestException(
        'Handover could not be saved. Please try again. If the problem continues, use smaller images (max 5MB each) or fewer files.',
      );
    }
  }

  /**
   * Get quality entry for a batch (accepts internal batch UUID or public lot code BATCH-…).
   */
  async getQualityEntry(batchRef: string) {
    const batch = await this.prisma.batches.findFirst({
      where: { OR: [{ id: batchRef }, { batchId: batchRef }] },
      select: { id: true },
    });
    if (!batch?.id) {
      return null;
    }
    return this.prisma.quality_entries.findUnique({
      where: { batchId: batch.id },
      include: {
        batches: {
          include: {
            estates: true,
          },
        },
      },
    });
  }

  /**
   * Check if batch can create shipment (quality entry completed). Accepts internal id or BATCH-…
   */
  async canCreateShipment(batchRef: string): Promise<boolean> {
    const batch = await this.prisma.batches.findFirst({
      where: { OR: [{ id: batchRef }, { batchId: batchRef }] },
      select: { id: true },
    });
    if (!batch?.id) {
      return false;
    }
    const qualityEntry = await this.prisma.quality_entries.findUnique({
      where: { batchId: batch.id },
    });

    return qualityEntry !== null && qualityEntry.status === 'COMPLETED';
  }

  /**
   * Receiver at farm/dock: name + optional signature image; PDF hash stored for audit.
   */
  async submitHandoverReceiverProof(userId: string, dto: HandoverReceiverProofDto) {
    const mission = await this.prisma.missions.findUnique({
      where: { id: dto.missionId },
      include: {
        logistics_handovers: true,
        batches: true,
        users_missions_logisticsPartnerIdTousers: true,
      },
    });
    if (!mission?.logistics_handovers) {
      throw new BadRequestException(
        'Loading handover not found for this mission. Complete temperature and photos first.',
      );
    }
    if (mission.logisticsPartnerId !== userId) {
      throw new ForbiddenException('Only the assigned logistics partner can submit receiver proof');
    }
    const h = mission.logistics_handovers;
    const signedAt = new Date();
    const lp = mission.users_missions_logisticsPartnerIdTousers;
    const partnerName = lp ? `${lp.firstName} ${lp.lastName}`.trim() : undefined;
    const buf = await buildLogisticsHandoverReceiverProofPdf({
      missionId: mission.id,
      batchPublicId: mission.batches?.batchId,
      productName: mission.batches?.productName,
      receiverName: dto.receiverName.trim(),
      signedAtIso: signedAt.toISOString(),
      logisticsPartnerName: partnerName,
      signatureDataUrl: dto.receiverSignatureDataUrl,
    });
    const receiverProofPdfHash = crypto.createHash('sha256').update(buf).digest('hex');
    await this.prisma.logistics_handovers.update({
      where: { id: h.id },
      data: {
        receiverName: dto.receiverName.trim(),
        receiverSignatureDataUrl: dto.receiverSignatureDataUrl?.trim() || null,
        receiverSignedAt: signedAt,
        receiverProofPdfHash,
      },
    });
    return {
      success: true as const,
      receiverProofPdfHash,
      message: 'Receiver proof saved. Download PDF via GET quality-entry/handover/mission/:missionId/receiver-pdf',
    };
  }

  async getHandoverReceiverPdfBuffer(missionId: string, userId: string): Promise<Buffer> {
    const mission = await this.prisma.missions.findUnique({
      where: { id: missionId },
      include: {
        logistics_handovers: true,
        batches: true,
        users_missions_logisticsPartnerIdTousers: true,
      },
    });
    if (!mission?.logistics_handovers) {
      throw new NotFoundException('Handover not found');
    }
    const h = mission.logistics_handovers;
    if (!h.receiverSignedAt || !h.receiverName) {
      throw new BadRequestException('Receiver proof has not been submitted for this mission');
    }
    const requester = await this.prisma.users.findUnique({ where: { id: userId } });
    const isAdmin = requester?.roles.some((r) => r === 'ADMIN' || r === 'SUPER_ADMIN');
    if (
      !isAdmin &&
      mission.logisticsPartnerId !== userId &&
      mission.growerId !== userId
    ) {
      throw new ForbiddenException('You cannot access this handover document');
    }
    const lp = mission.users_missions_logisticsPartnerIdTousers;
    return buildLogisticsHandoverReceiverProofPdf({
      missionId: mission.id,
      batchPublicId: mission.batches?.batchId,
      productName: mission.batches?.productName,
      receiverName: h.receiverName,
      signedAtIso: h.receiverSignedAt.toISOString(),
      logisticsPartnerName: lp ? `${lp.firstName} ${lp.lastName}`.trim() : undefined,
      signatureDataUrl: h.receiverSignatureDataUrl || undefined,
    });
  }
}
