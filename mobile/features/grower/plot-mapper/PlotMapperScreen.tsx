import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';
import { Save } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { usePlotMapperData } from './usePlotMapperData';
import { DimensionsForm } from './DimensionsForm';
import { PlotCanvas } from './PlotCanvas';
import { ZonesList } from './ZonesList';
import { ZoneModal } from './ZoneModal';

/**
 * Plot mapper – digital parcel layout with zones and crops.
 * App route: app/(producer)/plot-mapper.tsx renders this screen.
 */
export default function PlotMapperScreen() {
  const { t } = useTranslation();
  const { parcelId } = useLocalSearchParams<{ parcelId: string }>();
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
    handleCanvasPress,
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
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          padding: 20,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: '300',
              color: colors.text.primary,
              letterSpacing: 0.5,
            }}
          >
            {t('producer.plotMapper.veraPlanTitle')}
          </Text>
          <TouchableOpacity
            onPress={handleSaveBlueprint}
            disabled={saving}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: colors.primary,
              borderRadius: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Save size={16} color={colors.background} strokeWidth={1} />
            )}
            <Text
              style={{
                fontSize: 12,
                fontWeight: '400',
                color: colors.background,
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
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={{ padding: 20 }}>
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
            onCanvasPress={handleCanvasPress}
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
