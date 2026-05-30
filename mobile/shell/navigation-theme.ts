import { dsColors } from '../design-system/theme';

/** Native stack header — enterprise tokens (not legacy theme.ts). */
export const growerNavigationTheme = {
  headerStyle: {
    backgroundColor: dsColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: dsColors.borderNeutral,
  },
  headerTintColor: dsColors.gray900,
  headerTitleStyle: {
    fontWeight: '400' as const,
    fontSize: 18,
    letterSpacing: -0.2,
  },
};
