import { View, Text, StyleSheet } from 'react-native';
import { dsTypography } from '../../design-system';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

/** Centered form header — EDS typography for register and similar flows. */
export function AuthFormHeader({ eyebrow, title, subtitle }: Props) {
  return (
    <View style={styles.root}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={[styles.title, eyebrow ? styles.titleAfterEyebrow : null]} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    marginBottom: 20,
  },
  eyebrow: {
    ...dsTypography.eyebrow,
    textAlign: 'center',
  },
  title: {
    ...dsTypography.pageTitle,
    textAlign: 'center',
    fontSize: 26,
    lineHeight: 32,
  },
  titleAfterEyebrow: {
    marginTop: 10,
  },
  subtitle: {
    ...dsTypography.pageLead,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
});
