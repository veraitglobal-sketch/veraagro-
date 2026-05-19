import type { ComponentType, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

type Props = {
  title: string;
  icon?: ComponentType<IconProps>;
  children: ReactNode;
};

/** Mission detail block — matches grower enterprise panels. */
export function MissionDetailSection({ title, icon: Icon, children }: Props) {
  return (
    <View style={[enterpriseUi.inAppPanel, styles.panel]}>
      <View style={styles.header}>
        {Icon ? (
          <View style={enterpriseUi.navRowIcon}>
            <Icon size={20} color={enterpriseColors.gray600} strokeWidth={1.5} />
          </View>
        ) : null}
        <Text style={enterpriseUi.navRowTitle}>{title}</Text>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  body: {
    gap: 8,
  },
});
