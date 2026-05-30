import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { growerHeroText } from '../../design-system/grower-sheet-styles';

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
};

/** Hub / home hero — white type on sky gradient. */
export function GrowerPageHero({ eyebrow, title, subtitle, footer }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.eyebrow, growerHeroText.subtitle]} numberOfLines={1}>
        {eyebrow}
      </Text>
      <Text
        style={[styles.title, growerHeroText.title]}
        numberOfLines={2}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, growerHeroText.subtitle]} numberOfLines={3}>
          {subtitle}
        </Text>
      ) : null}
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: '100%',
    paddingTop: 10,
    paddingBottom: 10,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.88)',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 12,
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: -0.85,
    lineHeight: 38,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.86)',
    lineHeight: 24,
    marginTop: 12,
    textAlign: 'center',
    letterSpacing: -0.12,
    paddingHorizontal: 12,
  },
  partnerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.36)',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  partnerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.78)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  partnerCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
});

export function GrowerPartnerPill({
  label,
  code,
}: {
  label: string;
  code: string;
}) {
  return (
    <View style={styles.partnerPill} accessibilityLabel={`${label} ${code}`}>
      <Text style={styles.partnerLabel}>{label}</Text>
      <Text style={styles.partnerCode}>{code}</Text>
    </View>
  );
}
