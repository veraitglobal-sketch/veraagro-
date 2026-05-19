import { View, StyleSheet } from 'react-native';
import { enterpriseColors } from '../../lib/enterprise-ui';

type Props = {
  /** Green segment width — Bio Vera brand signature on tab headers. */
  accentWidth?: number;
};

/**
 * Dual-line header rule: Vera green + neutral continuation (luxury / enterprise cue).
 */
export function BioVeraSignatureRule({ accentWidth = 48 }: Props) {
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.accent, { width: accentWidth }]} />
      <View style={styles.rest} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 0,
  },
  accent: {
    height: 2,
    borderRadius: 1,
    backgroundColor: enterpriseColors.primary,
  },
  rest: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: enterpriseColors.gray200,
    marginLeft: 10,
  },
});
