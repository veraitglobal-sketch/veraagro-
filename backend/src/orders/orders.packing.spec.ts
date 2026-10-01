import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';

describe('Grower order packing', () => {
  const baseOrder = {
    id: 'order',
    orderNumber: 'BIOVERA-1-ABC',
    buyerId: 'buyer',
    catalogProductId: 'product',
    status: 'PAID',
    packCount: 2,
    packLabel: '5 kg',
    packSizeKg: 5,
    quantity: 10,
    unit: 'kg',
    packedAt: null as Date | null,
    missions: [] as Array<{ status: string }>,
  };

  function setup(overrides: Partial<typeof baseOrder> = {}) {
    const row = { ...baseOrder, ...overrides };
    const prisma = {
      orders: {
        findFirst: jest.fn().mockResolvedValue(row),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...row, ...data })),
      },
    };
    const notifications = { createLocalized: jest.fn().mockResolvedValue({}) };
    const service = new OrdersService(prisma as any, {} as any, {} as any, notifications as any, {} as any);
    return { service, prisma, notifications };
  }

  it.each(['PENDING', 'APPROVED'])('refuses packing while the order is %s and does not notify the buyer', async (status) => {
    const { service, prisma, notifications } = setup({ status });
    await expect(service.recordGrowerPacking('grower', 'order', { packedPackCount: 2 })).rejects.toThrow(
      'not paid yet',
    );
    expect(prisma.orders.update).not.toHaveBeenCalled();
    expect(notifications.createLocalized).not.toHaveBeenCalled();
  });

  it.each(['CANCELLED', 'REJECTED', 'REFUNDED', 'DELIVERED'])('refuses packing for %s orders', async (status) => {
    const { service, prisma } = setup({ status });
    await expect(service.recordGrowerPacking('grower', 'order', { packedPackCount: 2 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.orders.update).not.toHaveBeenCalled();
  });

  it('refuses changes once the goods left the farm', async () => {
    const { service } = setup({ missions: [{ status: 'IN_TRANSIT' }] });
    await expect(service.recordGrowerPacking('grower', 'order', { packedPackCount: 2 })).rejects.toThrow(
      'left the farm',
    );
  });

  it('records a paid order once and notifies the buyer once', async () => {
    const { service, prisma, notifications } = setup();
    const saved = await service.recordGrowerPacking('grower', 'order', { packedPackCount: 2 });
    expect(saved.packedPackCount).toBe(2);
    expect(saved.packedKg).toBe(10);
    expect(notifications.createLocalized).toHaveBeenCalledTimes(1);
    expect(notifications.createLocalized.mock.calls[0][0]).toMatchObject({
      userId: 'buyer',
      templateKey: 'buyer.orderPacked',
      templateParams: { orderNumber: 'BIOVERA-1-ABC', packLine: '2 × 5 kg' },
    });
    expect(prisma.orders.update).toHaveBeenCalledTimes(1);
  });

  it('does not notify again when packing is corrected', async () => {
    const { service, notifications } = setup({ packedAt: new Date() });
    await service.recordGrowerPacking('grower', 'order', { packedPackCount: 1 });
    expect(notifications.createLocalized).not.toHaveBeenCalled();
  });

  it('rejects more packs than ordered', async () => {
    const { service } = setup();
    await expect(service.recordGrowerPacking('grower', 'order', { packedPackCount: 3 })).rejects.toThrow('2 max');
  });

  it('accepts weight within ±5 % and rejects outside it', async () => {
    const { service } = setup();
    await expect(service.recordGrowerPacking('grower', 'order', { packedPackCount: 2, packedKg: 10.4 })).resolves.toMatchObject({
      packedKg: 10.4,
    });
    const second = setup();
    await expect(
      second.service.recordGrowerPacking('grower', 'order', { packedPackCount: 2, packedKg: 11 }),
    ).rejects.toThrow('±5 %');
  });
});
