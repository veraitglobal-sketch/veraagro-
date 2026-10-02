import { saveWorkflowMission } from './save-workflow-mission';

jest.mock('../orders/order-batch-link', () => ({ assertBatchFitsOrder: jest.fn().mockResolvedValue({ id: 'lot' }) }));

describe('order mission attachment', () => {
  const input = { id: 'new', missionNumber: 'M-new', orderId: 'order', batchId: 'lot', growerId: 'grower',
    pickupLocation: {}, pickupAddress: 'Farm', destinationAddress: 'Buyer', updatedAt: new Date() };
  function setup(existing: Record<string, unknown> | null, changes = {}) {
    const order = { id: 'order', status: 'PAID', payments: { status: 'IN_ESCROW' }, packCount: 2, packedPackCount: 2, packedBatchId: 'lot', ...changes };
    const tx = { $queryRaw: jest.fn(), $executeRaw: jest.fn(), orders: { findUnique: async () => order },
      missions: { findMany: async () => existing ? [existing] : [], findUniqueOrThrow: async () => existing,
        update: jest.fn(async ({ data }) => ({ ...existing, ...data })), create: jest.fn(async ({ data }) => data) } };
    return { tx, db: { $transaction: async (fn: any) => fn(tx) } as any };
  }
  it('attaches the order and destination to an existing pending lot mission', async () => {
    const { db, tx } = setup({ id: 'old', batchId: 'lot', growerId: 'grower', status: 'PENDING', orderId: null });
    expect((await saveWorkflowMission(db, input)).mission).toMatchObject({ id: 'old', orderId: 'order', destinationAddress: 'Buyer' });
    expect(tx.missions.create).not.toHaveBeenCalled();
  });
  it.each(['ASSIGNED', 'IN_TRANSIT', 'COMPLETED'])('does not silently reroute an existing %s mission', async status => {
    const { db } = setup({ id: 'old', batchId: 'lot', growerId: 'grower', status, orderId: null });
    await expect(saveWorkflowMission(db, input)).rejects.toThrow('review');
  });
  it('does not reuse another order mission', async () => {
    const { db } = setup({ id: 'old', batchId: 'lot', growerId: 'grower', status: 'PENDING', orderId: 'other' });
    await expect(saveWorkflowMission(db, input)).rejects.toThrow('another order');
  });
  it.each([{ status: 'CANCELLED' }, { payments: { status: 'REFUNDED' } }, { payments: null }])('rejects orders without active escrow', async changes => {
    const { db, tx } = setup(null, changes);
    await expect(saveWorkflowMission(db, input)).rejects.toThrow('escrow');
    expect(tx.missions.create).not.toHaveBeenCalled();
  });
});
