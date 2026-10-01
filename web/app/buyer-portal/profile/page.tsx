'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { MapPin, Plus, X, Building2, Users, Truck, Loader2 } from 'lucide-react';
import { useBuyerPortalNavItems } from '@/lib/buyer-portal-nav';
import { buyersAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';

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

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const STAFF_ROLES = [
  { value: 'Purchasing Manager', key: 'purchasingManager' },
  { value: 'Warehouse Lead', key: 'warehouseLead' },
  { value: 'Accountant', key: 'accountant' },
  { value: 'Operations Manager', key: 'operationsManager' },
  { value: 'Quality Control', key: 'qualityControl' },
] as const;

export default function BuyerProfilePage() {
  const { t } = useTranslation();
  const buyerPortalNavItems = useBuyerPortalNavItems();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isEditing, setIsEditing] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Company Core Data (persisted: same document admin sees on /users)
  const [companyData, setCompanyData] = useState({
    legalEntity: '',
    taxId: '',
    headquarters: '',
    generalDirector: '',
    financeManager: '',
  });

  const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>([]);
  const [authorizedPersonnel, setAuthorizedPersonnel] = useState<AuthorizedPerson[]>([]);

  const persist = useCallback(
    async (override?: {
      company?: typeof companyData;
      deliveryLocations?: DeliveryLocation[];
      authorizedPersonnel?: AuthorizedPerson[];
    }) => {
      setSaving(true);
      setSaveError(null);
      try {
        await buyersAPI.updateCompanyProfile({
          company: override?.company ?? companyData,
          deliveryLocations: override?.deliveryLocations ?? deliveryLocations,
          authorizedPersonnel: override?.authorizedPersonnel ?? authorizedPersonnel,
        });
      } finally {
        setSaving(false);
      }
    },
    [companyData, deliveryLocations, authorizedPersonnel],
  );

  const showField = (v: string) => (v?.trim() ? v : t('buyerPortalProfile.emptyField'));

  const handleSaveGeneral = async () => {
    setSaveError(null);
    try {
      await persist();
      setIsEditing(false);
    } catch (e: unknown) {
      const msg = apiErrorOrT(e, t, 'common.apiErrorGeneric');
      setSaveError(msg);
      alert(msg);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError(null);
      setLoading(true);
      try {
        const data = await buyersAPI.getCompanyProfile();
        if (cancelled) return;
        setCompanyData(data.company);
        setDeliveryLocations((data.deliveryLocations || []) as DeliveryLocation[]);
        setAuthorizedPersonnel((data.authorizedPersonnel || []) as AuthorizedPerson[]);
      } catch (e: unknown) {
        if (!cancelled) {
          setLoadError(apiErrorOrT(e, t, 'common.apiErrorGeneric'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // New Location Form
  const [newLocation, setNewLocation] = useState<Partial<DeliveryLocation>>({
    alias: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
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

  const resetNewLocation = () => {
    setNewLocation({
      alias: '',
      address: '',
      city: '',
      postalCode: '',
      country: '',
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
  };

  const openLocationModal = (existing?: DeliveryLocation) => {
    if (existing) {
      setEditingLocationId(existing.id);
      setNewLocation({ ...existing });
    } else {
      setEditingLocationId(null);
      resetNewLocation();
    }
    setShowLocationModal(true);
  };

  const handleAddLocation = async () => {
    if (newLocation.alias && newLocation.address && newLocation.city) {
      const location: DeliveryLocation = {
        id: editingLocationId ?? Date.now().toString(),
        alias: newLocation.alias,
        address: newLocation.address,
        city: newLocation.city,
        postalCode: newLocation.postalCode || '',
        country: newLocation.country || '',
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
      const next = editingLocationId
        ? deliveryLocations.map((loc) => (loc.id === editingLocationId ? location : loc))
        : [...deliveryLocations, location];
      setDeliveryLocations(next);
      resetNewLocation();
      setEditingLocationId(null);
      setShowLocationModal(false);
      try {
        await buyersAPI.updateCompanyProfile({
          company: companyData,
          deliveryLocations: next,
          authorizedPersonnel,
        });
      } catch (e: unknown) {
        const msg = apiErrorOrT(e, t, 'common.apiErrorGeneric');
        setSaveError(msg);
        alert(msg);
      }
    }
  };

  const handleAddStaff = async () => {
    if (newStaff.firstName && newStaff.lastName && newStaff.email && newStaff.role) {
      const staff: AuthorizedPerson = {
        id: Date.now().toString(),
        firstName: newStaff.firstName,
        lastName: newStaff.lastName,
        email: newStaff.email,
        phone: newStaff.phone || '',
        role: newStaff.role,
      };
      const next = [...authorizedPersonnel, staff];
      setAuthorizedPersonnel(next);
      setNewStaff({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
      });
      setShowStaffModal(false);
      try {
        await buyersAPI.updateCompanyProfile({
          company: companyData,
          deliveryLocations,
          authorizedPersonnel: next,
        });
      } catch (e: unknown) {
        const msg = apiErrorOrT(e, t, 'common.apiErrorGeneric');
        setSaveError(msg);
        alert(msg);
      }
    }
  };

  const handleDeleteLocation = async (id: string) => {
    const next = deliveryLocations.filter((loc) => loc.id !== id);
    setDeliveryLocations(next);
    try {
      await buyersAPI.updateCompanyProfile({
        company: companyData,
        deliveryLocations: next,
        authorizedPersonnel,
      });
    } catch (e: unknown) {
      const msg = apiErrorOrT(e, t, 'common.apiErrorGeneric');
      setSaveError(msg);
      alert(msg);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    const next = authorizedPersonnel.filter((staff) => staff.id !== id);
    setAuthorizedPersonnel(next);
    try {
      await buyersAPI.updateCompanyProfile({
        company: companyData,
        deliveryLocations,
        authorizedPersonnel: next,
      });
    } catch (e: unknown) {
      const msg = apiErrorOrT(e, t, 'common.apiErrorGeneric');
      setSaveError(msg);
      alert(msg);
    }
  };

  return (
    <AuthGuard requiredRoles={['BUYER']}>
    <SidebarLayout title={t('buyerPortalPages.profile')} navItems={buyerPortalNavItems}>
      <div className="space-y-6">
        {loadError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-lg text-sm">
            {loadError}
          </div>
        )}
        {saveError && (
          <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-lg text-sm">
            <p className="font-medium">{t('buyerPortalProfile.saveFailedTitle')}</p>
            <p className="mt-1 font-light">{saveError}</p>
            <p className="mt-2 text-xs font-light text-red-800/90">{t('buyerPortalProfile.saveFailedMigrationHint')}</p>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-light">{t('buyerPortalProfile.loading')}</span>
          </div>
        ) : null}
        {!loading && (
          <>
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'general' as TabType, labelKey: 'buyerPortalProfile.tabGeneral', icon: Building2 },
              { id: 'locations' as TabType, labelKey: 'buyerPortalProfile.tabLocations', icon: Truck },
              { id: 'staff' as TabType, labelKey: 'buyerPortalProfile.tabStaff', icon: Users },
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
                  {t(tab.labelKey)}
                </button>
              );
            })}
          </nav>
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="border-b border-green-200/50 pb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-light text-gray-900">{t('buyerPortalProfile.companyCore')}</h2>
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    if (isEditing) {
                      await handleSaveGeneral();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  className="px-4 py-2 text-sm font-light text-gray-700 bg-white border border-[0.5px] border-black/10 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isEditing ? t('buyerPortalProfile.saveChanges') : t('buyerPortalProfile.edit')}
                </button>
              </div>

              <div className="space-y-6">
                {/* Legal Entity */}
                <div>
                  <h3 className="text-xs font-light tracking-[0.15em] text-gray-500 uppercase mb-4">{t('buyerPortalProfile.legalEntity')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-light text-gray-600 mb-1.5">{t('buyerPortalProfile.companyName')}</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={companyData.legalEntity}
                          onChange={(e) => setCompanyData({ ...companyData, legalEntity: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      ) : (
                        <p className="text-sm font-light text-gray-900">{showField(companyData.legalEntity)}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-light text-gray-600 mb-1.5">{t('buyerPortalProfile.taxId')}</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={companyData.taxId}
                          onChange={(e) => setCompanyData({ ...companyData, taxId: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      ) : (
                        <p className="text-sm font-light text-gray-900">{showField(companyData.taxId)}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-light text-gray-600 mb-1.5">{t('buyerPortalProfile.headquarters')}</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={companyData.headquarters}
                          onChange={(e) => setCompanyData({ ...companyData, headquarters: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      ) : (
                        <p className="text-sm font-light text-gray-900">{showField(companyData.headquarters)}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Management */}
                <div className="pt-4 border-t border-[0.5px] border-black/10">
                  <h3 className="text-xs font-light tracking-[0.15em] text-gray-500 uppercase mb-4">{t('buyerPortalProfile.management')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-light text-gray-600 mb-1.5">{t('buyerPortalProfile.generalDirector')}</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={companyData.generalDirector}
                          onChange={(e) => setCompanyData({ ...companyData, generalDirector: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      ) : (
                        <p className="text-sm font-light text-gray-900">{showField(companyData.generalDirector)}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-light text-gray-600 mb-1.5">{t('buyerPortalProfile.financeManager')}</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={companyData.financeManager}
                          onChange={(e) => setCompanyData({ ...companyData, financeManager: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      ) : (
                        <p className="text-sm font-light text-gray-900">{showField(companyData.financeManager)}</p>
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
                <h2 className="text-lg font-light text-gray-900">{t('buyerPortalProfile.deliveryPoints')}</h2>
                <button
                  onClick={() => openLocationModal()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-light text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                  {t('buyerPortalProfile.addNewLocation')}
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
                          {t('buyerPortalProfile.responsible', {
                            name: location.responsiblePerson,
                            phone: location.responsiblePhone,
                          })}
                        </p>
                        <p className="text-[11px] font-light text-gray-500 mt-1">
                          {t('buyerPortalProfile.hoursMonFri', { hours: location.operatingHours.monday })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openLocationModal(location)}
                          className="min-h-[44px] px-3 text-sm font-medium text-[#2D5A27] hover:underline"
                        >
                          {t('buyerPortalProfile.editLocation')}
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(location.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </div>
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
                <h2 className="text-lg font-light text-gray-900">{t('buyerPortalProfile.authorizedPersonnel')}</h2>
                <button
                  onClick={() => setShowStaffModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-light text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                  {t('buyerPortalProfile.addPerson')}
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
                    <h3 className="text-lg font-light text-gray-900">
                      {editingLocationId
                        ? t('buyerPortalProfile.modalEditLocation')
                        : t('buyerPortalProfile.modalAddLocation')}
                    </h3>
                    <button
                      onClick={() => setShowLocationModal(false)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-light text-gray-600 mb-1.5">{t('buyerPortalProfile.alias')}</label>
                      <input
                        type="text"
                        value={newLocation.alias}
                        onChange={(e) => setNewLocation({ ...newLocation, alias: e.target.value })}
                        placeholder={t('buyerPortalProfile.aliasPlaceholder')}
                        className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-light text-gray-600 mb-1.5">{t('buyerPortalProfile.address')}</label>
                        <input
                          type="text"
                          value={newLocation.address}
                          onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-light text-gray-600 mb-1.5">{t('buyerPortalProfile.city')}</label>
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
                        <label className="block text-[11px] font-light text-gray-600 mb-1.5">{t('buyerPortalProfile.postalCode')}</label>
                        <input
                          type="text"
                          value={newLocation.postalCode}
                          onChange={(e) => setNewLocation({ ...newLocation, postalCode: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-light text-gray-600 mb-1.5">{t('buyerPortalProfile.country')}</label>
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
                        <label className="block text-[11px] font-light text-gray-600 mb-1.5">{t('buyerPortalProfile.latitude')}</label>
                        <input
                          type="number"
                          step="any"
                          value={newLocation.latitude}
                          onChange={(e) => setNewLocation({ ...newLocation, latitude: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-light text-gray-600 mb-1.5">{t('buyerPortalProfile.longitude')}</label>
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
                        <label className="block text-[11px] font-light text-gray-600 mb-1.5">{t('buyerPortalProfile.responsiblePerson')}</label>
                        <input
                          type="text"
                          value={newLocation.responsiblePerson}
                          onChange={(e) => setNewLocation({ ...newLocation, responsiblePerson: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-light text-gray-600 mb-1.5">{t('buyerPortalProfile.phone')}</label>
                        <input
                          type="tel"
                          value={newLocation.responsiblePhone}
                          onChange={(e) => setNewLocation({ ...newLocation, responsiblePhone: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[0.5px] border-black/10">
                      <label className="block text-[11px] font-light text-gray-600 mb-3">{t('buyerPortalProfile.operatingHours')}</label>
                      <div className="grid grid-cols-2 gap-3">
                        {WEEKDAYS.map((day) => (
                          <div key={day}>
                            <label className="block text-[10px] font-light text-gray-500 mb-1">{t(`buyerPortalProfile.days.${day}`)}</label>
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
                              placeholder={t('buyerPortalProfile.hoursPlaceholder')}
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
                        {t('buyerPortalProfile.cancel')}
                      </button>
                      <button
                        onClick={handleAddLocation}
                        className="px-4 py-2 text-sm font-light text-white bg-green-600 rounded-lg hover:bg-green-700"
                      >
                        {editingLocationId
                          ? t('buyerPortalProfile.confirmEditLocation')
                          : t('buyerPortalProfile.confirmAddLocation')}
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
                    <h3 className="text-lg font-light text-gray-900">{t('buyerPortalProfile.modalAddStaff')}</h3>
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
                        <label className="block text-[11px] font-light text-gray-600 mb-1.5">{t('buyerPortalProfile.firstName')}</label>
                        <input
                          type="text"
                          value={newStaff.firstName}
                          onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-light text-gray-600 mb-1.5">{t('buyerPortalProfile.lastName')}</label>
                        <input
                          type="text"
                          value={newStaff.lastName}
                          onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-light text-gray-600 mb-1.5">{t('buyerPortalProfile.email')}</label>
                      <input
                        type="email"
                        value={newStaff.email}
                        onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                        className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-light text-gray-600 mb-1.5">{t('buyerPortalProfile.phone')}</label>
                      <input
                        type="tel"
                        value={newStaff.phone}
                        onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                        className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-light text-gray-600 mb-1.5">{t('buyerPortalProfile.role')}</label>
                      <select
                        value={newStaff.role}
                        onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                        className="w-full px-3 py-2 text-sm font-light border-[0.5px] border-black/10 rounded-lg focus:ring-1 focus:ring-green-600 focus:border-green-600"
                      >
                        <option value="">{t('buyerPortalProfile.selectRole')}</option>
                        {STAFF_ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {t(`buyerPortalProfile.roles.${role.key}`)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        onClick={() => setShowStaffModal(false)}
                        className="px-4 py-2 text-sm font-light text-gray-700 bg-white border border-[0.5px] border-black/10 rounded-lg hover:bg-gray-50"
                      >
                        {t('buyerPortalProfile.cancel')}
                      </button>
                      <button
                        onClick={handleAddStaff}
                        className="px-4 py-2 text-sm font-light text-white bg-green-600 rounded-lg hover:bg-green-700"
                      >
                        {t('buyerPortalProfile.confirmAddStaff')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </SidebarLayout>
    </AuthGuard>
  );
}
