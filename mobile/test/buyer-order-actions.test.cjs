const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { buyerOrderPermissions: permissions, buyerOrderNextStep: next } = load('lib/buyer-order-next-step.ts', {
  './buyer-delivery-state': load('lib/buyer-delivery-state.ts'),
});
const approved = { id: 'order', status: 'APPROVED', stockReservation: { status: 'RESERVED' } };

test('payment and cancellation stop when a payment or delivery already exists', () => {
  assert.deepEqual(permissions(approved), { canPay: true, canCancel: true });
  for (const status of ['PENDING', 'IN_ESCROW', 'RELEASED', 'REFUNDED']) {
    assert.deepEqual(permissions({ ...approved, payments: { status } }), { canPay: false, canCancel: false });
  }
  assert.deepEqual(permissions({ ...approved, deliveries: { id: 'delivery', status: 'ASSIGNED' } }), { canPay: false, canCancel: false });
  assert.equal(permissions({ ...approved, stockReservation: null }).canPay, false);
});

test('payment processing and preparation have distinct next steps without another payment prompt', () => {
  assert.equal(next({ ...approved, payments: { status: 'PENDING' } }).kind, 'paymentPending');
  assert.equal(next({ ...approved, payments: { status: 'IN_ESCROW' } }).kind, 'preparing');
  assert.equal(next({ ...approved, status: 'PAID' }).kind, 'preparing');
  for (const status of ['CANCELLED', 'REFUNDED']) {
    assert.equal(next({ ...approved, status, payments: { status: 'REFUNDED' } }).kind, 'closed');
  }
  assert.equal(next({ ...approved, status: 'COMPLETED', payments: { status: 'RELEASED' } }).kind, 'details');
});

test('delivery action uses the linked delivery ID and a confirmed receipt opens the report window', () => {
  const now = Date.parse('2026-09-26T12:00:00Z');
  const delivery = { id: 'delivery-42', status: 'CONFIRMED', buyerPickupConfirmedAt: new Date(now).toISOString() };
  const step = next({ ...approved, status: 'COMPLETED', deliveries: delivery }, now);
  assert.equal(step.id, 'delivery-42');
  assert.equal(step.destination, 'delivery');
  assert.equal(step.kind, 'report');
});

test('bank instructions need both recipient and IBAN in the supported order currency', () => {
  const keys = ['EXPO_PUBLIC_BIOVERA_BENEFICIARY_NAME', 'EXPO_PUBLIC_BIOVERA_BANK_IBAN', 'EXPO_PUBLIC_BIOVERA_BANK_NAME', 'EXPO_PUBLIC_BIOVERA_PAYMENT_CURRENCY'];
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    keys.forEach(key => delete process.env[key]);
    const { hasExpoPaymentConfig } = load('lib/biovera-payment-public.ts');
    process.env.EXPO_PUBLIC_BIOVERA_BANK_NAME = 'Bank';
    assert.equal(hasExpoPaymentConfig(), false);
    process.env.EXPO_PUBLIC_BIOVERA_BENEFICIARY_NAME = 'Recipient';
    assert.equal(hasExpoPaymentConfig(), false);
    process.env.EXPO_PUBLIC_BIOVERA_BANK_IBAN = 'DE89 3704 0044 0532 0130 00';
    assert.equal(hasExpoPaymentConfig(), true);
    process.env.EXPO_PUBLIC_BIOVERA_PAYMENT_CURRENCY = 'USD';
    assert.equal(hasExpoPaymentConfig(), false);
  } finally {
    for (const key of keys) { if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key]; }
  }
});
