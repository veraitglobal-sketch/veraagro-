import { AuthService } from './auth.service';

describe('AuthService.buildBuyerCompanyProfileFromRegistration', () => {
  const service = new AuthService({} as never, {} as never, {} as never, {} as never, {} as never);

  it('stores delivery address when street and city are provided', () => {
    const profile = service.buildBuyerCompanyProfileFromRegistration({
      email: 'buyer@test.com',
      firstName: 'Anna',
      lastName: 'Buyer',
      password: 'secret123',
      address: 'Hafenstraße 12',
      city: 'Hamburg',
      postalCode: '20457',
      country: 'Germany',
    });

    expect(profile).toBeDefined();
    expect(profile!.deliveryLocations).toHaveLength(1);
    const loc = profile!.deliveryLocations[0];
    expect(loc.address).toBe('Hafenstraße 12');
    expect(loc.city).toBe('Hamburg');
    expect(loc.postalCode).toBe('20457');
    expect(loc.country).toBe('Germany');
    expect(loc.alias).toBe('Primary');
  });

  it('does not default country when omitted', () => {
    const profile = service.buildBuyerCompanyProfileFromRegistration({
      email: 'buyer@test.com',
      firstName: 'Anna',
      lastName: 'Buyer',
      password: 'secret123',
      address: 'Main St 1',
      city: 'Belgrade',
    });

    expect(profile!.deliveryLocations[0].country).toBe('');
  });

  it('stores GPS coordinates on the delivery location when location is provided', () => {
    const profile = service.buildBuyerCompanyProfileFromRegistration({
      email: 'buyer@test.com',
      firstName: 'Anna',
      lastName: 'Buyer',
      password: 'secret123',
      address: 'Hafenstraße 12',
      city: 'Hamburg',
      location: { latitude: 53.551086, longitude: 9.993682 },
    });

    expect(profile!.deliveryLocations[0].latitude).toBe(53.551086);
    expect(profile!.deliveryLocations[0].longitude).toBe(9.993682);
  });

  it('returns undefined when street or city is missing', () => {
    expect(
      service.buildBuyerCompanyProfileFromRegistration({
        email: 'buyer@test.com',
        firstName: 'Anna',
        lastName: 'Buyer',
        password: 'secret123',
        address: 'Only street',
      }),
    ).toBeUndefined();
  });
});
