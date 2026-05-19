import { View } from 'react-native';
import HarvestScreen from '../../../features/grower/harvest/HarvestScreen';
import { growerUi } from '../../../lib/grower-ui';

/**
 * Harvest tab – tanki wrapper; logika i UI u features/grower/harvest/
 */
export default function HarvestTabRoute() {
  return (
    <View style={growerUi.canvas}>
      <HarvestScreen />
    </View>
  );
}
