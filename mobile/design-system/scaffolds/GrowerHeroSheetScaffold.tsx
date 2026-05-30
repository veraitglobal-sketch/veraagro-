import { type ReactNode } from 'react';
import {
  ScrollView,
  View,
  RefreshControl,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GrowerHeroBackdrop } from '../GrowerHeroBackdrop';
import { growerSheet } from '../grower-sheet-styles';
import { dsColors } from '../theme';
import { bioVeraScrollProps } from '../../lib/scroll-view-props';
import { getGrowerTabBarHeight, getGrowerTabScrollPadding } from '../../lib/grower-tab-bar-metrics';

type Props = {
  hero: ReactNode;
  topBar?: ReactNode;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentPaddingBottom?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  sheetStyle?: StyleProp<ViewStyle>;
  /** Shorter hero band — profile and similar person-centric tabs. */
  heroCompact?: boolean;
};

function SheetHandle() {
  return (
    <View style={styles.handleRow} accessibilityElementsHidden>
      <View style={styles.handle} />
    </View>
  );
}

/** Mock layout — gradient hero + white bottom sheet (Living Editorial pattern). */
export function GrowerHeroSheetScaffold({
  hero,
  topBar,
  children,
  refreshing = false,
  onRefresh,
  contentPaddingBottom,
  contentContainerStyle,
  sheetStyle,
  heroCompact = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, 12);
  const tabReserve = getGrowerTabBarHeight(insets.bottom);
  const contentTail = contentPaddingBottom ?? getGrowerTabScrollPadding(insets.bottom);

  return (
    <View style={styles.root}>
      <GrowerHeroBackdrop />
      <View
        style={[
          styles.heroZone,
          heroCompact && styles.heroZoneCompact,
          { paddingTop: topPad },
        ]}
      >
        {topBar ? <View style={styles.topBarSlot}>{topBar}</View> : null}
        <View style={styles.heroBody}>{hero}</View>
      </View>

      <View style={[styles.sheet, sheetStyle]}>
        <SheetHandle />
        <ScrollView
          {...bioVeraScrollProps}
          style={{ flex: 1, marginBottom: tabReserve }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.sheetContent,
            { paddingBottom: contentTail },
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
                tintColor={dsColors.primary}
                colors={[dsColors.primary]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: growerSheet.title,
  },
  heroZone: {
    minHeight: 284,
    paddingBottom: 44,
  },
  heroZoneCompact: {
    minHeight: 248,
    paddingBottom: 36,
  },
  topBarSlot: {
    paddingHorizontal: 22,
    marginBottom: 10,
  },
  heroBody: {
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  sheet: {
    flex: 1,
    marginTop: -40,
    backgroundColor: growerSheet.bg,
    borderTopLeftRadius: growerSheet.radiusSheet,
    borderTopRightRadius: growerSheet.radiusSheet,
    shadowColor: '#06140c',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 18,
    overflow: 'hidden',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: growerSheet.handle,
  },
  sheetContent: {
    paddingHorizontal: 22,
    paddingTop: 12,
  },
});
