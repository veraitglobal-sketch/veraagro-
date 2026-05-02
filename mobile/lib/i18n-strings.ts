import type { TFunction } from 'i18next';

/**
 * Coerces i18n output to a string. Guards against plural / merge misconfig
 * where the resolver returns an object (React then shows i18next warnings).
 */
export function tString(
  t: TFunction,
  key: string,
  options?: Record<string, unknown> & { defaultValue?: string },
): string {
  const resolved = t(key, options);
  if (typeof resolved === 'string') return resolved;
  if (options?.defaultValue != null && typeof options.defaultValue === 'string') {
    return options.defaultValue;
  }
  return key;
}
