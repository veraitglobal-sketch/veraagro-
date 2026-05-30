import { View, StyleSheet } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import { theme } from '../../lib/theme';

export type MapLocationPinVariant = 'retail' | 'supplier';

export const MAP_LOCATION_COLORS = {
  retail: theme.colors.primary,
  supplier: theme.colors.primary,
} as const;

/** Center of the disc sits on the coordinate. */
export const MAP_PIN_ANCHOR = { x: 0.5, y: 0.5 } as const;

interface MapLocationPinProps {
  variant: MapLocationPinVariant;
}

/**
 * Bio Vera map icon — white disc + green ring + ShoppingBag (original map look).
 */
export function MapLocationPin(_props: MapLocationPinProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.disc}>
        <ShoppingBag size={20} color={theme.colors.primary} strokeWidth={2} />
      </View>
    </View>
  );
}

const DISC = 48;

const styles = StyleSheet.create({
  wrap: {
    width: DISC,
    height: DISC,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 4,
  },
});
