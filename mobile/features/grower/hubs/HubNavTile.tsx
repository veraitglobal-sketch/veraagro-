import React from 'react';
import type { ComponentType } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

export type HubNavTileProps = {
  title: string;
  description?: string;
  icon: ComponentType<IconProps>;
  onPress: () => void;
};

export function HubNavTile({ title, description, icon: Icon, onPress }: HubNavTileProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={growerUi.tile} accessibilityRole="button">
      <View style={growerUi.tileIcon}>
        <Icon size={22} color={enterpriseColors.primary} strokeWidth={1.75} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={growerUi.tileTitle}>{title}</Text>
        {description ? (
          <Text style={growerUi.tileDesc} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={20} color={enterpriseColors.gray600} strokeWidth={1.75} />
    </TouchableOpacity>
  );
}

export function HubSectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={growerUi.sectionLabel}>{children}</Text>;
}
