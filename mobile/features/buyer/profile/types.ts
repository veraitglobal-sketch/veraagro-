export interface DeliveryLocation {
  id: string;
  alias: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  responsiblePerson: string;
  responsiblePhone: string;
  operatingHours: string;
}

export interface AuthorizedPerson {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
}

export type ProfileTabType = 'general' | 'locations' | 'staff';

export interface CompanyData {
  legalEntity: string;
  taxId: string;
  headquarters: string;
  generalDirector: string;
  financeManager: string;
}

export const EMPTY_LOCATION: Partial<DeliveryLocation> = {
  alias: '',
  address: '',
  city: '',
  postalCode: '',
  country: 'Germany',
  latitude: 0,
  longitude: 0,
  responsiblePerson: '',
  responsiblePhone: '',
  operatingHours: 'Mon-Fri: 08:00 - 18:00',
};

export const EMPTY_STAFF: Partial<AuthorizedPerson> = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: '',
};
