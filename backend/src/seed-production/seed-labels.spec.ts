import {
  assertLabelLayoutNoOverlap,
  buildLabelsPdfSheet,
  computeLabelLayout,
  formatProductLine,
} from './seed-labels';

describe('seed-labels layout', () => {
  const run = {
    lotNumber: 'NS2604',
    seedCropYear: 2026,
    bagSizeLabel: '5 kg',
    originCountry: 'Serbia',
    expiresAt: new Date('2027-06-01T00:00:00.000Z'),
    approvedProduct: { name: 'Bio Vera Raspberry seed – Willamette', variety: 'Willamette' },
  };

  it('does not duplicate variety in product line', () => {
    expect(formatProductLine('Bio Vera Raspberry seed – Willamette', 'Willamette')).toBe(
      'Bio Vera Raspberry seed – Willamette',
    );
    expect(formatProductLine('Tomato seed', 'Roma')).toBe('Tomato seed — Roma');
  });

  it('computes non-overlapping regions for 70×37 mm label with QR ≥ 15 mm', () => {
    const w = (70 / 25.4) * 72;
    const h = (37 / 25.4) * 72;
    const layout = computeLabelLayout(w, h, run, true);
    expect(layout.qrSizeMm).toBeGreaterThanOrEqual(15);
    expect(layout.qr.w).toBeGreaterThanOrEqual((15 / 25.4) * 72);
    expect(layout.barcode.h).toBeGreaterThanOrEqual((7 / 25.4) * 72);
    expect(() => assertLabelLayoutNoOverlap(layout)).not.toThrow();
  });

  it('renders one label PDF without throwing', async () => {
    const pdf = await buildLabelsPdfSheet(run, [{ serialNumber: 'BV-26-NS2604-000001-AAAA', bagNumber: 1 }]);
    expect(pdf.length).toBeGreaterThan(500);
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  });
});
