import { View, Text, TouchableOpacity } from 'react-native';
import { Camera } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { useGrowthJournalData } from './useGrowthJournalData';
import { GrowthJournalFilters } from './GrowthJournalFilters';
import { GrowthJournalList } from './GrowthJournalList';

/**
 * Growth Journal – hronologija dokaza rasta sa GPS metapodacima.
 * App route: app/(producer)/growth-journal.tsx renders this screen.
 */
export default function GrowthJournalScreen() {
  const {
    estates,
    logs,
    loading,
    refreshing,
    filterEstate,
    filterParcel,
    setFilterEstate,
    setFilterParcel,
    parcels,
    onRefresh,
    handleAddPhoto,
    uploading,
  } = useGrowthJournalData();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 48,
          paddingBottom: 16,
          borderBottomWidth: 0.5,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            flex: 1,
            color: colors.text.primary,
            fontWeight: '300',
            letterSpacing: 0.5,
          }}
        >
          Growth Journal
        </Text>
        <TouchableOpacity
          onPress={handleAddPhoto}
          disabled={estates.length === 0 || uploading}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Camera size={20} color={colors.background} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <GrowthJournalFilters
        estates={estates}
        parcels={parcels}
        filterEstate={filterEstate}
        filterParcel={filterParcel}
        onEstateChange={setFilterEstate}
        onParcelChange={setFilterParcel}
      />

      <GrowthJournalList
        logs={logs}
        loading={loading}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
}
