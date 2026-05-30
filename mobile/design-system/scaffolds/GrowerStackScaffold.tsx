import type { ReactNode } from 'react';
import { View, ScrollView, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dsColors, dsStyles } from '../theme';
import { EnterprisePageTitle } from '../EnterprisePageTitle';
import { EnterpriseButton } from '../EnterpriseButton';
import { GrowerHeroBackdrop } from '../GrowerHeroBackdrop';
import { bioVeraScrollProps } from '../../lib/scroll-view-props';

type Props = {
  children: ReactNode;
  title?: string;
  description?: string;
  eyebrow?: string;
  header?: ReactNode;
  stickyFooterLabel?: string;
  onStickyFooterPress?: () => void;
  stickyFooterLoading?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  withTopWash?: boolean;
};

/** Grower stack workflow — canvas scroll + optional sticky primary CTA. */
export function GrowerStackScaffold({
  children,
  title,
  description,
  eyebrow,
  header,
  stickyFooterLabel,
  onStickyFooterPress,
  stickyFooterLoading,
  contentContainerStyle,
  withTopWash = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const footerPad = stickyFooterLabel ? 88 + insets.bottom : insets.bottom + 16;

  return (
    <View style={withTopWash ? dsStyles.heroRoot : dsStyles.canvas}>
      {withTopWash ? <GrowerHeroBackdrop /> : null}
      <ScrollView
        {...bioVeraScrollProps}
        contentContainerStyle={[
          {
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: footerPad,
          },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {header ??
          (title ? (
            <EnterprisePageTitle
              title={title}
              description={description}
              eyebrow={eyebrow}
              style={{ marginBottom: 16 }}
            />
          ) : null)}
        {children}
      </ScrollView>
      {stickyFooterLabel && onStickyFooterPress ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: dsColors.canvas,
            borderTopWidth: 1,
            borderTopColor: dsColors.borderNeutral,
          }}
        >
          <EnterpriseButton
            label={stickyFooterLabel}
            onPress={onStickyFooterPress}
            variant="primary"
            size="large"
            fullWidth
            loading={stickyFooterLoading}
          />
        </View>
      ) : null}
    </View>
  );
}

/** Field / scanner mode — same scaffold, farmer-sized footer default. */
export function GrowerFieldScaffold(props: Props) {
  return <GrowerStackScaffold {...props} />;
}
