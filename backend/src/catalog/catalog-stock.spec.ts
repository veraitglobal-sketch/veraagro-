import { BadRequestException } from '@nestjs/common';
import { adminAdjustCatalogStock, sumAvailableKg } from './catalog-stock';

describe('catalog-stock ledger', () => {
  const movements: Array<{ productId: string; quantityKg: number; type: string }> = [];

  const tx = {
    $queryRaw: jest.fn(),
    catalog_products: {
      findUnique: jest.fn().mockResolvedValue({ id: 'p1' }),
    },
    catalog_stock_movements: {
      aggregate: jest.fn(async ({ where }: { where: { productId: string } }) => ({
        _sum: {
          quantityKg: movements
            .filter((m) => m.productId === where.productId)
            .reduce((s, m) => s + m.quantityKg, 0),
        },
      })),
      create: jest.fn(async ({ data }: { data: { productId: string; quantityKg: number; type: string } }) => {
        movements.push(data);
        return data;
      }),
    },
  };

  beforeEach(() => {
    movements.length = 0;
    jest.clearAllMocks();
  });

  it('sums available kg from movements', async () => {
    movements.push({ productId: 'p1', quantityKg: 600, type: 'ADMIN_ADD' });
    movements.push({ productId: 'p1', quantityKg: -60, type: 'ORDER_RESERVE' });
    expect(await sumAvailableKg(tx as never, 'p1')).toBe(540);
  });

  it('rejects ADMIN_REMOVE without reason', async () => {
    movements.push({ productId: 'p1', quantityKg: 100, type: 'ADMIN_ADD' });
    await expect(
      adminAdjustCatalogStock(tx as never, 'p1', 'ADMIN_REMOVE', 10, 'admin'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects ADMIN_REMOVE below zero', async () => {
    movements.push({ productId: 'p1', quantityKg: 40, type: 'ADMIN_ADD' });
    await expect(
      adminAdjustCatalogStock(tx as never, 'p1', 'ADMIN_REMOVE', 50, 'admin', 'quality'),
    ).rejects.toThrow(/only 40 kg on offer/);
  });
});
