import { BadRequestException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const logger = new Logger('order-fulfillment');

export const VERA_PLATFORM_ESTATE_ID =
  process.env.VERA_PLATFORM_ESTATE_ID || 'biov-vera-platform';
export const PRE_ORDER_ESTATE_ID =
  process.env.PRE_ORDER_ESTATE_ID || 'biov-preorder-system';

/** System estates that are not physical pickup points for deliveries */
export function isSystemEstateId(id: string | null | undefined): boolean {
  if (id == null) return true;
  if (id === 'PRE-ORDER') return true;
  if (id === VERA_PLATFORM_ESTATE_ID) return true;
  if (id === PRE_ORDER_ESTATE_ID) return true;
  return false;
}

/**
 * `orders.estateId` must reference a real `estates` row. Standard shop orders
 * are sold by Vera, so we use one platform estate (upserted on first use).
 */
export async function ensureVeraPlatformEstateId(
  prisma: PrismaService,
): Promise<string> {
  const existing = await prisma.estates.findFirst({
    where: { id: VERA_PLATFORM_ESTATE_ID },
  });
  if (existing) {
    return existing.id;
  }

  const owner =
    (await prisma.users.findFirst({
      where: { roles: { has: 'SUPER_ADMIN' } },
    })) ||
    (await prisma.users.findFirst({ orderBy: { createdAt: 'asc' } }));

  if (!owner) {
    throw new BadRequestException(
      'Orders are not available: no system user. Contact support.',
    );
  }

  const polygon: Prisma.InputJsonValue = {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [0, 0.00001],
        [0.00001, 0.00001],
        [0, 0],
      ],
    ],
  };

  await prisma.estates.upsert({
    where: { id: VERA_PLATFORM_ESTATE_ID },
    create: {
      id: VERA_PLATFORM_ESTATE_ID,
      name: 'Vera (platform — line seller, not a pickup point)',
      ownerId: owner.id,
      estateQrCode: null,
      polygonCoordinates: polygon,
      calculatedArea: 0,
      status: 'ACTIVE',
      updatedAt: new Date(),
    },
    update: { updatedAt: new Date() },
  });

  logger.log(`Vera platform estate ready (${VERA_PLATFORM_ESTATE_ID})`);
  return VERA_PLATFORM_ESTATE_ID;
}

/**
 * estate used for driver pickup; fulfilling farm if set, else legacy line estate when it is a real farm
 */
export function getPickupEstate(
  order: {
    estateId: string;
    fulfillingEstateId: string | null;
    fulfilling_estate: { id: string; name: string; ownerId: string; polygonCoordinates: any } | null;
    estates: { id: string; name: string; ownerId: string; polygonCoordinates: any };
  },
) {
  if (order.fulfillingEstateId && order.fulfilling_estate) {
    return order.fulfilling_estate;
  }
  if (!isSystemEstateId(order.estateId)) {
    return order.estates;
  }
  return null;
}

/**
 * User id to credit for farmer share / notify as grower: fulfilling farm first, else legacy real line estate
 */
export function getFarmerOwnerUserId(
  order: {
    estateId: string;
    fulfillingEstateId: string | null;
    fulfilling_estate: { ownerId: string } | null;
    estates: { ownerId: string };
  },
): string | null {
  if (order.fulfillingEstateId && order.fulfilling_estate) {
    return order.fulfilling_estate.ownerId;
  }
  if (!isSystemEstateId(order.estateId)) {
    return order.estates.ownerId;
  }
  return order.estates.ownerId;
}
