import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogOut, MapPin, Package, Building2, Truck, Users, Plus, X } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import { LanguageSettingsBlock } from '../../components/LanguageSettingsBlock';

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
  operatingHours: string;
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

/**
 * Buyer Profile Screen
 * Corporate client profile with company data, multi-location system, and role-based access
 */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuth();
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
    operatingHours: 'Mon-Fri: 08:00 - 18:00',
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
        operatingHours: newLocation.operatingHours || 'Mon-Fri: 08:00 - 18:00',
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
        operatingHours: 'Mon-Fri: 08:00 - 18:00',
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

  const handleLogout = async () => {
    Alert.alert(
      t('buyer.profile.logout'),
      t('buyer.profile.logoutConfirm'),
      [
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
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: theme.spacing.lg }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '300',
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.lg,
            letterSpacing: 1,
          }}>
            {t('buyer.profile.title')}
          </Text>

          <LanguageSettingsBlock />

          {/* Tabs */}
          <View style={{
            flexDirection: 'row',
            borderBottomWidth: 0.5,
            borderBottomColor: 'rgba(0, 0, 0, 0.1)',
            marginBottom: theme.spacing.lg,
          }}>
            {[
              { id: 'general' as TabType, label: t('buyer.profile.tabGeneral'), icon: Building2 },
              { id: 'locations' as TabType, label: t('buyer.profile.tabLocations'), icon: Truck },
              { id: 'staff' as TabType, label: t('buyer.profile.tabStaff'), icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    paddingVertical: theme.spacing.md,
                    alignItems: 'center',
                    borderBottomWidth: isActive ? 2 : 0,
                    borderBottomColor: isActive ? theme.colors.primary : 'transparent',
                  }}
                >
                  <Icon size={18} color={isActive ? theme.colors.primary : theme.colors.text.secondary} strokeWidth={1.5} />
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: isActive ? theme.colors.primary : theme.colors.text.secondary,
                    marginTop: theme.spacing.xs,
                    letterSpacing: 0.3,
                  }}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* General Tab */}
          {activeTab === 'general' && (
            <View>
              {/* User Info */}
              {user && (
                <View style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.lg,
                  marginBottom: theme.spacing.md,
                  borderWidth: 0.5,
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '300',
                    color: theme.colors.text.primary,
                    marginBottom: theme.spacing.xs,
                    letterSpacing: 0.5,
                  }}>
                    {user.firstName} {user.lastName}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    letterSpacing: 0.3,
                  }}>
                    {user.partnerCode}
                  </Text>
                </View>
              )}

              {/* Company Core */}
              <View style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.lg,
                marginBottom: theme.spacing.md,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.1)',
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '300',
                    color: theme.colors.text.primary,
                    letterSpacing: 0.5,
                  }}>
                    {t('buyer.profile.companyCore')}
                  </Text>
                  <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '300',
                      color: theme.colors.primary,
                      letterSpacing: 0.3,
                    }}>
                      {isEditing ? t('buyer.profile.save') : t('buyer.profile.edit')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ marginBottom: theme.spacing.md }}>
                  <Text style={{
                    fontSize: 10,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    letterSpacing: 0.5,
                    marginBottom: theme.spacing.sm,
                    textTransform: 'uppercase',
                  }}>
                    {t('buyer.profile.legalEntity')}
                  </Text>
                  {isEditing ? (
                    <TextInput
                      value={companyData.legalEntity}
                      onChangeText={(text) => setCompanyData({ ...companyData, legalEntity: text })}
                      style={{
                        fontSize: 13,
                        fontWeight: '300',
                        color: theme.colors.text.primary,
                        borderWidth: 0.5,
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: theme.borderRadius.sm,
                        padding: theme.spacing.sm,
                        marginBottom: theme.spacing.sm,
                      }}
                    />
                  ) : (
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '300',
                      color: theme.colors.text.primary,
                      marginBottom: theme.spacing.sm,
                    }}>
                      {companyData.legalEntity}
                    </Text>
                  )}
                  {isEditing ? (
                    <TextInput
                      value={companyData.taxId}
                      onChangeText={(text) => setCompanyData({ ...companyData, taxId: text })}
                      placeholder="Tax ID (USt-ID)"
                      style={{
                        fontSize: 13,
                        fontWeight: '300',
                        color: theme.colors.text.primary,
                        borderWidth: 0.5,
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: theme.borderRadius.sm,
                        padding: theme.spacing.sm,
                        marginBottom: theme.spacing.sm,
                      }}
                    />
                  ) : (
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '300',
                      color: theme.colors.text.secondary,
                      marginBottom: theme.spacing.sm,
                    }}>
                      {companyData.taxId}
                    </Text>
                  )}
                  {isEditing ? (
                    <TextInput
                      value={companyData.headquarters}
                      onChangeText={(text) => setCompanyData({ ...companyData, headquarters: text })}
                      placeholder="Headquarters"
                      style={{
                        fontSize: 13,
                        fontWeight: '300',
                        color: theme.colors.text.primary,
                        borderWidth: 0.5,
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: theme.borderRadius.sm,
                        padding: theme.spacing.sm,
                      }}
                    />
                  ) : (
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '300',
                      color: theme.colors.text.secondary,
                    }}>
                      {companyData.headquarters}
                    </Text>
                  )}
                </View>

                <View style={{ paddingTop: theme.spacing.md, borderTopWidth: 0.5, borderTopColor: 'rgba(0, 0, 0, 0.1)' }}>
                  <Text style={{
                    fontSize: 10,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    letterSpacing: 0.5,
                    marginBottom: theme.spacing.sm,
                    textTransform: 'uppercase',
                  }}>
                    Management
                  </Text>
                  {isEditing ? (
                    <>
                      <TextInput
                        value={companyData.generalDirector}
                        onChangeText={(text) => setCompanyData({ ...companyData, generalDirector: text })}
                        placeholder="General Director"
                        style={{
                          fontSize: 13,
                          fontWeight: '300',
                          color: theme.colors.text.primary,
                          borderWidth: 0.5,
                          borderColor: 'rgba(0, 0, 0, 0.1)',
                          borderRadius: theme.borderRadius.sm,
                          padding: theme.spacing.sm,
                          marginBottom: theme.spacing.sm,
                        }}
                      />
                      <TextInput
                        value={companyData.financeManager}
                        onChangeText={(text) => setCompanyData({ ...companyData, financeManager: text })}
                        placeholder="Finance Manager"
                        style={{
                          fontSize: 13,
                          fontWeight: '300',
                          color: theme.colors.text.primary,
                          borderWidth: 0.5,
                          borderColor: 'rgba(0, 0, 0, 0.1)',
                          borderRadius: theme.borderRadius.sm,
                          padding: theme.spacing.sm,
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '300',
                        color: theme.colors.text.secondary,
                        marginBottom: theme.spacing.xs,
                      }}>
                        General Director: {companyData.generalDirector}
                      </Text>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '300',
                        color: theme.colors.text.secondary,
                      }}>
                        Finance Manager: {companyData.financeManager}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Locations Tab */}
          {activeTab === 'locations' && (
            <View>
              <TouchableOpacity
                onPress={() => setShowLocationModal(true)}
                style={{
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: theme.spacing.md,
                }}
                activeOpacity={0.7}
              >
                <Plus size={18} color="white" strokeWidth={1.5} />
                <Text style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: 'white',
                  marginLeft: theme.spacing.sm,
                  letterSpacing: 0.3,
                }}>
                  Add New Location
                </Text>
              </TouchableOpacity>

              {deliveryLocations.map((location) => (
                <View
                  key={location.id}
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.md,
                    marginBottom: theme.spacing.sm,
                    borderWidth: 0.5,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
                        <MapPin size={14} color={theme.colors.text.secondary} strokeWidth={1} />
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '300',
                          color: theme.colors.text.primary,
                          marginLeft: theme.spacing.xs,
                          letterSpacing: 0.3,
                        }}>
                          {location.alias}
                        </Text>
                      </View>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '300',
                        color: theme.colors.text.secondary,
                        marginBottom: theme.spacing.xs,
                      }}>
                        {location.address}, {location.postalCode} {location.city}
                      </Text>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '300',
                        color: theme.colors.text.secondary,
                      }}>
                        {location.responsiblePerson} • {location.responsiblePhone}
                      </Text>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '300',
                        color: theme.colors.text.secondary,
                        marginTop: theme.spacing.xs,
                      }}>
                        {location.operatingHours}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteLocation(location.id)}>
                      <X size={16} color={theme.colors.error} strokeWidth={1.5} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Staff Tab */}
          {activeTab === 'staff' && (
            <View>
              <TouchableOpacity
                onPress={() => setShowStaffModal(true)}
                style={{
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: theme.spacing.md,
                }}
                activeOpacity={0.7}
              >
                <Plus size={18} color="white" strokeWidth={1.5} />
                <Text style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: 'white',
                  marginLeft: theme.spacing.sm,
                  letterSpacing: 0.3,
                }}>
                  Add Person
                </Text>
              </TouchableOpacity>

              <View style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
              }}>
                {authorizedPersonnel.map((person, index) => (
                  <View
                    key={person.id}
                    style={{
                      padding: theme.spacing.md,
                      borderTopWidth: index > 0 ? 0.5 : 0,
                      borderTopColor: 'rgba(0, 0, 0, 0.1)',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '300',
                        color: theme.colors.text.primary,
                        marginBottom: theme.spacing.xs,
                      }}>
                        {person.firstName} {person.lastName}
                      </Text>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '300',
                        color: theme.colors.text.secondary,
                        marginBottom: theme.spacing.xs,
                      }}>
                        {person.role}
                      </Text>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '300',
                        color: theme.colors.text.secondary,
                      }}>
                        {person.email}
                      </Text>
                      {person.phone && (
                        <Text style={{
                          fontSize: 11,
                          fontWeight: '300',
                          color: theme.colors.text.secondary,
                          marginTop: theme.spacing.xs,
                        }}>
                          {person.phone}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteStaff(person.id)}>
                      <X size={16} color={theme.colors.error} strokeWidth={1.5} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              borderWidth: 0.5,
              borderColor: theme.colors.error,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.sm,
              marginTop: theme.spacing.lg,
            }}
            activeOpacity={0.7}
          >
            <LogOut size={20} color={theme.colors.error} strokeWidth={1.5} />
            <Text style={{
              fontSize: 14,
              fontWeight: '300',
              color: theme.colors.error,
              letterSpacing: 0.5,
            }}>
              {t('buyer.profile.logout') || 'Logout'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Location Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: 'white',
            borderTopLeftRadius: theme.borderRadius.lg,
            borderTopRightRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '300',
                color: theme.colors.text.primary,
                letterSpacing: 0.5,
              }}>
                Add New Location
              </Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <X size={20} color={theme.colors.text.secondary} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <TextInput
                placeholder="Alias (e.g., Main distribution center)"
                value={newLocation.alias}
                onChangeText={(text) => setNewLocation({ ...newLocation, alias: text })}
                style={{
                  fontSize: 13,
                  fontWeight: '300',
                  borderWidth: 0.5,
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  padding: theme.spacing.sm,
                  marginBottom: theme.spacing.sm,
                }}
              />
              <TextInput
                placeholder="Address"
                value={newLocation.address}
                onChangeText={(text) => setNewLocation({ ...newLocation, address: text })}
                style={{
                  fontSize: 13,
                  fontWeight: '300',
                  borderWidth: 0.5,
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  padding: theme.spacing.sm,
                  marginBottom: theme.spacing.sm,
                }}
              />
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <TextInput
                  placeholder="City"
                  value={newLocation.city}
                  onChangeText={(text) => setNewLocation({ ...newLocation, city: text })}
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: '300',
                    borderWidth: 0.5,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: theme.borderRadius.sm,
                    padding: theme.spacing.sm,
                    marginBottom: theme.spacing.sm,
                  }}
                />
                <TextInput
                  placeholder="Postal Code"
                  value={newLocation.postalCode}
                  onChangeText={(text) => setNewLocation({ ...newLocation, postalCode: text })}
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: '300',
                    borderWidth: 0.5,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: theme.borderRadius.sm,
                    padding: theme.spacing.sm,
                    marginBottom: theme.spacing.sm,
                  }}
                />
              </View>
              <TextInput
                placeholder="Responsible Person"
                value={newLocation.responsiblePerson}
                onChangeText={(text) => setNewLocation({ ...newLocation, responsiblePerson: text })}
                style={{
                  fontSize: 13,
                  fontWeight: '300',
                  borderWidth: 0.5,
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  padding: theme.spacing.sm,
                  marginBottom: theme.spacing.sm,
                }}
              />
              <TextInput
                placeholder="Phone"
                value={newLocation.responsiblePhone}
                onChangeText={(text) => setNewLocation({ ...newLocation, responsiblePhone: text })}
                keyboardType="phone-pad"
                style={{
                  fontSize: 13,
                  fontWeight: '300',
                  borderWidth: 0.5,
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  padding: theme.spacing.sm,
                  marginBottom: theme.spacing.sm,
                }}
              />
              <TextInput
                placeholder="Operating Hours (e.g., Mon-Fri: 08:00 - 18:00)"
                value={newLocation.operatingHours}
                onChangeText={(text) => setNewLocation({ ...newLocation, operatingHours: text })}
                style={{
                  fontSize: 13,
                  fontWeight: '300',
                  borderWidth: 0.5,
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  padding: theme.spacing.sm,
                  marginBottom: theme.spacing.lg,
                }}
              />

              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <TouchableOpacity
                  onPress={() => setShowLocationModal(false)}
                  style={{
                    flex: 1,
                    padding: theme.spacing.md,
                    borderWidth: 0.5,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: theme.borderRadius.sm,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '300',
                    color: theme.colors.text.primary,
                  }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddLocation}
                  style={{
                    flex: 1,
                    padding: theme.spacing.md,
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.borderRadius.sm,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '300',
                    color: 'white',
                  }}>
                    Add Location
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Staff Modal */}
      <Modal
        visible={showStaffModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStaffModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: 'white',
            borderTopLeftRadius: theme.borderRadius.lg,
            borderTopRightRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '300',
                color: theme.colors.text.primary,
                letterSpacing: 0.5,
              }}>
                Add Authorized Person
              </Text>
              <TouchableOpacity onPress={() => setShowStaffModal(false)}>
                <X size={20} color={theme.colors.text.secondary} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="First Name"
              value={newStaff.firstName}
              onChangeText={(text) => setNewStaff({ ...newStaff, firstName: text })}
              style={{
                fontSize: 13,
                fontWeight: '300',
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderRadius: theme.borderRadius.sm,
                padding: theme.spacing.sm,
                marginBottom: theme.spacing.sm,
              }}
            />
            <TextInput
              placeholder="Last Name"
              value={newStaff.lastName}
              onChangeText={(text) => setNewStaff({ ...newStaff, lastName: text })}
              style={{
                fontSize: 13,
                fontWeight: '300',
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderRadius: theme.borderRadius.sm,
                padding: theme.spacing.sm,
                marginBottom: theme.spacing.sm,
              }}
            />
            <TextInput
              placeholder="Email"
              value={newStaff.email}
              onChangeText={(text) => setNewStaff({ ...newStaff, email: text })}
              keyboardType="email-address"
              style={{
                fontSize: 13,
                fontWeight: '300',
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderRadius: theme.borderRadius.sm,
                padding: theme.spacing.sm,
                marginBottom: theme.spacing.sm,
              }}
            />
            <TextInput
              placeholder="Phone"
              value={newStaff.phone}
              onChangeText={(text) => setNewStaff({ ...newStaff, phone: text })}
              keyboardType="phone-pad"
              style={{
                fontSize: 13,
                fontWeight: '300',
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderRadius: theme.borderRadius.sm,
                padding: theme.spacing.sm,
                marginBottom: theme.spacing.sm,
              }}
            />
            <TextInput
              placeholder="Role (e.g., Purchasing Manager)"
              value={newStaff.role}
              onChangeText={(text) => setNewStaff({ ...newStaff, role: text })}
              style={{
                fontSize: 13,
                fontWeight: '300',
                borderWidth: 0.5,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderRadius: theme.borderRadius.sm,
                padding: theme.spacing.sm,
                marginBottom: theme.spacing.lg,
              }}
            />

            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <TouchableOpacity
                onPress={() => setShowStaffModal(false)}
                style={{
                  flex: 1,
                  padding: theme.spacing.md,
                  borderWidth: 0.5,
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: theme.borderRadius.sm,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddStaff}
                style={{
                  flex: 1,
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.sm,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: 'white',
                }}>
                  Add Person
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
