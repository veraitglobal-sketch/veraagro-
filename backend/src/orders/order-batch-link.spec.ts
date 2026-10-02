import { BadRequestException } from '@nestjs/common';
import { assertBatchFitsOrder } from './order-batch-link';

describe('assertBatchFitsOrder', () => {
  const order = {
    orderId: 'ord-1',
    fulfillingEstateId: 'estate-a',
    catalogProductId: 'cat-1',
    productName: 'Tomatoes', quantity: 10, unit: 'kg',
  };

  it('rejects lot owned by another grower', async () => {
    const prisma = {
      batches: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'b1',
          estateId: 'estate-a',
          status: 'PACKED',
          estates: { ownerId: 'other-grower' },
          quality_entries: { status: 'COMPLETED' },
        }),
      },
    };
    await expect(assertBatchFitsOrder(prisma as any, 'grower-1', order, 'BATCH-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects lot without completed quality entry', async () => {
    const prisma = {
      batches: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'b1',
          estateId: 'estate-a',
          status: 'PACKED',
          estates: { ownerId: 'grower-1' },
          quality_entries: { status: 'DRAFT' },
        }),
      },
    };
    await expect(assertBatchFitsOrder(prisma as any, 'grower-1', order, 'BATCH-1')).rejects.toThrow(
      'quality entry',
    );
  });

  it('accepts ready lot on fulfilling estate', async () => {
    const batch = {
      id: 'b1',
      estateId: 'estate-a',
      status: 'QUALITY_VERIFIED', productName: 'Tomatoes', quantity: 20, unit: 'kg',
      estates: { ownerId: 'grower-1' },
      quality_entries: { status: 'VERIFIED' },
    };
    const prisma = { batches: { findFirst: jest.fn().mockResolvedValue(batch) }, catalog_products: { findUnique: jest.fn().mockResolvedValue(null) }, orders: { findMany: jest.fn().mockResolvedValue([]) } };
    await expect(assertBatchFitsOrder(prisma as any, 'grower-1', order, 'BATCH-1')).resolves.toEqual(batch);
  });
});

describe('lot compatibility and allocation', () => {
  const order = { orderId: 'order', fulfillingEstateId: 'farm', catalogProductId: 'product', productName: 'Raspberry', quantity: 10, unit: 'kg' };
  const lot = { id: 'lot', estateId: 'farm', estates: { ownerId: 'grower' }, productName: 'Raspberry', quantity: 15, unit: 'kg', status: 'PACKED', quality_entries: { status: 'VERIFIED' } };
  function db(batch = lot, allocations = [], product = null) {
    return { batches: { findFirst: async () => batch }, orders: { findMany: async () => allocations }, catalog_products: { findUnique: async () => product } } as any;
  }
  it('rejects the wrong product even on the same farm', async () => {
    await expect(assertBatchFitsOrder(db({ ...lot, productName: 'Apple' }), 'grower', order, 'lot')).rejects.toThrow('same product');
  });
  it('rejects insufficient quantity and quantity already promised to another order', async () => {
    await expect(assertBatchFitsOrder(db({ ...lot, quantity: 1 }), 'grower', order, 'lot')).rejects.toThrow('quantity');
    await expect(assertBatchFitsOrder(db(lot, [{ quantity: 6 }]), 'grower', order, 'lot')).rejects.toThrow('quantity');
    await expect(assertBatchFitsOrder(db(lot, [{ quantity: 5 }]), 'grower', order, 'lot')).resolves.toMatchObject({ id: 'lot' });
  });
  it('rejects the wrong source planting', async () => {
    await expect(assertBatchFitsOrder(db(lot, [], { sourcePlantingId: 'planting' }), 'grower', order, 'lot')).rejects.toThrow('planting');
  });
});
