import { formatRouteDisplay } from './format-route';

describe('formatRouteDisplay', () => {
  it('never returns an object — coerces optimalRoute JSON to string', () => {
    const text = formatRouteDisplay({
      distance: '350.00 km',
      destination: { address: 'Novi Sad', city: 'Serbia' },
    });
    expect(typeof text).toBe('string');
    expect(text).toContain('Novi Sad');
    expect(text).toContain('350.00 km');
  });

  it('returns string routes unchanged', () => {
    expect(formatRouteDisplay('A → B, 10 km')).toBe('A → B, 10 km');
  });
});
