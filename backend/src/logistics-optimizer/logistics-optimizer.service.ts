import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface HarvestPrediction {
  targetDate: Date;
  estimatedReadyDate: Date;
  confidence: number; // 0-1
  farmersInvolved: number;
  totalQuantity: number; // kg
  villageClusters: VillageCluster[];
  warnings: string[];
}

export interface VillageCluster {
  clusterId: string;
  villageName: string;
  farmers: Array<{
    farmerId: string;
    farmerName: string;
    farmLocation: { lat: number; lng: number };
    estimatedQuantity: number; // kg
    estimatedReadyDate: Date;
  }>;
  totalQuantity: number; // kg
  clusterCenter: { lat: number; lng: number };
  estimatedReadyDate: Date;
}

export interface LoadPlan {
  truckId: string;
  truckCapacity: {
    length: number; // meters
    width: number;
    height: number;
    maxWeight: number; // kg
  };
  pallets: Array<{
    palletId: string;
    position: { x: number; y: number; z: number }; // meters from front-left-bottom
    dimensions: { length: number; width: number; height: number };
    weight: number; // kg
    batchId: string;
    farmerId: string;
    villageCluster: string;
  }>;
  utilization: {
    volumeUsed: number; // m³
    volumeTotal: number; // m³
    weightUsed: number; // kg
    weightTotal: number; // kg
    volumeEfficiency: number; // percentage
    weightEfficiency: number; // percentage
  };
  loadingSequence: string[]; // Order of pallet IDs to load
}

export interface WeatherCheckResult {
  route: {
    origin: { lat: number; lng: number; name: string };
    destination: { lat: number; lng: number; name: string };
    waypoints?: Array<{ lat: number; lng: number; name: string }>;
  };
  weatherForecast: Array<{
    location: { lat: number; lng: number; name: string };
    date: Date;
    condition: string; // "rain", "snow", "clear", etc.
    precipitation: number; // mm
    severity: 'low' | 'medium' | 'high';
  }>;
  recommendedDepartureTime: Date;
  originalDepartureTime: Date;
  adjustmentReason: string;
  riskLevel: 'low' | 'medium' | 'high';
}

@Injectable()
export class LogisticsOptimizerService {
  private readonly logger = new Logger(LogisticsOptimizerService.name);
  private readonly TARGET_QUANTITY = 20000; // 20 tons in kg
  private readonly STANDARD_PALLET = {
    length: 1.2, // meters
    width: 0.8,
    height: 1.5, // with product
    weight: 500, // kg average
  };

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  /**
   * PREDICT: When will 20 tons be ready in a village cluster?
   * Analyzes harvest entries and predicts packaging completion date
   */
  async predictHarvestReadiness(
    targetDate: Date,
    region?: string,
  ): Promise<HarvestPrediction> {
    this.logger.log(`Predicting harvest readiness for ${targetDate.toISOString()}`);

    // Get all recent harvest batches (using Batch model with harvestDate)
    const batches = await this.prisma.batches.findMany({
      where: {
        harvestDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
        status: {
          in: ['PACKED', 'QUALITY_VERIFIED'],
        },
      },
      include: {
        estates: {
          include: {
            users: true,
          },
        },
      },
      orderBy: {
        harvestDate: 'desc',
      },
    });

    if (batches.length === 0) {
      throw new Error('No harvest batches found in the last 30 days');
    }

    // Transform to harvest entries format
    const harvestEntries = batches.map((batch) => ({
      id: batch.id,
      farmer_id: batch.estates.ownerId,
      farmer_name: `${batch.estates.users.firstName} ${batch.estates.users.lastName}`,
      farm_id: batch.estateId,
      farm_coordinates: (batch.estates.polygonCoordinates as any)?.[0] || { lat: 0, lng: 0 },
      farm_size: (batch.estates as any).size || 1,
      createdAt: batch.harvestDate,
      quantity: batch.quantity,
    }));

    // Cluster farmers by geographic proximity (village clustering)
    const clusters = await this.clusterVillages(harvestEntries);

    // Predict packaging time for each farmer
    const predictions = await Promise.all(
      harvestEntries.map(async (entry) => {
        const estimatedQuantity = await this.estimateHarvestQuantity(entry);
        const packagingTime = await this.estimatePackagingTime(entry, estimatedQuantity);
        const readyDate = new Date(entry.createdAt);
        readyDate.setHours(readyDate.getHours() + packagingTime);

        return {
          farmerId: entry.farmer_id,
          farmerName: entry.farmer_name,
          farmLocation: entry.farm_coordinates as { lat: number; lng: number },
          estimatedQuantity,
          estimatedReadyDate: readyDate,
        };
      })
    );

    // Group by clusters and calculate totals
    const clusterData: VillageCluster[] = clusters.map((cluster, index) => {
      const clusterFarmers = predictions.filter((p) =>
        cluster.farmerIds.includes(p.farmerId)
      );
      const totalQuantity = clusterFarmers.reduce((sum, f) => sum + f.estimatedQuantity, 0);
      const latestReadyDate = new Date(
        Math.max(...clusterFarmers.map((f) => f.estimatedReadyDate.getTime()))
      );

      return {
        clusterId: `cluster-${index + 1}`,
        villageName: cluster.villageName,
        farmers: clusterFarmers,
        totalQuantity,
        clusterCenter: cluster.center,
        estimatedReadyDate: latestReadyDate,
      };
    });

    // Find cluster(s) that can reach 20 tons
    const suitableClusters = clusterData.filter((c) => c.totalQuantity >= this.TARGET_QUANTITY);
    const combinedClusters = this.combineClusters(clusterData, this.TARGET_QUANTITY);

    // Calculate estimated ready date
    const estimatedReadyDate = this.calculateEstimatedReadyDate(combinedClusters, targetDate);

    // Calculate confidence based on historical data
    const confidence = await this.calculateConfidence(harvestEntries, estimatedReadyDate);

    // Generate warnings
    const warnings = this.generateWarnings(combinedClusters, estimatedReadyDate, targetDate);

    return {
      targetDate,
      estimatedReadyDate,
      confidence,
      farmersInvolved: predictions.length,
      totalQuantity: combinedClusters.reduce((sum, c) => sum + c.totalQuantity, 0),
      villageClusters: combinedClusters,
      warnings,
    };
  }

