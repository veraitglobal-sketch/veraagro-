import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { LogOut, Building2, Truck, Users, Bell } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { bioVeraScrollProps, TAB_SCROLL_PADDING_BOTTOM } from '../../../lib/scroll-view-props';
import { BookCallBlock } from '../../../components/BookCallBlock';
import { LanguageSettingsBlock } from '../../../components/LanguageSettingsBlock';
import { useProfileData } from './useProfileData';
import { GeneralTab } from './GeneralTab';
import { LocationsTab } from './LocationsTab';
import { StaffTab } from './StaffTab';
import type { ProfileTabType } from './types';

export default function BuyerProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useBioVeraScreenPadding();
  const data = useProfileData();

  const tabs: { id: ProfileTabType; label: string; icon: typeof Building2 }[] = [
    { id: 'general', label: t('buyer.profile.tabGeneral'), icon: Building2 },
    { id: 'locations', label: t('buyer.profile.tabLocations'), icon: Truck },
    { id: 'staff', label: t('buyer.profile.tabStaff'), icon: Users },
  ];

  return (
    <View style={{ flex: 1, paddingTop: insets.topInset, backgroundColor: theme.colors.background }}>
      <ScrollView
        {...bioVeraScrollProps}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: TAB_SCROLL_PADDING_BOTTOM }}
        refreshControl={
          <RefreshControl
            refreshing={data.refreshing}
            onRefresh={() => void data.onRefresh()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressViewOffset={10}
          />
        }
      >
        <View style={{ padding: theme.spacing.lg }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '400',
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.lg,
              letterSpacing: 1,
            }}
          >
            {t('buyer.profile.title')}
          </Text>

          <LanguageSettingsBlock />
        <BookCallBlock />

          <TouchableOpacity
            onPress={() => router.push('/(buyer)/notifications')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.lg,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.08)',
            }}
            accessibilityRole="button"
            accessibilityLabel={t('buyer.profile.openNotifications')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
              <Bell size={20} color={theme.colors.primary} strokeWidth={1.5} />
              <Text style={{ fontSize: 14, fontWeight: '400', color: theme.colors.text.primary }}>
                {t('buyer.profile.openNotifications')}
              </Text>
            </View>
            <Text style={{ fontSize: 18, color: theme.colors.text.tertiary }}>›</Text>
          </TouchableOpacity>

          <View
            style={{
              flexDirection: 'row',
              borderBottomWidth: 0.5,
              borderBottomColor: 'rgba(0, 0, 0, 0.1)',
              marginBottom: theme.spacing.lg,
            }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = data.activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => data.setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    paddingVertical: theme.spacing.md,
                    alignItems: 'center',
                    borderBottomWidth: isActive ? 2 : 0,
                    borderBottomColor: isActive ? theme.colors.primary : 'transparent',
                  }}
                >
                  <Icon
                    size={18}
                    color={isActive ? theme.colors.primary : theme.colors.text.secondary}
                    strokeWidth={1.5}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '400',
                      color: isActive ? theme.colors.primary : theme.colors.text.secondary,
                      marginTop: theme.spacing.xs,
                      letterSpacing: 0.3,
                    }}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {data.activeTab === 'general' ? (
            <GeneralTab
              user={data.user}
              companyData={data.companyData}
              setCompanyData={data.setCompanyData}
              isEditing={data.isEditing}
              setIsEditing={data.setIsEditing}
            />
          ) : null}

          {data.activeTab === 'locations' ? (
            <LocationsTab
              locations={data.deliveryLocations}
              onDelete={data.handleDeleteLocation}
              showModal={data.showLocationModal}
              onOpenModal={() => data.openLocationModal()}
              onEdit={data.openLocationModal}
              onCloseModal={() => data.setShowLocationModal(false)}
              newLocation={data.newLocation}
              setNewLocation={data.setNewLocation}
              onAdd={data.handleAddLocation}
              editingLocationId={data.editingLocationId}
            />
          ) : null}

          {data.activeTab === 'staff' ? (
            <StaffTab
              staff={data.authorizedPersonnel}
              onDelete={data.handleDeleteStaff}
              showModal={data.showStaffModal}
              onOpenModal={() => data.setShowStaffModal(true)}
              onCloseModal={() => data.setShowStaffModal(false)}
              newStaff={data.newStaff}
              setNewStaff={data.setNewStaff}
              onAdd={data.handleAddStaff}
            />
          ) : null}

          <TouchableOpacity
            onPress={data.handleLogout}
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
            <Text
              style={{
                fontSize: 14,
                fontWeight: '400',
                color: theme.colors.error,
                letterSpacing: 0.5,
              }}
            >
              {t('buyer.profile.logout')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
