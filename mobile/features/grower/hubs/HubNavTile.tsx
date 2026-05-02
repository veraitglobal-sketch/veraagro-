import React from 'react';
import type { ComponentType } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { theme } from '../../../lib/theme';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

export type HubNavTileProps = {
  title: string;
  description?: string;
  icon: ComponentType<IconProps>;
  onPress: () => void;
  iconColor?: string;
  iconBg?: string;
};

/**
 * Single tappable row for hub screens — matches grower web card rhythm (touch ~48pt).
 */
export function HubNavTile({
  title,
  description,
  icon: Icon,
  onPress,
  iconColor = theme.colors.primary,
  iconBg = theme.colors.primaryLight,
}: HubNavTileProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.borderRadius.md,
        paddingVertical: 12,
        paddingHorizontal: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        minHeight: 64,
        marginBottom: theme.spacing.sm,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: theme.borderRadius.md,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: theme.spacing.sm,
        }}
      >
        <Icon size={22} color={iconColor} strokeWidth={1.75} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text.primary }}>{title}</Text>
        {description ? (
          <Text
            style={{
              fontSize: 13,
              fontWeight: '400',
              color: theme.colors.text.secondary,
              marginTop: 2,
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export function HubSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        marginBottom: theme.spacing.xs,
        marginTop: theme.spacing.md,
      }}
    >
      {children}
    </Text>
  );
}
