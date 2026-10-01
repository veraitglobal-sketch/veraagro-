import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react-native';
import {
  setAppLanguage,
  SUPPORTED_LOCALES,
  LOCALE_NATIVE_NAMES,
  type AppLanguage,
} from '../lib/i18n-language';
import { EnterpriseSettingsGroup } from './enterprise/EnterpriseSettingsGroup';
import { enterpriseColors } from '../lib/enterprise-ui';
import { growerUi } from '../lib/grower-ui';

/**
 * Language picker — same seven locales and native names as web LanguageSwitcher.
 */
export function LanguageSettingsBlock() {
  const { t, i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? i18n.language ?? 'en').split('-')[0] as AppLanguage;

  return (
    <EnterpriseSettingsGroup
      title={t('producer.settings.language')}
      icon={<Globe size={20} color={enterpriseColors.primary} strokeWidth={1.5} />}
    >
      <Text style={[growerUi.settingsRowDesc, { marginBottom: 14 }]}>
        {t('producer.settings.languageDescription')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {SUPPORTED_LOCALES.map((code) => {
          const active = code === current;
          return (
            <TouchableOpacity
              key={code}
              onPress={() => void setAppLanguage(code)}
              activeOpacity={0.88}
              style={[growerUi.filterChip, active && growerUi.filterChipOn, { minWidth: 96 }]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[
                  growerUi.filterChipText,
                  active && growerUi.filterChipTextOn,
                  { textAlign: 'center' },
                ]}
              >
                {LOCALE_NATIVE_NAMES[code]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </EnterpriseSettingsGroup>
  );
}
