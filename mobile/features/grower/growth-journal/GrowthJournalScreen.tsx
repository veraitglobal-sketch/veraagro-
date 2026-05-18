import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Camera } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { useGrowthJournalData } from './useGrowthJournalData';
import { GrowthJournalFilters } from './GrowthJournalFilters';
import { GrowthJournalList } from './GrowthJournalList';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import { AddGrowthLogModal } from './AddGrowthLogModal';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';

/**
 * Growth Journal – timeline of crop growth evidence with GPS + optional stage/notes (web-aligned).
 * App route: app/(producer)/growth-journal.tsx renders this screen.
 */
export default function GrowthJournalScreen() {
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();
  const {
    estates,
    logs,
    loading,
    logsLoading,
    refreshing,
    filterEstate,
    filterParcel,
    setFilterEstate,
    setFilterParcel,
    parcels,
    parcelPlans,
    activePlanId,
    setActivePlanId,
    plansLoading,
    canAddLog,
    onRefresh,
    submitAddLog,
    addModalVisible,
    setAddModalVisible,
    uploading,
    selectedEstate,
    parcelsLoading,
  } = useGrowthJournalData();

  const parcelLabel =
    filterParcel !== 'all' && filterParcel
      ? parcels.find((x) => x.id === filterParcel)?.cropType || filterParcel.slice(0, 8)
      : t('producer.growthJournal.allParcelsContext');

  const planLabel =
    parcelPlans.find((p) => p.id === activePlanId)?.label || t('producer.growthJournal.planNotSelected');

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <BioVeraSubpageHeader
        left="back"
        title={t('producer.growthJournal.screenTitle')}
        right={
          <TouchableOpacity
            onPress={() => setAddModalVisible(true)}
            disabled={estates.length === 0 || uploading || !canAddLog}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: uploading || !canAddLog ? 0.45 : 1,
            }}
          >
            <Camera size={20} color={colors.background} strokeWidth={1.5} />
          </TouchableOpacity>
        }
      />

      <View style={{ paddingHorizontal: p.screenPaddingLeft, paddingBottom: theme.spacing.sm }}>
        <Text style={{ fontSize: 13, color: colors.text.secondary, lineHeight: 20 }}>
          {t('producer.growthJournal.screenIntro')}
        </Text>
        {filterEstate !== 'all' && !loading && (
          <View style={{ marginTop: theme.spacing.sm }}>
            {!canAddLog && !uploading ? (
              <Text style={{ fontSize: 12, color: colors.warning, lineHeight: 18, fontWeight: '500' }}>
                {filterParcel === 'all'
                  ? t('producer.growthJournal.hintPickParcel')
                  : parcelsLoading || plansLoading
                    ? t('producer.growthJournal.hintLoadingSelections')
                    : !activePlanId
                      ? t('producer.growthJournal.hintPickPlan')
                      : t('producer.growthJournal.addPhotosToTrack')}
              </Text>
            ) : (
              <Text style={{ fontSize: 12, color: colors.text.secondary, lineHeight: 18 }}>
                {t('producer.growthJournal.stepsReminder')}
              </Text>
            )}
          </View>
        )}
      </View>

      <GrowthJournalFilters
        estates={estates}
        parcels={parcels}
        parcelsLoading={parcelsLoading}
        filterEstate={filterEstate}
        filterParcel={filterParcel}
        onEstateChange={setFilterEstate}
        onParcelChange={setFilterParcel}
        parcelPlans={parcelPlans}
        activePlanId={activePlanId}
        onPlanChange={setActivePlanId}
        plansLoading={plansLoading}
      />

      <GrowthJournalList
        logs={logs}
        loading={loading}
        logsLoading={logsLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      <AddGrowthLogModal
        visible={addModalVisible}
        onClose={() => !uploading && setAddModalVisible(false)}
        onSubmit={submitAddLog}
        busy={uploading}
        estateName={selectedEstate?.name}
        parcelLabel={parcelLabel}
        planLabel={planLabel}
        strictPlantingProgress={
          parcelPlans.find((p) => p.id === activePlanId)?.announcementType === 'PLANTING'
        }
      />
    </View>
  );
}
