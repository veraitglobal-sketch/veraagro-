import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/** Reference palette — sky blue → forest green (no photo). */
export const HERO_SKY = '#7ec8ef';
export const HERO_SKY_BRIGHT = '#a8dcff';
export const HERO_MID = '#6fbf98';
export const HERO_FOREST = '#2D5A27';
export const HERO_FOREST_DEEP = '#163322';

/**
 * Premium hero canvas — vivid sky, soft horizon, deep forest base.
 */
export function GrowerHeroBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[HERO_SKY_BRIGHT, HERO_SKY, '#8fd4ea', HERO_MID, '#3d7a52', HERO_FOREST, HERO_FOREST_DEEP]}
        locations={[0, 0.12, 0.28, 0.46, 0.64, 0.84, 1]}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.12)', 'transparent']}
        locations={[0, 0.18, 0.42]}
        style={styles.skyWash}
      />

      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.32)', 'rgba(255,255,255,0.08)', 'transparent']}
        locations={[0.32, 0.46, 0.52, 0.66]}
        style={styles.horizon}
      />

      <LinearGradient
        colors={['transparent', 'rgba(12, 40, 24, 0.18)']}
        locations={[0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

/** @deprecated alias */
export const GrowerAmbientBackground = GrowerHeroBackdrop;

const styles = StyleSheet.create({
  skyWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '38%',
  },
  horizon: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '36%',
    height: '28%',
  },
});
