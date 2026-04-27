import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { BlockchainService, ChainEventType } from '../blockchain/blockchain.service';
import { BatchStatus } from '@prisma/client';

/**
 * Batch Tracking Service
 * Tracks every box/crate with Batch_ID
 * One-click traceability: Who harvested, who drove, which hub
 */
@Injectable()
export class BatchesService {
  private readonly logger = new Logger(BatchesService.name);
  private static readonly MAX_PACKING_PHOTO_BYTES = Math.floor(2.5 * 1024 * 1024);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
    private blockchainService: BlockchainService,
  ) {}

  /**
   * Create new batch (when farmer packs produce).
   * If parcelId is provided, the parcel must be approved by admin before the farmer can form a batch.
   */
  async createBatch(data: {
    estateId: string;
    parcelId?: string;
    harvestedByUserId: string;
    productName: string;
    quantity: number;
    unit: string;
    harvestDate: Date;
  }) {
    if (data.parcelId) {
      const parcel = await this.prisma.parcels.findFirst({
        where: { id: data.parcelId, estateId: data.estateId },
        include: { estates: { select: { ownerId: true } } },
      });
      if (!parcel) {
        throw new NotFoundException('Parcel not found or does not belong to this estate');
      }
      if (parcel.estates.ownerId !== data.harvestedByUserId) {
        throw new ForbiddenException('You can only create batches from your own estate parcels');
      }
      if (!parcel.approvedAt) {
        throw new ForbiddenException('Parcel must be approved before you can form a batch. Wait for admin approval.');
      }
    }

    // Generate batch ID
    const batchId = `BATCH-${new Date().getFullYear()}-${String(
      Math.floor(Math.random() * 10000),
    ).padStart(4, '0')}`;

    const harvestDate =
      data.harvestDate instanceof Date
        ? data.harvestDate
        : new Date(data.harvestDate as string | number);
    if (Number.isNaN(harvestDate.getTime())) {
      throw new BadRequestException('Invalid harvest date');
    }

    const now = new Date();
    const batch = await this.prisma.batches.create({
      data: {
        id: randomUUID(),
        batchId,
        estateId: data.estateId,
        parcelId: data.parcelId,
        harvestedByUserId: data.harvestedByUserId,
        productName: data.productName,
        quantity: data.quantity,
        unit: data.unit,
        harvestDate,
        status: 'PACKED',
        updatedAt: now,
        locationHistory: [
          {
            hubId: null,
            timestamp: now.toISOString(),
            status: 'PACKED',
            driverId: null,
          },
        ],
      },
    });

    // Register on blockchain if enabled (non-blocking; batch is already created)
    if (this.blockchainService.isEnabled()) {
      try {
        const harvestDateStr = harvestDate.toISOString().split('T')[0];
        const result = await this.blockchainService.registerBatch({
          batchId,
          estateId: data.estateId,
          harvestDate: harvestDateStr,
          productType: data.productName,
        });
        await this.prisma.batches.update({
          where: { id: batch.id },
          data: {
            blockchainTxHash: result.txHash,
            blockchainRegisteredAt: result.timestamp,
            updatedAt: new Date(),
          },
        });
        this.logger.log(`Batch ${batchId} registered on blockchain: ${result.txHash}`);
        const nowIso = new Date().toISOString();
        const harvestDateIso = harvestDate.toISOString();
        try {
          await this.blockchainService.recordEvent(batchId, ChainEventType.HARVEST, {
            timestamp: harvestDateIso,
          });
          this.logger.log(`Batch ${batchId} chain event HARVEST recorded`);
        } catch (e) {
          this.logger.warn(`Blockchain HARVEST event failed for ${batchId}`, e);
        }
        try {
          await this.blockchainService.recordEvent(batchId, ChainEventType.PACKAGING, {
            timestamp: nowIso,
          });
          this.logger.log(`Batch ${batchId} chain event PACKAGING recorded`);
        } catch (e) {
          this.logger.warn(`Blockchain PACKAGING event failed for ${batchId}`, e);
        }
        const updated = await this.prisma.batches.findUnique({ where: { id: batch.id } });
        if (updated) return updated;
      } catch (err) {
        this.logger.warn(`Blockchain register failed for batch ${batchId}`, err);
      }
    }

    return batch;
  }

  /**
   * Move batch to hub
   */
  async moveToHub(batchId: string, hubId: string, driverId?: string) {
    const batch = await this.prisma.batches.findUnique({
      where: { batchId },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    // Update location history
    const locationHistory = (batch.locationHistory as any[]) || [];
    locationHistory.push({
      hubId,
      timestamp: new Date().toISOString(),
      status: 'IN_HUB',
      driverId: driverId || null,
    });

    const updated = await this.prisma.batches.update({
      where: { batchId },
      data: {
        currentHubId: hubId,
        status: 'IN_HUB',
        transportedByDriverId: driverId || batch.transportedByDriverId,
        locationHistory,
      },
    });

    if (this.blockchainService.isEnabled()) {
      try {
        await this.blockchainService.recordEvent(batchId, ChainEventType.HANDOVER, {
          timestamp: new Date().toISOString(),
          locationCode: hubId,
        });
        this.logger.log(`Batch ${batchId} chain event HANDOVER recorded`);
      } catch (err) {
        this.logger.warn(`Blockchain HANDOVER event failed for ${batchId}`, err);
      }
    }

    // Notify hub manager
    const hub = await this.prisma.hubs.findUnique({
      where: { id: hubId },
      include: { users: true },
    });

    if (hub?.users) {
      await this.notificationsService.sendSmartNotification(
        'BATCH_ARRIVED' as any,
        hub.users.id,
        { batchId },
      );
    }

    // Real-time notification to producer (grower)
    if (updated.harvestedByUserId) {
      const hubName = hub?.name || 'Hub';
      await this.notificationsGateway.notifyBatchLocationUpdate(
        updated.harvestedByUserId,
        updated,
        hubName,
      );
    }

    return updated;
  }

  /**
   * Assign batch to order
   */
  async assignToOrder(batchId: string, orderItemId: string) {
    // Note: Batch can have multiple orderItems, so we link via OrderItem instead
    const updated = await this.prisma.batches.update({
      where: { batchId },
      data: {
        status: 'IN_TRANSIT',
      },
    });
    if (updated.harvestedByUserId) {
      this.notificationsGateway.emitBatchUpdatedToGrower(updated.harvestedByUserId, {
        id: updated.id,
        batchId: updated.batchId,
        status: updated.status,
      });
    }
    return updated;
  }

  /**
   * Mark batch as delivered
   */
  async markDelivered(batchId: string) {
    const updated = await this.prisma.batches.update({
      where: { batchId },
      data: {
        status: 'DELIVERED',
      },
    });
    if (updated.harvestedByUserId) {
      this.notificationsGateway.emitBatchUpdatedToGrower(updated.harvestedByUserId, {
        id: updated.id,
        batchId: updated.batchId,
        status: updated.status,
      });
    }
    return updated;
  }

  /**
   * Report quality issue
   * One-click traceability: See who harvested, who drove, which hub
   */
  async reportQualityIssue(
    batchId: string,
    reportedByUserId: string,
    issue: string,
  ) {
    const batch = await this.prisma.batches.findUnique({
      where: { batchId },
      include: {
        estates: { include: { users: true } },
        users_batches_harvestedByUserIdTousers: true,
        users_batches_transportedByDriverIdTousers: true,
        hubs: { include: { users: true } },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    // Record quality issue
    const qualityIssues = (batch.qualityIssues as any[]) || [];
    qualityIssues.push({
      reportedBy: reportedByUserId,
      issue,
      timestamp: new Date().toISOString(),
    });

    await this.prisma.batches.update({
      where: { batchId },
      data: {
        qualityIssues,
      },
    });

    // Notify all involved parties
    const affectedUsers: string[] = [];

    if (batch.estates.ownerId) {
      affectedUsers.push(batch.estates.ownerId);
    }
    if (batch.users_batches_harvestedByUserIdTousers) {
      affectedUsers.push(batch.users_batches_harvestedByUserIdTousers.id);
    }
    if (batch.users_batches_transportedByDriverIdTousers) {
      affectedUsers.push(batch.users_batches_transportedByDriverIdTousers.id);
    }
    if (batch.hubs?.managerId) {
      affectedUsers.push(batch.hubs.managerId);
    }

    await this.notificationsService.notifyQualityIssue(
      batchId,
      reportedByUserId,
      issue,
      affectedUsers,
    );

    // Return traceability info
    return {
      batch: {
        batchId: batch.batchId,
        productName: batch.productName,
        harvestDate: batch.harvestDate,
      },
      traceability: {
        harvestedBy: batch.users_batches_harvestedByUserIdTousers
          ? {
              id: batch.users_batches_harvestedByUserIdTousers.id,
              name: `${batch.users_batches_harvestedByUserIdTousers.firstName} ${batch.users_batches_harvestedByUserIdTousers.lastName}`,
            }
          : null,
        transportedBy: batch.users_batches_transportedByDriverIdTousers
          ? {
              id: batch.users_batches_transportedByDriverIdTousers.id,
              name: `${batch.users_batches_transportedByDriverIdTousers.firstName} ${batch.users_batches_transportedByDriverIdTousers.lastName}`,
            }
          : null,
        currentHub: batch.hubs
          ? {
              id: batch.hubs.id,
              name: batch.hubs.name,
              city: batch.hubs.city,
            }
          : null,
        locationHistory: batch.locationHistory,
      },
      qualityIssues,
    };
  }

  /**
   * Get batch traceability (one-click view)
   */
  async getBatchTraceability(batchId: string) {
    const batch = await this.prisma.batches.findFirst({
      where: { OR: [{ id: batchId }, { batchId: batchId }] },
      include: {
        estates: { include: { users: true } },
        parcels: true,
        users_batches_harvestedByUserIdTousers: true,
        users_batches_transportedByDriverIdTousers: true,
        hubs: true,
        order_items: {
          include: {
            orders: {
              include: {
                users: true,
                deliveries: { include: { users: true } },
              },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    return {
      batch: {
        batchId: batch.batchId,
        productName: batch.productName,
        quantity: batch.quantity,
        unit: batch.unit,
        harvestDate: batch.harvestDate,
        status: batch.status,
      },
      traceability: {
        origin: {
          estate: {
            id: batch.estates.id,
            name: batch.estates.name,
            owner: {
              id: batch.estates.users.id,
              name: `${batch.estates.users.firstName} ${batch.estates.users.lastName}`,
            },
          },
          parcel: batch.parcels
            ? {
                id: batch.parcels.id,
                cropType: batch.parcels.cropType,
              }
            : null,
        },
        harvestedBy: batch.users_batches_harvestedByUserIdTousers
          ? {
              id: batch.users_batches_harvestedByUserIdTousers.id,
              name: `${batch.users_batches_harvestedByUserIdTousers.firstName} ${batch.users_batches_harvestedByUserIdTousers.lastName}`,
            }
          : null,
        transportedBy: batch.users_batches_transportedByDriverIdTousers
          ? {
              id: batch.users_batches_transportedByDriverIdTousers.id,
              name: `${batch.users_batches_transportedByDriverIdTousers.firstName} ${batch.users_batches_transportedByDriverIdTousers.lastName}`,
            }
          : null,
        currentLocation: batch.hubs
          ? {
              hubId: batch.hubs.id,
              hubName: batch.hubs.name,
              city: batch.hubs.city,
            }
          : 'At origin (estate)',
        locationHistory: batch.locationHistory,
        orders: batch.order_items && batch.order_items.length > 0
          ? batch.order_items.map((item) => ({
              orderId: item.orders.id,
              orderNumber: item.orders.orderNumber,
              buyer: {
                id: item.orders.users.id,
                name: `${item.orders.users.firstName} ${item.orders.users.lastName}`,
              },
              delivery: item.orders.deliveries
                ? {
                    driver: item.orders.deliveries.users
                      ? {
                          id: item.orders.deliveries.users.id,
                          name: `${item.orders.deliveries.users.firstName} ${item.orders.deliveries.users.lastName}`,
                        }
                      : null,
                  }
                : null,
            }))
          : [],
        qualityIssues: batch.qualityIssues,
      },
    };
  }

  /**
   * Get batch availability (for reservations)
   * Returns total quantity, reserved quantity, and available quantity
   */
  async getBatchAvailability(batchId: string) {
    const batch = await this.prisma.batches.findUnique({
      where: { batchId },
      include: {
        order_items: {
          where: {
            orders: {
              status: {
                notIn: ['CANCELLED', 'REFUNDED'],
              },
            },
          },
          include: {
            orders: {
              include: {
                users: true,
              },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    // Calculate reserved quantity from order items
    const reservedQuantity = batch.order_items.reduce((sum, item) => {
      return sum + (item.quantity || 0);
    }, 0);

    const totalQuantity = batch.quantity;
    const availableQuantity = totalQuantity - reservedQuantity;
    const reservedPercentage = totalQuantity > 0 ? (reservedQuantity / totalQuantity) * 100 : 0;

    return {
      batchId: batch.batchId,
      productName: batch.productName,
      totalQuantity,
      reservedQuantity,
      availableQuantity,
      reservedPercentage,
      unit: batch.unit,
      isSoldOut: availableQuantity <= 0,
    };
  }

  /**
   * Get all batches for a user (grower)
   */
  async getAllBatchesForUser(userId: string) {
    return this.prisma.batches.findMany({
      where: {
        harvestedByUserId: userId,
      },
      include: {
        estates: true,
        parcels: true,
        hubs: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Record mobile packing-flow completion: GPS + optional crate/quality photos on disk (audit JSON references files).
   * batchRef is internal batch UUID or public batchId (e.g. BATCH-2026-0001).
   */
  async recordPackingFlowCheck(
    userId: string,
    batchRef: string,
    dto: {
      latitude: number;
      longitude: number;
      completedAt?: string;
      cratePhotoBase64?: string;
      qualityPhotoBase64?: string;
    },
  ) {
    const batch = await this.prisma.batches.findFirst({
      where: {
        OR: [{ id: batchRef }, { batchId: batchRef }],
        harvestedByUserId: userId,
      },
    });
    if (!batch) {
      throw new NotFoundException('Batch not found or you do not have access');
    }
    const c = dto.cratePhotoBase64?.trim() ?? '';
    const q = dto.qualityPhotoBase64?.trim() ?? '';
    if ((c && !q) || (!c && q)) {
      throw new BadRequestException('When uploading images, both crate and quality photos are required.');
    }
    const at = dto.completedAt ? new Date(dto.completedAt) : new Date();

    let photos:
      | {
          storage: 'local_disk';
          dir: string;
          crate: { fileName: string; sha256: string; bytes: number };
          quality: { fileName: string; sha256: string; bytes: number };
        }
      | {
          storage: 'vercel_blob';
          crate: { url: string; sha256: string; bytes: number };
          quality: { url: string; sha256: string; bytes: number };
        }
      | undefined;

    if (c && q) {
      const bufC = this.decodePackingPhotoBase64(c);
      const bufQ = this.decodePackingPhotoBase64(q);
      const ts = Date.now();
      const extC = BatchesService.guessImageExt(bufC);
      const extQ = BatchesService.guessImageExt(bufQ);
      const blobToken = (process.env.BLOB_READ_WRITE_TOKEN || '').trim();

      if (blobToken) {
        const { put } = await import('@vercel/blob');
        const keyBase = `packing-flow/${batch.id}/${ts}`;
        const putOpts = { access: 'public' as const, token: blobToken };
        const [outC, outQ] = await Promise.all([
          put(`${keyBase}-crate.${extC}`, bufC, putOpts),
          put(`${keyBase}-quality.${extQ}`, bufQ, putOpts),
        ]);
        const hashC = createHash('sha256').update(bufC).digest('hex');
        const hashQ = createHash('sha256').update(bufQ).digest('hex');
        photos = {
          storage: 'vercel_blob' as const,
          crate: { url: outC.url, sha256: hashC, bytes: bufC.length },
          quality: { url: outQ.url, sha256: hashQ, bytes: bufQ.length },
        };
      } else {
        const relDir = path.join('packing-flow', batch.id);
        const absDir = path.join(process.cwd(), 'uploads', relDir);
        fs.mkdirSync(absDir, { recursive: true });
        const fC = `crate-${ts}.${extC}`;
        const fQ = `quality-${ts}.${extQ}`;
        fs.writeFileSync(path.join(absDir, fC), bufC);
        fs.writeFileSync(path.join(absDir, fQ), bufQ);
        const hashC = createHash('sha256').update(bufC).digest('hex');
        const hashQ = createHash('sha256').update(bufQ).digest('hex');
        photos = {
          storage: 'local_disk' as const,
          dir: relDir.replace(/\\/g, '/'),
          crate: { fileName: fC, sha256: hashC, bytes: bufC.length },
          quality: { fileName: fQ, sha256: hashQ, bytes: bufQ.length },
        };
      }
    }

    await this.prisma.audit_trails.create({
      data: {
        id: randomUUID(),
        eventType: 'QUALITY_CHECK',
        entityType: 'Batch',
        entityId: batch.id,
        batchId: batch.id,
        performedByUserId: userId,
        newValue: {
          source: 'mobile_packing_flow',
          gps: { lat: dto.latitude, lng: dto.longitude },
          completedAt: at.toISOString(),
          ...(photos && { photos }),
        },
        isCompliant: true,
        location: { lat: dto.latitude, lng: dto.longitude },
        timestamp: at,
      } as any,
    });
    return { success: true, batchId: batch.batchId, id: batch.id, photosSaved: Boolean(photos) };
  }

  /**
   * Serve a packing-flow photo (crate | quality) from the latest audit with stored files or blob URL.
   */
  async getPackingFlowPhotoFile(
    userId: string,
    batchRef: string,
    kind: 'crate' | 'quality',
  ): Promise<{ filePath: string; fileName: string } | { redirectUrl: string; fileName: string }> {
    const batch = await this.prisma.batches.findFirst({
      where: {
        OR: [{ id: batchRef }, { batchId: batchRef }],
        harvestedByUserId: userId,
      },
    });
    if (!batch) {
      throw new NotFoundException('Batch not found or you do not have access');
    }
    const expectedDir = `packing-flow/${batch.id}`.replace(/\\/g, '/');
    const trails = await this.prisma.audit_trails.findMany({
      where: {
        batchId: batch.id,
        eventType: 'QUALITY_CHECK',
      },
      orderBy: { timestamp: 'desc' },
      take: 30,
    });
    const trail = trails.find((t) => {
      const nv = t.newValue as Record<string, unknown> | null;
      return nv?.source === 'mobile_packing_flow' && nv?.photos;
    });
    if (!trail) {
      throw new NotFoundException('No packing flow record with photos found');
    }
    const nv = trail.newValue as Record<string, unknown>;
    const p = nv.photos as Record<string, unknown>;
    if (p.storage === 'vercel_blob') {
      const sub = p[kind] as { url?: string } | undefined;
      if (!sub?.url) {
        throw new NotFoundException('Photo not found');
      }
      const u = new URL(sub.url);
      const seg = u.pathname.split('/').filter(Boolean).pop() || 'photo';
      return { redirectUrl: sub.url, fileName: seg };
    }
    const dir = p.dir as string;
    const sub = p[kind] as { fileName?: string } | undefined;
    if (!dir || !sub?.fileName) {
      throw new NotFoundException('Photo not found');
    }
    if (dir !== expectedDir) {
      throw new BadRequestException('Invalid path');
    }
    if (!/^[a-zA-Z0-9._-]+\.(jpg|jpeg|png)$/i.test(sub.fileName)) {
      throw new BadRequestException('Invalid file name');
    }
    const full = path.join(process.cwd(), 'uploads', dir, sub.fileName);
    const resolved = path.resolve(full);
    const base = path.resolve(path.join(process.cwd(), 'uploads', dir));
    if (!resolved.startsWith(base) || !fs.existsSync(resolved)) {
      throw new NotFoundException('Photo file missing');
    }
    return { filePath: resolved, fileName: sub.fileName };
  }

  private stripDataUrlBase64(input: string): string {
    const m = input.trim().match(/^data:image\/\w+;base64,(.+)$/is);
    return m ? m[1] : input.replace(/\s/g, '');
  }

  private decodePackingPhotoBase64(base64: string): Buffer {
    const raw = this.stripDataUrlBase64(base64);
    const buf = Buffer.from(raw, 'base64');
    if (buf.length === 0) {
      throw new BadRequestException('Invalid image data');
    }
    if (buf.length > BatchesService.MAX_PACKING_PHOTO_BYTES) {
      throw new BadRequestException(`Each photo must be at most ${BatchesService.MAX_PACKING_PHOTO_BYTES} bytes`);
    }
    return buf;
  }

  private static guessImageExt(buf: Buffer): 'jpg' | 'png' {
    if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg';
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
    return 'jpg';
  }
}
