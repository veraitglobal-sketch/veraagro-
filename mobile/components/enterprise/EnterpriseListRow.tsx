import type { ComponentType } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

export type EnterpriseListRowProps = {
  title: string;
  /** One short line — farmers scan title first; keep optional. */
  description?: string;
  icon?: ComponentType<IconProps>;
  onPress: () => void;
};

/**
 * Primary navigation row — welcome/login panel quality, 72px+ tap area.
 */
export function EnterpriseListRow({ title, description, icon: Icon, onPress }: EnterpriseListRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={enterpriseUi.listRow}
      accessibilityRole="button"
      accessibilityLabel={description ? `${title}. ${description}` : title}
    >
      {Icon ? (
        <View style={enterpriseUi.listRowIcon}>
          <Icon size={24} color={enterpriseColors.primary} strokeWidth={1.75} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={enterpriseUi.listRowTitle}>{title}</Text>
        {description ? (
          <Text style={enterpriseUi.listRowDesc} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={22} color={enterpriseColors.gray600} strokeWidth={1.75} />
    </TouchableOpacity>
  );
}
