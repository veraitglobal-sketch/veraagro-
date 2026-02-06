import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVeraInsightDto, UpdateVeraInsightDto } from './dto/vera-insight.dto';
import * as crypto from 'crypto';

@Injectable()
export class VeraInsightsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all active insights for farmers
   * Public endpoint - no auth required
   */
  async getActiveInsights() {
    return this.prisma.vera_insights.findMany({
      where: {
        isActive: true,
      },
      include: {
        seeds: {
          select: {
            id: true,
            name: true,
            serialNumber: true,
          },
        },
      },
      orderBy: {
        veraScore: 'desc', // Highest scores first
      },
    });
  }

  /**
   * Get all insights (including inactive) for admin
   */
  async getAllInsights() {
    return this.prisma.vera_insights.findMany({
      include: {
        seeds: {
          select: {
            id: true,
            name: true,
            serialNumber: true,
          },
        },
        users_vera_insights_createdByTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        users_vera_insights_updatedByTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get insight by ID
   */
  async getInsightById(id: string) {
    const insight = await this.prisma.vera_insights.findUnique({
      where: { id },
      include: {
        seeds: true,
        users_vera_insights_createdByTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        users_vera_insights_updatedByTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!insight) {
      throw new NotFoundException('Vera Insight not found');
    }

    return insight;
  }

  /**
   * Create new insight (Admin only)
   */
  async createInsight(userId: string, dto: CreateVeraInsightDto) {
    return this.prisma.vera_insights.create({
      data: {
        cropName: dto.cropName,
        veraScore: dto.veraScore,
        historicalDeficit: dto.historicalDeficit,
        whyText: dto.whyText,
        riskLevel: dto.riskLevel,
        priceTrend: dto.priceTrend,
        seedId: dto.seedId,
        isActive: dto.isActive ?? true,
        createdBy: userId,
        id: crypto.randomUUID(),
        updatedAt: new Date(),
      },
      include: {
        seeds: true,
      },
    });
  }

  /**
   * Update insight (Admin only)
   */
  async updateInsight(id: string, userId: string, dto: UpdateVeraInsightDto) {
    const existing = await this.prisma.vera_insights.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Vera Insight not found');
    }

    return this.prisma.vera_insights.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
      include: {
        seeds: true,
      },
    });
  }

  /**
   * Delete insight (Admin only)
   */
  async deleteInsight(id: string) {
    const existing = await this.prisma.vera_insights.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Vera Insight not found');
    }

    return this.prisma.vera_insights.delete({
      where: { id },
    });
  }
}
