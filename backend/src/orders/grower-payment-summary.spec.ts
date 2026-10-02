import { growerPaymentSummaryFromOrder } from './orders.service';

describe('growerPaymentSummaryFromOrder', () => {
  it('maps awaiting payment statuses', () => {
    expect(growerPaymentSummaryFromOrder({ status: 'PENDING' })).toBe('AWAITING_PAYMENT');
    expect(growerPaymentSummaryFromOrder({ status: 'APPROVED' })).toBe('AWAITING_PAYMENT');
  });

  it('maps paid in escrow for fulfilment statuses', () => {
    expect(growerPaymentSummaryFromOrder({ status: 'PAID' })).toBe('PAID_IN_ESCROW');
    expect(growerPaymentSummaryFromOrder({ status: 'CONFIRMED' })).toBe('PAID_IN_ESCROW');
    expect(growerPaymentSummaryFromOrder({ status: 'IN_TRANSIT' })).toBe('PAID_IN_ESCROW');
  });

  it('maps settled and refund paths', () => {
    expect(growerPaymentSummaryFromOrder({ status: 'COMPLETED' })).toBe('SETTLED');
    expect(growerPaymentSummaryFromOrder({ status: 'REFUNDED' })).toBe('REFUNDED');
  });
});
