import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../hooks/useAuth';
import type {
  AuthorizedPerson,
  CompanyData,
  DeliveryLocation,
  ProfileTabType,
} from './types';
import { EMPTY_LOCATION, EMPTY_STAFF } from './types';

const INITIAL_LOCATIONS: DeliveryLocation[] = [
  {
    id: '1',
    alias: 'Main distribution center — Hamburg',
    address: 'Hamburger Straße 123',
    city: 'Hamburg',
    postalCode: '20095',
    country: 'Germany',
    latitude: 53.5511,
    longitude: 9.9937,
    responsiblePerson: 'Klaus Schmidt',
    responsiblePhone: '+49 40 12345678',
    operatingHours: 'Mon-Fri: 08:00 - 18:00',
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
    operatingHours: 'Mon-Sat: 07:00 - 20:00',
  },
];

const INITIAL_STAFF: AuthorizedPerson[] = [
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
];

export function useProfileData() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTabType>('general');
  const [isEditing, setIsEditing] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);

  const [companyData, setCompanyData] = useState<CompanyData>({
    legalEntity: 'Aldi Nord',
    taxId: 'DE123456789',
    headquarters: 'Essen, Germany',
    generalDirector: 'Dr. Michael Kretz',
    financeManager: 'Sarah Weber',
  });

  const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>(INITIAL_LOCATIONS);
  const [authorizedPersonnel, setAuthorizedPersonnel] = useState<AuthorizedPerson[]>(INITIAL_STAFF);
  const [newLocation, setNewLocation] = useState<Partial<DeliveryLocation>>(EMPTY_LOCATION);
  const [newStaff, setNewStaff] = useState<Partial<AuthorizedPerson>>(EMPTY_STAFF);

  const handleAddLocation = useCallback(() => {
    if (!newLocation.alias || !newLocation.address || !newLocation.city) return;
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
      operatingHours: newLocation.operatingHours || 'Mon-Fri: 08:00 - 18:00',
    };
    setDeliveryLocations((prev) => [...prev, location]);
    setNewLocation(EMPTY_LOCATION);
    setShowLocationModal(false);
  }, [newLocation]);

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
    setAuthorizedPersonnel((prev) => [...prev, staff]);
    setNewStaff(EMPTY_STAFF);
    setShowStaffModal(false);
  }, [newStaff]);

  const handleDeleteLocation = useCallback((id: string) => {
    setDeliveryLocations((prev) => prev.filter((loc) => loc.id !== id));
  }, []);

  const handleDeleteStaff = useCallback((id: string) => {
    setAuthorizedPersonnel((prev) => prev.filter((staff) => staff.id !== id));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.resolve();
    } finally {
      setRefreshing(false);
    }
  }, []);

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
    activeTab,
    setActiveTab,
    isEditing,
    setIsEditing,
    showLocationModal,
    setShowLocationModal,
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
