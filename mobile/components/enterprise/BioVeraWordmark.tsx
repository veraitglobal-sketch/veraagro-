import { View, Text, Image, StyleSheet } from 'react-native';
import { enterpriseColors } from '../../lib/enterprise-ui';
import { useTranslation } from 'react-i18next';

const LOGO = require('../../assets/logo.png');

/** Compact logo lockup — tab headers (premium, not playful). */
export function BioVeraWordmark() {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap} accessibilityLabel={t('producer.brand.wordmarkA11y')}>
      <Image source={LOGO} style={styles.logo} resizeMode="contain" accessibilityIgnoresInvertColors />
      <Text style={styles.caption}>{t('producer.brand.productLine')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-end',
    opacity: 0.94,
  },
  logo: {
    width: 76,
    height: 22,
  },
  caption: {
    fontSize: 9,
    fontWeight: '600',
    color: enterpriseColors.gray600,
    letterSpacing: 1.8,
    marginTop: 5,
    textTransform: 'uppercase',
  },
});
