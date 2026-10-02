import { BadRequestException } from '@nestjs/common';
import { MissionsService } from './missions.service';

describe('adminCreateMissionFromOrder', () => {
  const baseOrder = {
    id: 'order-1',
    orderNumber: 'BIOVERA-1',
    productName: 'Tomato',
    quantity: 10,
    unit: 'kg',
    packCount: 2,
    packedPackCount: 2,
    packedBatchId: null as string | null,
    deliveryAddress: { street: 'A', city: 'B', postalCode: '1', country: 'RS' },
    deliveryNotes: null,
    fulfillingEstateId: 'estate-1',
    fulfilling_estate: {
      id: 'estate-1',
      name: 'Farm',
      ownerId: 'grower-1',
      polygonCoordinates: [{ lat: 44.1, lng: 20.2 }],
    },
    users: { firstName: 'Buyer', lastName: 'One', email: 'b@example.com' },
  };

  function serviceWith(order: typeof baseOrder, extras: Record<string, unknown> = {}) {
    const prisma = {
      orders: { findUnique: jest.fn().mockResolvedValue(order) },
      batches: { findUnique: jest.fn() },
      missions: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
      ...extras,
    };
    const svc = new MissionsService(
      prisma as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    return { svc, prisma };
  }

  it('rejects admin mission when order has no packed lot linked', async () => {
    const { svc } = serviceWith(baseOrder);
    await expect(svc.adminCreateMissionFromOrder('admin', { orderId: 'order-1' })).rejects.toThrow(
      'must select a lot',
    );
  });

  it('rejects when packed lot quality is incomplete', async () => {
    const { svc, prisma } = serviceWith({ ...baseOrder, packedBatchId: 'batch-1' });
    prisma.batches.findUnique.mockResolvedValue({
      id: 'batch-1',
      quality_entries: { status: 'DRAFT' },
    });
    await expect(svc.adminCreateMissionFromOrder('admin', { orderId: 'order-1' })).rejects.toThrow(
      'Quality entry',
    );
  });

  it('rejects duplicate open mission for the same order', async () => {
    const { svc, prisma } = serviceWith({ ...baseOrder, packedBatchId: 'batch-1' });
    prisma.batches.findUnique.mockResolvedValue({
      id: 'batch-1',
      quality_entries: { status: 'VERIFIED' },
    });
    prisma.missions.findFirst.mockResolvedValue({ missionNumber: 'M-1', status: 'PENDING' });
    await expect(svc.adminCreateMissionFromOrder('admin', { orderId: 'order-1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
