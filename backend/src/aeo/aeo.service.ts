import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AeoService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all batches in a specific vehicle/mission for customs
   */
  async getBatchesByVehicle(vehicleId: string) {
    const vehicle = await this.prisma.vehicles.findUnique({
      where: { id: vehicleId },
      include: {
        missions: {
          include: {
            batches: {
              include: {
                estates: {
                  include: {
                    users: true,
                    digital_passports: {
                      where: {
                        status: {
                          in: ['GENERATED', 'VERIFIED'],
                        },
                      },
                    },
                  },
                },
                 parcels: true,
                freshness_trackers: true,
                temperature_logs: {
                  orderBy: {
                    timestamp: 'asc',
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!vehicle) {
      throw new Error(`Vehicle with ID ${vehicleId} not found`);
    }

    const batches = vehicle.missions
      .filter(m => m.batches)
      .map(m => ({
        batch: m.batches,
        mission: {
          id: m.id,
          missionNumber: m.missionNumber,
          status: m.status,
          pickupLocation: m.pickupLocation,
          pickedUpAt: m.pickedUpAt,
        },
      }));

    // Get seal status (simplified - in production, this would be from IoT seal sensor)
    const sealStatus = {
      isSealed: true,
      sealedAt: vehicle.missions[0]?.pickedUpAt || new Date(),
      sealId: `SEAL-${vehicleId}-${Date.now()}`,
      isIntact: true, // Would be checked via IoT sensor
    };

    return {
      vehicle: {
        id: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber,
        licensePlate: vehicle.licensePlate,
        type: vehicle.type,
        tempRange: {
          min: vehicle.tempRangeMin,
          max: vehicle.tempRangeMax,
        },
      },
      sealStatus,
      batches: batches.map(b => ({
        batchId: b.batch.batchId,
        productName: b.batch.productName,
        quantity: b.batch.quantity,
        unit: b.batch.unit,
        harvestDate: b.batch.harvestDate,
        origin: {
          farmName: b.batch.estates.name,
          ownerName: `${b.batch.estates.users.firstName} ${b.batch.estates.users.lastName}`,
          gpsLocation: b.batch.estates.polygonCoordinates,
        },
        freshness: b.batch.freshness_trackers ? {
          timestampHarvested: b.batch.freshness_trackers.timestampHarvested,
          expiresAt: b.batch.freshness_trackers.expiresAt,
          remainingHours: b.batch.freshness_trackers.remainingShelfLifeHours,
        } : null,
        temperatureHistory: b.batch.temperature_logs.map(log => ({
          timestamp: log.timestamp,
          temperature: log.temperature,
          isWithinRange: log.temperature >= 2 && log.temperature <= 8,
        })),
        digitalPassports: (b.batch.estates.digital_passports || []).map(passport => ({
          id: passport.id,
          passportHash: passport.passportHash,
          status: passport.status,
          generatedAt: passport.generatedAt,
          exportData: passport.exportData,
        })),
        mission: b.mission,
        qualityStatus: b.batch.qualityIssues,
      })),
      summary: {
        totalBatches: batches.length,
        totalWeight: batches.reduce((sum, b) => sum + b.batch.quantity, 0),
        temperatureRange: this.calculateTemperatureRange(batches.map(b => b.batch.temperature_logs)),
        allSealsIntact: sealStatus.isIntact,
      },
    };
  }

  /**
   * Get AEO export data for customs
   */
  async getAeoExportData(missionId: string) {
    const mission = await this.prisma.missions.findUnique({
      where: { id: missionId },
      include: {
        batches: {
          include: {
            estates: {
              include: {
                digital_passports: true,
              },
            },
            parcels: true,
            freshness_trackers: true,
            temperature_logs: true,
          },
        },
        vehicles: true,
        users_missions_logisticsPartnerIdTousers: true,
      },
    });

    if (!mission) {
      throw new Error(`Mission with ID ${missionId} not found`);
    }

    return {
      mission: {
        id: mission.id,
        missionNumber: mission.missionNumber,
        status: mission.status,
      },
      vehicle: {
        vehicleNumber: mission.vehicles?.vehicleNumber,
        licensePlate: mission.vehicles?.licensePlate,
      },
      logisticsPartner: {
        name: mission.users_missions_logisticsPartnerIdTousers
          ? `${mission.users_missions_logisticsPartnerIdTousers.firstName} ${mission.users_missions_logisticsPartnerIdTousers.lastName}`
          : null,
      },
      batch: mission.batches ? {
        batchId: mission.batches.batchId,
        productName: mission.batches.productName,
        quantity: mission.batches.quantity,
        harvestDate: mission.batches.harvestDate,
        origin: {
          farmName: mission.batches.estates.name,
          gpsLocation: mission.batches.estates.polygonCoordinates,
        },
        digitalPassports: mission.batches.estates.digital_passports || [],
        temperatureCompliance: this.checkTemperatureCompliance(mission.batches.temperature_logs),
      } : null,
    };
  }

  /**
   * Calculate temperature range from logs
   */
  private calculateTemperatureRange(allLogs: any[]): { min: number; max: number; avg: number } {
    const allTemps = allLogs.flat().map(log => log.temperature);
    if (allTemps.length === 0) {
      return { min: 0, max: 0, avg: 0 };
    }
    return {
      min: Math.min(...allTemps),
      max: Math.max(...allTemps),
      avg: allTemps.reduce((sum, t) => sum + t, 0) / allTemps.length,
    };
  }

  /**
   * Check temperature compliance
   */
  private checkTemperatureCompliance(logs: any[]): {
    isCompliant: boolean;
    violations: number;
    minTemp: number;
    maxTemp: number;
  } {
    if (logs.length === 0) {
      return { isCompliant: true, violations: 0, minTemp: 0, maxTemp: 0 };
    }

    const temps = logs.map(log => log.temperature);
    const violations = logs.filter(log => log.temperature < 2 || log.temperature > 8).length;

    return {
      isCompliant: violations === 0,
      violations,
      minTemp: Math.min(...temps),
      maxTemp: Math.max(...temps),
    };
  }
}
