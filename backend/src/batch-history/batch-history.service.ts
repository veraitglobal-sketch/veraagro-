import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DistributorArrivalDto, BorderWaitTimeDto } from './dto/batch-history.dto';

@Injectable()
export class BatchHistoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get complete batch history (Chain of Custody)
   */
  async getBatchHistory(batchId: string) {
    const batch = await this.prisma.batches.findUnique({
      where: { id: batchId },
      include: {
        estates: {
          include: {
            users: true,
          },
        },
        parcels: true,
        users_batches_harvestedByUserIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        quality_entries: true,
        freshness_trackers: true,
        distributor_arrivals: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        missions: {
          include: {
            users_missions_logisticsPartnerIdTousers: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            vehicles: true,
            logistics_handovers: true,
            temperature_logs: {
              orderBy: { timestamp: 'asc' },
              include: {
                users: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            location_logs: {
              orderBy: { timestamp: 'asc' },
            },
            border_wait_times: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        audit_trails: {
          where: {
            entityType: 'Batch',
            entityId: batchId,
          },
          orderBy: { timestamp: 'asc' },
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                roles: true,
              },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`Batch ${batchId} not found`);
    }

    // Build Chain of Custody timeline
    const timeline = this.buildTimeline(batch);

    // Calculate compliance score
    const complianceScore = this.calculateComplianceScore(batch);

    return {
      batch: {
        id: batch.id,
        batchId: batch.batchId,
        productName: batch.productName,
        quantity: batch.quantity,
        unit: batch.unit,
        harvestDate: batch.harvestDate,
        status: batch.status,
      },
      origin: {
        estate: {
          name: batch.estates.name,
          owner: {
            name: `${batch.estates.users.firstName} ${batch.estates.users.lastName}`,
            email: batch.estates.users.email,
            phone: batch.estates.users.phone,
          },
        },
        parcel: batch.parcels ? {
          cropType: batch.parcels.cropType,
          plantingDate: batch.parcels.plantingDate,
        } : null,
        harvestedBy: batch.users_batches_harvestedByUserIdTousers ? {
          name: `${batch.users_batches_harvestedByUserIdTousers.firstName} ${batch.users_batches_harvestedByUserIdTousers.lastName}`,
          email: batch.users_batches_harvestedByUserIdTousers.email,
          phone: batch.users_batches_harvestedByUserIdTousers.phone,
        } : null,
      },
      farmerEntry: batch.quality_entries ? {
        weatherAtHarvest: batch.quality_entries.weatherAtHarvest,
        preCoolingStartTime: batch.quality_entries.preCoolingStartTime,
        visualGradePhotos: batch.quality_entries.visualGradePhotos,
        standardConfirmation: batch.quality_entries.standardConfirmation,
        confirmedAt: batch.quality_entries.createdAt,
      } : null,
      logistics: batch.missions.map((mission) => ({
        missionNumber: mission.missionNumber,
        logisticsPartner: mission.users_missions_logisticsPartnerIdTousers ? {
          name: `${mission.users_missions_logisticsPartnerIdTousers.firstName} ${mission.users_missions_logisticsPartnerIdTousers.lastName}`,
          email: mission.users_missions_logisticsPartnerIdTousers.email,
          phone: mission.users_missions_logisticsPartnerIdTousers.phone,
        } : null,
        vehicle: mission.vehicles ? {
          vehicleNumber: mission.vehicles.vehicleNumber,
          licensePlate: mission.vehicles.licensePlate,
          type: mission.vehicles.type,
        } : null,
        handover: mission.logistics_handovers ? {
          insideTruckTemperature: mission.logistics_handovers.insideTruckTemperature,
          verifiedAt: mission.logistics_handovers.timestamp,
        } : null,
        pickupLocation: mission.pickupLocation,
        pickupAddress: mission.pickupAddress,
        requestedAt: mission.requestedAt,
        pickedUpAt: mission.pickedUpAt,
        completedAt: mission.completedAt,
        temperatureLogs: mission.temperature_logs,
        locationLogs: mission.location_logs,
        borderWaitTimes: mission.border_wait_times,
      })),
      distributorArrivals: batch.distributor_arrivals.map((arrival) => ({
        hubName: arrival.hubName,
        arrivalTime: arrival.arrivalTime,
        temperatureAtArrival: arrival.temperatureAtArrival,
        visualState: arrival.visualState,
        notes: arrival.notes,
        photos: arrival.photos,
        recordedBy: arrival.users ? {
          name: `${arrival.users.firstName} ${arrival.users.lastName}`,
          email: arrival.users.email,
        } : null,
      })),
      freshness: batch.freshness_trackers ? {
        timestampHarvested: batch.freshness_trackers.timestampHarvested,
        shelfLifeHours: batch.freshness_trackers.shelfLifeHours,
        remainingShelfLifeHours: batch.freshness_trackers.remainingShelfLifeHours,
        expiresAt: batch.freshness_trackers.expiresAt,
        isExpired: batch.freshness_trackers.isExpired,
      } : null,
      timeline,
      complianceScore,
      auditTrail: batch.audit_trails,
    };
  }

  /**
   * Record distributor arrival (Hamburg distributor entry)
   */
  async recordDistributorArrival(userId: string, dto: DistributorArrivalDto) {
    const batch = await this.prisma.batches.findUnique({
      where: { id: dto.batchId },
    });

    if (!batch) {
      throw new NotFoundException(`Batch ${dto.batchId} not found`);
    }

    // Get hub info (assuming user is hub manager)
    const hub = await this.prisma.hubs.findFirst({
      where: {
        managerId: userId,
      },
    });

    const arrival = await this.prisma.distributor_arrivals.create({
      data: {
        batchId: dto.batchId,
        hubName: hub?.name || 'Unknown Hub',
        arrivalTime: new Date(),
        temperatureAtArrival: dto.temperatureAtArrival,
        visualState: dto.visualState,
        notes: dto.notes,
        photos: dto.photos || [],
        recordedByUserId: userId,
      } as any,
    });

    // Create audit trail
    await this.prisma.audit_trails.create({
      data: {
        id: crypto.randomUUID(),
        eventType: 'QUALITY_CHECK',
        entityType: 'Batch',
        entityId: dto.batchId,
        newValue: {
          distributorArrival: arrival.id,
          temperatureAtArrival: dto.temperatureAtArrival,
          visualState: dto.visualState,
        },
        changeReason: 'Distributor arrival recorded',
        isCompliant: dto.temperatureAtArrival >= 2 && dto.temperatureAtArrival <= 8,
        timestamp: new Date(),
        performedByUserId: userId,
      } as any,
    });

    return arrival;
  }

  /**
   * Record border wait time
   */
  async recordBorderWaitTime(userId: string, dto: BorderWaitTimeDto) {
    const mission = await this.prisma.missions.findUnique({
      where: { id: dto.missionId },
    });

    if (!mission) {
      throw new NotFoundException(`Mission ${dto.missionId} not found`);
    }

    const borderWaitTime = await this.prisma.border_wait_times.create({
      data: {
        missionId: dto.missionId,
        borderArrivalTime: new Date(dto.borderArrivalTime),
        borderExitTime: new Date(dto.borderExitTime),
        waitTimeMinutes: dto.waitTimeMinutes,
        borderName: dto.borderName,
        notes: dto.notes,
        recordedByUserId: userId,
      } as any,
    });

    // Create audit trail
    await this.prisma.audit_trails.create({
      data: {
        id: crypto.randomUUID(),
        eventType: 'LOCATION_CHANGE',
        entityType: 'Mission',
        entityId: dto.missionId,
        newValue: {
          borderWaitTime: borderWaitTime.id,
          waitTimeMinutes: dto.waitTimeMinutes,
        },
        changeReason: 'Border crossing recorded',
        isCompliant: true,
        timestamp: new Date(),
        performedByUserId: userId,
      } as any,
    });

    return borderWaitTime;
  }

  /**
   * Build timeline from all events
   */
  private buildTimeline(batch: any) {
    const events: any[] = [];

    // Harvest event
    if (batch.harvestDate) {
      events.push({
        type: 'HARVEST',
        timestamp: batch.harvestDate,
        actor: batch.users_batches_harvestedByUserIdTousers ? `${batch.users_batches_harvestedByUserIdTousers.firstName} ${batch.users_batches_harvestedByUserIdTousers.lastName}` : 'Unknown',
        description: `Harvested ${batch.quantity} ${batch.unit} of ${batch.productName}`,
        location: batch.estates.name,
      });
    }

    // Quality entry
    if (batch.quality_entries) {
      events.push({
        type: 'QUALITY_ENTRY',
        timestamp: batch.quality_entries.createdAt,
        actor: 'Farmer',
        description: 'Quality entry completed',
        data: {
          weather: batch.quality_entries.weatherAtHarvest,
          preCoolingStartTime: batch.quality_entries.preCoolingStartTime,
        },
      });
    }

    // Mission events
    batch.missions.forEach((mission: any) => {
      if (mission.requestedAt) {
        events.push({
          type: 'MISSION_REQUESTED',
          timestamp: mission.requestedAt,
          actor: 'Grower',
          description: `Mission ${mission.missionNumber} requested`,
        });
      }

      if (mission.logistics_handovers) {
        events.push({
          type: 'TRUCK_TEMPERATURE_VERIFIED',
          timestamp: mission.logistics_handovers.timestamp,
          actor: mission.users_missions_logisticsPartnerIdTousers ? `${mission.users_missions_logisticsPartnerIdTousers.firstName} ${mission.users_missions_logisticsPartnerIdTousers.lastName}` : 'Driver',
          description: `Truck temperature verified: ${mission.logistics_handovers.insideTruckTemperature}°C`,
        });
      }

      if (mission.pickedUpAt) {
        events.push({
          type: 'PICKED_UP',
          timestamp: mission.pickedUpAt,
          actor: mission.users_missions_logisticsPartnerIdTousers ? `${mission.users_missions_logisticsPartnerIdTousers.firstName} ${mission.users_missions_logisticsPartnerIdTousers.lastName}` : 'Driver',
          description: `Picked up from ${mission.pickupAddress}`,
        });
      }

      // Border crossings
      mission.border_wait_times.forEach((border: any) => {
        events.push({
          type: 'BORDER_CROSSING',
          timestamp: border.borderArrivalTime,
          actor: mission.users_missions_logisticsPartnerIdTousers ? `${mission.users_missions_logisticsPartnerIdTousers.firstName} ${mission.users_missions_logisticsPartnerIdTousers.lastName}` : 'Driver',
          description: `Arrived at ${border.borderName || 'border'}`,
          data: {
            waitTimeMinutes: border.waitTimeMinutes,
            exitTime: border.borderExitTime,
          },
        });
      });

      if (mission.completedAt) {
        events.push({
          type: 'DELIVERED_TO_HUB',
          timestamp: mission.completedAt,
          actor: mission.users_missions_logisticsPartnerIdTousers ? `${mission.users_missions_logisticsPartnerIdTousers.firstName} ${mission.users_missions_logisticsPartnerIdTousers.lastName}` : 'Driver',
          description: 'Delivered to hub',
        });
      }
    });

    // Distributor arrivals
    batch.distributor_arrivals.forEach((arrival: any) => {
      events.push({
        type: 'DISTRIBUTOR_ARRIVAL',
        timestamp: arrival.arrivalTime,
        actor: `${arrival.users.firstName} ${arrival.users.lastName}`,
        description: `Arrived at ${arrival.hubName}`,
        data: {
          temperature: arrival.temperatureAtArrival,
          visualState: arrival.visualState,
        },
      });
    });

    // Sort by timestamp
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return events;
  }

  /**
   * Calculate compliance score based on all data points
   */
  private calculateComplianceScore(batch: any): number {
    let score = 100;
    const issues: string[] = [];

    // Check quality entry
    if (!batch.quality_entries) {
      score -= 20;
      issues.push('Missing quality entry');
    } else if (!batch.quality_entries.standardConfirmation) {
      score -= 10;
      issues.push('Standard confirmation not checked');
    }

    // Check temperature logs
    batch.missions.forEach((mission: any) => {
      if (mission.logistics_handovers) {
        const temp = mission.logistics_handovers.insideTruckTemperature;
        if (temp < 2 || temp > 8) {
          score -= 15;
          issues.push(`Truck temperature out of range: ${temp}°C`);
        }
      }

      mission.temperature_logs.forEach((log: any) => {
        if (log.isOutOfRange) {
          score -= 5;
          issues.push(`Temperature out of range at ${log.timestamp}`);
        }
      });
    });

    // Check distributor arrivals
    batch.distributor_arrivals.forEach((arrival: any) => {
      if (arrival.temperatureAtArrival < 2 || arrival.temperatureAtArrival > 8) {
        score -= 10;
        issues.push(`Arrival temperature out of range: ${arrival.temperatureAtArrival}°C`);
      }
      if (arrival.visualState === 'DAMAGED') {
        score -= 20;
        issues.push('Visual state: DAMAGED');
      }
    });

    return Math.max(0, score);
  }
}
