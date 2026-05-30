import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../../lib/theme';
import type { CompanyData } from './types';

type ProfileUser = {
  firstName?: string | null;
  lastName?: string | null;
  partnerCode?: string | null;
};

type Props = {
  user: ProfileUser | null;
  companyData: CompanyData;
  setCompanyData: (data: CompanyData) => void;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
};

export function GeneralTab({ user, companyData, setCompanyData, isEditing, setIsEditing }: Props) {
  const { t } = useTranslation();

  return (
    <View>
      {user ? (
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: '400',
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.xs,
              letterSpacing: 0.5,
            }}
          >
            {user.firstName} {user.lastName}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '400',
              color: theme.colors.text.secondary,
              letterSpacing: 0.3,
            }}
          >
            {user.partnerCode}
          </Text>
        </View>
      ) : null}

      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.lg,
          marginBottom: theme.spacing.md,
          borderWidth: 0.5,
          borderColor: 'rgba(0, 0, 0, 0.1)',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing.md,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '400',
              color: theme.colors.text.primary,
              letterSpacing: 0.5,
            }}
          >
            {t('buyer.profile.companyCore')}
          </Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '400',
                color: theme.colors.primary,
                letterSpacing: 0.3,
              }}
            >
              {isEditing ? t('buyer.profile.save') : t('buyer.profile.edit')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: theme.spacing.md }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '400',
              color: theme.colors.text.secondary,
              letterSpacing: 0.5,
              marginBottom: theme.spacing.sm,
              textTransform: 'uppercase',
            }}
          >
            {t('buyer.profile.legalEntity')}
          </Text>
          {isEditing ? (
            <>
              <TextInput
                value={companyData.legalEntity}
                onChangeText={(text) => setCompanyData({ ...companyData, legalEntity: text })}
                style={inputStyle}
              />
              <TextInput
                value={companyData.taxId}
                onChangeText={(text) => setCompanyData({ ...companyData, taxId: text })}
                placeholder={t('buyer.profile.placeholderTaxId')}
                style={inputStyle}
              />
              <TextInput
                value={companyData.headquarters}
                onChangeText={(text) => setCompanyData({ ...companyData, headquarters: text })}
                placeholder={t('buyer.profile.placeholderHeadquarters')}
                style={[inputStyle, { marginBottom: 0 }]}
              />
            </>
          ) : (
            <>
              <Text style={valueStyle}>{companyData.legalEntity}</Text>
              <Text style={secondaryValueStyle}>{companyData.taxId}</Text>
              <Text style={[secondaryValueStyle, { marginBottom: 0 }]}>{companyData.headquarters}</Text>
            </>
          )}
        </View>

        <View
          style={{
            paddingTop: theme.spacing.md,
            borderTopWidth: 0.5,
            borderTopColor: 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '400',
              color: theme.colors.text.secondary,
              letterSpacing: 0.5,
              marginBottom: theme.spacing.sm,
              textTransform: 'uppercase',
            }}
          >
            {t('buyer.profile.management')}
          </Text>
          {isEditing ? (
            <>
              <TextInput
                value={companyData.generalDirector}
                onChangeText={(text) => setCompanyData({ ...companyData, generalDirector: text })}
                placeholder={t('buyer.profile.placeholderGeneralDirector')}
                style={inputStyle}
              />
              <TextInput
                value={companyData.financeManager}
                onChangeText={(text) => setCompanyData({ ...companyData, financeManager: text })}
                placeholder={t('buyer.profile.placeholderFinanceManager')}
                style={[inputStyle, { marginBottom: 0 }]}
              />
            </>
          ) : (
            <>
              <Text style={secondaryValueStyle}>
                {t('buyer.profile.managementGeneralDirector')} {companyData.generalDirector}
              </Text>
              <Text style={[secondaryValueStyle, { marginBottom: 0 }]}>
                {t('buyer.profile.managementFinanceManager')} {companyData.financeManager}
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const inputStyle = {
  fontSize: 13,
  fontWeight: '400' as const,
  color: theme.colors.text.primary,
  borderWidth: 0.5,
  borderColor: 'rgba(0, 0, 0, 0.1)',
  borderRadius: theme.borderRadius.sm,
  padding: theme.spacing.sm,
  marginBottom: theme.spacing.sm,
};

const valueStyle = {
  fontSize: 13,
  fontWeight: '400' as const,
  color: theme.colors.text.primary,
  marginBottom: theme.spacing.sm,
};

const secondaryValueStyle = {
  fontSize: 14,
  fontWeight: '400' as const,
  color: theme.colors.text.secondary,
  marginBottom: theme.spacing.sm,
};
