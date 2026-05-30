/**
 * Farmer form UX — large touch targets and readable spacing (field / sunlight).
 */
import type { TextStyle, ViewStyle } from 'react-native';

export const farmerFormUi = {
  touchTarget: {
    minHeight: 48,
    minWidth: 48,
    padding: 12,
  } satisfies ViewStyle,

  sectionGap: {
    marginBottom: 24,
  } satisfies ViewStyle,

  fieldStack: {
    gap: 16,
  } satisfies ViewStyle,

  cardPadding: {
    padding: 16,
  } satisfies ViewStyle,

  input: {
    minHeight: 48,
    padding: 12,
    fontSize: 16,
  } satisfies TextStyle,
} as const;
