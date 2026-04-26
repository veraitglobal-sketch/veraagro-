import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { theme } from '../lib/theme';
import { useBioVeraScreenPadding } from '../lib/screen-insets';

type LeftMode = 'back' | 'none';

type BioVeraSubpageHeaderProps = {
  title: string;
  left?: LeftMode;
  onBack?: () => void;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Subpage title bar: safe area top, 20pt + safe horizontal gutters (web-style), hairline border.
 */
export function BioVeraSubpageHeader({
  title,
  left = 'back',
  onBack,
  right,
  style,
}: BioVeraSubpageHeaderProps) {
  const p = useBioVeraScreenPadding();

  return (
    <View
      style={[
        {
          paddingTop: p.headerTop,
          paddingLeft: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          paddingBottom: theme.spacing.md,
          backgroundColor: theme.colors.background,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
          flexDirection: 'row',
          alignItems: 'center',
        },
        style,
      ]}
    >
      {left === 'back' ? (
        <TouchableOpacity
          onPress={
            onBack ??
            (() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            })
          }
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          style={{ marginRight: theme.spacing.md }}
        >
          <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
      ) : null}
      <Text
        numberOfLines={2}
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 20,
          fontWeight: '300',
          letterSpacing: 0.2,
          color: theme.colors.text.primary,
        }}
      >
        {title}
      </Text>
      {right != null ? (
        <View style={{ marginLeft: theme.spacing.sm, justifyContent: 'center' }}>{right}</View>
      ) : null}
    </View>
  );
}
