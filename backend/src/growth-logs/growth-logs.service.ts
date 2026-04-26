import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AntiFraudService } from '../anti-fraud/anti-fraud.service';
import { CryptoUtil } from '../common/utils/crypto.util';

@Injectable()
export class GrowthLogsService {
  constructor(
    private prisma: PrismaService,
    private antiFraudService: AntiFraudService,
  ) {}

  async create(userId: string, data: {
    estateId: string;
    parcelId?: string;
    imageUrl: string;
    imageHash: string;
    gpsLatitude: number;
    gpsLongitude: number;
    deviceId: string;
    deviceTimestamp: Date | string;
    notes?: string;
    growthStage?: string;
  }) {
    const deviceTimestamp =
      data.deviceTimestamp instanceof Date
        ? data.deviceTimestamp
        : new Date(String(data.deviceTimestamp));
    if (Number.isNaN(deviceTimestamp.getTime())) {
      throw new BadRequestException('Invalid deviceTimestamp');
    }
    // Verify estate ownership
    const estate = await this.prisma.estates.findFirst({
      where: {
        id: data.estateId,
        ownerId: userId,
      },
    });

    if (!estate) {
      throw new ForbiddenException('Estate not found or access denied');
    }

    if (data.parcelId) {
      const parcel = await this.prisma.parcels.findFirst({
        where: { id: data.parcelId, estateId: data.estateId },
      });
      if (!parcel) {
        throw new ForbiddenException('Parcel not found on this estate');
      }
      if (!parcel.approvedAt) {
        throw new ForbiddenException(
          'This parcel is not approved yet. Growth journal entries are available after an administrator approves the parcel.',
        );
      }
    } else {
      const approved = await this.prisma.parcels.count({
        where: { estateId: data.estateId, approvedAt: { not: null } },
      });
      const anyParcel = await this.prisma.parcels.count({
        where: { estateId: data.estateId },
      });
      if (anyParcel > 0 && approved === 0) {
        throw new ForbiddenException(
          'Journal entries require at least one administrator-approved parcel on this field.',
        );
      }
    }

    // Anti-fraud validation
    const fraudValidation = await this.antiFraudService.validateGrowthLogSubmission({
      gpsLatitude: data.gpsLatitude,
      gpsLongitude: data.gpsLongitude,
      deviceTimestamp,
      deviceId: data.deviceId,
      imageHash: data.imageHash,
    });

    if (!fraudValidation.isValid) {
      throw new BadRequestException(`Fraud validation failed: ${fraudValidation.errors.join(', ')}`);
    }

    // Calculate time offset
    const networkTimestamp = new Date();
    const timestampValidation = this.antiFraudService.validateTimestamp(
      deviceTimestamp,
      networkTimestamp,
    );

    // Get previous log hash for chaining
    const previousLog = await this.prisma.growth_logs.findFirst({
      where: {
        estateId: data.estateId,
        parcelId: data.parcelId || null,
      },
      orderBy: { createdAt: 'desc' },
      select: { dataHash: true },
    });

    // Generate cryptographic hash for this log (Immutable proof)
    const dataHash = CryptoUtil.hashGrowthLog({
      userId,
      estateId: data.estateId,
      parcelId: data.parcelId || null,
      imageHash: data.imageHash,
      gpsLatitude: data.gpsLatitude,
      gpsLongitude: data.gpsLongitude,
      networkTimestamp,
    });

    // Check for duplicate hash (data integrity)
    const existingLog = await this.prisma.growth_logs.findUnique({
      where: { dataHash },
    });

    if (existingLog) {
      throw new BadRequestException('Duplicate log detected. This entry already exists.');
    }

    // Create immutable log
    const growthLog = await this.prisma.growth_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        estateId: data.estateId,
        parcelId: data.parcelId || null,
        imageUrl: data.imageUrl,
        imageHash: data.imageHash,
        gpsLatitude: data.gpsLatitude,
        gpsLongitude: data.gpsLongitude,
        deviceId: data.deviceId,
        networkTimestamp,
        deviceTimestamp,
        timeOffset: timestampValidation.timeOffset,
        notes: data.notes,
        growthStage: data.growthStage,
        dataHash,
        previousLogHash: previousLog?.dataHash || null,
      },
    });

    return growthLog;
  }

  async findAllByEstate(estateId: string, userId: string) {
    // Verify ownership
    const estate = await this.prisma.estates.findFirst({
      where: {
        id: estateId,
        ownerId: userId,
      },
    });

    if (!estate) {
      throw new ForbiddenException('Estate not found or access denied');
    }

    return this.prisma.growth_logs.findMany({
      where: { estateId },
      orderBy: { createdAt: 'desc' },
      include: {
        parcels: {
          select: {
            id: true,
            cropType: true,
          },
        },
      },
    });
  }

  async findAllByParcel(parcelId: string, userId: string) {
    const parcel = await this.prisma.parcels.findFirst({
      where: {
        id: parcelId,
        estates: {
          ownerId: userId,
        },
      },
    });

    if (!parcel) {
      throw new ForbiddenException('Parcel not found or access denied');
    }

    return this.prisma.growth_logs.findMany({
      where: { parcelId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
