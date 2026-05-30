import { forwardRef, type RefObject } from 'react';
import { View, type NativeSyntheticEvent } from 'react-native';
import MapView, { Marker, Polygon, Polyline, type Region } from 'react-native-maps';
import { theme } from '../../lib/theme';
import type { MapLonLat } from '../../lib/map-boundary-geometry';

export const DEFAULT_ESTATE_MAP_REGION: Region = {
  latitude: 44.0165,
  longitude: 21.0059,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

type Coord = { lat: number; lng: number };

type Props = {
  height?: number;
  initialRegion?: Region;
  polygonCoordinates: Coord[];
  fingerStroke: MapLonLat[];
  drawing: boolean;
  drawStyle: 'tap' | 'finger';
  fingerDrawingLocked: boolean;
  currentLocation: { lat: number; lng: number } | null;
  onMapPress: (event: NativeSyntheticEvent<{ coordinate: { latitude: number; longitude: number } }>) => void;
  onPanDrag: (event: NativeSyntheticEvent<{ coordinate: { latitude: number; longitude: number } }>) => void;
  pointLabel: (index: number) => string;
  yourLocationTitle: string;
};

export const EstateBoundaryMap = forwardRef<MapView, Props>(function EstateBoundaryMap(
  {
    height = 360,
    initialRegion = DEFAULT_ESTATE_MAP_REGION,
    polygonCoordinates,
    fingerStroke,
    drawing,
    drawStyle,
    fingerDrawingLocked,
    currentLocation,
    onMapPress,
    onPanDrag,
    pointLabel,
    yourLocationTitle,
  },
  ref,
) {
  const mapLocked = drawing;

  return (
    <View
      style={{
        height,
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        marginBottom: theme.spacing.md,
      }}
    >
      <MapView
        ref={ref}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        onPress={onMapPress}
        onPanDrag={onPanDrag}
        scrollEnabled={!mapLocked}
        zoomEnabled={!mapLocked}
        rotateEnabled={!mapLocked}
        pitchEnabled={false}
        showsUserLocation={!mapLocked}
        showsMyLocationButton={!mapLocked}
        moveOnMarkerPress={false}
        loadingEnabled
      >
        {currentLocation ? (
          <Marker
            coordinate={{ latitude: currentLocation.lat, longitude: currentLocation.lng }}
            title={yourLocationTitle}
          />
        ) : null}
        {polygonCoordinates.length > 0 && !(fingerDrawingLocked && fingerStroke.length >= 2) ? (
          <Polygon
            coordinates={polygonCoordinates.map((c) => ({ latitude: c.lat, longitude: c.lng }))}
            fillColor={`${theme.colors.primary}30`}
            strokeColor={theme.colors.primary}
            strokeWidth={2}
          />
        ) : null}
        {polygonCoordinates.length > 0 && fingerDrawingLocked && fingerStroke.length >= 2 ? (
          <Polygon
            coordinates={polygonCoordinates.map((c) => ({ latitude: c.lat, longitude: c.lng }))}
            fillColor={`${theme.colors.primary}14`}
            strokeColor={theme.colors.primary}
            strokeWidth={1}
          />
        ) : null}
        {fingerDrawingLocked && fingerStroke.length >= 2 ? (
          <Polyline
            coordinates={fingerStroke.map((c) => ({ latitude: c.lat, longitude: c.lng }))}
            strokeColor={theme.colors.primary}
            strokeWidth={3}
          />
        ) : null}
        {drawStyle === 'tap'
          ? polygonCoordinates.map((coord, index) => (
              <Marker
                key={`v-${coord.lat}-${coord.lng}-${index}`}
                coordinate={{ latitude: coord.lat, longitude: coord.lng }}
                title={pointLabel(index)}
              />
            ))
          : null}
      </MapView>
    </View>
  );
});

/** Center map without controlled `region` (avoids drift while drawing). */
export function animateEstateMapTo(
  mapRef: RefObject<MapView | null>,
  lat: number,
  lng: number,
  delta = 0.01,
) {
  mapRef.current?.animateToRegion(
    {
      latitude: lat,
      longitude: lng,
      latitudeDelta: delta,
      longitudeDelta: delta,
    },
    350,
  );
}
