import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin, Plus, X } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import type { DeliveryLocation } from './types';

type Props = {
  locations: DeliveryLocation[];
  onDelete: (id: string) => void;
  showModal: boolean;
  onOpenModal: () => void;
  onEdit: (location: DeliveryLocation) => void;
  onCloseModal: () => void;
  newLocation: Partial<DeliveryLocation>;
  setNewLocation: (loc: Partial<DeliveryLocation>) => void;
  onAdd: () => void;
  editingLocationId: string | null;
};

export function LocationsTab({
  locations,
  onDelete,
  showModal,
  onOpenModal,
  onEdit,
  onCloseModal,
  newLocation,
  setNewLocation,
  onAdd,
  editingLocationId,
}: Props) {
  const { t } = useTranslation();

  return (
    <View>
      <TouchableOpacity
        onPress={onOpenModal}
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
        <Text
          style={{
            fontSize: 13,
            fontWeight: '400',
            color: 'white',
            marginLeft: theme.spacing.sm,
            letterSpacing: 0.3,
          }}
        >
          {t('buyer.profile.addLocation')}
        </Text>
      </TouchableOpacity>

      {locations.map((location) => (
        <TouchableOpacity
          key={location.id}
          onPress={() => onEdit(location)}
          activeOpacity={0.75}
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
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '400',
                    color: theme.colors.text.primary,
                    marginLeft: theme.spacing.xs,
                    letterSpacing: 0.3,
                  }}
                >
                  {location.alias}
                </Text>
              </View>
              <Text style={metaText}>
                {location.address}, {location.postalCode} {location.city}
              </Text>
              <Text style={metaText}>
                {location.responsiblePerson} • {location.responsiblePhone}
              </Text>
              <Text style={[metaText, { marginTop: theme.spacing.xs }]}>{location.operatingHours}</Text>
            </View>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                onDelete(location.id);
              }}
              accessibilityRole="button"
              accessibilityLabel={t('common.delete')}
            >
              <X size={16} color={theme.colors.error} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={onCloseModal}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: theme.borderRadius.lg,
              borderTopRightRadius: theme.borderRadius.lg,
              padding: theme.spacing.lg,
              maxHeight: '90%',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: theme.spacing.lg,
              }}
            >
              <Text style={modalTitle}>
                {editingLocationId
                  ? t('buyer.profile.modalTitleEditLocation')
                  : t('buyer.profile.modalTitleAddLocation')}
              </Text>
              <TouchableOpacity onPress={onCloseModal} accessibilityRole="button" accessibilityLabel={t('common.close')}>
                <X size={20} color={theme.colors.text.secondary} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <TextInput
                placeholder={t('buyer.profile.placeholderLocationAlias')}
                value={newLocation.alias}
                onChangeText={(text) => setNewLocation({ ...newLocation, alias: text })}
                style={fieldStyle}
              />
              <TextInput
                placeholder={t('buyer.checkout.street')}
                value={newLocation.address}
                onChangeText={(text) => setNewLocation({ ...newLocation, address: text })}
                style={fieldStyle}
              />
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <TextInput
                  placeholder={t('buyer.checkout.city')}
                  value={newLocation.city}
                  onChangeText={(text) => setNewLocation({ ...newLocation, city: text })}
                  style={[fieldStyle, { flex: 1 }]}
                />
                <TextInput
                  placeholder={t('buyer.checkout.postalCode')}
                  value={newLocation.postalCode}
                  onChangeText={(text) => setNewLocation({ ...newLocation, postalCode: text })}
                  style={[fieldStyle, { flex: 1 }]}
                />
              </View>
              <TextInput
                placeholder={t('buyer.checkout.country')}
                value={newLocation.country}
                onChangeText={(text) => setNewLocation({ ...newLocation, country: text })}
                style={fieldStyle}
              />
              <TextInput
                placeholder={t('buyer.profile.placeholderResponsiblePerson')}
                value={newLocation.responsiblePerson}
                onChangeText={(text) => setNewLocation({ ...newLocation, responsiblePerson: text })}
                style={fieldStyle}
              />
              <TextInput
                placeholder={t('buyer.profile.placeholderPhoneShort')}
                value={newLocation.responsiblePhone}
                onChangeText={(text) => setNewLocation({ ...newLocation, responsiblePhone: text })}
                keyboardType="phone-pad"
                style={fieldStyle}
              />
              <TextInput
                placeholder={t('buyer.profile.placeholderOperatingHours')}
                value={newLocation.operatingHours}
                onChangeText={(text) => setNewLocation({ ...newLocation, operatingHours: text })}
                style={[fieldStyle, { marginBottom: theme.spacing.lg }]}
              />

              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <TouchableOpacity onPress={onCloseModal} style={cancelBtn}>
                  <Text style={cancelBtnText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onAdd} style={confirmBtn}>
                  <Text style={confirmBtnText}>
                    {editingLocationId
                      ? t('buyer.profile.confirmEditLocation')
                      : t('buyer.profile.confirmAddLocation')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const metaText = {
  fontSize: 14,
  fontWeight: '400' as const,
  color: theme.colors.text.secondary,
  marginBottom: theme.spacing.xs,
};

const modalTitle = {
  fontSize: 16,
  fontWeight: '400' as const,
  color: theme.colors.text.primary,
  letterSpacing: 0.5,
};

const fieldStyle = {
  fontSize: 13,
  fontWeight: '400' as const,
  borderWidth: 0.5,
  borderColor: 'rgba(0, 0, 0, 0.1)',
  borderRadius: theme.borderRadius.sm,
  padding: theme.spacing.sm,
  marginBottom: theme.spacing.sm,
};

const cancelBtn = {
  flex: 1,
  padding: theme.spacing.md,
  borderWidth: 0.5,
  borderColor: 'rgba(0, 0, 0, 0.1)',
  borderRadius: theme.borderRadius.sm,
  alignItems: 'center' as const,
};

const cancelBtnText = {
  fontSize: 13,
  fontWeight: '400' as const,
  color: theme.colors.text.primary,
};

const confirmBtn = {
  flex: 1,
  padding: theme.spacing.md,
  backgroundColor: theme.colors.primary,
  borderRadius: theme.borderRadius.sm,
  alignItems: 'center' as const,
};

const confirmBtnText = {
  fontSize: 13,
  fontWeight: '400' as const,
  color: 'white',
};
