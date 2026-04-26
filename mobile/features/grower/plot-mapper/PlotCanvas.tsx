import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import type { Zone, Partition } from './types';

interface PlotCanvasProps {
  length: string;
  width: string;
  zones: Zone[];
  partitions: Partition[];
  partitionMode: boolean;
  onAddPartition: () => void;
  onCanvasPress: (event: { nativeEvent: { locationX: number; locationY: number } }) => void;
  onZonePress: (zone: Zone) => void;
}

export function PlotCanvas({
  length,
  width,
  zones,
  partitions,
  partitionMode,
  onAddPartition,
  onCanvasPress,
  onZonePress,
}: PlotCanvasProps) {
  const { t } = useTranslation();
  const vertCount = partitions.filter((p) => p.type === 'VERTICAL').length + 1;
  const horzCount = partitions.filter((p) => p.type === 'HORIZONTAL').length + 1;
  const zoneWidth = CANVAS_WIDTH / vertCount;
  const zoneHeight = CANVAS_HEIGHT / horzCount;

  return (
    <View style={{ marginBottom: 24 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: '400',
            color: colors.text.primary,
            letterSpacing: 0.3,
          }}
        >
          {t('producer.plotMapper.canvasPlanLabel')}
        </Text>
        <TouchableOpacity
          onPress={onAddPartition}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderWidth: 0.5,
            borderColor: colors.border,
            borderRadius: 6,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: partitionMode ? `${colors.primary}10` : colors.surface,
          }}
          activeOpacity={0.7}
        >
          <Plus
            size={14}
            color={partitionMode ? colors.primary : colors.text.secondary}
            strokeWidth={1}
          />
          <Text
            style={{
              fontSize: 11,
              fontWeight: '300',
              color: partitionMode ? colors.primary : colors.text.secondary,
            }}
          >
            Add partition
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={onCanvasPress}
        activeOpacity={1}
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          backgroundColor: colors.surface,
          borderWidth: 0.5,
          borderColor: 'rgba(26, 48, 33, 0.2)',
          borderRadius: 6,
          position: 'relative',
          alignSelf: 'center',
        }}
      >
        {/* Grid */}
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={{
              position: 'absolute',
              top: (i * CANVAS_HEIGHT) / 20,
              left: 0,
              right: 0,
              height: 0.5,
              backgroundColor: 'rgba(26, 48, 33, 0.05)',
            }}
          />
        ))}
        {Array.from({ length: 15 }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={{
              position: 'absolute',
              left: (i * CANVAS_WIDTH) / 15,
              top: 0,
              bottom: 0,
              width: 0.5,
              backgroundColor: 'rgba(26, 48, 33, 0.05)',
            }}
          />
        ))}

        {partitions.map((partition) => (
          <View
            key={partition.id}
            style={{
              position: 'absolute',
              [partition.type === 'HORIZONTAL' ? 'top' : 'left']: partition.position,
              [partition.type === 'HORIZONTAL' ? 'left' : 'top']: 0,
              [partition.type === 'HORIZONTAL' ? 'width' : 'height']:
                partition.type === 'HORIZONTAL' ? CANVAS_WIDTH : CANVAS_HEIGHT,
              [partition.type === 'HORIZONTAL' ? 'height' : 'width']: 1,
              borderWidth: 1,
              borderColor: colors.primary,
              borderStyle: 'dashed',
            }}
          />
        ))}

        {zones.map((zone, index) => {
          const col = index % vertCount;
          const row = Math.floor(index / vertCount);
          return (
            <TouchableOpacity
              key={zone.id}
              onPress={() => onZonePress(zone)}
              style={{
                position: 'absolute',
                left: col * zoneWidth,
                top: row * zoneHeight,
                width: zoneWidth,
                height: zoneHeight,
                borderWidth: 0.5,
                borderColor: colors.primary,
                backgroundColor: zone.cropType ? `${colors.primary}05` : 'transparent',
                padding: 4,
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '300',
                  color: colors.text.primary,
                  letterSpacing: 0.2,
                }}
                numberOfLines={2}
              >
                {zone.name}
              </Text>
              {zone.cropType && (
                <Text
                  style={{
                    fontSize: 8,
                    fontWeight: '300',
                    color: colors.text.secondary,
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {zone.cropType}
                </Text>
              )}
              <Text
                style={{
                  fontSize: 7,
                  fontWeight: '300',
                  color: colors.text.secondary,
                  marginTop: 1,
                }}
              >
                {zone.area} m²
              </Text>
            </TouchableOpacity>
          );
        })}

        {length && width && (
          <>
            <View style={{ position: 'absolute', top: -20, left: CANVAS_WIDTH / 2 - 20 }}>
              <Text style={{ fontSize: 10, fontWeight: '300', color: colors.text.secondary }}>
                {length}m
              </Text>
            </View>
            <View style={{ position: 'absolute', left: -40, top: CANVAS_HEIGHT / 2 - 8 }}>
              <Text style={{ fontSize: 10, fontWeight: '300', color: colors.text.secondary }}>
                {width}m
              </Text>
            </View>
          </>
        )}
      </TouchableOpacity>

      {partitionMode && (
        <Text
          style={{
            marginTop: 8,
            fontSize: 11,
            fontWeight: '300',
            color: colors.primary,
            textAlign: 'center',
          }}
        >
          Dodirnite plan da dodate liniju podela
        </Text>
      )}
    </View>
  );
}
