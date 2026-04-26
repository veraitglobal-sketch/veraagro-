import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { FarmerAdminDetailResponse } from './dto/farmer-admin-detail.response';
import { includeSection, parseFarmerDetailIncludeParam } from './farmer-detail-include.util';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStatistics() {
    const [
      totalUsers,
      totalFarmers,
      totalBuyers,
      totalOrders,
      totalMissions,
      totalBatches,
      totalSecurityAlerts,
      todayOrders,
      todayRevenue,
      activeMissions,
      pendingSecurityAlerts,
      totalEstates,
      totalParcels,
      pendingParcelsCount,
      pendingEstatesCount,
    ] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.users.count({
        where: {
          OR: [
            { roles: { has: 'FARMER' } },
            { roles: { has: 'GROWER' } },
          ],
        },
      }),
      this.prisma.users.count({
        where: {
          roles: { has: 'BUYER' },
        },
      }),
      this.prisma.orders.count(),
      this.prisma.missions.count(),
      this.prisma.batches.count(),
      this.prisma.security_alerts.count(),
      this.prisma.orders.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.orders.aggregate({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
          status: {
            notIn: ['CANCELLED', 'REFUNDED'],
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      this.prisma.missions.count({
        where: {
          status: {
            in: ['PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'PICKED_UP', 'IN_TRANSIT'],
          },
        },
      }),
      this.prisma.security_alerts.count({
        where: {
          status: 'PENDING',
        },
      }),
      this.prisma.estates.count(),
      this.prisma.parcels.count(),
      this.prisma.parcels.count({ where: { approvedAt: null } }),
      this.prisma.estates.count({ where: { status: 'PENDING_SETUP' } }),
    ]);

    return {
      users: {
        total: totalUsers,
        farmers: totalFarmers,
        buyers: totalBuyers,
      },
      orders: {
        total: totalOrders,
        today: todayOrders,
        todayRevenue: todayRevenue._sum.totalAmount || 0,
      },
      missions: {
        total: totalMissions,
        active: activeMissions,
      },
      batches: {
        total: totalBatches,
      },
      security: {
        total: totalSecurityAlerts,
        pending: pendingSecurityAlerts,
      },
      estates: {
        total: totalEstates,
        pendingSetup: pendingEstatesCount,
      },
      parcels: {
        total: totalParcels,
        pendingApproval: pendingParcelsCount,
      },
    };
  }

  private async getFarmerResourceCounts(farmerId: string): Promise<FarmerAdminDetailResponse['counts']> {
    const [estates, parcels, batches, treatmentLogs, complianceLogs, growthLogs, missions] = await Promise.all([
      this.prisma.estates.count({ where: { ownerId: farmerId } }),
      this.prisma.parcels.count({ where: { estates: { ownerId: farmerId } } }),
      this.prisma.batches.count({ where: { estates: { ownerId: farmerId } } }),
      this.prisma.treatment_logs.count({
        where: { parcels: { estates: { ownerId: farmerId } } },
      }),
      this.prisma.compliance_logs.count({ where: { farmerId } }),
      this.prisma.growth_logs.count({ where: { userId: farmerId } }),
      this.prisma.missions.count({ where: { growerId: farmerId } }),
    ]);
    return {
      estates,
      parcels,
      batches,
      treatmentLogs,
      complianceLogs,
      growthLogs,
      missions,
    };
  }

  /**
   * Admin dossier. Optional `include` = comma list of sections; omit or `all` = full payload (default).
   * Always includes `meta` and `farmer` on success.
   */
  async getFarmerAdminDetail(farmerId: string, includeParam?: string): Promise<Partial<FarmerAdminDetailResponse> | FarmerAdminDetailResponse> {
    const I = parseFarmerDetailIncludeParam(includeParam);
    const W = (k: string) => includeSection(I, k);

    const userRow = await this.prisma.users.findUnique({
      where: { id: farmerId },
      include: {
        ...(W('materialBalance') ? { farmer_material_balances: true } : {}),
        ...(W('trust') ? { trust_scores: true } : {}),
        ...(W('kycDocuments') ? { kyc_documents: { orderBy: { createdAt: 'desc' as const }, take: 20 } } : {}),
      },
    });
    if (!userRow) {
      throw new NotFoundException('User not found');
    }

    const roles = userRow.roles || [];
    const isGrower = roles.includes('GROWER') || roles.includes('FARMER');
    if (!isGrower) {
      throw new BadRequestException('User is not a grower or farmer account');
    }

    const { passwordHash: _p, kyc_documents: kycList, farmer_material_balances: mat, trust_scores: tr, ...userCore } = userRow as any;
    const farmer: FarmerAdminDetailResponse['farmer'] = {
      id: userCore.id,
      partnerCode: userCore.partnerCode,
      email: userCore.email,
      phone: userCore.phone,
      firstName: userCore.firstName,
      lastName: userCore.lastName,
      roles: userCore.roles as string[],
      status: userCore.status,
      farmerQrCode: userCore.farmerQrCode,
      farmerProfileUrl: userCore.farmerProfileUrl,
      farmerPhoto: userCore.farmerPhoto,
      farmerBio: userCore.farmerBio,
      productionCountry: userCore.productionCountry,
      yearsOfExperience: userCore.yearsOfExperience,
      generation: userCore.generation,
      isVeraPartner: userCore.isVeraPartner,
      createdAt: userCore.createdAt.toISOString(),
      lastLoginAt: userCore.lastLoginAt?.toISOString() ?? null,
      updatedAt: userCore.updatedAt.toISOString(),
    };

    const materialBalance: FarmerAdminDetailResponse['materialBalance'] = W('materialBalance')
      ? mat
        ? {
            crateBalance: mat.crateBalance,
            labelRollBalance: mat.labelRollBalance,
            filmMeterBalance: mat.filmMeterBalance,
            lastUpdated: mat.lastUpdated.toISOString(),
          }
        : null
      : null;

    const trust: FarmerAdminDetailResponse['trust'] = W('trust')
      ? tr
        ? {
            currentScore: tr.currentScore,
            farmerScore: tr.farmerScore,
            averageRating: tr.averageRating,
            totalRatings: tr.totalRatings,
            lastUpdated: tr.lastUpdated.toISOString(),
          }
        : null
      : null;

    const kycDocuments: FarmerAdminDetailResponse['kycDocuments'] = W('kycDocuments')
      ? (kycList || []).map((d) => ({
          id: d.id,
          docType: d.docType,
          status: d.status,
          createdAt: d.createdAt.toISOString(),
          verifiedAt: d.verifiedAt?.toISOString() ?? null,
        }))
      : [];

    let estatesFull: any[] = [];
    let estateIds: string[] = [];
    let parcelIds: string[] = [];

    if (W('estates')) {
      estatesFull = await this.prisma.estates.findMany({
        where: { ownerId: farmerId },
        include: { parcels: { orderBy: { createdAt: 'desc' } } },
        orderBy: { createdAt: 'desc' },
      });
      estateIds = estatesFull.map((e) => e.id);
      parcelIds = estatesFull.flatMap((e) => e.parcels.map((p) => p.id));
    } else {
      const needEstateIds =
        W('batches') || W('batchesSummary') || W('compliancePhotos') || W('treatmentLogs');
      if (needEstateIds) {
        const slim = await this.prisma.estates.findMany({
          where: { ownerId: farmerId },
          select: { id: true, parcels: { select: { id: true } } },
        });
        estateIds = slim.map((e) => e.id);
        parcelIds = slim.flatMap((e) => e.parcels.map((p) => p.id));
      }
    }

    const wantGrowth = W('fieldPhotos') || W('growthLogs') || W('labResults');

    let batchesList: any[] = [];
    let compliancePhotosOnly: { id: string; photoUrl: string; photoType: string; batchId: string }[] = [];

    if (W('batches') && estateIds.length) {
      batchesList = await this.prisma.batches.findMany({
        where: { estateId: { in: estateIds } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          compliance_photos: { orderBy: { uploadedAt: 'desc' } },
          quality_entries: true,
          estates: { select: { id: true, name: true } },
          parcels: { select: { id: true, cropType: true } },
        },
      });
    } else if (W('batchesSummary') && !W('batches') && estateIds.length) {
      batchesList = await this.prisma.batches.findMany({
        where: { estateId: { in: estateIds } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          batchId: true,
          productName: true,
          quantity: true,
          status: true,
        },
      });
    } else if (W('compliancePhotos') && !W('batches') && estateIds.length) {
      const cps = await this.prisma.compliance_photos.findMany({
        where: { batches: { estateId: { in: estateIds } } },
        orderBy: { uploadedAt: 'desc' },
        take: 200,
      });
      compliancePhotosOnly = cps.map((c) => ({
        id: c.id,
        photoUrl: c.photoUrl,
        photoType: c.photoType,
        batchId: c.batchId,
      }));
    }

    const [growthLogs, treatmentLogs, harvestAnn, complianceLogs, missions] = await Promise.all([
      wantGrowth
        ? this.prisma.growth_logs.findMany({
            where: { userId: farmerId },
            orderBy: { createdAt: 'desc' },
            take: 100,
          })
        : Promise.resolve([] as Awaited<ReturnType<typeof this.prisma.growth_logs.findMany>>),
      W('treatmentLogs') && parcelIds.length
        ? this.prisma.treatment_logs.findMany({
            where: { parcelId: { in: parcelIds } },
            orderBy: { appliedAt: 'desc' },
            take: 100,
          })
        : Promise.resolve([] as Awaited<ReturnType<typeof this.prisma.treatment_logs.findMany>>),
      W('harvestAnnouncements')
        ? this.prisma.harvest_announcements.findMany({
            where: { userId: farmerId },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : Promise.resolve([] as Awaited<ReturnType<typeof this.prisma.harvest_announcements.findMany>>),
      W('complianceLogs')
        ? this.prisma.compliance_logs.findMany({
            where: { farmerId },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : Promise.resolve([] as Awaited<ReturnType<typeof this.prisma.compliance_logs.findMany>>),
      W('missions')
        ? this.prisma.missions.findMany({
            where: { growerId: farmerId },
            orderBy: { createdAt: 'desc' },
            take: 30,
            select: {
              id: true,
              missionNumber: true,
              status: true,
              batchId: true,
              pickupAddress: true,
              createdAt: true,
            },
          })
        : Promise.resolve([] as Awaited<ReturnType<typeof this.prisma.missions.findMany>>),
    ]);

    const batches: FarmerAdminDetailResponse['batches'] = W('batches')
      ? (batchesList as any[]).map((b) => {
          const qe = b.quality_entries;
          return {
            id: b.id,
            batchId: b.batchId,
            estateId: b.estateId,
            estateName: b.estates?.name ?? null,
            parcelId: b.parcelId,
            parcelCropType: b.parcels?.cropType ?? null,
            productName: b.productName,
            quantity: b.quantity,
            unit: b.unit,
            harvestDate: b.harvestDate.toISOString(),
            status: b.status,
            harvestedByUserId: b.harvestedByUserId,
            currentHubId: b.currentHubId,
            createdAt: b.createdAt.toISOString(),
            updatedAt: b.updatedAt.toISOString(),
            compliance_photos: (b.compliance_photos || []).map((c: any) => ({
              id: c.id,
              batchId: c.batchId,
              photoType: c.photoType,
              photoUrl: c.photoUrl,
              isVerified: c.isVerified,
              uploadedAt: c.uploadedAt.toISOString(),
              uploadedBy: c.uploadedBy,
            })),
            qualityEntry: qe
              ? {
                  id: qe.id,
                  status: qe.status,
                  preCoolingStartTime: qe.preCoolingStartTime.toISOString(),
                  standardConfirmation: qe.standardConfirmation,
                  createdAt: qe.createdAt.toISOString(),
                }
              : null,
          };
        })
      : [];

    const compliancePhotosFlat: FarmerAdminDetailResponse['compliancePhotos'] = W('batches')
      ? (batchesList as any[]).flatMap((b) =>
          (b.compliance_photos || []).map((c: any) => ({
            id: c.id,
            photoUrl: c.photoUrl,
            photoType: c.photoType,
            batchId: c.batchId,
          })),
        )
      : compliancePhotosOnly;

    const fieldPhotos: FarmerAdminDetailResponse['fieldPhotos'] = W('fieldPhotos')
      ? growthLogs.map((g) => ({
      id: g.id,
      imageUrl: g.imageUrl,
      imageHash: g.imageHash,
      createdAt: g.createdAt.toISOString(),
      growthStage: g.growthStage ?? undefined,
    }))
      : [];

    const growthLogsOut: FarmerAdminDetailResponse['growthLogs'] = W('growthLogs')
      ? growthLogs.map((g) => ({
      id: g.id,
      estateId: g.estateId,
      parcelId: g.parcelId,
      imageUrl: g.imageUrl,
      growthStage: g.growthStage,
      networkTimestamp: g.networkTimestamp.toISOString(),
      deviceTimestamp: g.deviceTimestamp.toISOString(),
      createdAt: g.createdAt.toISOString(),
      labResultUrl: g.labResultUrl,
      labTestDate: g.labTestDate?.toISOString() ?? null,
    }))
      : [];

    const labResults: FarmerAdminDetailResponse['labResults'] = W('labResults')
      ? growthLogs
          .filter((g) => g.labResultUrl)
          .map((g) => ({
            id: g.id,
            labResultUrl: g.labResultUrl!,
            labTestDate: g.labTestDate?.toISOString(),
            source: 'growth_log' as const,
          }))
      : [];

    const estates: FarmerAdminDetailResponse['estates'] = W('estates')
      ? (estatesFull as any[]).map((e) => ({
      id: e.id,
      name: e.name,
      status: e.status,
      polygonCoordinates: e.polygonCoordinates,
      calculatedArea: e.calculatedArea,
      verifiedArea: e.verifiedArea,
      estateQrCode: e.estateQrCode,
      certificationStartDate: e.certificationStartDate?.toISOString() ?? null,
      daysRemaining: e.daysRemaining,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      parcels: e.parcels.map((p) => ({
        id: p.id,
        estateId: p.estateId,
        cropType: p.cropType,
        calculatedArea: p.calculatedArea,
        status: p.status,
        validationError: p.validationError,
        inputSerialNumber: p.inputSerialNumber,
        plantingDate: p.plantingDate?.toISOString() ?? null,
        expectedHarvestDate: p.expectedHarvestDate?.toISOString() ?? null,
        approvedAt: p.approvedAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    }))
      : [];

    const treatmentOut: FarmerAdminDetailResponse['treatmentLogs'] = W('treatmentLogs')
      ? treatmentLogs.map((t) => ({
      id: t.id,
      parcelId: t.parcelId,
      productId: t.productId,
      productName: t.productName,
      dosage: t.dosage,
      waterVolume: t.waterVolume,
      reason: t.reason,
      appliedAt: t.appliedAt.toISOString(),
      gpsLatitude: t.gpsLatitude,
      gpsLongitude: t.gpsLongitude,
      gpsAccuracy: t.gpsAccuracy,
      deviceTimestamp: t.deviceTimestamp.toISOString(),
      needsAudit: t.needsAudit,
      createdAt: t.createdAt.toISOString(),
    }))
      : [];

    const complianceOut: FarmerAdminDetailResponse['complianceLogs'] = W('complianceLogs')
      ? complianceLogs.map((c) => ({
      id: c.id,
      estateId: c.estateId,
      parcelId: c.parcelId,
      entryType: c.entryType,
      isCompliant: c.isCompliant,
      complianceStatus: c.complianceStatus,
      blockedReason: c.blockedReason,
      gpsLatitude: c.gpsLatitude,
      gpsLongitude: c.gpsLongitude,
      isWithinFarm: c.isWithinFarm,
      deviceTimestamp: c.deviceTimestamp.toISOString(),
      createdAt: c.createdAt.toISOString(),
    }))
      : [];

    const harvestOut: FarmerAdminDetailResponse['harvestAnnouncements'] = W('harvestAnnouncements')
      ? harvestAnn.map((h) => ({
      id: h.id,
      parcelId: h.parcelId,
      announcementType: h.announcementType,
      cropType: h.cropType,
      estimatedDate: h.estimatedDate.toISOString(),
      estimatedQuantity: h.estimatedQuantity,
      status: h.status,
      marketChannel: h.marketChannel,
      qualityGrade: h.qualityGrade,
      adminNotes: h.adminNotes,
      createdAt: h.createdAt.toISOString(),
    }))
      : [];

    const missionsOut: FarmerAdminDetailResponse['missions'] = W('missions')
      ? missions.map((m) => ({
          id: m.id,
          missionNumber: m.missionNumber,
          status: m.status,
          batchId: m.batchId,
          pickupAddress: m.pickupAddress,
          createdAt: m.createdAt.toISOString(),
        }))
      : [];

    const totalParcels = W('estates')
      ? estatesFull.reduce((n: number, e: { parcels: { id: string }[] }) => n + e.parcels.length, 0)
      : 0;

    const batchesSummary: FarmerAdminDetailResponse['batchesSummary'] =
      W('batches') || W('batchesSummary')
        ? (batchesList as { id: string; batchId: string; productName: string; quantity: number; status: string }[]).map(
            (b) => ({
              id: b.id,
              batchId: b.batchId,
              productName: b.productName,
              quantity: b.quantity,
              status: b.status,
            }),
          )
        : [];

    const meta = { schemaVersion: 1 as const, generatedAt: new Date().toISOString() };
    let counts: FarmerAdminDetailResponse['counts'] | undefined;
    if (I === null) {
      counts = {
        estates: (estatesFull as any[]).length,
        parcels: totalParcels,
        batches: batchesList.length,
        treatmentLogs: treatmentLogs.length,
        complianceLogs: complianceLogs.length,
        growthLogs: growthLogs.length,
        missions: missions.length,
      };
    } else if (W('counts')) {
      counts = await this.getFarmerResourceCounts(farmerId);
    }

    if (I === null) {
      return {
        meta,
        farmer,
        materialBalance,
        trust,
        kycDocuments,
        estates,
        batches,
        compliancePhotos: compliancePhotosFlat,
        treatmentLogs: treatmentOut,
        complianceLogs: complianceOut,
        fieldPhotos,
        growthLogs: growthLogsOut,
        labResults,
        harvestAnnouncements: harvestOut,
        missions: missionsOut,
        batchesSummary,
        counts,
      } as FarmerAdminDetailResponse;
    }

    const out: Record<string, unknown> = { meta, farmer };
    if (W('counts') && counts !== undefined) out.counts = counts;
    if (W('materialBalance')) out.materialBalance = materialBalance;
    if (W('trust')) out.trust = trust;
    if (W('kycDocuments')) out.kycDocuments = kycDocuments;
    if (W('estates')) out.estates = estates;
    if (W('batches')) out.batches = batches;
    if (W('compliancePhotos') || W('batches')) out.compliancePhotos = compliancePhotosFlat;
    if (W('treatmentLogs')) out.treatmentLogs = treatmentOut;
    if (W('complianceLogs')) out.complianceLogs = complianceOut;
    if (W('fieldPhotos')) out.fieldPhotos = fieldPhotos;
    if (W('growthLogs')) out.growthLogs = growthLogsOut;
    if (W('labResults')) out.labResults = labResults;
    if (W('harvestAnnouncements')) out.harvestAnnouncements = harvestOut;
    if (W('missions')) out.missions = missionsOut;
    if (W('batchesSummary') || W('batches')) out.batchesSummary = batchesSummary;

    for (const k of Object.keys(out)) {
      if (out[k] === undefined) delete out[k];
    }
    return out as unknown as FarmerAdminDetailResponse;
  }

  async getRecentActivities(limit: number = 10) {
    const [recentOrders, recentMissions, recentAlerts, pendingParcels, recentBatches] = await Promise.all([
      this.prisma.orders.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              partnerCode: true,
            },
          },
          estates: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.missions.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          users_missions_growerIdTousers: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.security_alerts.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.parcels.findMany({
        where: { approvedAt: null },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          estates: {
            select: {
              id: true,
              name: true,
              ownerId: true,
              users: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  partnerCode: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.batches.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          estates: {
            select: {
              id: true,
              name: true,
            },
          },
          parcels: {
            select: {
              id: true,
              cropType: true,
            },
          },
        },
      }),
    ]);

    return {
      orders: recentOrders,
      missions: recentMissions,
      alerts: recentAlerts,
      pendingParcels,
      recentBatches,
    };
  }
}
