'use client';

import { useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { MapPin, Plus, X, Building2, Users, Truck } from 'lucide-react';
import { getBuyerPortalNavItems } from '@/lib/buyer-portal-nav';

interface DeliveryLocation {
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
  operatingHours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
}

interface AuthorizedPerson {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
}

type TabType = 'general' | 'locations' | 'staff';

export default function BuyerProfilePage() {
  const buyerPortalNavItems = getBuyerPortalNavItems();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isEditing, setIsEditing] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);

  // Company Core Data
  const [companyData, setCompanyData] = useState({
    legalEntity: 'Aldi Nord',
    taxId: 'DE123456789',
    headquarters: 'Essen, Germany',
    generalDirector: 'Dr. Michael Kretz',
    financeManager: 'Sarah Weber',
  });

  // Delivery Locations
  const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>([
    {
      id: '1',
      alias: 'Glavni Distributivni Centar - Hamburg',
      address: 'Hamburger Straße 123',
      city: 'Hamburg',
      postalCode: '20095',
      country: 'Germany',
      latitude: 53.5511,
      longitude: 9.9937,
      responsiblePerson: 'Klaus Schmidt',
      responsiblePhone: '+49 40 12345678',
      operatingHours: {
        monday: '08:00 - 18:00',
        tuesday: '08:00 - 18:00',
        wednesday: '08:00 - 18:00',
        thursday: '08:00 - 18:00',
        friday: '08:00 - 18:00',
        saturday: '09:00 - 14:00',
        sunday: 'Closed',
      },
    },
    {
      id: '2',
      alias: 'Market Eimsbüttel',
      address: 'Eimsbütteler Chaussee 45',
      city: 'Hamburg',
      postalCode: '20259',
      country: 'Germany',
      latitude: 53.5714,
      longitude: 9.9602,
      responsiblePerson: 'Anna Müller',
      responsiblePhone: '+49 40 98765432',
      operatingHours: {
        monday: '07:00 - 20:00',
        tuesday: '07:00 - 20:00',
        wednesday: '07:00 - 20:00',
        thursday: '07:00 - 20:00',
        friday: '07:00 - 20:00',
        saturday: '07:00 - 20:00',
        sunday: '10:00 - 18:00',
      },
    },
  ]);

  // Authorized Personnel
  const [authorizedPersonnel, setAuthorizedPersonnel] = useState<AuthorizedPerson[]>([
    {
      id: '1',
      firstName: 'Thomas',
      lastName: 'Klein',
      email: 'thomas.klein@aldinord.de',
      phone: '+49 201 123456',
      role: 'Purchasing Manager',
    },
    {
      id: '2',
      firstName: 'Maria',
      lastName: 'Schneider',
      email: 'maria.schneider@aldinord.de',
      phone: '+49 201 234567',
      role: 'Warehouse Lead',
    },
    {
      id: '3',
      firstName: 'Peter',
      lastName: 'Fischer',
      email: 'peter.fischer@aldinord.de',
      phone: '+49 201 345678',
      role: 'Accountant',
    },
  ]);

  // New Location Form
  const [newLocation, setNewLocation] = useState<Partial<DeliveryLocation>>({
    alias: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Germany',
    latitude: 0,
    longitude: 0,
    responsiblePerson: '',
    responsiblePhone: '',
    operatingHours: {
      monday: '08:00 - 18:00',
      tuesday: '08:00 - 18:00',
      wednesday: '08:00 - 18:00',
      thursday: '08:00 - 18:00',
      friday: '08:00 - 18:00',
      saturday: '09:00 - 14:00',
      sunday: 'Closed',
    },
  });

  // New Staff Form
  const [newStaff, setNewStaff] = useState<Partial<AuthorizedPerson>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
  });

  const handleAddLocation = () => {
    if (newLocation.alias && newLocation.address && newLocation.city) {
      const location: DeliveryLocation = {
        id: Date.now().toString(),
        alias: newLocation.alias,
        address: newLocation.address,
        city: newLocation.city,
        postalCode: newLocation.postalCode || '',
        country: newLocation.country || 'Germany',
        latitude: newLocation.latitude || 0,
        longitude: newLocation.longitude || 0,
        responsiblePerson: newLocation.responsiblePerson || '',
        responsiblePhone: newLocation.responsiblePhone || '',
        operatingHours: newLocation.operatingHours || {
          monday: '08:00 - 18:00',
          tuesday: '08:00 - 18:00',
          wednesday: '08:00 - 18:00',
          thursday: '08:00 - 18:00',
          friday: '08:00 - 18:00',
          saturday: '09:00 - 14:00',
          sunday: 'Closed',
        },
      };
      setDeliveryLocations([...deliveryLocations, location]);
      setNewLocation({
        alias: '',
        address: '',
        city: '',
        postalCode: '',
        country: 'Germany',
        latitude: 0,
        longitude: 0,
        responsiblePerson: '',
        responsiblePhone: '',
        operatingHours: {
          monday: '08:00 - 18:00',
          tuesday: '08:00 - 18:00',
          wednesday: '08:00 - 18:00',
          thursday: '08:00 - 18:00',
          friday: '08:00 - 18:00',
          saturday: '09:00 - 14:00',
          sunday: 'Closed',
        },
      });
      setShowLocationModal(false);
    }
  };

  const handleAddStaff = () => {
    if (newStaff.firstName && newStaff.lastName && newStaff.email && newStaff.role) {
      const staff: AuthorizedPerson = {
        id: Date.now().toString(),
        firstName: newStaff.firstName,
        lastName: newStaff.lastName,
        email: newStaff.email,
        phone: newStaff.phone || '',
        role: newStaff.role,
      };
      setAuthorizedPersonnel([...authorizedPersonnel, staff]);
      setNewStaff({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
      });
      setShowStaffModal(false);
    }
  };

  const handleDeleteLocation = (id: string) => {
    setDeliveryLocations(deliveryLocations.filter(loc => loc.id !== id));
  };

  const handleDeleteStaff = (id: string) => {
    setAuthorizedPersonnel(authorizedPersonnel.filter(staff => staff.id !== id));
  };

  return (
    <SidebarLayout title="Company Profile" navItems={buyerPortalNavItems}>
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'general' as TabType, label: 'General', icon: Building2 },
              { id: 'locations' as TabType, label: 'Delivery Locations', icon: Truck },
              { id: 'staff' as TabType, label: 'Staff', icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-light text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="border-b border-green-200/50 pb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-light text-gray-900">Company Core</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 text-sm font-light text-gray-700 bg-white border border-[0.5px] border-black/10 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {isEditing ? 'Save Changes' : 'Edit'}
                </button>
              </div>

              <div className="space-y-6">
                {/* Legal Entity */}
                <div>
                  <h3 className="text-xs font-light tracking-[0.15em] text-gray-500 uppercase mb-4">Legal Entity</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-light text-gray-600 mb-1.5">Company Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={companyData.legalEntity}
                          onChange={(e) => setCompanyData({ ...companyData, legalEntity: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      ) : (
                        <p className="text-sm font-light text-gray-900">{companyData.legalEntity}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-light text-gray-600 mb-1.5">Tax ID (USt-ID)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={companyData.taxId}
                          onChange={(e) => setCompanyData({ ...companyData, taxId: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      ) : (
                        <p className="text-sm font-light text-gray-900">{companyData.taxId}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-light text-gray-600 mb-1.5">Headquarters</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={companyData.headquarters}
                          onChange={(e) => setCompanyData({ ...companyData, headquarters: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      ) : (
                        <p className="text-sm font-light text-gray-900">{companyData.headquarters}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Management */}
                <div className="pt-4 border-t border-[0.5px] border-black/10">
                  <h3 className="text-xs font-light tracking-[0.15em] text-gray-500 uppercase mb-4">Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-light text-gray-600 mb-1.5">General Director</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={companyData.generalDirector}
                          onChange={(e) => setCompanyData({ ...companyData, generalDirector: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      ) : (
                        <p className="text-sm font-light text-gray-900">{companyData.generalDirector}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-light text-gray-600 mb-1.5">Finance Manager</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={companyData.financeManager}
                          onChange={(e) => setCompanyData({ ...companyData, financeManager: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      ) : (
                        <p className="text-sm font-light text-gray-900">{companyData.financeManager}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Locations Tab */}
          {activeTab === 'locations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-light text-gray-900">Delivery Points</h2>
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-light text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                  Add New Location
                </button>
              </div>

              <div className="space-y-3">
                {deliveryLocations.map((location) => (
                  <div
                    key={location.id}
                    className="border-b border-green-200/50 pb-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-gray-400" strokeWidth={1} />
                          <h3 className="text-sm font-light text-gray-900">{location.alias}</h3>
                        </div>
                        <p className="text-[11px] font-light text-gray-600 mb-1">
                          {location.address}, {location.postalCode} {location.city}, {location.country}
                        </p>
                        <p className="text-[11px] font-light text-gray-500">
                          Responsible: {location.responsiblePerson} • {location.responsiblePhone}
                        </p>
                        <p className="text-[11px] font-light text-gray-500 mt-1">
                          Hours: Mon-Fri {location.operatingHours.monday}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteLocation(location.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Staff Tab */}
          {activeTab === 'staff' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-light text-gray-900">Authorized Personnel</h2>
                <button
                  onClick={() => setShowStaffModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-light text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                  Add Person
                </button>
              </div>

              <div className="bg-white rounded-lg border-[0.5px] border-black/10 overflow-hidden">
                <div className="divide-y divide-[0.5px] divide-black/10">
                  {authorizedPersonnel.map((person) => (
                    <div
                      key={person.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-[11px] font-light text-gray-900">
                          {person.firstName} {person.lastName}
                        </p>
                        <p className="text-[11px] font-light text-gray-500">{person.role}</p>
                        <p className="text-[11px] font-light text-gray-400">{person.email}</p>
                        {person.phone && (
                          <p className="text-[11px] font-light text-gray-400">{person.phone}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteStaff(person.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        {/* Add Location Modal */}
        {showLocationModal && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLocationModal(false)}
          >
            <div
              className="bg-white border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-light text-gray-900">Add New Delivery Location</h3>
                    <button
                      onClick={() => setShowLocationModal(false)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-light text-gray-600 mb-1.5">Alias</label>
                      <input
                        type="text"
                        value={newLocation.alias}
                        onChange={(e) => setNewLocation({ ...newLocation, alias: e.target.value })}
                        placeholder="e.g., Glavni Distributivni Centar - Hamburg"
                        className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-light text-gray-600 mb-1.5">Address</label>
                        <input
                          type="text"
                          value={newLocation.address}
                          onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-light text-gray-600 mb-1.5">City</label>
                        <input
                          type="text"
                          value={newLocation.city}
                          onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-light text-gray-600 mb-1.5">Postal Code</label>
                        <input
                          type="text"
                          value={newLocation.postalCode}
                          onChange={(e) => setNewLocation({ ...newLocation, postalCode: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-light text-gray-600 mb-1.5">Country</label>
                        <input
                          type="text"
                          value={newLocation.country}
                          onChange={(e) => setNewLocation({ ...newLocation, country: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-light text-gray-600 mb-1.5">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          value={newLocation.latitude}
                          onChange={(e) => setNewLocation({ ...newLocation, latitude: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-light text-gray-600 mb-1.5">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          value={newLocation.longitude}
                          onChange={(e) => setNewLocation({ ...newLocation, longitude: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-light text-gray-600 mb-1.5">Responsible Person</label>
                        <input
                          type="text"
                          value={newLocation.responsiblePerson}
                          onChange={(e) => setNewLocation({ ...newLocation, responsiblePerson: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-light text-gray-600 mb-1.5">Phone</label>
                        <input
                          type="tel"
                          value={newLocation.responsiblePhone}
                          onChange={(e) => setNewLocation({ ...newLocation, responsiblePhone: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[0.5px] border-black/10">
                      <label className="block text-[11px] font-light text-gray-600 mb-3">Operating Hours</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                          <div key={day}>
                            <label className="block text-[10px] font-light text-gray-500 mb-1 capitalize">{day}</label>
                            <input
                              type="text"
                              value={newLocation.operatingHours?.[day as keyof typeof newLocation.operatingHours] || ''}
                              onChange={(e) =>
                                setNewLocation({
                                  ...newLocation,
                                  operatingHours: {
                                    ...newLocation.operatingHours,
                                    [day]: e.target.value,
                                  } as any,
                                })
                              }
                              placeholder="08:00 - 18:00"
                              className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        onClick={() => setShowLocationModal(false)}
                        className="px-4 py-2 text-sm font-light text-gray-700 bg-white border border-[0.5px] border-black/10 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddLocation}
                        className="px-4 py-2 text-sm font-light text-white bg-green-600 rounded-lg hover:bg-green-700"
                      >
                        Add Location
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Add Staff Modal */}
        {showStaffModal && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowStaffModal(false)}
          >
            <div
              className="bg-white border border-gray-200 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-light text-gray-900">Add Authorized Person</h3>
                    <button
                      onClick={() => setShowStaffModal(false)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-light text-gray-600 mb-1.5">First Name</label>
                        <input
                          type="text"
                          value={newStaff.firstName}
                          onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-light text-gray-600 mb-1.5">Last Name</label>
                        <input
                          type="text"
                          value={newStaff.lastName}
                          onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-light text-gray-600 mb-1.5">Email</label>
                      <input
                        type="email"
                        value={newStaff.email}
                        onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                        className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-light text-gray-600 mb-1.5">Phone</label>
                      <input
                        type="tel"
                        value={newStaff.phone}
                        onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                        className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-light text-gray-600 mb-1.5">Role</label>
                      <select
                        value={newStaff.role}
                        onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                        className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                      >
                        <option value="">Select Role</option>
                        <option value="Purchasing Manager">Purchasing Manager</option>
                        <option value="Warehouse Lead">Warehouse Lead</option>
                        <option value="Accountant">Accountant</option>
                        <option value="Operations Manager">Operations Manager</option>
                        <option value="Quality Control">Quality Control</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        onClick={() => setShowStaffModal(false)}
                        className="px-4 py-2 text-sm font-light text-gray-700 bg-white border border-[0.5px] border-black/10 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddStaff}
                        className="px-4 py-2 text-sm font-light text-white bg-green-600 rounded-lg hover:bg-green-700"
                      >
                        Add Person
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </SidebarLayout>
  );
}
