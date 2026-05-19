import type { TFunction } from 'i18next';

/**
 * Backend harvest-announcements errors are mostly English; map to i18n for grower UI.
 * Prefer specific keys; unknown non-empty prose is surfaced so growers/support see the server text.
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

  // POST create — ownership / readiness (English from Nest ForbiddenException).
  if (
    low.includes('parcel not found') ||
    low.includes('do not have access') ||
    low.includes('parcel not found or access denied') ||
    low.includes('access denied')
  ) {
    return t('producer.plantings.errSaveAccess');
  }

  if (
    low.includes('administrator-approved parcel') ||
    low.includes('admin-approved parcel') ||
    (low.includes('approved parcel') &&
      low.includes('require'))
  ) {
    return t('producer.plantings.errSaveNotApproved');
  }

  if (
    low.includes('harvest is already registered') ||
    low.includes('do not submit again') ||
    low.includes('next: open request transport')
  ) {
    return t('producer.plantings.errSaveHarvestAlreadyExists');
  }

  if (low.includes('could not verify chemical withdrawal')) {
    return t('producer.plantings.errSavePhiCheckFailed');
  }

  if (low.includes('harvest blocked') || low.includes('earliest harvest date')) {
    const dateMatch = s.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      return t('producer.plantings.errSaveHarvestBlockedPhi', { detail: dateMatch[1] });
    }
    return t('producer.plantings.errSaveHarvestBlockedPhi', {
      detail: s.length > 120 ? `${s.slice(0, 117)}…` : s,
    });
  }

  if (low.includes('invalid announcement type')) {
    return t('producer.plantings.errSaveInvalidData');
  }

  if (
    (low.includes('crop') || low.includes('product')) &&
    low.includes('required')
  ) {
    return t('producer.plantings.validationCrop');
  }

  if (low.includes('invalid estimated quantity') || low.includes('invalid load quantity')) {
    return t('producer.plantings.errSaveInvalidData');
  }

  if (low.includes('invalid planned harvest date') || low.includes('invalid planned date')) {
    return t('producer.plantings.validationDateFormat');
  }

  if (low.startsWith('invalid date:')) {
    return t('producer.plantings.validationDateFormat');
  }

  if (low.includes('invalid plan data')) {
    return t('producer.plantings.errSaveInvalidData');
  }

  /** Prisma wrapper from API — clearer than opaque generic. */
  if (low.includes('could not save this plan')) {
    return t('producer.plantings.errSaveServerPersist');
  }

  if (low.includes('invalid time value')) {
    return t('producer.plantings.validationDateFormat');
  }

  if (
    low.includes('estimateddate') ||
    (low.includes('property') &&
      (low.includes('should not exist') || low.includes('whitelist')))
  ) {
    return t('producer.plantings.errSaveInvalidData');
  }
  if (low.includes('shorter') && low.includes('crop')) {
    return t('producer.plantings.errCropTooLong');
  }
  if (low.includes('maxlength') || low.includes('must be shorter')) {
    return t('producer.plantings.errCropTooLong');
  }

  /** Fallback: meaningful server phrase (validation array joined, BadRequest bodies, …). */
  if (s.length >= 24) {
    return s.length > 420 ? `${s.slice(0, 417)}…` : s;
  }

  return t('producer.plantings.errSaveGeneric');
}
