import type { TFunction } from 'i18next';

/**
 * Backend harvest-announcements errors are English; map to i18n for grower UI.
 */
export function mapPlantingSaveError(raw: string | undefined | null, t: TFunction): string {
  const s = (raw || '').trim();
  if (!s) return t('producer.plantings.errSaveGeneric');

  const low = s.toLowerCase();

  if (
    low.includes('parcel was removed') ||
    low.includes('session does not match the farm')
  ) {
    return t('producer.plantings.errSaveParcelRemoved');
  }
  if (low.includes('parcel not found') || low.includes('do not have access')) {
    return t('producer.plantings.errSaveAccess');
  }
  if (low.includes('administrator-approved') || low.includes('admin-approved parcel')) {
    return t('producer.plantings.errSaveNotApproved');
  }
  if (low.includes('require') && low.includes('approved parcel')) {
    return t('producer.plantings.errSaveNotApproved');
  }
  if (low.includes('invalid plan data')) {
    return t('producer.plantings.errSaveInvalidData');
  }
  if (low.includes('could not save this plan')) {
    return t('producer.plantings.errSaveGeneric');
  }

  return t('producer.plantings.errSaveGeneric');
}
