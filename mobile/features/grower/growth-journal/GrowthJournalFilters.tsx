import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GrowerSelectField } from '../../../components/grower/GrowerSelectField';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import type { ParcelOption } from './useGrowthJournalData';

export type PlantingOption = { id: string; label: string; announcementType?: string };

/** Growth stage filter chips (AddGrowthLogModal). */
export const GROWTH_STAGE_PRESET_KEYS = [
  'vegetative',
  'flowering',
  'fruitSet',
  'ripening',
  'preHarvest',
] as const;

export type GrowthStagePresetKey = (typeof GROWTH_STAGE_PRESET_KEYS)[number];

interface GrowthJournalFiltersProps {
  parcels: ParcelOption[];
  selectedParcelId: string;
  onParcelSelect: (parcelId: string) => void;
  plantings: PlantingOption[];
  activePlanId: string;
  onPlanSelect: (planId: string) => void;
  loading?: boolean;
}

export function GrowthJournalFilters({
  parcels,
  selectedParcelId,
  onParcelSelect,
  plantings,
  activePlanId,
  onPlanSelect,
  loading = false,
}: GrowthJournalFiltersProps) {
  const { t } = useTranslation();

  if (loading && parcels.length === 0) {
    return (
      <View style={[enterpriseUi.inAppPanel, styles.panel, styles.centered]}>
        <ActivityIndicator color={enterpriseColors.primary} />
        <Text style={[enterpriseUi.navRowSubtitle, { marginTop: 10 }]}>{t('producer.growthJournal.loading')}</Text>
      </View>
    );
  }

  if (!loading && parcels.length === 0) {
    return (
      <View style={[enterpriseUi.inAppPanel, styles.panel]}>
        <Text style={enterpriseUi.navRowSubtitle}>{t('producer.growthJournal.noApprovedParcels')}</Text>
      </View>
    );
  }

  const parcelOptions = parcels.map((p) => ({ id: p.id, label: p.label }));
  const plantingOptions = plantings.map((pl) => ({ id: pl.id, label: pl.label }));

  return (
    <View style={[enterpriseUi.inAppPanel, styles.panel]}>
      <GrowerSelectField
        label={t('producer.growthJournal.parcelLabel')}
        placeholder={t('producer.select.parcel')}
        valueId={selectedParcelId}
        options={parcelOptions}
        onSelect={onParcelSelect}
      />

      {selectedParcelId ? (
        <GrowerSelectField
          label={t('producer.growthJournal.plantingLabel')}
          placeholder={t('producer.select.planting')}
          valueId={activePlanId}
          options={plantingOptions}
          onSelect={onPlanSelect}
          disabled={plantingOptions.length === 0}
          hint={
            plantingOptions.length === 0
              ? t('producer.growthJournal.noPlantingOnParcel')
              : undefined
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: 14,
    marginBottom: 12,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 20,
  },
});
