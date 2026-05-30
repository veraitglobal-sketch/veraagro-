/**
 * Farmer-readable typography — field use (sunlight, 60+, arm's length).
 * Mirrors theme.typography; minimum readable size is 13px.
 */
import type { TextStyle } from 'react-native';
import { theme } from './theme';

/** Hard floor for any human-readable string. */
export const FARMER_MIN_READABLE = 13;
export const FARMER_MIN_BODY = 16;
export const FARMER_MIN_LABEL = 14;

export const farmerType = {
  display: theme.typography.h1,
  title: theme.typography.h3,
  body: theme.typography.body,
  bodySmall: theme.typography.bodySmall,
  caption: theme.typography.caption,
  badge: theme.typography.badge,
  label: theme.typography.label,
  sectionLabel: theme.typography.sectionLabel,
} as const satisfies Record<string, TextStyle>;

/** Clamp legacy inline sizes to farmer minimums. */
export function farmerFontSize(size: number): number {
  if (size <= 9) return FARMER_MIN_READABLE;
  if (size <= 11) return FARMER_MIN_LABEL;
  if (size === 12) return FARMER_MIN_LABEL;
  return size;
}