  /**
   * CLUSTER: Group farmers by geographic proximity (village clustering)
   */
  private async clusterVillages(entries: any[]): Promise<Array<{
    villageName: string;
    farmerIds: string[];
    center: { lat: number; lng: number };
  }>> {
    // Group by approximate location (within 5km radius)
    const CLUSTER_RADIUS = 5000; // meters
    const clusters: Array<{
      villageName: string;
      farmerIds: string[];
      center: { lat: number; lng: number };
      locations: Array<{ lat: number; lng: number }>;
    }> = [];

    for (const entry of entries) {
      const location = entry.farm_coordinates as { lat: number; lng: number };
      if (!location || !location.lat || !location.lng) continue;

      // Find existing cluster within radius
      let assigned = false;
      for (const cluster of clusters) {
        const distance = this.calculateDistance(
          location.lat,
          location.lng,
          cluster.center.lat,
          cluster.center.lng
        );

        if (distance <= CLUSTER_RADIUS) {
          cluster.farmerIds.push(entry.farmer_id);
          cluster.locations.push(location);
          // Recalculate center
          cluster.center = this.calculateCenter(cluster.locations);
          assigned = true;
          break;
        }
      }

      // Create new cluster if not assigned
      if (!assigned) {
        clusters.push({
          villageName: `Village ${clusters.length + 1}`,
          farmerIds: [entry.farmer_id],
          center: location,
          locations: [location],
        });
      }
    }

    return clusters.map((c) => ({
      villageName: c.villageName,
      farmerIds: c.farmerIds,
      center: c.center,
    }));
  }

  /**
   * Estimate harvest quantity based on farm size and crop type
   */
  private async estimateHarvestQuantity(entry: any): Promise<number> {
    // Default: 2000kg per hectare (adjustable per crop)
    const DEFAULT_YIELD = 2000; // kg/ha
    const farmSize = entry.farm_size || 1; // hectares
    return farmSize * DEFAULT_YIELD;
  }

  /**
   * Estimate packaging time in hours
   */
  private async estimatePackagingTime(entry: any, quantity: number): Promise<number> {
    // Average packaging rate: 500kg per hour
    const PACKAGING_RATE = 500; // kg/hour
    const baseHours = quantity / PACKAGING_RATE;

    // Add buffer for quality checks, cooling, etc.
    const bufferHours = 4; // hours

    return baseHours + bufferHours;
  }

