import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from '../i18n/config';
import { isSupportedLocale, SUPPORTED_LOCALES, type SupportedLocale } from '../../shared/i18n/constants';

export const I18N_LANGUAGE_KEY = 'i18n_language';

export type AppLanguage = SupportedLocale;

export const LOCALE_NATIVE_NAMES: Record<SupportedLocale, string> = {
  en: 'English',
  sr: 'Srpski',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  ro: 'Română',
  bg: 'Български',
};

function deviceLocale(): SupportedLocale {
  const tag = Localization.getLocales?.()[0]?.languageCode ?? 'en';
  const code = tag.split('-')[0]?.toLowerCase() ?? 'en';
  return isSupportedLocale(code) ? code : 'en';
}

/**
 * Prefer saved choice; on first launch use device language when supported.
 */
export async function applySavedLanguagePreference(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(I18N_LANGUAGE_KEY);
    const code = isSupportedLocale(saved ?? '') ? saved! : deviceLocale();
    if (i18n.language !== code) {
      await i18n.changeLanguage(code);
    }
    if (!saved) {
      await AsyncStorage.setItem(I18N_LANGUAGE_KEY, code);
    }
  } catch {
    // keep default
  }
}

export async function setAppLanguage(code: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(I18N_LANGUAGE_KEY, code);
  await i18n.changeLanguage(code);
  try {
    const { usersAPI } = await import('./api');
    await usersAPI.updatePreferredLanguage(code);
  } catch {
    /* offline or unauthenticated */
  }
}

export function getAppLanguage(): AppLanguage {
  const lng = (i18n.language || 'en').split('-')[0];
  return isSupportedLocale(lng) ? lng : 'en';
}

export { SUPPORTED_LOCALES };
