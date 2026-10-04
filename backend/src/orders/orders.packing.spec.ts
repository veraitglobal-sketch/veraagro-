import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';

jest.mock('./order-batch-link', () => ({
  assertBatchFitsOrder: jest.fn().mockResolvedValue({ id: 'batch-internal' }),
  listCompatibleBatchesForOrder: jest.fn().mockResolvedValue([]),
}));

describe('Grower order packing', () => {
  const baseOrder = {
    id: 'order',
    orderNumber: 'BIOVERA-1-ABC',
    buyerId: 'buyer',
    catalogProductId: 'product',
    fulfillingEstateId: 'estate-1',
    status: 'PAID',
    packCount: 2,
    packLabel: '5 kg',
    packSizeKg: 5,
    quantity: 10,
    unit: 'kg',
    packedAt: null as Date | null,
    packedBatchId: null as string | null,
    buyerPackedNotifiedAt: null as Date | null,
    packedPackCount: null as number | null,
    missions: [] as Array<{ status: string }>,
  };

  function setup(overrides: Partial<typeof baseOrder> = {}) {
    const row = { ...baseOrder, ...overrides };
    const prisma = {
      $queryRaw: jest.fn(),
      $transaction: async (fn: any) => fn(prisma),
      orders: {
        findFirst: jest.fn().mockResolvedValue(row),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...row, ...data })),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      batches: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'batch-internal', actualPackDate: null, passportProductSnapshot: null }),
        update: jest.fn().mockResolvedValue({ id: 'batch-internal' }),
      },
      catalog_products: { findUnique: jest.fn().mockResolvedValue({ id: 'product', name: 'Apple', variety: null, description: null, storageConditions: 'Cool', imageUrl: null }) },
    };
    const notifications = { pushCreatedNotification: jest.fn(), createLocalized: jest.fn().mockResolvedValue({}) };
    const service = new OrdersService(prisma as any, {} as any, {} as any, notifications as any, {} as any);
    return { service, prisma, notifications, row };
  }

  it.each(['PENDING', 'APPROVED'])('refuses packing while the order is %s and does not notify the buyer', async (status) => {
    const { service, prisma, notifications } = setup({ status });
    await expect(
      service.recordGrowerPacking('grower', 'order', { packedPackCount: 2, batchId: 'BATCH-1' }),
    ).rejects.toThrow('not paid yet');
    expect(prisma.orders.update).not.toHaveBeenCalled();
    expect(notifications.createLocalized).not.toHaveBeenCalled();
  });

  it('refuses catalogue packing without a lot', async () => {
    const { service } = setup();
    await expect(service.recordGrowerPacking('grower', 'order', { packedPackCount: 2 })).rejects.toThrow(
      'Select the lot',
    );
  });

  it('does not notify buyer on partial pack', async () => {
    const { service, notifications } = setup();
    await service.recordGrowerPacking('grower', 'order', { packedPackCount: 1, batchId: 'BATCH-1' });
    expect(notifications.createLocalized).not.toHaveBeenCalled();
  });

  it('preserves product metadata and packing date already captured for a lot', async () => {
    const { service, prisma } = setup();
    const firstDate = new Date('2026-01-01');
    prisma.batches.findUniqueOrThrow.mockResolvedValue({ id: 'batch-internal', actualPackDate: firstDate,
      passportProductSnapshot: { name: 'Original' } } as any);
    await service.recordGrowerPacking('grower', 'order', { packedPackCount: 1, batchId: 'BATCH-1' });
    expect(prisma.catalog_products.findUnique).not.toHaveBeenCalled();
    expect(prisma.batches.update.mock.calls[0][0].data.actualPackDate).toEqual(firstDate);
    expect(prisma.batches.update.mock.calls[0][0].data).not.toHaveProperty('passportProductSnapshot');
  });

  it('does not overwrite an existing packaging declaration', async () => {
    const { service } = setup({ packedAt: new Date(), declaredShelfLifeHours: 48 } as any);
    await expect(service.recordGrowerPacking('grower', 'order', {
      packedPackCount: 1, batchId: 'BATCH-1', declaredShelfLifeHours: 72,
    })).rejects.toThrow('cannot be changed');
  });

  it('notifies buyer once when order becomes fully packed', async () => {
    const { service, notifications } = setup();
    await service.recordGrowerPacking('grower', 'order', { packedPackCount: 2, batchId: 'BATCH-1' });
    expect(notifications.createLocalized).toHaveBeenCalledTimes(1);
    expect(notifications.createLocalized.mock.calls[0][0]).toMatchObject({
      userId: 'buyer',
      templateKey: 'buyer.orderPacked',
      templateParams: { orderNumber: 'BIOVERA-1-ABC', packLine: '2 × 5 kg' },
    });
  });

  it('does not notify again when packing is corrected after full notification', async () => {
    const { service, notifications } = setup({
      packedAt: new Date(),
      packedPackCount: 2,
      packedBatchId: 'batch-internal',
      buyerPackedNotifiedAt: new Date(),
    });
    await service.recordGrowerPacking('grower', 'order', { packedPackCount: 2, batchId: 'BATCH-1' });
    expect(notifications.createLocalized).not.toHaveBeenCalled();
  });

  it('refuses changes once the goods left the farm', async () => {
    const { service } = setup({ missions: [{ status: 'IN_TRANSIT' }] });
    await expect(
      service.recordGrowerPacking('grower', 'order', { packedPackCount: 2, batchId: 'BATCH-1' }),
    ).rejects.toThrow('left the farm');
  });

  it('rejects more packs than ordered', async () => {
    const { service } = setup();
    await expect(
      service.recordGrowerPacking('grower', 'order', { packedPackCount: 3, batchId: 'BATCH-1' }),
    ).rejects.toThrow('2 max');
  });

  it('accepts weight within ±5 % and rejects outside it', async () => {
    const { service } = setup();
    await expect(
      service.recordGrowerPacking('grower', 'order', { packedPackCount: 2, packedKg: 10.4, batchId: 'BATCH-1' }),
    ).resolves.toMatchObject({ packedKg: 10.4 });
    const second = setup();
    await expect(
      second.service.recordGrowerPacking('grower', 'order', { packedPackCount: 2, packedKg: 11, batchId: 'BATCH-1' }),
    ).rejects.toThrow('±5 %');
  });
});
