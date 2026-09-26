import { GrowerPortalService } from './grower-portal.service';

describe('mobile product readback', () => {
  it('scopes persisted products to their grower and returns the original offline identity', async () => {
    const findMany = jest.fn().mockResolvedValue([{ clientReference: 'device-entry', createdAt: new Date('2026-09-26'),
      payload: { source: 'qr', name: 'Seed', contents: 'Tomato', quantity: 4, unit: 'kg', parcelOrEstate: 'Plot A' } }]);
    const service = new GrowerPortalService({ grower_mobile_ingest: { findMany } } as any, {} as any);
    const result = await service.listMobileProducts('grower-A');
    expect(findMany).toHaveBeenCalledWith({ where: { userId: 'grower-A', kind: 'PRODUCT' }, orderBy: { createdAt: 'desc' } });
    expect(result[0]).toMatchObject({ id: 'device-entry', source: 'qr', name: 'Seed', quantity: 4, status: 'synced', timestamp: '2026-09-26T00:00:00.000Z' });
  });
  it('keeps database failure distinguishable from a valid empty product list', async () => {
    const error = new Error('db unavailable');
    const service = new GrowerPortalService({ grower_mobile_ingest: { findMany: jest.fn().mockRejectedValue(error) } } as any, {} as any);
    await expect(service.listMobileProducts('grower-A')).rejects.toBe(error);
  });
});
