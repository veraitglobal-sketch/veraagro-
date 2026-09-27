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
          <View style={styles.icon}>
            <Icon size={15} color={enterpriseColors.primary} strokeWidth={1.9} />
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  icon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#E8F1E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: '#6B7A67',
  },
  body: {
    gap: 8,
  },
});
