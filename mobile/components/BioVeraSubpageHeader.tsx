import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import type { ReactNode } from 'react';
import { router, useSegments } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { replaceToRoleHome } from '../lib/app-navigation';
import { ArrowLeft } from 'lucide-react-native';
import { useBioVeraScreenPadding } from '../lib/screen-insets';
import { enterpriseColors } from '../lib/enterprise-ui';
import { growerUi } from '../lib/grower-ui';
import { a11yIconButton } from '../lib/date-locale';

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
  const { t } = useTranslation();

  return (
    <View
      style={[
        {
          paddingTop: p.headerTop,
          paddingLeft: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          paddingBottom: 14,
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
        <TouchableOpacity
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
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', marginRight: 4 }}
          {...a11yIconButton(t('common.back'))}
        >
          <ArrowLeft size={22} color={enterpriseColors.gray900} strokeWidth={1.5} />
        </TouchableOpacity>
      ) : null}
      <Text numberOfLines={2} style={[growerUi.pageTitle, { flex: 1, minWidth: 0, fontSize: 22 }]}>
        {title}
      </Text>
      {right != null ? <View style={{ marginLeft: 8, justifyContent: 'center' }}>{right}</View> : null}
    </View>
  );
}
