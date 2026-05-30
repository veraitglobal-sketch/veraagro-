import { type ReactNode } from 'react';
import {
  ScrollView,
  View,
  RefreshControl,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dsColors, dsStyles } from '../theme';
import { EnterprisePageTitle } from '../EnterprisePageTitle';
import { GrowerHeroBackdrop } from '../GrowerHeroBackdrop';
import { GlassSurface } from '../GlassSurface';
import { bioVeraScrollProps } from '../../lib/scroll-view-props';
import { getGrowerTabBarHeight, getGrowerTabScrollPadding } from '../../lib/grower-tab-bar-metrics';

type Props = {
  children: ReactNode;
  title: string;
  description?: string;
  eyebrow?: string;
  statusLine?: string;
  headerRight?: ReactNode;
  header?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentPaddingBottom?: number;
  withTopWash?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  fillViewport?: boolean;
};

/** Grower tab root — warm canvas, optional wash, enterprise page title. */
export function GrowerTabScaffold({
  children,
  title,
  description,
  eyebrow,
  statusLine,
  headerRight,
  header,
  refreshing = false,
  onRefresh,
  contentPaddingBottom,
  withTopWash = true,
  contentContainerStyle,
  fillViewport = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, 16) + 8;
  const tabReserve = getGrowerTabBarHeight(insets.bottom);
  const contentTail = contentPaddingBottom ?? getGrowerTabScrollPadding(insets.bottom);

  return (
    <View style={dsStyles.heroRoot}>
      {withTopWash ? <GrowerHeroBackdrop /> : null}
      <ScrollView
        {...bioVeraScrollProps}
        style={{ flex: 1, marginBottom: tabReserve }}
        contentContainerStyle={[
          {
            paddingHorizontal: 20,
            paddingTop: topPad,
            paddingBottom: contentTail,
            ...(fillViewport ? { flexGrow: 1 } : {}),
          },
          contentContainerStyle,
        ]}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              progressViewOffset={insets.top}
              tintColor={dsColors.primary}
              colors={[dsColors.primary]}
            />
          ) : undefined
        }
      >
        {header ?? (
          <GlassSurface style={{ marginBottom: 14 }} contentStyle={{ padding: 18 }} blur={52}>
            <EnterprisePageTitle
              title={title}
              description={description}
              eyebrow={eyebrow}
              statusLine={statusLine}
              right={headerRight}
              style={{ marginBottom: 0 }}
            />
          </GlassSurface>
        )}
        {children}
      </ScrollView>
    </View>
  );
}
