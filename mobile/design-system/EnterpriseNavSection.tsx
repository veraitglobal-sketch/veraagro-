import type { ComponentType } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { dsColors, dsStyles, dsTypography } from './theme';
import { EnterprisePanel } from './EnterprisePanel';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

export type EnterpriseNavItem = {
  key: string;
  title: string;
  subtitle?: string;
  icon?: ComponentType<IconProps>;
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
  surface = 'sheet',
}: {
  title?: string;
  items: EnterpriseNavItem[];
  showChevron?: boolean;
  /** `sheet` = white panel on bottom sheet; `glass` = frosted on gradient. */
  surface?: 'sheet' | 'glass';
}) {
  if (items.length === 0) return null;

  return (
    <View style={{ marginBottom: 12 }}>
      {title ? <EnterpriseSectionLabel>{title}</EnterpriseSectionLabel> : null}
      <EnterprisePanel variant={surface === 'glass' ? 'glass' : 'default'} padding="none">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={item.onPress}
              activeOpacity={0.72}
              accessibilityRole="button"
              accessibilityLabel={item.subtitle ? `${item.title}. ${item.subtitle}` : item.title}
              style={[
                dsStyles.navRow,
                index < items.length - 1 &&
                  (surface === 'glass' ? dsStyles.navRowBorderGlass : dsStyles.navRowBorder),
              ]}
            >
              {Icon ? (
                <View style={dsStyles.navRowIcon}>
                  <Icon size={20} color={dsColors.primary} strokeWidth={1.5} />
                </View>
              ) : null}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={dsTypography.navRowTitle}>{item.title}</Text>
                {item.subtitle ? (
                  <Text style={dsTypography.navRowSubtitle} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>
              {showChevron ? (
                <ChevronRight size={20} color={dsColors.muted} strokeWidth={1.5} />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </EnterprisePanel>
    </View>
  );
}
