import type { TFunction } from 'i18next';
import { apiErrorOrT, axiosLikeMessage } from './api-error';

export { axiosLikeMessage };

/** Grower pages: default fallback `growerPages.apiErrorGeneric`. */
export function growerApiErrorOrT(
  err: unknown,
  t: TFunction,
  fallbackKey = 'growerPages.apiErrorGeneric',
): string {
  return apiErrorOrT(err, t, fallbackKey);
}
