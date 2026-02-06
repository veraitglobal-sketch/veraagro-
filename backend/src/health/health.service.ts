import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    server: {
      status: 'up';
      uptime: number;
      memory: {
        used: number;
        total: number;
        percentage: number;
      };
    };
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(private prisma: PrismaService) {}

  /**
   * Basic health check
   */
  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      // Quick database ping
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Detailed health check
   */
  async detailedHealthCheck(): Promise<HealthStatus> {
    const services: HealthStatus['services'] = {
      database: await this.checkDatabase(),
      server: this.checkServer(),
    };

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (services.database.status === 'down') {
      status = 'unhealthy';
    } else if (services.database.responseTime && services.database.responseTime > 1000) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date(),
      services,
    };
  }

  /**
   * Check database connection and performance
   */
  private async checkDatabase(): Promise<{
    status: 'up' | 'down';
    responseTime?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        status: 'up',
        responseTime,
      };
    } catch (error: any) {
      this.logger.error('Database health check failed:', error);
      return {
        status: 'down',
        error: error.message || 'Database connection failed',
      };
    }
  }

  /**
   * Check server status
   */
  private checkServer(): {
    status: 'up';
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  } {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000); // seconds
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const percentage = (usedMemory / totalMemory) * 100;

    return {
      status: 'up',
      uptime,
      memory: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round(percentage * 100) / 100,
      },
    };
  }
}
