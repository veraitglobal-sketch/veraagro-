import type { ReactNode } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';

type Props = {
  children: ReactNode;
  footer?: ReactNode;
  contentStyle?: ViewStyle;
};

/** gray-50 canvas + light green wash (welcome, login). */
export function AuthScreenShell({ children, footer, contentStyle }: Props) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['rgba(45, 90, 39, 0.08)', 'rgba(249, 250, 251, 0)']}
        style={styles.gradient}
        pointerEvents="none"
      />
      <View style={[styles.content, contentStyle]}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

/** Form / content panel — same shell as welcome CTA card. */
export function AuthPanel({ children }: { children: ReactNode }) {
  return <View style={enterpriseUi.authPanel}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: enterpriseColors.canvas,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    alignItems: 'center',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
});
