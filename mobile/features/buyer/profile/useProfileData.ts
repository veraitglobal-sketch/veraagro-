import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../hooks/useAuth';
import { buyerCompanyAPI, type BuyerCompanyProfile } from '../../../lib/api';
import type {
  AuthorizedPerson,
  CompanyData,
  DeliveryLocation,
  ProfileTabType,
} from './types';
import { EMPTY_LOCATION, EMPTY_STAFF } from './types';

const EMPTY_COMPANY: CompanyData = {
  legalEntity: '',
  taxId: '',
  headquarters: '',
  generalDirector: '',
  financeManager: '',
};

export function useProfileData() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTabType>('general');
  const [isEditing, setIsEditingState] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [showStaffModal, setShowStaffModal] = useState(false);

  const [companyData, setCompanyData] = useState<CompanyData>(EMPTY_COMPANY);
  const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>([]);
  const [authorizedPersonnel, setAuthorizedPersonnel] = useState<AuthorizedPerson[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const snapshot = useRef<BuyerCompanyProfile | null>(null);

  const applyProfile = useCallback((p: BuyerCompanyProfile) => {
    snapshot.current = p;
    setCompanyData({ ...EMPTY_COMPANY, ...p.company });
    setDeliveryLocations((p.deliveryLocations ?? []) as DeliveryLocation[]);
    setAuthorizedPersonnel((p.authorizedPersonnel ?? []) as AuthorizedPerson[]);
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      applyProfile(await buyerCompanyAPI.get());
    } catch (error) {
      console.error('Error loading company profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  }, [applyProfile]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  /** Persist the whole document; roll back the screen to the last saved copy on failure. */
  const persist = useCallback(
    async (next: Partial<BuyerCompanyProfile>) => {
      const base = snapshot.current ?? {
        company: EMPTY_COMPANY,
        deliveryLocations: [],
        authorizedPersonnel: [],
      };
      const merged: BuyerCompanyProfile = { ...base, ...next };
      try {
        applyProfile(await buyerCompanyAPI.update(merged));
      } catch (error) {
        console.error('Error saving company profile:', error);
        applyProfile(base);
        Alert.alert(t('error'), t('buyer.profile.saveFailed'));
      }
    },
    [applyProfile, t],
  );

  const setIsEditing = useCallback(
    (value: boolean) => {
      if (!value && isEditing) {
        void persist({ company: companyData });
      }
      setIsEditingState(value);
    },
    [isEditing, companyData, persist],
  );

  const [newLocation, setNewLocation] = useState<Partial<DeliveryLocation>>(EMPTY_LOCATION);
  const [newStaff, setNewStaff] = useState<Partial<AuthorizedPerson>>(EMPTY_STAFF);

  const openLocationModal = useCallback((existing?: DeliveryLocation) => {
    if (existing) {
      setEditingLocationId(existing.id);
      setNewLocation({ ...existing });
    } else {
      setEditingLocationId(null);
      setNewLocation(EMPTY_LOCATION);
    }
    setShowLocationModal(true);
  }, []);

  const handleAddLocation = useCallback(() => {
    if (!newLocation.alias || !newLocation.address || !newLocation.city) return;
    const location: DeliveryLocation = {
      id: editingLocationId ?? Date.now().toString(),
      alias: newLocation.alias!,
      address: newLocation.address!,
      city: newLocation.city!,
      postalCode: newLocation.postalCode || '',
      country: newLocation.country || '',
      latitude: newLocation.latitude || 0,
      longitude: newLocation.longitude || 0,
      responsiblePerson: newLocation.responsiblePerson || '',
      responsiblePhone: newLocation.responsiblePhone || '',
      operatingHours: newLocation.operatingHours || '',
    };
    const next = editingLocationId
      ? deliveryLocations.map((loc) => (loc.id === editingLocationId ? location : loc))
      : [...deliveryLocations, location];
    void persist({ deliveryLocations: next });
    setNewLocation(EMPTY_LOCATION);
    setEditingLocationId(null);
    setShowLocationModal(false);
  }, [newLocation, deliveryLocations, persist, editingLocationId]);

  const handleAddStaff = useCallback(() => {
    if (!newStaff.firstName || !newStaff.lastName || !newStaff.email || !newStaff.role) return;
    const staff: AuthorizedPerson = {
      id: Date.now().toString(),
      firstName: newStaff.firstName,
      lastName: newStaff.lastName,
      email: newStaff.email,
      phone: newStaff.phone || '',
      role: newStaff.role,
    };
    void persist({ authorizedPersonnel: [...authorizedPersonnel, staff] });
    setNewStaff(EMPTY_STAFF);
    setShowStaffModal(false);
  }, [newStaff, authorizedPersonnel, persist]);

  const handleDeleteLocation = useCallback(
    (id: string) => {
      void persist({ deliveryLocations: deliveryLocations.filter((loc) => loc.id !== id) });
    },
    [deliveryLocations, persist],
  );

  const handleDeleteStaff = useCallback(
    (id: string) => {
      void persist({ authorizedPersonnel: authorizedPersonnel.filter((p) => p.id !== id) });
    },
    [authorizedPersonnel, persist],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadProfile();
    } finally {
      setRefreshing(false);
    }
  }, [loadProfile]);

  const handleLogout = useCallback(() => {
    Alert.alert(t('buyer.profile.logout'), t('buyer.profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('buyer.profile.logout'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          await AsyncStorage.removeItem('shopping_cart');
          router.replace('/buyer-login');
        },
      },
    ]);
  }, [t, logout, router]);

  return {
    user,
    refreshing,
    loadingProfile,
    activeTab,
    setActiveTab,
    isEditing,
    setIsEditing,
    showLocationModal,
    setShowLocationModal,
    openLocationModal,
    editingLocationId,
    showStaffModal,
    setShowStaffModal,
    companyData,
    setCompanyData,
    deliveryLocations,
    authorizedPersonnel,
    newLocation,
    setNewLocation,
    newStaff,
    setNewStaff,
    handleAddLocation,
    handleAddStaff,
    handleDeleteLocation,
    handleDeleteStaff,
    onRefresh,
    handleLogout,
  };
}
