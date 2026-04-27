import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n/config';

export const I18N_LANGUAGE_KEY = 'i18n_language';

export type AppLanguage = 'en' | 'sr';

/**
 * When the app is already open, call after login / cold start to prefer saved
 * choice over device locale. Safe to call multiple times.
 */
export async function applySavedLanguagePreference(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(I18N_LANGUAGE_KEY);
    if (saved === 'en' || saved === 'sr') {
      if (i18n.language !== saved) {
        await i18n.changeLanguage(saved);
      }
    }
  } catch {
    // keep device default
  }
}

export async function setAppLanguage(code: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(I18N_LANGUAGE_KEY, code);
  await i18n.changeLanguage(code);
}

export function getAppLanguage(): AppLanguage {
  const lng = (i18n.language || 'en').split('-')[0];
  return lng === 'sr' ? 'sr' : 'en';
}
