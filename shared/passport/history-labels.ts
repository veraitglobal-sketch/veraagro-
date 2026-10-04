import { productNameLabel, type TranslateFn } from '../i18n/labels';

export function historyFactLabel(t: TranslateFn, fact: { label: string; value: string }): string {
  if (fact.label === 'product') return productNameLabel(t, fact.value);
  if (fact.label === 'frost') return t(`glossary.productionHistory.${fact.value}`);
  if (fact.label === 'activity') {
    if (fact.value === 'IRRIGATION' || fact.value === 'INSPECTION') return t(`glossary.productionHistory.${fact.value.toLowerCase()}`);
    if (fact.value === 'SPRAYING') return t('glossary.fieldEntryType.PRSKANJE');
    if (fact.value === 'FERTILIZING') return t('glossary.fieldEntryType.DJUBRENJE');
    if (fact.value === 'WEATHER') return t('glossary.productionHistory.weather');
    const code = fact.value === 'PRIHRANA' ? 'DJUBRENJE' : fact.value;
    const key = `glossary.fieldEntryType.${code}`;
    const translated = t(key, { defaultValue: fact.value });
    return translated === key ? fact.value : translated;
  }
  return fact.value;
}
