import { View, TouchableOpacity } from 'react-native';
import { Camera } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { useGrowthJournalData } from './useGrowthJournalData';
import { GrowthJournalFilters } from './GrowthJournalFilters';
import { GrowthJournalList } from './GrowthJournalList';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';

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
      <BioVeraSubpageHeader
        left="none"
        title="Growth Journal"
        right={
          <TouchableOpacity
            onPress={handleAddPhoto}
            disabled={estates.length === 0 || uploading}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Camera size={20} color={colors.background} strokeWidth={1.5} />
          </TouchableOpacity>
        }
      />

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
