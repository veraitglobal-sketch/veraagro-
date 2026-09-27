import type { ComponentType } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { dsColors, dsTypography } from './theme';
import { EnterprisePanel } from './EnterprisePanel';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

/** Earthy accent palette — each row gets its own tile color for faster scanning. */
export const navTones = {
  green: { bg: '#E8F1E4', fg: '#2D5A27' },
  wheat: { bg: '#F6EDDA', fg: '#8A5D0F' },
  teal: { bg: '#E1EFEC', fg: '#1D665D' },
  clay: { bg: '#F5E6E0', fg: '#9A4428' },
  olive: { bg: '#EDEFDD', fg: '#56651C' },
  slate: { bg: '#ECEEF1', fg: '#475467' },
} as const;

export type NavTone = keyof typeof navTones;

const AUTO_TONES: NavTone[] = ['green', 'wheat', 'teal', 'clay', 'olive'];

export type EnterpriseNavItem = {
  key: string;
  title: string;
  subtitle?: string;
  icon?: ComponentType<IconProps>;
  /** Tile color; defaults to a rotating earthy palette. */
  tone?: NavTone;
  /** Short value shown on the right (count, amount). */
  value?: string;
  onPress: () => void;
};

export function EnterpriseSectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={dsTypography.sectionLabel}>{children}</Text>;
}

/** Grouped workflow nav — web GrowerDashboardHomeWorkflow parity. */
export function EnterpriseNavSection({
  title,
  items,
  showChevron = true,
  numbered = false,
  surface = 'sheet',
}: {
  title?: string;
  items: EnterpriseNavItem[];
  showChevron?: boolean;
  /** Sequential workflow (Polje, Lanac) — shows step number on each tile. */
  numbered?: boolean;
  /** `sheet` = white panel on bottom sheet; `glass` = frosted on gradient. */
  surface?: 'sheet' | 'glass';
}) {
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      {title ? <EnterpriseSectionLabel>{title}</EnterpriseSectionLabel> : null}
      <EnterprisePanel variant={surface === 'glass' ? 'glass' : 'default'} padding="none">
        {items.map((item, index) => {
          const Icon = item.icon;
          const tone = navTones[item.tone ?? AUTO_TONES[index % AUTO_TONES.length]];
          const isLast = index === items.length - 1;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={item.onPress}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel={item.subtitle ? `${item.title}. ${item.subtitle}` : item.title}
              style={styles.row}
            >
              {Icon ? (
                <View style={[styles.tile, { backgroundColor: tone.bg }]}>
                  <Icon size={19} color={tone.fg} strokeWidth={1.8} />
                  {numbered ? (
                    <View style={[styles.stepBadge, { backgroundColor: tone.fg }]}>
                      <Text style={styles.stepBadgeText}>{index + 1}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              <View style={styles.copy}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.subtitle ? (
                  <Text style={styles.subtitle} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>
              {item.value ? (
                <Text style={[styles.value, { color: tone.fg }]} numberOfLines={1}>
                  {item.value}
                </Text>
              ) : null}
              {showChevron ? (
                <View style={styles.chevron}>
                  <ChevronRight size={14} color={dsColors.muted} strokeWidth={2.2} />
                </View>
              ) : null}
              {!isLast ? (
                <View
                  style={[
                    styles.divider,
                    { left: Icon ? 66 : 14 },
                    surface === 'glass' && styles.dividerGlass,
                  ]}
                />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </EnterprisePanel>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 12,
    gap: 12,
  },
  tile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: dsColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: dsColors.gray900,
    letterSpacing: -0.25,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: dsColors.muted,
    marginTop: 1,
    lineHeight: 17,
    letterSpacing: -0.05,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
    maxWidth: 110,
  },
  chevron: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: dsColors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: dsColors.borderNeutral,
  },
  dividerGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
  },
});
