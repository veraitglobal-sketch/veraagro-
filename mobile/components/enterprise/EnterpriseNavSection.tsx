import type { ComponentType } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

export type EnterpriseNavItem = {
  key: string;
  title: string;
  subtitle?: string;
  icon?: ComponentType<IconProps>;
  onPress: () => void;
};

export function EnterpriseSectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={enterpriseUi.inAppSectionLabel}>{children}</Text>;
}

/** Grouped nav — tappable rows, no chevron (Dribbble-style enterprise lists). */
export function EnterpriseNavSection({
  title,
  items,
}: {
  title?: string;
  items: EnterpriseNavItem[];
}) {
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      {title ? <EnterpriseSectionLabel>{title}</EnterpriseSectionLabel> : null}
      <View style={enterpriseUi.inAppPanel}>
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={item.onPress}
              activeOpacity={0.72}
              style={[styles.row, index < items.length - 1 && styles.rowBorder]}
              accessibilityRole="button"
              accessibilityLabel={item.subtitle ? `${item.title}. ${item.subtitle}` : item.title}
            >
              {Icon ? (
                <View style={enterpriseUi.navRowIcon}>
                  <Icon size={20} color={enterpriseColors.gray600} strokeWidth={1.5} />
                </View>
              ) : null}
              <View style={styles.copy}>
                <Text style={enterpriseUi.navRowTitle}>{item.title}</Text>
                {item.subtitle ? (
                  <Text style={enterpriseUi.navRowSubtitle} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
});
