import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Save, ChevronLeft } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { usePlotMapperData } from './usePlotMapperData';
import { DimensionsForm } from './DimensionsForm';
import { PlotCanvas } from './PlotCanvas';
import { ZonesList } from './ZonesList';
import { ZoneModal } from './ZoneModal';
import PlotMapperParcelPicker from './PlotMapperParcelPicker';

function normalizeParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  const s = Array.isArray(v) ? v[0] : v;
  const t = (s || '').trim();
  return t.length ? t : undefined;
}

function safeDecodeParam(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function PlotMapperEditor({
  parcelId,
  parcelLabel,
}: {
  parcelId: string;
  parcelLabel?: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const {
    length,
    setLength,
    width,
    setWidth,
    zones,
    partitions,
    selectedZone,
    showZoneModal,
    setShowZoneModal,
    setSelectedZone,
    partitionMode,
    loading,
    saving,
    totalArea,
    handleAddPartition,
    handlePartitionGestureEnd,
    handleZonePress,
    handleSaveZone,
    handleSaveBlueprint,
    loadBlueprint,
  } = usePlotMapperData(parcelId);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: p.topInset,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          paddingTop: Math.max(p.headerTop, theme.spacing.md),
          paddingHorizontal: Math.max(theme.spacing.sm, p.screenPaddingLeft),
          paddingRight: Math.max(theme.spacing.sm, p.screenPaddingRight),
          paddingBottom: 14,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.replace('/(producer)/plot-mapper')}
          hitSlop={12}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: parcelLabel ? 4 : 0 }}
        >
          <ChevronLeft size={20} color={theme.colors.primary} strokeWidth={1.75} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.primary }}>
            {t('producer.plotMapper.changeParcel')}
          </Text>
        </TouchableOpacity>
        {parcelLabel ? (
          <Text
            style={{
              fontSize: 13,
              color: theme.colors.text.secondary,
              marginBottom: 4,
              flexWrap: 'wrap',
            }}
            numberOfLines={2}
          >
            {parcelLabel}
          </Text>
        ) : null}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: '400',
              color: theme.colors.text.primary,
              letterSpacing: 0.5,
              flex: 1,
              minWidth: 160,
            }}
          >
            {t('producer.plotMapper.veraPlanTitle')}
          </Text>
          <TouchableOpacity
            onPress={() => void handleSaveBlueprint()}
            disabled={saving}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: theme.colors.primary,
              borderRadius: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              minHeight: 44,
              opacity: saving ? 0.85 : 1,
            }}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color={theme.colors.background} />
            ) : (
              <Save size={16} color={theme.colors.background} strokeWidth={1} />
            )}
            <Text
              style={{
                fontSize: 14,
                fontWeight: '400',
                color: theme.colors.background,
                letterSpacing: 0.3,
              }}
            >
              {t('producer.plotMapper.savePlan')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        scrollEnabled={!partitionMode}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={async () => {
              setPullRefreshing(true);
              try {
                await loadBlueprint({ silent: true });
              } finally {
                setPullRefreshing(false);
              }
            }}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View
          style={{
            paddingHorizontal: Math.max(theme.spacing.sm, p.screenPaddingLeft),
            paddingRight: Math.max(theme.spacing.sm, p.screenPaddingRight),
            paddingTop: theme.spacing.md,
            paddingBottom: Math.max(p.bottomInset, theme.spacing.xl),
          }}
        >
          <DimensionsForm
            length={length}
            width={width}
            totalArea={totalArea}
            onLengthChange={setLength}
            onWidthChange={setWidth}
          />
          <PlotCanvas
            length={length}
            width={width}
            zones={zones}
            partitions={partitions}
            partitionMode={partitionMode}
            onAddPartition={handleAddPartition}
            onPartitionGestureEnd={handlePartitionGestureEnd}
            onZonePress={handleZonePress}
          />
          <ZonesList zones={zones} onZonePress={handleZonePress} />
        </View>
      </ScrollView>

      <ZoneModal
        visible={showZoneModal}
        selectedZone={selectedZone}
        onClose={() => {
          setShowZoneModal(false);
          setSelectedZone(null);
        }}
        onSave={(zoneCropType, zonePlantingDate, zoneStatus) =>
          handleSaveZone(zoneCropType, zonePlantingDate, zoneStatus, () => {
            setShowZoneModal(false);
            setSelectedZone(null);
          })
        }
      />
    </View>
  );
}

/**
 * Vera plan — zoniranje pravougaonika parcele. Zahteva izabranu parcelu ako ruta ne prosledi `parcelId`.
 */
export default function PlotMapperScreen() {
  const rawId = normalizeParam(useLocalSearchParams<{ parcelId?: string }>().parcelId);
  const parcelLabelRaw = normalizeParam(useLocalSearchParams<{ parcelLabel?: string }>().parcelLabel);

  const parcelLabel = parcelLabelRaw ? safeDecodeParam(parcelLabelRaw) : undefined;

  if (!rawId) {
    return <PlotMapperParcelPicker />;
  }

  return <PlotMapperEditor parcelId={rawId} parcelLabel={parcelLabel} />;
}
