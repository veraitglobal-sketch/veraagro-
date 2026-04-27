import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react-native';
import { theme } from '../lib/theme';
import { setAppLanguage } from '../lib/i18n-language';
import type { AppLanguage } from '../lib/i18n-language';

/**
 * English / Serbian toggle — same copy and storage as producer Settings.
 * Re-used on buyer Profile so the whole app can switch language from either place.
 */
export function LanguageSettingsBlock() {
  const { t, i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? i18n.language ?? 'en').split('-')[0] as string;
  const isSr = current === 'sr';

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 0.5,
        borderColor: 'rgba(0, 0, 0, 0.1)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <Globe size={20} color={theme.colors.text.primary} strokeWidth={1.5} />
        <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '300',
              color: theme.colors.text.primary,
              letterSpacing: 0.3,
            }}
          >
            {t('producer.settings.language')}
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              marginTop: 2,
              letterSpacing: 0.2,
            }}
          >
            {t('producer.settings.languageDescription')}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginTop: theme.spacing.xs, gap: theme.spacing.sm }}>
        {(['en', 'sr'] as const).map((code) => {
          const active = code === 'sr' ? isSr : !isSr;
          return (
            <TouchableOpacity
              key={code}
              onPress={() => void setAppLanguage(code as AppLanguage)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: theme.borderRadius.sm,
                borderWidth: 0.5,
                borderColor: active ? theme.colors.primary : 'rgba(0, 0, 0, 0.1)',
                backgroundColor: active ? `${theme.colors.primary}12` : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: active ? '500' : '300',
                  color: active ? theme.colors.primary : theme.colors.text.secondary,
                }}
              >
                {code === 'en' ? t('producer.settings.languageEnglish') : t('producer.settings.languageSerbian')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
