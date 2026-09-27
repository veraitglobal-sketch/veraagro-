import { ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';

describe('Buyer payment confirmation regression', () => {
  it.each(['BANK_TRANSFER', 'CARD', 'CASH'])('cannot mark an approved order paid using %s', async (paymentMethod) => {
    const prisma = { orders: { update: jest.fn() } };
    const payments = { createEscrowPayment: jest.fn() };
    const invoices = { generateInvoice: jest.fn() };
    const service = new OrdersService(prisma as any, payments as any, {} as any, {} as any, invoices as any);
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'order', status: 'APPROVED' } as any);

    await expect(service.initiatePayment('order', 'buyer', {
      paymentMethod, transactionId: 'client-supplied-reference',
    })).rejects.toBeInstanceOf(ForbiddenException);

    expect(payments.createEscrowPayment).not.toHaveBeenCalled();
    expect(prisma.orders.update).not.toHaveBeenCalled();
    expect(invoices.generateInvoice).not.toHaveBeenCalled();
  });
});

describe('Grower order visibility', () => {
  const order = {
    id: 'order', buyerId: 'buyer', createdAt: new Date(),
    fulfilling_estate: { ownerId: 'grower' },
    payments: [{ id: 'pay' }], invoices: [{ id: 'inv' }], ratings: [{ id: 'rate' }],
  };
  function serviceWith(row: unknown) {
    const prisma = { orders: { findUnique: jest.fn().mockResolvedValue(row), findMany: jest.fn().mockResolvedValue([]) } };
    const service = new OrdersService(prisma as any, {} as any, {} as any, {} as any, {} as any);
    jest.spyOn(service as any, 'buildBuyerShipmentTracking').mockResolvedValue(null);
    return { service, prisma };
  }

  it('lets the fulfilling grower open the order without buyer payment records', async () => {
    const { service } = serviceWith(order);
    const seen = await service.findOne('order', 'grower');
    expect(seen.payments).toEqual([]);
    expect(seen.invoices).toEqual([]);
    expect(seen.ratings).toEqual([]);
  });

  it('still rejects unrelated users', async () => {
    const { service } = serviceWith(order);
    await expect(service.findOne('order', 'someone-else')).rejects.toThrow('Access denied');
  });

  it('lists only orders fulfilled from the grower\'s own estates', async () => {
    const { service, prisma } = serviceWith(order);
    await service.findAllForGrower('grower');
    expect(prisma.orders.findMany.mock.calls[0][0].where).toEqual({ fulfilling_estate: { ownerId: 'grower' } });
  });
});
