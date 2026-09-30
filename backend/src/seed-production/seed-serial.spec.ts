import { buildSeedSerial, parseSeedSerial, extractSerialFromInput } from './seed-serial';

describe('seed-serial', () => {
  const prev = process.env.SEED_LABEL_SECRET;
  beforeAll(() => {
    process.env.SEED_LABEL_SECRET = 'test-seed-label-secret-fixed';
  });
  afterAll(() => {
    process.env.SEED_LABEL_SECRET = prev;
  });

  it('round-trips serial', () => {
    const serial = buildSeedSerial(2026, 'NS2604', 123);
    expect(serial).toMatch(/^BV-26-NS2604-000123-[0-9A-HJKMNP-TV-Z]{4}$/);
    const parsed = parseSeedSerial(serial);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.year).toBe(2026);
      expect(parsed.lot).toBe('NS2604');
      expect(parsed.bagNo).toBe(123);
      expect(parsed.serial).toBe(serial);
    }
  });

  it('accepts lowercase, spaces, and URL variants', () => {
    const serial = buildSeedSerial(2026, 'NS2604', 1);
    const lower = serial.toLowerCase();
    expect(parseSeedSerial(lower).ok).toBe(true);
    expect(parseSeedSerial(serial.replace(/-/g, ' ')).ok).toBe(true);
    expect(parseSeedSerial(`https://biovera.app/s/${serial}`).ok).toBe(true);
    expect(parseSeedSerial(`https://www.biovera.app/verify/seed/${serial}/`).ok).toBe(true);
    expect(parseSeedSerial(`http://biovera.app/s/${serial}?x=1`).ok).toBe(true);
    expect(extractSerialFromInput(`  https://biovera.app/s/${serial}  `)).toBe(serial);
  });

  it('rejects tampered check digit', () => {
    const serial = buildSeedSerial(2026, 'NS2604', 5);
    const tampered = serial.slice(0, -1) + (serial.endsWith('A') ? 'B' : 'A');
    const parsed = parseSeedSerial(tampered);
    expect(parsed.ok).toBe(false);
    if (parsed.ok === false) expect(parsed.reason).toBe('CHECK');
  });

  it('rejects wrong shape', () => {
    expect(parseSeedSerial('NOT-A-CODE').ok).toBe(false);
    expect(parseSeedSerial('BV-26-NS2604-000123').ok).toBe(false);
    const bad = parseSeedSerial('BV-26-NS2604-000123-IIII');
    expect(bad.ok).toBe(false);
    if (bad.ok === false) expect(bad.reason).toBe('FORMAT');
  });

  it('fails check with different secret', () => {
    const serial = buildSeedSerial(2026, 'AB123', 10);
    process.env.SEED_LABEL_SECRET = 'other-secret';
    const parsed = parseSeedSerial(serial);
    expect(parsed.ok).toBe(false);
    if (parsed.ok === false) expect(parsed.reason).toBe('CHECK');
    process.env.SEED_LABEL_SECRET = 'test-seed-label-secret-fixed';
  });
});
