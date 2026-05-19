import type { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';

type Props = {
  title: string;
  body?: string;
  onPress?: () => void;
  actionLabel?: string;
};

export function EnterpriseNotice({ title, body, onPress, actionLabel }: Props) {
  const inner = (
    <View style={[enterpriseUi.inAppPanel, styles.wrap]}>
      <View style={styles.accent} />
      <View style={styles.copy}>
        <Text style={enterpriseUi.navRowTitle}>{title}</Text>
        {body ? <Text style={enterpriseUi.navRowSubtitle}>{body}</Text> : null}
        {onPress && actionLabel ? (
          <Text style={styles.action}>{actionLabel}</Text>
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.88} accessibilityRole="button">
        {inner}
      </TouchableOpacity>
    );
  }

  return inner;
}

export function EnterpriseNoticePanel({ children }: { children: ReactNode }) {
  return <View style={[enterpriseUi.authPanel, styles.panel]}>{children}</View>;
}

const styles = StyleSheet.create({
  panel: {
    marginBottom: 12,
  },
  wrap: {
    flexDirection: 'row',
    marginBottom: 14,
    paddingVertical: 14,
    paddingRight: 16,
  },
  accent: {
    width: 3,
    backgroundColor: enterpriseColors.primary,
    marginRight: 14,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 2,
    justifyContent: 'center',
  },
  action: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.primary,
    marginTop: 8,
  },
});
