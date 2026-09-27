import { BadRequestException } from '@nestjs/common';
import { B2bSuppliersService } from './b2b-suppliers.service';

function serviceWith(order: Record<string, unknown>) {
  const prisma = {
    users: { findUniqueOrThrow: jest.fn().mockResolvedValue({ roles: ['MATERIAL_SUPPLIER'] }) },
    supplier_direct_orders: {
      findFirst: jest.fn().mockResolvedValue(order),
      update: jest.fn().mockImplementation(({ data }) => ({ ...order, ...data })),
    },
  };
  const notifications = { create: jest.fn().mockResolvedValue({}) };
  const service = new B2bSuppliersService(prisma as any, notifications as any);
  return { service, prisma, notifications };
}

describe('Supplier direct order status workflow', () => {
  const base = { id: 'abcdef12-0000', farmerId: 'farmer', supplierUserId: 'sup', farmerReceivedAt: null };

  it('confirms a pending order and tells the farmer', async () => {
    const { service, notifications } = serviceWith({ ...base, status: 'PENDING' });
    await service.updateOrderStatus('sup', base.id, 'CONFIRMED' as any);
    expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'farmer', title: 'Order confirmed' }));
  });

  it.each([
    ['PENDING', 'FULFILLED'],
    ['FULFILLED', 'PENDING'],
    ['REJECTED', 'CONFIRMED'],
    ['CANCELLED', 'CONFIRMED'],
  ])('rejects %s → %s', async (from, to) => {
    const { service, prisma } = serviceWith({ ...base, status: from });
    await expect(service.updateOrderStatus('sup', base.id, to as any)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.supplier_direct_orders.update).not.toHaveBeenCalled();
  });

  it('cannot cancel after the farmer confirmed receipt', async () => {
    const { service } = serviceWith({ ...base, status: 'CONFIRMED', farmerReceivedAt: new Date() });
    await expect(service.updateOrderStatus('sup', base.id, 'CANCELLED' as any)).rejects.toBeInstanceOf(BadRequestException);
  });
});
