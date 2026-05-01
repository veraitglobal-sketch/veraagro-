import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/** BCP 47 tag for dates, times, and EUR formatting (matches other grower screens). */
export function useAppLocaleTag(): 'sr-Latn-RS' | 'en-US' {
  const { i18n } = useTranslation();
  return useMemo(
    () =>
      typeof i18n.language === 'string' && i18n.language.toLowerCase().startsWith('sr')
        ? 'sr-Latn-RS'
        : 'en-US',
    [i18n.language],
  );
}