  /**
   * Combine clusters to reach target quantity
   */
  private combineClusters(
    clusters: VillageCluster[],
    targetQuantity: number
  ): VillageCluster[] {
    // Sort by quantity descending
    const sorted = [...clusters].sort((a, b) => b.totalQuantity - a.totalQuantity);

    const combined: VillageCluster[] = [];
    let currentTotal = 0;
    let currentCluster: VillageCluster | null = null;

    for (const cluster of sorted) {
      if (currentTotal >= targetQuantity) {
        if (currentCluster) {
          combined.push(currentCluster);
        }
        currentCluster = null;
        currentTotal = 0;
      }

      if (!currentCluster) {
        currentCluster = { ...cluster };
        currentTotal = cluster.totalQuantity;
      } else {
        // Merge clusters
        currentCluster.farmers = [...currentCluster.farmers, ...cluster.farmers];
        currentCluster.totalQuantity += cluster.totalQuantity;
        currentTotal += cluster.totalQuantity;
      }
    }

    if (currentCluster && currentTotal >= targetQuantity) {
      combined.push(currentCluster);
    }

    return combined;
  }

  /**
   * Calculate estimated ready date
   */
  private calculateEstimatedReadyDate(
    clusters: VillageCluster[],
    targetDate: Date
  ): Date {
    if (clusters.length === 0) {
      return targetDate;
    }

    // Use the latest ready date from all clusters
    const latestDate = new Date(
      Math.max(...clusters.map((c) => c.estimatedReadyDate.getTime()))
    );

    // If latest date is before target, use target date
    return latestDate > targetDate ? latestDate : targetDate;
  }

