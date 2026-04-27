import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQualityEntryDto, LogisticsHandoverDto } from './dto/quality-entry.dto';
import * as crypto from 'crypto';

@Injectable()
export class QualityEntryService {
  private readonly logger = new Logger(QualityEntryService.name);
  private readonly STANDARD_TRUCK_TEMP_MIN = 2; // °C
  private readonly STANDARD_TRUCK_TEMP_MAX = 8; // °C
  /** Per-image cap for data URLs / long URL strings (bytes as sent in JSON). */
  private readonly MAX_PHOTO_STRING_LENGTH = 5 * 1024 * 1024;

  constructor(private prisma: PrismaService) {}

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

    const batchIdFk = batch.id;

    const existing = await this.prisma.quality_entries.findUnique({
      where: { batchId: batchIdFk },
    });

    if (existing) {
      throw new BadRequestException(
        'Unos kvaliteta za ovaj lot već postoji. Ne šaljite ponovo. Nastavite sa prevozom (Request transport) ili proverite lot u My Batches. / A quality entry for this batch already exists. Continue with Request transport or check My Batches — no need to submit again.',
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
    if (qe.status !== 'COMPLETED') {
      throw new BadRequestException(
        `Quality entry for this lot is not completed (status: ${qe.status}). The grower must finish the quality step first.`,
      );
    }

    this.assertHandoverPhotos(dto.palletPhotos, 'Pallet photos');
    this.assertHandoverPhotos(dto.truckInteriorPhotos, 'Inside-truck photos');

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

    const palletJson = JSON.parse(JSON.stringify(dto.palletPhotos)) as Prisma.InputJsonValue;
    const truckJson = JSON.parse(JSON.stringify(dto.truckInteriorPhotos)) as Prisma.InputJsonValue;

    try {
      return await this.prisma.$transaction(async (tx) => {
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
          },
        });

        await tx.missions.update({
          where: { id: dto.missionId },
          data: { status: 'READY_FOR_LOADING' },
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
    } catch (e: unknown) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(`logisticsHandover Prisma ${e.code}: ${e.message} meta=${JSON.stringify(e.meta)}`);
        throw new BadRequestException(
          `Could not save handover (${e.code}). If you recently changed vehicle data, refresh missions and try again, or contact support.`,
        );
      }
      this.logger.error(`logisticsHandover: ${e instanceof Error ? e.message : String(e)}`);
      throw e;
    }
  }

  /**
   * Get quality entry for a batch
   */
  async getQualityEntry(batchId: string) {
    return this.prisma.quality_entries.findUnique({
      where: { batchId },
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
   * Check if batch can create shipment (quality entry completed)
   */
  async canCreateShipment(batchId: string): Promise<boolean> {
    const qualityEntry = await this.prisma.quality_entries.findUnique({
      where: { batchId },
    });

    return qualityEntry !== null && qualityEntry.status === 'COMPLETED';
  }
}
