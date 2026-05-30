import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { MapPin } from 'lucide-react-native';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { MissionDetailSection } from './MissionDetailSection';

interface JourneyMapBlockProps {
  journeyMap: { route?: Array<{ latitude: number; longitude: number; name?: string }> } | null;
}

export default function JourneyMapBlock({ journeyMap }: JourneyMapBlockProps) {
  const { t } = useTranslation();
  if (!journeyMap?.route?.length) return null;
  const route = journeyMap.route;

  return (
    <MissionDetailSection title={t('producer.missions.journeyMap')} icon={MapPin}>
      <View style={styles.mapWrap}>
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: route[0]?.latitude ?? 44.0165,
            longitude: route[0]?.longitude ?? 21.0059,
            latitudeDelta: 2,
            longitudeDelta: 2,
          }}
        >
          {route.map((point, index) => (
            <Marker
              key={index}
              coordinate={{ latitude: point.latitude, longitude: point.longitude }}
              title={point.name ?? t('producer.missions.mapPointFallback', { n: index + 1 })}
            />
          ))}
          {route.length > 1 ? (
            <Polyline
              coordinates={route.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))}
              strokeColor={enterpriseColors.primary}
              strokeWidth={2}
            />
          ) : null}
        </MapView>
      </View>
    </MissionDetailSection>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: enterpriseColors.gray200,
  },
});
