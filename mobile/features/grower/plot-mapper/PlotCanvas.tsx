import { View, Text, TouchableOpacity, useWindowDimensions, PanResponder } from 'react-native';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MIN_PARTITION_GESTURE_DRAG } from './constants';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { getPlotCanvasLayout } from './canvasLayout';
import type { Zone, Partition } from './types';

const GRID_LINE = 0.5;

interface PlotCanvasProps {
  length: string;
  width: string;
  zones: Zone[];
  partitions: Partition[];
  partitionMode: boolean;
  onAddPartition: () => void;
  onPartitionGestureEnd: (partition: Pick<Partition, 'type' | 'position'>) => void;
  onZonePress: (zone: Zone) => void;
}

/** Logical → display X */
function toDx(x: number, displayW: number) {
  return (x / CANVAS_WIDTH) * displayW;
}
/** Logical → display Y */
function toDy(y: number, displayH: number) {
  return (y / CANVAS_HEIGHT) * displayH;
}

function commitGesture(
  sx: number,
  sy: number,
  endX: number,
  endY: number,
): Pick<Partition, 'type' | 'position'> {
  const dx = Math.abs(endX - sx);
  const dy = Math.abs(endY - sy);
  const MIN = MIN_PARTITION_GESTURE_DRAG;

  if (dx < MIN && dy < MIN) {
    return { type: 'VERTICAL', position: sx };
  }
  if (dx > dy) {
    return { type: 'VERTICAL', position: (sx + endX) / 2 };
  }
  return { type: 'HORIZONTAL', position: (sy + endY) / 2 };
}

