import { View, Text, Image, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { dsColors } from '../../design-system';

const LOGO = require('../../assets/logo.png');

type Props = {
  compact?: boolean;
};

/** Editorial brand block — hero typography, not form chrome. */
export function AuthBrandHero({ compact = false }: Props) {
  const { t } = useTranslation();

  return (
    <View style={[styles.root, compact && styles.rootCompact]}>
      <Animated.View entering={FadeIn.delay(60).duration(520)}>
        <Image
          source={LOGO}
          style={[styles.logo, compact && styles.logoCompact]}
          resizeMode="contain"
          accessibilityLabel={t('producer.brand.wordmarkA11y')}
        />
      </Animated.View>

      {!compact ? (
        <Animated.View entering={FadeInDown.delay(120).duration(500).springify().damping(26)} style={styles.tagline}>
          <Text style={styles.taglineLine} accessibilityRole="header">
            {t('growerJourney.taglineLine1')}
          </Text>
          <Text style={[styles.taglineLine, styles.taglineAccent]}>{t('growerJourney.taglineLine2')}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 8,
  },
  rootCompact: {
    flex: 0,
    paddingTop: 0,
    paddingBottom: 8,
  },
  logo: {
    width: 176,
    height: 50,
    marginBottom: 28,
  },
  logoCompact: {
    width: 132,
    height: 38,
    marginBottom: 16,
  },
  tagline: {
    alignItems: 'center',
    maxWidth: 320,
  },
  taglineLine: {
    fontSize: 32,
    fontWeight: '300',
    color: dsColors.gray900,
    letterSpacing: -0.85,
    lineHeight: 38,
    textAlign: 'center',
  },
  taglineAccent: {
    color: dsColors.primary,
    marginTop: -2,
  },
});
