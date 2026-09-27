import type { ReactNode } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BackButton } from '../BackButton';
import { dsStyles } from '../theme';
import { EnterprisePageTitle } from '../EnterprisePageTitle';
import { EnterpriseNavSection, type EnterpriseNavItem } from '../EnterpriseNavSection';

type Props = {
  title: string;
  description?: string;
  statusLine?: string;
  items: EnterpriseNavItem[];
  footer?: ReactNode;
  /** @deprecated Title block is always compact now. */
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
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
          paddingTop: Math.max(insets.top, 16) + 4,
          paddingHorizontal: 16,
          paddingBottom: Math.max(insets.bottom, 16) + 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <BackButton
            style={{ marginTop: 1 }}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(producer)/(tabs)/profile'))}
          />
          <EnterprisePageTitle
            title={title}
            description={description}
            statusLine={statusLine}
            style={{ flex: 1, marginBottom: 0, paddingTop: 5 }}
            compact
          />
        </View>
        <EnterpriseNavSection items={items} />
        {footer}
      </View>
    </View>
  );
}
