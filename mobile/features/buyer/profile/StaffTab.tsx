import { View, Text, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import type { AuthorizedPerson } from './types';

type Props = {
  staff: AuthorizedPerson[];
  onDelete: (id: string) => void;
  showModal: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
  newStaff: Partial<AuthorizedPerson>;
  setNewStaff: (person: Partial<AuthorizedPerson>) => void;
  onAdd: () => void;
};

export function StaffTab({
  staff,
  onDelete,
  showModal,
  onOpenModal,
  onCloseModal,
  newStaff,
  setNewStaff,
  onAdd,
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
          {t('buyer.profile.addPerson')}
        </Text>
      </TouchableOpacity>

      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          borderWidth: 0.5,
          borderColor: 'rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
      >
        {staff.map((person, index) => (
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
              <Text style={rowTitle}>
                {person.firstName} {person.lastName}
              </Text>
              <Text style={rowMeta}>{person.role}</Text>
              <Text style={rowMeta}>{person.email}</Text>
              {person.phone ? <Text style={[rowMeta, { marginTop: theme.spacing.xs }]}>{person.phone}</Text> : null}
            </View>
            <TouchableOpacity
              onPress={() => onDelete(person.id)}
              accessibilityRole="button"
              accessibilityLabel={t('common.delete')}
            >
              <X size={16} color={theme.colors.error} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

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
              <Text style={modalTitle}>{t('buyer.profile.modalTitleAddStaff')}</Text>
              <TouchableOpacity onPress={onCloseModal}>
                <X size={20} color={theme.colors.text.secondary} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder={t('buyer.profile.placeholderFirstName')}
              value={newStaff.firstName}
              onChangeText={(text) => setNewStaff({ ...newStaff, firstName: text })}
              style={fieldStyle}
            />
            <TextInput
              placeholder={t('buyer.profile.placeholderLastName')}
              value={newStaff.lastName}
              onChangeText={(text) => setNewStaff({ ...newStaff, lastName: text })}
              style={fieldStyle}
            />
            <TextInput
              placeholder={t('buyer.profile.placeholderEmail')}
              value={newStaff.email}
              onChangeText={(text) => setNewStaff({ ...newStaff, email: text })}
              keyboardType="email-address"
              style={fieldStyle}
            />
            <TextInput
              placeholder={t('buyer.profile.placeholderPhoneShort')}
              value={newStaff.phone}
              onChangeText={(text) => setNewStaff({ ...newStaff, phone: text })}
              keyboardType="phone-pad"
              style={fieldStyle}
            />
            <TextInput
              placeholder={t('buyer.profile.placeholderRole')}
              value={newStaff.role}
              onChangeText={(text) => setNewStaff({ ...newStaff, role: text })}
              style={[fieldStyle, { marginBottom: theme.spacing.lg }]}
            />

            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <TouchableOpacity onPress={onCloseModal} style={cancelBtn}>
                <Text style={cancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onAdd} style={confirmBtn}>
                <Text style={confirmBtnText}>{t('buyer.profile.confirmAddStaff')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const rowTitle = {
  fontSize: 14,
  fontWeight: '400' as const,
  color: theme.colors.text.primary,
  marginBottom: theme.spacing.xs,
};

const rowMeta = {
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
