import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';

interface JourneyMapBlockProps {
  journeyMap: { route?: Array<{ latitude: number; longitude: number; name?: string }> } | null;
}

export default function JourneyMapBlock({ journeyMap }: JourneyMapBlockProps) {
  const { t } = useTranslation();
  if (!journeyMap?.route?.length) return null;
  const route = journeyMap.route;
  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 0.5,
        borderColor: colors.border,
      }}
    >
      <Text
        style={{
          fontSize: 15,
          fontWeight: '300',
          color: colors.text.primary,
          marginBottom: theme.spacing.md,
          letterSpacing: 0.3,
        }}
      >
        {t('producer.missions.journeyMapTitle')}
      </Text>
      <View
        style={{
          height: 250,
          borderRadius: theme.borderRadius.sm,
          overflow: 'hidden',
          borderWidth: 0.5,
          borderColor: colors.border,
        }}
      >
        <MapView
          style={{ flex: 1 }}
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
          {route.length > 1 && (
            <Polyline
              coordinates={route.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))}
              strokeColor={colors.primary}
              strokeWidth={2}
            />
          )}
        </MapView>
      </View>
    </View>
  );
}
