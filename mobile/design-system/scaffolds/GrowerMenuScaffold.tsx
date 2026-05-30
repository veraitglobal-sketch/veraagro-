import type { ReactNode } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dsStyles } from '../theme';
import { EnterprisePageTitle } from '../EnterprisePageTitle';
import { EnterpriseNavSection, type EnterpriseNavItem } from '../EnterpriseNavSection';

type Props = {
  title: string;
  description?: string;
  statusLine?: string;
  items: EnterpriseNavItem[];
  footer?: ReactNode;
  /** Tighter title block — sub-menus with few rows. */
  compact?: boolean;
};

/**
 * Sub-menu (nivo 1.5): 2–5 stavki, bez ScrollView — samo onoliko visine koliko treba.
 * @see mobile/docs/MOBILE_SCROLL_BUDGET.md
 */
export function GrowerMenuScaffold({
  title,
  description,
  statusLine,
  items,
  footer,
  compact = true,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[dsStyles.canvas, { flex: 1 }]}>
      <LinearGradient
        colors={['rgba(45, 90, 39, 0.055)', 'rgba(246, 245, 241, 0)']}
        style={dsStyles.screenTopWash}
        pointerEvents="none"
      />
      <View
        style={{
          flex: 1,
          paddingTop: Math.max(insets.top, 16) + 8,
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, 16) + 8,
        }}
      >
        <EnterprisePageTitle
          title={title}
          description={description}
          statusLine={statusLine}
          style={compact ? { marginBottom: 12 } : undefined}
        />
        <EnterpriseNavSection items={items} />
        {footer}
      </View>
    </View>
  );
}
