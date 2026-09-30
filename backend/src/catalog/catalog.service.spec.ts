import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { computeMaxPacks } from './catalog.util';

describe('catalog.util', () => {
  it('computes max packs from available kg', () => {
    expect(computeMaxPacks(60, 5)).toBe(12);
    expect(computeMaxPacks(4, 5)).toBe(0);
    expect(computeMaxPacks(2.5, 0.5)).toBe(5);
  });
});

describe('CatalogService', () => {
  const prisma = {
    orders: { aggregate: jest.fn(), count: jest.fn() },
    catalog_products: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    catalog_pack_options: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    catalog_stock_movements: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    audit_trails: { create: jest.fn() },
  };
  const service = new CatalogService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('rejects publish without active pack options', async () => {
    prisma.catalog_products.findUnique.mockResolvedValue({
      id: 'p1',
      name: 'Raspberry',
      plannedQuantityKg: 100,
      status: 'DRAFT',
      availableUntil: new Date(Date.now() + 86400000),
      packOptions: [],
    });
    await expect(service.publishProduct('p1', 'admin')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects publish when no stock on offer', async () => {
    prisma.catalog_products.findUnique.mockResolvedValue({
      id: 'p1',
      name: 'Raspberry',
      plannedQuantityKg: 1000,
      status: 'DRAFT',
      availableUntil: new Date(Date.now() + 86400000),
      packOptions: [{ id: 'o1', isActive: true }],
    });
    prisma.catalog_stock_movements.aggregate.mockResolvedValue({ _sum: { quantityKg: 0 } });
    await expect(service.publishProduct('p1', 'admin')).rejects.toThrow(/Add stock before publishing/);
  });

  it('blocks pack label change when option has orders', async () => {
    prisma.catalog_pack_options.findUnique.mockResolvedValue({
      id: 'o1',
      productId: 'p1',
      label: '5 kg',
      packSizeKg: 5,
      pricePerPack: 19,
    });
    prisma.orders.count.mockResolvedValue(2);
    await expect(
      service.updatePackOption('o1', { label: '6 kg' }, 'admin'),
    ).rejects.toThrow(/only active flag, sort order and price may change/);
  });

  it('throws when product missing on update', async () => {
    prisma.catalog_products.findUnique.mockResolvedValue(null);
    await expect(service.updateProduct('missing', { name: 'X' }, 'admin')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
