import { Controller, Post, Get, Body, UseGuards, Query, Param } from '@nestjs/common';
import { LogisticsOptimizerService, HarvestPrediction, LoadPlan, WeatherCheckResult } from './logistics-optimizer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('logistics-optimizer')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogisticsOptimizerController {
  constructor(
    private readonly optimizerService: LogisticsOptimizerService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * PREDICT: When will 20 tons be ready in a village cluster?
   */
  @Post('predict-harvest')
  @Roles('SUPER_ADMIN', 'COORDINATOR', 'LOGISTICS_PARTNER')
  async predictHarvest(
    @Body() body: {
      targetDate: string; // ISO date string
      region?: string;
    }
  ): Promise<HarvestPrediction> {
    return this.optimizerService.predictHarvestReadiness(
      new Date(body.targetDate),
      body.region
    );
  }

  /**
   * GENERATE LOAD PLAN: Optimal pallet arrangement
   */
  @Post('load-plan')
  @Roles('SUPER_ADMIN', 'COORDINATOR', 'LOGISTICS_PARTNER')
  async generateLoadPlan(
    @Body() body: {
      clusterId: string;
      truckId: string;
      batches: string[];
    }
  ): Promise<LoadPlan> {
    return this.optimizerService.generateLoadPlan(
      body.clusterId,
      body.truckId,
      body.batches
    );
  }

  /**
   * WEATHER CHECK: Check weather and adjust departure time
   */
  @Post('weather-check')
  @Roles('SUPER_ADMIN', 'COORDINATOR', 'LOGISTICS_PARTNER')
  async checkWeather(
    @Body() body: {
      route: {
        origin: { lat: number; lng: number; name: string };
        destination: { lat: number; lng: number; name: string };
        waypoints?: Array<{ lat: number; lng: number; name: string }>;
      };
      plannedDepartureTime: string; // ISO date string
    }
  ): Promise<WeatherCheckResult> {
    return this.optimizerService.checkWeatherAndAdjustRoute(
      body.route,
      new Date(body.plannedDepartureTime)
    );
  }

  /**
   * GET: Combined optimization (predict + load plan + weather)
   */
  @Post('optimize')
  @Roles('SUPER_ADMIN', 'COORDINATOR', 'LOGISTICS_PARTNER')
  async optimize(
    @Body() body: {
      targetDate: string;
      truckId: string;
      route: {
        origin: { lat: number; lng: number; name: string };
        destination: { lat: number; lng: number; name: string };
        waypoints?: Array<{ lat: number; lng: number; name: string }>;
      };
      plannedDepartureTime: string;
    }
  ): Promise<{
    prediction: HarvestPrediction;
    loadPlan: LoadPlan;
    weatherCheck: WeatherCheckResult;
    recommendations: string[];
  }> {
    // Run all optimizations
    const [prediction, weatherCheck] = await Promise.all([
      this.optimizerService.predictHarvestReadiness(new Date(body.targetDate)),
      this.optimizerService.checkWeatherAndAdjustRoute(
        body.route,
        new Date(body.plannedDepartureTime)
      ),
    ]);

    // Get batches from prediction clusters
    const farmerIds = prediction.villageClusters.flatMap((c) => c.farmers.map((f) => f.farmerId));
    
    // Get batches for these farmers
    const batches = await this.prisma.batches.findMany({
      where: {
        estates: {
          ownerId: { in: farmerIds },
        },
        status: {
          in: ['PACKED', 'QUALITY_VERIFIED'],
        },
      },
      select: { id: true },
    });

    const batchIds = batches.map((b) => b.id);

    const loadPlan = await this.optimizerService.generateLoadPlan(
      prediction.villageClusters[0]?.clusterId || 'cluster-1',
      body.truckId,
      batchIds
    );

    // Generate recommendations
    const recommendations: string[] = [];

    if (weatherCheck.recommendedDepartureTime < new Date(body.plannedDepartureTime)) {
      recommendations.push(
        `Depart ${Math.round(
          (new Date(body.plannedDepartureTime).getTime() - weatherCheck.recommendedDepartureTime.getTime()) /
            (1000 * 60 * 60)
        )} hours earlier due to weather conditions`
      );
    }

    if (loadPlan.utilization.volumeEfficiency < 80) {
      recommendations.push(
        `Truck volume utilization is only ${loadPlan.utilization.volumeEfficiency.toFixed(1)}% - consider smaller truck or additional batches`
      );
    }

    if (prediction.confidence < 0.7) {
      recommendations.push(
        `Low confidence (${(prediction.confidence * 100).toFixed(0)}%) in harvest prediction - verify with farmers`
      );
    }

    return {
      prediction,
      loadPlan,
      weatherCheck,
      recommendations,
    };
  }
}
