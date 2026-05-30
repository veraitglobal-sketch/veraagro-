import { View, Text, TouchableOpacity } from 'react-native';
import { theme } from '../../../lib/theme';
import type { Zone } from './types';

interface ZonesListProps {
  zones: Zone[];
  onZonePress: (zone: Zone) => void;
}

export function ZonesList({ zones, onZonePress }: ZonesListProps) {
  if (zones.length === 0) return null;

  return (
    <View>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '400',
          color: theme.colors.text.primary,
          marginBottom: 12,
          letterSpacing: 0.3,
        }}
      >
        Zone ({zones.length})
      </Text>
      {zones.map((zone) => (
        <TouchableOpacity
          key={zone.id}
          onPress={() => onZonePress(zone)}
          style={{
            padding: 12,
            borderWidth: 0.5,
            borderColor: theme.colors.border,
            borderRadius: 6,
            backgroundColor: theme.colors.surface,
            marginBottom: 8,
          }}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '400',
                  color: theme.colors.text.primary,
                  letterSpacing: 0.2,
                }}
              >
                {zone.name}
              </Text>
              {zone.cropType ? (
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '400',
                    color: theme.colors.text.secondary,
                    marginTop: 2,
                  }}
                >
                  {zone.cropType} • {zone.area} m²
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '400',
                    color: theme.colors.text.secondary,
                    marginTop: 2,
                  }}
                >
                  {zone.area} m² • Dodirnite da dodate usev
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}
