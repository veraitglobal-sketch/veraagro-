import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react-native';
import { setAppLanguage } from '../lib/i18n-language';
import type { AppLanguage } from '../lib/i18n-language';
import { EnterpriseSettingsGroup } from './enterprise/EnterpriseSettingsGroup';
import { enterpriseColors } from '../lib/enterprise-ui';
import { growerUi } from '../lib/grower-ui';

/**
 * English / Serbian toggle — same copy and storage as producer Settings.
 * Re-used on buyer Profile so the whole app can switch language from either place.
 */
export function LanguageSettingsBlock() {
  const { t, i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? i18n.language ?? 'en').split('-')[0] as string;
  const isSr = current === 'sr';

  return (
    <EnterpriseSettingsGroup
      title={t('producer.settings.language')}
      icon={<Globe size={20} color={enterpriseColors.primary} strokeWidth={1.5} />}
    >
      <Text style={[growerUi.settingsRowDesc, { marginBottom: 14 }]}>
        {t('producer.settings.languageDescription')}
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {(['en', 'sr'] as const).map((code) => {
          const active = code === 'sr' ? isSr : !isSr;
          return (
            <TouchableOpacity
              key={code}
              onPress={() => void setAppLanguage(code as AppLanguage)}
              activeOpacity={0.88}
              style={[
                growerUi.filterChip,
                { flex: 1 },
                active && growerUi.filterChipOn,
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  growerUi.filterChipText,
                  active && growerUi.filterChipTextOn,
                  { textAlign: 'center' },
                ]}
              >
                {code === 'en' ? t('producer.settings.languageEnglish') : t('producer.settings.languageSerbian')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </EnterpriseSettingsGroup>
  );
}