export function PlotCanvas({
  length,
  width,
  zones,
  partitions,
  partitionMode,
  onAddPartition,
  onPartitionGestureEnd,
  onZonePress,
}: PlotCanvasProps) {
  const { t } = useTranslation();
  const { width: screenW } = useWindowDimensions();
  const p = useBioVeraScreenPadding();
  const horizontalPad = p.screenPaddingLeft + p.screenPaddingRight + 48;
  const { displayW, displayH, touchToLogical } = getPlotCanvasLayout(screenW, horizontalPad);

  const startRef = useRef({ x: 0, y: 0 });
  /** Latest pointer in logical coords — used when gesture is cancelled mid-drag. */
  const lastLocalRef = useRef({ x: 0, y: 0 });

  const toLogical = (ev: { locationX: number; locationY: number }) => ({
    x: ev.locationX * touchToLogical,
    y: ev.locationY * touchToLogical,
  });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => partitionMode,
        onMoveShouldSetPanResponder: (_, gestate) =>
          partitionMode && (Math.abs(gestate.dx) > 2 || Math.abs(gestate.dy) > 2),
        onStartShouldSetPanResponderCapture: () => partitionMode,
        onMoveShouldSetPanResponderCapture: (_, gestate) =>
          partitionMode && (Math.abs(gestate.dx) > 4 || Math.abs(gestate.dy) > 4),
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          const logical = toLogical(e.nativeEvent);
          startRef.current = logical;
          lastLocalRef.current = logical;
        },
        onPanResponderMove: (e) => {
          lastLocalRef.current = toLogical(e.nativeEvent);
        },
        onPanResponderRelease: (e) => {
          if (!partitionMode) return;
          const logical = toLogical(e.nativeEvent);
          onPartitionGestureEnd(commitGesture(startRef.current.x, startRef.current.y, logical.x, logical.y));
        },
        onPanResponderTerminate: () => {
          if (!partitionMode) return;
          const logical = lastLocalRef.current;
          onPartitionGestureEnd(commitGesture(startRef.current.x, startRef.current.y, logical.x, logical.y));
        },
      }),
    [partitionMode, touchToLogical, onPartitionGestureEnd],
  );

  const vertCount = partitions.filter((pr) => pr.type === 'VERTICAL').length + 1;
  const horzCount = partitions.filter((pr) => pr.type === 'HORIZONTAL').length + 1;
  const zoneWidth = displayW / vertCount;
  const zoneHeight = displayH / horzCount;

  return (
    <View style={{ marginBottom: 24 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: '400',
            color: colors.text.primary,
            letterSpacing: 0.3,
            flexShrink: 1,
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
            {t('producer.plotMapper.addPartition')}
          </Text>
        </TouchableOpacity>
      </View>

      {length ? (
        <Text
          style={{
            fontSize: 11,
            fontWeight: '300',
            color: colors.text.secondary,
            textAlign: 'center',
            marginBottom: 6,
          }}
          numberOfLines={1}
        >
          {t('producer.plotMapper.axisLength')} {length} m
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
        {width ? (
          <View
            style={{
              width: 48,
              paddingRight: 6,
              justifyContent: 'center',
              minHeight: displayH,
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: '300', color: colors.text.secondary, textAlign: 'center' }}>
              {t('producer.plotMapper.axisWidth')}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text.primary, textAlign: 'center', marginTop: 2 }}>
              {width} m
            </Text>
          </View>
        ) : (
          <View style={{ width: 8 }} />
        )}

        <View
          collapsable={false}
          style={{
            width: displayW,
            height: displayH,
            backgroundColor: colors.surface,
            borderWidth: 0.5,
            borderColor: 'rgba(26, 48, 33, 0.2)',
            borderRadius: 6,
            position: 'relative',
            overflow: 'hidden',
          }}
          {...(partitionMode ? panResponder.panHandlers : {})}
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <View
              key={`h-${i}`}
              style={{
                position: 'absolute',
                top: (i * displayH) / 20,
                left: 0,
                width: displayW,
                height: GRID_LINE,
                backgroundColor: 'rgba(26, 48, 33, 0.05)',
              }}
            />
          ))}
          {Array.from({ length: 15 }).map((_, i) => (
            <View
              key={`v-${i}`}
              style={{
                position: 'absolute',
                left: (i * displayW) / 15,
                top: 0,
                height: displayH,
                width: GRID_LINE,
                backgroundColor: 'rgba(26, 48, 33, 0.05)',
              }}
            />
          ))}

          {partitions.map((partition) =>
            partition.type === 'HORIZONTAL' ? (
              <View
                key={partition.id}
                style={{
                  position: 'absolute',
                  top: toDy(partition.position, displayH),
                  left: 0,
                  width: displayW,
                  height: GRID_LINE,
                  backgroundColor: colors.primary,
                  borderStyle: 'dashed',
                  opacity: 0.95,
                }}
              />
            ) : (
              <View
                key={partition.id}
                style={{
                  position: 'absolute',
                  left: toDx(partition.position, displayW),
                  top: 0,
                  height: displayH,
                  width: GRID_LINE,
                  backgroundColor: colors.primary,
                  opacity: 0.95,
                }}
              />
            ),
          )}

          {zones.map((zone, index) => {
            const col = index % vertCount;
            const row = Math.floor(index / vertCount);
            return (
              <View
                key={zone.id}
                pointerEvents={partitionMode ? 'none' : 'auto'}
                style={{
                  position: 'absolute',
                  left: col * zoneWidth,
                  top: row * zoneHeight,
                  width: zoneWidth,
                  height: zoneHeight,
                }}
              >
                <TouchableOpacity
                  onPress={() => onZonePress(zone)}
                  style={{
                    flex: 1,
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
                  {zone.cropType ? (
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
                  ) : null}
                  <Text
                    style={{
                      fontSize: 7,
                      fontWeight: '300',
                      color: colors.text.secondary,
                      marginTop: 1,
                    }}
                    numberOfLines={1}
                  >
                    {zone.area} m²
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      {partitionMode ? (
        <Text
          style={{
            marginTop: 8,
            fontSize: 11,
            fontWeight: '300',
            color: colors.primary,
            textAlign: 'center',
          }}
        >
          {t('producer.plotMapper.partitionHint')}
        </Text>
      ) : null}
    </View>
  );
}
