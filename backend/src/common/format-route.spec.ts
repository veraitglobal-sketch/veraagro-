import { formatOptimalRoute } from './format-route';

describe('formatOptimalRoute', () => {
  it('returns a human string for mission optimalRoute objects', () => {
    const { route, routeDetail } = formatOptimalRoute(
      {
        distance: '350.00 km',
        duration: '240 min',
        waypoints: [{ lat: 45.2, lng: 19.8 }],
        destination: { address: 'Novi Sad', city: 'Serbia' },
        estimatedArrival: '2026-03-01T12:00:00.000Z',
      },
      'Test farm A',
    );
    expect(route).toBe('Test farm A → Novi Sad, Serbia, 350.00 km');
    expect(routeDetail).toMatchObject({ distance: '350.00 km' });
  });

  it('passes through string routes', () => {
    expect(formatOptimalRoute('Farm → Market, 120 km').route).toBe('Farm → Market, 120 km');
  });

  it('returns null for missing route', () => {
    expect(formatOptimalRoute(null)).toEqual({ route: null, routeDetail: null });
  });
});
