import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import type { ReactNode } from 'react';
import { router, useSegments } from 'expo-router';
import { replaceToRoleHome } from '../lib/app-navigation';
import { BackButton } from '../design-system/BackButton';
import { useBioVeraScreenPadding } from '../lib/screen-insets';
import { enterpriseColors } from '../lib/enterprise-ui';
import { growerUi } from '../lib/grower-ui';

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
  const segments = useSegments();

  return (
    <View
      style={[
        {
          paddingTop: p.headerTop,
          paddingLeft: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          paddingBottom: 12,
          backgroundColor: enterpriseColors.canvas,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: enterpriseColors.gray200,
          flexDirection: 'row',
          alignItems: 'center',
        },
        style,
      ]}
    >
      {left === 'back' ? (
        <BackButton
          style={{ marginRight: 12 }}
          onPress={
            onBack ??
            (() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                replaceToRoleHome(segments);
              }
            })
          }
        />
      ) : null}
      <Text numberOfLines={2} style={[growerUi.pageTitle, { flex: 1, minWidth: 0, fontSize: 20, fontWeight: '600', letterSpacing: -0.45 }]}>
        {title}
      </Text>
      {right != null ? <View style={{ marginLeft: 8, justifyContent: 'center' }}>{right}</View> : null}
    </View>
  );
}
