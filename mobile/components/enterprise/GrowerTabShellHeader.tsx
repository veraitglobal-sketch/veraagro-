import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BioVeraWordmark } from './BioVeraWordmark';
import { GlassSurface } from '../../design-system/GlassSurface';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';

type Props = Readonly<{
  eyebrow: string;
  title: string;
  statusLine: string;
  /** Logo + „Proizvođač“ — samo Početna */
  showBrandRow?: boolean;
  leftSlot?: ReactNode;
  footer?: ReactNode;
}>;

/** Grower tab header on hero backdrop — frosted glass card. */
export function GrowerTabShellHeader({
  eyebrow,
  title,
  statusLine,
  showBrandRow = false,
  leftSlot,
  footer,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <GlassSurface
      style={styles.shell}
      contentStyle={[styles.content, { paddingTop: showBrandRow ? 12 : 4 }]}
      blur={52}
    >
      {showBrandRow ? (
        <View style={styles.topRow}>
          <View style={styles.leftSlot}>{leftSlot}</View>
          <BioVeraWordmark />
        </View>
      ) : null}
      <Text style={styles.eyebrow} numberOfLines={1}>
        {eyebrow}
      </Text>
      <Text style={enterpriseUi.inAppTitle} numberOfLines={2} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.statusLine} numberOfLines={3}>
        {statusLine}
      </Text>
      {footer}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  shell: {
    marginBottom: 14,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
    minHeight: 36,
  },
  leftSlot: {
    flex: 1,
    alignItems: 'flex-start',
    paddingTop: 2,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: '600',
    color: enterpriseColors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statusLine: {
    fontSize: 15,
    fontWeight: '400',
    color: enterpriseColors.gray700,
    lineHeight: 22,
    marginTop: 10,
    letterSpacing: -0.12,
  },
});
