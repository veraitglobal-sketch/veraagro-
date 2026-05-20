import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GrowerSelectField } from '../../../components/grower/GrowerSelectField';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import type { GrowerParcelRow } from '../../../lib/load-grower-parcels';

export type CostPlantingOption = { id: string; label: string };

type Props = {
  parcels: GrowerParcelRow[];
  selectedParcelId: string;
  onParcelSelect: (id: string) => void;
  plantings: CostPlantingOption[];
  selectedPlantingId: string;
  onPlantingSelect: (id: string) => void;
  loading?: boolean;
};

export function CostAllocationPicker({
  parcels,
  selectedParcelId,
  onParcelSelect,
  plantings,
  selectedPlantingId,
  onPlantingSelect,
  loading = false,
}: Props) {
  const { t } = useTranslation();

  if (loading && parcels.length === 0) {
    return (
      <View style={[enterpriseUi.inAppPanel, styles.panel, styles.centered]}>
        <ActivityIndicator color={enterpriseColors.primary} />
        <Text style={[enterpriseUi.navRowSubtitle, { marginTop: 10 }]}>
          {t('producer.costCalculator.loadingParcels')}
        </Text>
      </View>
    );
  }

  if (!loading && parcels.length === 0) {
    return (
      <View style={[enterpriseUi.inAppPanel, styles.panel]}>
        <Text style={enterpriseUi.navRowSubtitle}>{t('producer.costCalculator.noParcels')}</Text>
      </View>
    );
  }

  const parcelOptions = parcels.map((par) => ({ id: par.id, label: par.label }));
  const plantingOptions = plantings.map((pl) => ({ id: pl.id, label: pl.label }));

  return (
    <View style={[enterpriseUi.inAppPanel, styles.panel]}>
      <GrowerSelectField
        label={t('producer.costCalculator.parcelLabel')}
        placeholder={t('producer.select.parcel')}
        valueId={selectedParcelId}
        options={parcelOptions}
        onSelect={onParcelSelect}
      />

      {selectedParcelId ? (
        <GrowerSelectField
          label={t('producer.costCalculator.plantingLabel')}
          placeholder={t('producer.select.planting')}
          valueId={selectedPlantingId}
          options={plantingOptions}
          onSelect={onPlantingSelect}
          disabled={plantingOptions.length === 0}
          hint={
            plantingOptions.length === 0
              ? t('producer.costCalculator.noPlantingOnParcel')
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
    marginBottom: 14,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 20,
  },
});
