import { growerPaymentSummaryFromOrder as summary } from './orders.service';

describe('grower payment summary follows payment evidence', () => {
  it.each(['DELIVERED', 'COMPLETED', 'PAID'] as const)('keeps %s in escrow until money is released', status => {
    expect(summary({ status, payments: { status: 'IN_ESCROW' } })).toBe('PAID_IN_ESCROW');
    expect(summary({ status, payments: { status: 'RELEASED' } })).toBe('SETTLED');
    expect(summary({ status, payments: null })).toBe('UNKNOWN');
  });
  it('handles refunds and unpaid orders without inferring settlement', () => {
    expect(summary({ status: 'DELIVERED', payments: { status: 'REFUNDED' } })).toBe('REFUNDED');
    expect(summary({ status: 'REFUNDED', payments: null })).toBe('UNKNOWN');
    expect(summary({ status: 'PENDING' })).toBe('AWAITING_PAYMENT');
    expect(summary({ status: 'APPROVED' })).toBe('AWAITING_PAYMENT');
  });
});
