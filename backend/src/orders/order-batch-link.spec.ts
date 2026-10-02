import { BadRequestException } from '@nestjs/common';
import { assertBatchFitsOrder } from './order-batch-link';

describe('assertBatchFitsOrder', () => {
  const order = {
    orderId: 'ord-1',
    fulfillingEstateId: 'estate-a',
    catalogProductId: 'cat-1',
    productName: 'Tomatoes',
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
      status: 'QUALITY_VERIFIED',
      estates: { ownerId: 'grower-1' },
      quality_entries: { status: 'VERIFIED' },
    };
    const prisma = { batches: { findFirst: jest.fn().mockResolvedValue(batch) } };
    await expect(assertBatchFitsOrder(prisma as any, 'grower-1', order, 'BATCH-1')).resolves.toEqual(batch);
  });
});
