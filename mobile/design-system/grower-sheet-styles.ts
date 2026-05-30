import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

/** Shared tokens — white bottom sheet surfaces. */
export const growerSheet = {
  bg: '#FFFFFF',
  cardBg: '#FFFFFF',
  cardTint: '#F7FAF8',
  cardBorder: 'rgba(45, 90, 39, 0.07)',
  cardShadow: '#1a3328',
  iconBg: 'rgba(45, 90, 39, 0.09)',
  iconBorder: 'rgba(45, 90, 39, 0.11)',
  title: '#14281f',
  handle: 'rgba(45, 90, 39, 0.16)',
  radiusSheet: 40,
  radiusCard: 24,
  radiusIcon: 18,
} as const;

export const growerHeroText = {
  title: {
    textShadowColor: 'rgba(10, 30, 18, 0.22)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  } as TextStyle,
  subtitle: {
    textShadowColor: 'rgba(10, 30, 18, 0.14)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  } as TextStyle,
};

export function growerSheetCardStyle(extra?: ViewStyle): ViewStyle {
  return {
    backgroundColor: growerSheet.cardBg,
    borderRadius: growerSheet.radiusCard,
    borderWidth: 1,
    borderColor: growerSheet.cardBorder,
    shadowColor: growerSheet.cardShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
    ...extra,
  };
}

export const growerSheetStyles = StyleSheet.create({
  cardTint: {
    backgroundColor: growerSheet.cardTint,
    borderRadius: growerSheet.radiusCard,
    borderWidth: 1,
    borderColor: growerSheet.cardBorder,
  },
  sectionGap: {
    marginBottom: 20,
  },
});
