import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { GlassSurface } from './GlassSurface';
import { dsStyles } from './theme';

export type EnterprisePanelVariant = 'default' | 'premium' | 'flat' | 'tint' | 'glass';

type Props = {
  children: ReactNode;
  variant?: EnterprisePanelVariant;
  padding?: 'none' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
};

export function EnterprisePanel({
  children,
  variant = 'default',
  padding = 'md',
  style,
}: Props) {
  const pad =
    padding === 'none'
      ? null
      : padding === 'lg'
        ? dsStyles.panelPaddingLg
        : dsStyles.panelPaddingMd;

  if (variant === 'glass') {
    return (
      <GlassSurface style={style} contentStyle={pad ?? undefined}>
        {children}
      </GlassSurface>
    );
  }

  const surface =
    variant === 'tint'
      ? dsStyles.accentPanel
      : variant === 'flat'
        ? [dsStyles.panel, { shadowOpacity: 0, elevation: 0 }]
        : variant === 'premium'
          ? [dsStyles.panel, { borderRadius: 22 }]
          : dsStyles.panel;

  return <View style={[surface, pad, style]}>{children}</View>;
}

export function EnterpriseAccentPanel({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <EnterprisePanel variant="glass" padding="lg" style={style}>
      {children}
    </EnterprisePanel>
  );
}
