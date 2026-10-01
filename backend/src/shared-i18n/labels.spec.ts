import {
  orderStatusLabel,
  missionStatusLabel,
  deliveryStatusLabel,
  seedBagStatusLabel,
} from '../../../shared/i18n/labels';

const LOCALES = ['en', 'sr', 'de', 'es', 'fr', 'ro', 'bg'] as const;

const glossaries: Record<(typeof LOCALES)[number], Record<string, unknown>> = {} as never;
for (const loc of LOCALES) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  glossaries[loc] = require(`../../../shared/i18n/glossary/${loc}.json`);
}

const ORDER_CODES = [
  'PENDING',
  'APPROVED',
  'PAID',
  'CONFIRMED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
] as const;

const MISSION_CODES = [
  'AWAITING_APPROVAL',
  'PENDING',
  'ASSIGNED',
  'ACCEPTED',
  'IN_PROGRESS',
  'READY_FOR_LOADING',
  'PICKED_UP',
  'IN_TRANSIT',
  'COMPLETED',
  'CANCELLED',
] as const;

const DELIVERY_CODES = ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED'] as const;

function mockT(locale: (typeof LOCALES)[number]) {
  const g = glossaries[locale];
  return ((key: string) => {
    const parts = key.replace(/^glossary\./, '').split('.');
    let node: unknown = g;
    for (const p of parts) {
      node = (node as Record<string, unknown>)?.[p];
    }
    return typeof node === 'string' ? node : key;
  }) as never;
}

describe('shared/i18n/labels', () => {
  it('buyer order status IN_TRANSIT is U transportu in Serbian', () => {
    expect(orderStatusLabel(mockT('sr'), 'IN_TRANSIT', 'buyer')).toBe('U transportu');
  });

  it('admin APPROVED differs from buyer in Serbian', () => {
    expect(orderStatusLabel(mockT('sr'), 'APPROVED', 'buyer')).toBe('Prihvaćeno');
    expect(orderStatusLabel(mockT('sr'), 'APPROVED', 'admin')).toBe('Odobreno');
  });

  it('every order status has buyer + admin labels in all 7 glossaries', () => {
    for (const loc of LOCALES) {
      const g = glossaries[loc] as {
        orderStatus: { buyer: Record<string, string>; admin: Record<string, string> };
      };
      for (const code of ORDER_CODES) {
        expect(g.orderStatus.buyer[code]).toBeTruthy();
        expect(g.orderStatus.admin[code]).toBeTruthy();
        expect(orderStatusLabel(mockT(loc), code, 'buyer')).not.toBe(code);
        expect(orderStatusLabel(mockT(loc), code, 'admin')).not.toBe(code);
      }
    }
  });

  it('every mission admin status resolves in all 7 languages', () => {
    for (const loc of LOCALES) {
      for (const code of MISSION_CODES) {
        expect(missionStatusLabel(mockT(loc), code, 'admin')).not.toBe(code);
      }
    }
  });

  it('delivery buyer statuses resolve in all 7 languages', () => {
    for (const loc of LOCALES) {
      for (const code of DELIVERY_CODES) {
        const label = deliveryStatusLabel(mockT(loc), code, 'buyer');
        expect(label).toBeTruthy();
        expect(label).not.toBe(code);
      }
    }
  });

  it('delivery buyer IN_TRANSIT is Unterwegs in German', () => {
    expect(deliveryStatusLabel(mockT('de'), 'IN_TRANSIT', 'buyer')).toBe('Unterwegs');
  });

  it('seed bag AVAILABLE resolves in all 7 languages', () => {
    for (const loc of LOCALES) {
      expect(seedBagStatusLabel(mockT(loc), 'AVAILABLE')).not.toBe('AVAILABLE');
    }
  });
});
