import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum RouteType {
  DIRECT = 'DIRECT', // Farm -> Logistics Partner -> Supermarket
  HUB = 'HUB', // Farm -> Logistics Partner -> Distributor Hub -> Local Delivery
}

export interface RouteDecision {
  routeType: RouteType;
  reason: string;
  estimatedTime: number; // hours
  cost: number; // EUR
  steps: Array<{
    location: string;
    action: string;
    estimatedArrival: Date;
  }>;
}

@Injectable()
export class RoutingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Determine optimal route for a batch
   */
  async determineRoute(
    batchId: string,
    destinationCountry: string,
    orderQuantity: number,
    orderUrgency: 'high' | 'medium' | 'low',
  ): Promise<RouteDecision> {
    const batch = await this.prisma.batches.findUnique({
      where: { id: batchId },
      include: {
        estates: true,
      },
    }) as any;

    if (!batch || !batch.estate) {
      throw new Error(`Batch ${batchId} not found or missing estate`);
    }

    // Route Decision Logic
    // Route A (Direct): High volume (>500kg) OR high urgency
    // Route B (Hub): Smaller orders (<500kg) OR fragmented retail orders

    const isHighVolume = orderQuantity >= 500;
    const isHighUrgency = orderUrgency === 'high';
    const isFragmented = orderQuantity < 500;

    if (isHighVolume || isHighUrgency) {
      // Route A: Direct
      return {
        routeType: RouteType.DIRECT,
        reason: isHighVolume
          ? 'High volume order - direct route for efficiency'
          : 'High urgency - direct route for speed',
        estimatedTime: this.calculateDirectRouteTime(batch.estate, destinationCountry),
        cost: this.calculateDirectRouteCost(orderQuantity, destinationCountry),
        steps: [
          {
            location: batch.estates.name,
            action: 'Harvest & Pack',
            estimatedArrival: new Date(),
          },
          {
            location: 'Logistics Partner',
            action: 'Pickup & Transport',
            estimatedArrival: new Date(Date.now() + 2 * 60 * 60 * 1000), // +2 hours
          },
          {
            location: destinationCountry,
            action: 'Direct Delivery to Supermarket',
            estimatedArrival: new Date(Date.now() + 14 * 60 * 60 * 1000), // +14 hours
          },
        ],
      };
    } else {
      // Route B: Hub
      return {
        routeType: RouteType.HUB,
        reason: isFragmented
          ? 'Fragmented retail order - hub consolidation required'
          : 'Standard order - hub route for cost efficiency',
        estimatedTime: this.calculateHubRouteTime(batch.estate, destinationCountry),
        cost: this.calculateHubRouteCost(orderQuantity, destinationCountry),
        steps: [
          {
            location: batch.estates.name,
            action: 'Harvest & Pack',
            estimatedArrival: new Date(),
          },
          {
            location: 'Logistics Partner',
            action: 'Pickup & Transport',
            estimatedArrival: new Date(Date.now() + 2 * 60 * 60 * 1000), // +2 hours
          },
          {
            location: `${destinationCountry} Distributor Hub`,
            action: 'Cross-Docking & Consolidation',
            estimatedArrival: new Date(Date.now() + 16 * 60 * 60 * 1000), // +16 hours
          },
          {
            location: destinationCountry,
            action: 'Local Delivery to Supermarkets',
            estimatedArrival: new Date(Date.now() + 20 * 60 * 60 * 1000), // +20 hours
          },
        ],
      };
    }
  }

  private calculateDirectRouteTime(estate: { name: string; polygonCoordinates?: any }, destination: string): number {
    // Simplified calculation
    const baseTime = 12; // hours
    const distanceMultiplier = destination === 'Germany' ? 1.2 : 1.0;
    return baseTime * distanceMultiplier;
  }

  private calculateHubRouteTime(estate: { name: string; polygonCoordinates?: any }, destination: string): number {
    // Hub route takes longer due to consolidation
    const baseTime = 18; // hours
    const distanceMultiplier = destination === 'Germany' ? 1.2 : 1.0;
    return baseTime * distanceMultiplier;
  }

  private calculateDirectRouteCost(quantity: number, destination: string): number {
    const baseCostPerKg = 0.15; // EUR per kg
    const destinationMultiplier = destination === 'Germany' ? 1.0 : 1.1;
    return quantity * baseCostPerKg * destinationMultiplier;
  }

  private calculateHubRouteCost(quantity: number, destination: string): number {
    // Hub route is cheaper for smaller quantities
    const baseCostPerKg = 0.12; // EUR per kg
    const destinationMultiplier = destination === 'Germany' ? 1.0 : 1.1;
    return quantity * baseCostPerKg * destinationMultiplier;
  }
}
