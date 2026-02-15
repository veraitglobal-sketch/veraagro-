import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** HACCP overview row for admin monitoring */
export interface HaccpOverviewRow {
  batchId: string;
  farmerName: string;
  farmerId: string;
  productName: string;
  harvestDate: string;
  loadTemperature?: number;
  loadTemperatureOk: boolean;
  compliancePhotosCount: number;
  requiredPhotosCount: number;
  haccpStatus: 'VERIFIED' | 'PENDING' | 'FAIL';
  lastUpdated: string;
}

/** HACCP track data for buyer (public link) */
export interface HaccpTractData {
  batchId: string;
  productName: string;
  quantity: number;
  unit: string;
  harvestDate: string;
  farmerName: string;
  haccpStatus: 'VERIFIED' | 'PENDING' | 'FAIL';
  loadTemperature?: number;
  loadTemperatureOk?: boolean;
  compliancePhotos: Array<{ photoType: string; photoUrl: string; isVerified: boolean }>;
  temperatureHistory?: Array<{ temperature: number; timestamp: string }>;
}

@Injectable()
export class HaccpService {
  constructor(private prisma: PrismaService) {}

  /** Admin: Get HACCP monitoring overview */
  async getOverview(): Promise<HaccpOverviewRow[]> {
    const standards = await this.prisma.bio_vera_standards.findFirst({
      where: { isActive: true },
    });
    const requiredPhotos = standards?.requiredPhotoTypes?.length ?? 3;
    const tempMin = standards?.requiredTemperatureMin ?? 2;
    const tempMax = standards?.requiredTemperatureMax ?? 8;

    const batches = await this.prisma.batches.findMany({
      where: { status: { in: ['PACKED', 'IN_TRANSIT', 'DELIVERED'] } },
      include: {
        estates: {
          include: {
            users: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        compliance_photos: true,
        distributor_arrivals: { orderBy: { arrivalTime: 'desc' }, take: 1 },
        temperature_logs: { orderBy: { timestamp: 'desc' }, take: 5 },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    const rows: HaccpOverviewRow[] = batches.map((b) => {
      const farmerName = b.estates?.users
        ? `${b.estates.users.firstName} ${b.estates.users.lastName}`
        : 'Unknown';
      const farmerId = b.estates?.ownerId ?? '';

      const arrival = b.distributor_arrivals?.[0];
      const loadTemp = arrival?.temperatureAtArrival ?? b.temperature_logs?.[0]?.temperature;
      const loadTempOk =
        loadTemp != null ? loadTemp >= tempMin && loadTemp <= tempMax : true;

      const photosCount = b.compliance_photos?.length ?? 0;
      const photosOk = photosCount >= requiredPhotos;
      const allVerified =
        (b.compliance_photos?.length ?? 0) > 0 &&
        b.compliance_photos.every((p) => p.isVerified);

      let haccpStatus: HaccpOverviewRow['haccpStatus'] = 'PENDING';
      if (photosOk && loadTempOk && allVerified) haccpStatus = 'VERIFIED';
      else if (!loadTempOk || !photosOk) haccpStatus = 'FAIL';

      const lastUpdated =
        b.updatedAt?.toISOString() ??
        b.distributor_arrivals?.[0]?.arrivalTime?.toISOString() ??
        new Date().toISOString();

      return {
        batchId: b.batchId,
        farmerName,
        farmerId,
        productName: b.productName,
        harvestDate: b.harvestDate?.toISOString() ?? '',
        loadTemperature: loadTemp,
        loadTemperatureOk: loadTempOk,
        compliancePhotosCount: photosCount,
        requiredPhotosCount: requiredPhotos,
        haccpStatus,
        lastUpdated,
      };
    });

    return rows;
  }

  /** Public: Get HACCP status for batch (buyer track link) */
  async getTrackData(batchId: string): Promise<HaccpTractData | null> {
    const batch = await this.prisma.batches.findFirst({
      where: { batchId },
      include: {
        estates: {
          include: {
            users: { select: { firstName: true, lastName: true } },
          },
        },
        compliance_photos: true,
        distributor_arrivals: { orderBy: { arrivalTime: 'desc' }, take: 1 },
        temperature_logs: { orderBy: { timestamp: 'desc' }, take: 20 },
      },
    });

    if (!batch) return null;

    const standards = await this.prisma.bio_vera_standards.findFirst({
      where: { isActive: true },
    });
    const requiredPhotos = standards?.requiredPhotoTypes?.length ?? 3;
    const tempMin = standards?.requiredTemperatureMin ?? 2;
    const tempMax = standards?.requiredTemperatureMax ?? 8;

    const farmerName = batch.estates?.users
      ? `${batch.estates.users.firstName} ${batch.estates.users.lastName}`
      : 'Unknown';

    const arrival = batch.distributor_arrivals?.[0];
    const loadTemp = arrival?.temperatureAtArrival ?? batch.temperature_logs?.[0]?.temperature;
    const loadTempOk =
      loadTemp != null ? loadTemp >= tempMin && loadTemp <= tempMax : undefined;

    const photosCount = batch.compliance_photos?.length ?? 0;
    const photosOk = photosCount >= requiredPhotos;
    const allVerified =
      photosCount > 0 &&
      batch.compliance_photos!.every((p) => p.isVerified);

    let haccpStatus: HaccpTractData['haccpStatus'] = 'PENDING';
    if (photosOk && (loadTempOk !== false) && allVerified) haccpStatus = 'VERIFIED';
    else if (loadTempOk === false || !photosOk) haccpStatus = 'FAIL';

    return {
      batchId: batch.batchId,
      productName: batch.productName,
      quantity: batch.quantity,
      unit: batch.unit,
      harvestDate: batch.harvestDate?.toISOString() ?? '',
      farmerName,
      haccpStatus,
      loadTemperature: loadTemp,
      loadTemperatureOk: loadTempOk,
      compliancePhotos:
        batch.compliance_photos?.map((p) => ({
          photoType: p.photoType,
          photoUrl: p.photoUrl,
          isVerified: p.isVerified,
        })) ?? [],
      temperatureHistory:
        batch.temperature_logs?.map((t) => ({
          temperature: t.temperature,
          timestamp: t.timestamp?.toISOString() ?? '',
        })) ?? [],
    };
  }
}
