import { BadRequestException } from '@nestjs/common';
import { PreOrdersService } from './pre-orders.service';

describe('PreOrdersService', () => {
  const dto = {
    season: 2027,
    companyName: 'Markt GmbH',
    contactPerson: 'Anna',
    email: 'anna@example.test',
    lines: [
      { productId: 'apple', varietyId: 'idared', label: 'Apple – Idared', quantityKg: 1200 },
      { productId: 'pepper', label: 'Pepper', quantityKg: 300.5 },
    ],
  };

  function setup() {
    const prisma = {
      pre_orders: { create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'p1', ...data })) },
      users: { findMany: jest.fn().mockResolvedValue([{ id: 'admin1' }, { id: 'admin2' }]) },
    };
    const notifications = { create: jest.fn().mockResolvedValue({}) };
    const email = { sendContactInquiryEmail: jest.fn().mockResolvedValue(true) };
    const service = new PreOrdersService(prisma as any, notifications as any, email as any);
    return { service, prisma, notifications, email };
  }

  afterEach(() => {
    delete process.env.PRE_ORDER_SEASON;
  });

  it('is open for 2027 by default', () => {
    expect(setup().service.config()).toEqual({ season: 2027, open: true });
  });

  it('rejects a pre-order for a closed season', async () => {
    const { service, prisma } = setup();
    await expect(service.create('buyer', { ...dto, season: 2026 })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.pre_orders.create).not.toHaveBeenCalled();
  });

  it('stores the pre-order with total kg and notifies every admin', async () => {
    const { service, prisma, notifications, email } = setup();
    const row = await service.create('buyer', dto);
    expect(row.totalKg).toBe(1500.5);
    expect(prisma.pre_orders.create.mock.calls[0][0].data).toMatchObject({ season: 2027, buyerId: 'buyer' });
    expect(notifications.create).toHaveBeenCalledTimes(2);
    expect(notifications.create.mock.calls[0][0]).toMatchObject({ title: 'New pre-order 2027', actionUrl: '/admin/pre-orders?id=p1' });
    expect(email.sendContactInquiryEmail).toHaveBeenCalledTimes(1);
  });

  it('follows PRE_ORDER_SEASON when a new season opens', async () => {
    process.env.PRE_ORDER_SEASON = '2028';
    const { service } = setup();
    await expect(service.create('buyer', dto)).rejects.toThrow('2028');
  });
});