  /**
   * Calculate confidence score (0-1)
   */
  private async calculateConfidence(entries: any[], estimatedDate: Date): Promise<number> {
    // Simple confidence based on:
    // 1. Number of entries (more = higher confidence)
    // 2. Recency of entries (recent = higher confidence)
    // 3. Consistency of data

    const entryCount = entries.length;
    const recentEntries = entries.filter(
      (e) => new Date(e.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    const countScore = Math.min(entryCount / 50, 1); // Max at 50 entries
    const recencyScore = recentEntries / entryCount;

    return (countScore + recencyScore) / 2;
  }

  /**
   * Generate warnings
   */
  private generateWarnings(
    clusters: VillageCluster[],
    estimatedDate: Date,
    targetDate: Date
  ): string[] {
    const warnings: string[] = [];

    const daysDifference = (estimatedDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDifference > 3) {
      warnings.push(`Estimated ready date is ${daysDifference.toFixed(1)} days after target date`);
    }

    if (clusters.length === 0) {
      warnings.push('No suitable clusters found to reach 20 tons');
    }

    const totalQuantity = clusters.reduce((sum, c) => sum + c.totalQuantity, 0);
    if (totalQuantity < this.TARGET_QUANTITY * 0.9) {
      warnings.push(`Total quantity (${totalQuantity}kg) is below 90% of target (${this.TARGET_QUANTITY}kg)`);
    }

    return warnings;
  }

  /**
   * GENERATE LOAD PLAN: Optimal pallet arrangement in truck
   * Uses 3D bin packing algorithm
   */
  async generateLoadPlan(
    clusterId: string,
    truckId: string,
    batches: string[]
  ): Promise<LoadPlan> {
    this.logger.log(`Generating load plan for truck ${truckId} with ${batches.length} batches`);

    // Get truck specifications
    const vehicle = await this.prisma.vehicles.findFirst({
      where: { 
        id: truckId,
      },
      select: {
        type: true,
        tempRangeMin: true,
        tempRangeMax: true,
      },
    });

    if (!vehicle) {
      throw new Error(`Vehicle ${truckId} not found`);
    }

    // Default capacity based on vehicle type
    const capacity = {
      length: vehicle.type === 'TRUCK' ? 13.6 : 6.0, // meters
      width: vehicle.type === 'TRUCK' ? 2.4 : 2.0,
      height: vehicle.type === 'TRUCK' ? 2.7 : 2.5,
      maxWeight: vehicle.type === 'TRUCK' ? 24000 : 3500, // kg
    };

    // Get batch data
    const batchData = await this.prisma.batches.findMany({
      where: { id: { in: batches } },
      include: {
        estates: {
          include: {
            users: true,
          },
        },
      },
    });

    // Convert batches to pallets
    const pallets = batchData.map((batch, index) => {
      const quantity = batch.quantity;
      const palletsNeeded = Math.ceil(quantity / this.STANDARD_PALLET.weight);

      return Array.from({ length: palletsNeeded }, (_, i) => ({
        palletId: `pallet-${batch.id}-${i}`,
        batchId: batch.id,
        farmerId: batch.estates.ownerId,
        villageCluster: clusterId,
        dimensions: {
          length: this.STANDARD_PALLET.length,
          width: this.STANDARD_PALLET.width,
          height: this.STANDARD_PALLET.height,
        },
        weight: this.STANDARD_PALLET.weight,
      }));
    }).flat();

    // 3D Bin Packing Algorithm (First Fit Decreasing)
    const sortedPallets = [...pallets].sort((a, b) => b.weight - a.weight);
    const loadedPallets: LoadPlan['pallets'] = [];
    const occupiedSpace: Array<{
      x: number;
      y: number;
      z: number;
      length: number;
      width: number;
      height: number;
    }> = [];

    for (const pallet of sortedPallets) {
      const position = this.findBestPosition(
        pallet.dimensions,
        capacity,
        occupiedSpace
      );

      if (position) {
        loadedPallets.push({
          ...pallet,
          position,
        });

        occupiedSpace.push({
          x: position.x,
          y: position.y,
          z: position.z,
          length: pallet.dimensions.length,
          width: pallet.dimensions.width,
          height: pallet.dimensions.height,
        });
      } else {
        this.logger.warn(`Could not fit pallet ${pallet.palletId} in truck`);
      }
    }

    // Calculate utilization
    const volumeUsed = loadedPallets.reduce(
      (sum, p) =>
        sum +
        p.dimensions.length * p.dimensions.width * p.dimensions.height,
      0
    );
    const volumeTotal = capacity.length * capacity.width * capacity.height;
    const weightUsed = loadedPallets.reduce((sum, p) => sum + p.weight, 0);

    // Generate loading sequence (bottom to top, front to back)
    const loadingSequence = loadedPallets
      .sort((a, b) => {
        if (a.position.z !== b.position.z) return a.position.z - b.position.z;
        if (a.position.y !== b.position.y) return a.position.y - b.position.y;
        return a.position.x - b.position.x;
      })
      .map((p) => p.palletId);

    return {
      truckId,
      truckCapacity: capacity,
      pallets: loadedPallets,
      utilization: {
        volumeUsed,
        volumeTotal,
        weightUsed,
        weightTotal: capacity.maxWeight,
        volumeEfficiency: (volumeUsed / volumeTotal) * 100,
        weightEfficiency: (weightUsed / capacity.maxWeight) * 100,
      },
      loadingSequence,
    };
  }

  /**
   * Find best position for pallet using First Fit Decreasing
   */
  private findBestPosition(
    dimensions: { length: number; width: number; height: number },
    capacity: { length: number; width: number; height: number },
    occupiedSpace: Array<{
      x: number;
      y: number;
      z: number;
      length: number;
      width: number;
      height: number;
    }>
  ): { x: number; y: number; z: number } | null {
    // Try positions from front-left-bottom
    const step = 0.1; // 10cm precision

    for (let z = 0; z <= capacity.height - dimensions.height; z += step) {
      for (let y = 0; y <= capacity.width - dimensions.width; y += step) {
        for (let x = 0; x <= capacity.length - dimensions.length; x += step) {
          const position = { x, y, z };

          // Check if position overlaps with occupied space
          const overlaps = occupiedSpace.some((occupied) => {
            return !(
              x + dimensions.length <= occupied.x ||
              occupied.x + occupied.length <= x ||
              y + dimensions.width <= occupied.y ||
              occupied.y + occupied.width <= y ||
              z + dimensions.height <= occupied.z ||
              occupied.z + occupied.height <= z
            );
          });

          if (!overlaps) {
            return position;
          }
        }
      }
    }

    return null; // No position found
  }

  /**
   * WEATHER CHECK: Check weather forecast and adjust departure time
   */
  async checkWeatherAndAdjustRoute(
    route: {
      origin: { lat: number; lng: number; name: string };
      destination: { lat: number; lng: number; name: string };
      waypoints?: Array<{ lat: number; lng: number; name: string }>;
    },
    plannedDepartureTime: Date,
  ): Promise<WeatherCheckResult> {
    this.logger.log(`Checking weather for route from ${route.origin.name} to ${route.destination.name}`);

    // Get weather forecast for route waypoints
    const waypoints = route.waypoints || [];
    const allPoints = [route.origin, ...waypoints, route.destination];

    const weatherForecast = await Promise.all(
      allPoints.map(async (point) => {
        const forecast = await this.getWeatherForecast(point.lat, point.lng, plannedDepartureTime);
        return {
          location: point,
          date: plannedDepartureTime,
          ...forecast,
        };
      })
    );

    // Check for rain/snow in Alps region (approximate: 45-47°N, 5-15°E)
    const alpsRegion = weatherForecast.filter((w) => {
      const lat = w.location.lat;
      const lng = w.location.lng;
      return lat >= 45 && lat <= 47 && lng >= 5 && lng <= 15;
    });

    const hasRainInAlps = alpsRegion.some(
      (w) => w.condition === 'rain' && w.severity !== 'low'
    );

    let recommendedDepartureTime = plannedDepartureTime;
    let adjustmentReason = 'No weather issues detected';
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    if (hasRainInAlps) {
      // Move departure 6 hours earlier
      recommendedDepartureTime = new Date(plannedDepartureTime);
      recommendedDepartureTime.setHours(recommendedDepartureTime.getHours() - 6);
      adjustmentReason = 'Rain forecasted in Alps region - departing 6 hours earlier to avoid delays';
      riskLevel = 'medium';
    }

    // Check overall risk
    const highRiskWeather = weatherForecast.filter((w) => w.severity === 'high');
    if (highRiskWeather.length > 0) {
      riskLevel = 'high';
      if (!hasRainInAlps) {
        recommendedDepartureTime = new Date(plannedDepartureTime);
        recommendedDepartureTime.setHours(recommendedDepartureTime.getHours() - 6);
        adjustmentReason = 'Severe weather conditions detected - departing 6 hours earlier';
      }
    }

    return {
      route,
      weatherForecast,
      recommendedDepartureTime,
      originalDepartureTime: plannedDepartureTime,
      adjustmentReason,
      riskLevel,
    };
  }

  /**
   * Get weather forecast from API (using OpenWeatherMap as example)
   */
  private async getWeatherForecast(
    lat: number,
    lng: number,
    date: Date
  ): Promise<{
    condition: string;
    precipitation: number;
    severity: 'low' | 'medium' | 'high';
  }> {
    try {
      // Use OpenWeatherMap API (requires API key)
      const apiKey = process.env.OPENWEATHER_API_KEY || '';
      if (!apiKey) {
        this.logger.warn('OpenWeatherMap API key not configured, using mock data');
        return this.getMockWeatherForecast(lat, lng, date);
      }

      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
      const response = await firstValueFrom(this.httpService.get(url));

      const forecasts = response.data.list;
      const targetForecast = forecasts.find((f: any) => {
        const forecastDate = new Date(f.dt * 1000);
        return Math.abs(forecastDate.getTime() - date.getTime()) < 3 * 60 * 60 * 1000; // Within 3 hours
      });

      if (!targetForecast) {
        return this.getMockWeatherForecast(lat, lng, date);
      }

      const condition = targetForecast.weather[0].main.toLowerCase();
      const precipitation = targetForecast.rain?.['3h'] || targetForecast.snow?.['3h'] || 0;

      let severity: 'low' | 'medium' | 'high' = 'low';
      if (precipitation > 10) severity = 'high';
      else if (precipitation > 5) severity = 'medium';

      return {
        condition: condition === 'rain' || condition === 'snow' ? condition : 'clear',
        precipitation,
        severity,
      };
    } catch (error) {
      this.logger.error('Error fetching weather forecast:', error);
      return this.getMockWeatherForecast(lat, lng, date);
    }
  }

  /**
   * Mock weather forecast (fallback)
   */
  private getMockWeatherForecast(
    lat: number,
    lng: number,
    date: Date
  ): {
    condition: string;
    precipitation: number;
    severity: 'low' | 'medium' | 'high';
  } {
    // Simple mock: rain in Alps region (45-47°N, 5-15°E)
    const isInAlps = lat >= 45 && lat <= 47 && lng >= 5 && lng <= 15;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    if (isInAlps && isWeekend) {
      return {
        condition: 'rain',
        precipitation: 8,
        severity: 'medium',
      };
    }

    return {
      condition: 'clear',
      precipitation: 0,
      severity: 'low',
    };
  }

  /**
   * Helper: Calculate distance between two points (Haversine)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
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
    return (degrees * Math.PI) / 180;
  }

  /**
   * Helper: Calculate center point of locations
   */
  private calculateCenter(locations: Array<{ lat: number; lng: number }>): {
    lat: number;
    lng: number;
  } {
    const sum = locations.reduce(
      (acc, loc) => ({
        lat: acc.lat + loc.lat,
        lng: acc.lng + loc.lng,
      }),
      { lat: 0, lng: 0 }
    );

    return {
      lat: sum.lat / locations.length,
      lng: sum.lng / locations.length,
    };
  }
}
